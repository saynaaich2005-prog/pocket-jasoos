// Pocket Jasoos Unified Application Logic

const initApp = () => {
    // ----------------------------------------------------
    // 1. Setup Elements and Configuration
    // ----------------------------------------------------
    const canvas = document.getElementById("animation-canvas");
    const ctx = canvas.getContext("2d");
    const loader = document.getElementById("loader");
    const progressBar = document.getElementById("progress-bar");
    const progressText = document.getElementById("progress-text");
    const scrollProgressLine = document.getElementById("scroll-progress-line");
    const hudFrameNum = document.getElementById("hud-frame-num");
    const pageTitle = document.getElementById("dynamic-page-title");
    
    const frameCount = 238;
    const images = [];
    const playhead = { frame: 1 };
    
    let activeTab = "intro";
    let isPreloadDone = false;
    let navShown = false;

    const pad = (num, size) => {
        let s = num + "";
        while (s.length < size) s = "0" + s;
        return s;
    };
    
    const getImagePath = (index) => {
        return `ezgif-frame-${pad(index, 3)}.jpg`;
    };

    // ----------------------------------------------------
    // 2. Image Preloader
    // ----------------------------------------------------
    let loadedCount = 0;
    
    const preloadImages = () => {
        return new Promise((resolve) => {
            for (let i = 1; i <= frameCount; i++) {
                const img = new Image();
                img.onload = () => {
                    loadedCount++;
                    const progress = Math.round((loadedCount / frameCount) * 100);
                    progressBar.style.width = `${progress}%`;
                    progressText.textContent = `${progress}%`;
                    
                    if (loadedCount === frameCount) {
                        onPreloadComplete(resolve);
                    }
                };
                img.onerror = () => {
                    // Try animation/ subfolder as fallback
                    const fallbackSrc = `animation/ezgif-frame-${pad(i, 3)}.jpg`;
                    if (img.src.indexOf('animation/') === -1) {
                        img.src = fallbackSrc;
                    } else {
                        // Both paths failed, count it anyway so loader doesn't hang
                        loadedCount++;
                        if (loadedCount === frameCount) {
                            onPreloadComplete(resolve);
                        }
                    }
                };
                img.src = getImagePath(i);
                images.push(img);
            }
        });
    };

    const onPreloadComplete = (resolve) => {
        isPreloadDone = true;
        resizeCanvas();
        renderFrame(1);
        
        setTimeout(() => {
            loader.style.opacity = 0;
            loader.style.visibility = "hidden";
            
            // Check authentication immediately after preloader finishes
            if (window.PocketJasoosAuth && !window.PocketJasoosAuth.getCurrentUser()) {
                window.location.href = 'login.html';
                return;
            }
            
            // Initialize animations and navigation for authenticated users
            initGSAP();
            initNavigation();
            resolve();
        }, 600);
    };

    // ----------------------------------------------------
    // 3. Canvas Aspect-Ratio Preserving Cover Draw
    // ----------------------------------------------------
    const resizeCanvas = () => {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        if (isPreloadDone) {
            renderFrame(Math.round(playhead.frame));
        }
    };

    window.addEventListener("resize", resizeCanvas);

    const drawImageProp = (ctx, img, x = 0, y = 0, w = canvas.width, h = canvas.height, offsetX = 0.5, offsetY = 0.5) => {
        const iw = img.naturalWidth || img.width;
        const ih = img.naturalHeight || img.height;
        if (!iw || !ih) return;
        
        const r = Math.min(w / iw, h / ih);
        let nw = iw * r;
        let nh = ih * r;
        let cx, cy, cw, ch, al = 1;

        if (nw < w) { al = w / nw; }
        if (Math.abs(nh - h) < 1) { al = h / nh; }
        
        if (al !== 1) {
            nw *= al;
            nh *= al;
        }

        cw = iw / (nw / w);
        ch = ih / (nh / h);

        cx = (iw - cw) * offsetX;
        cy = (ih - ch) * offsetY;

        if (cx < 0) cx = 0;
        if (cy < 0) cy = 0;
        if (cw > iw) cw = iw;
        if (ch > ih) ch = ih;

        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, cx, cy, cw, ch, x, y, w, h);
    };

    const renderFrame = (index) => {
        const frameIndex = Math.max(1, Math.min(frameCount, index));
        const img = images[frameIndex - 1];
        if (img && img.complete) {
            drawImageProp(ctx, img);
            if (hudFrameNum) {
                hudFrameNum.textContent = pad(frameIndex, 3);
            }
        }
    };

    // ----------------------------------------------------
    // 4. GSAP & ScrollTrigger Configuration
    // ----------------------------------------------------
    let scrollTween = null;
    let storyTriggers = [];

    const initGSAP = () => {
        // Play animation automatically over 3.5 seconds
        gsap.to(playhead, {
            frame: frameCount,
            snap: "frame",
            duration: 3.5,
            ease: "none",
            onUpdate: () => {
                renderFrame(Math.round(playhead.frame));
                if (scrollProgressLine) {
                    const progress = playhead.frame / frameCount;
                    scrollProgressLine.style.width = `${progress * 100}%`;
                }
            },
            onComplete: () => {
                // Show radiant intro
                const radiant = document.getElementById('radiant-intro');
                if (radiant) {
                    radiant.classList.remove('hidden');
                    // Allow CSS display to apply before opacity transition
                    setTimeout(() => {
                        radiant.classList.remove('opacity-0', 'pointer-events-none');
                        
                        // 3D Pop out animation
                        gsap.to("#intro-logo", { scale: 1, duration: 1.2, ease: "elastic.out(1, 0.5)", delay: 0.2 });
                        gsap.to("#intro-title", { scale: 1, duration: 1.2, ease: "elastic.out(1, 0.5)", delay: 0.4 });
                        gsap.to("#intro-welcome", { opacity: 1, y: -20, duration: 1, ease: "power2.out", delay: 1 });
                        
                        // Wait, then fade out and go to dashboard
                        setTimeout(() => {
                            radiant.classList.add('opacity-0', 'pointer-events-none');
                            setTimeout(() => {
                                radiant.classList.add('hidden');
                                if (typeof switchTab === 'function') {
                                    switchTab('dashboard');
                                }
                            }, 1000);
                        }, 3500);
                    }, 50);
                } else {
                    if (typeof switchTab === 'function') switchTab('dashboard');
                }
            }
        });
    };

    // ----------------------------------------------------
    // 5. Single-Page App Navigation Logic
    // ----------------------------------------------------
    window.switchTab = (tabId) => {
        if (tabId === activeTab) return;
        
        // Enforce auth before switching to any functional tab
        if (tabId !== 'intro' && window.PocketJasoosAuth) {
            if (!window.PocketJasoosAuth.getCurrentUser()) {
                window.location.href = 'login.html';
                return;
            }
        }
        
        activeTab = tabId;

        // 1. Scroll user to the top immediately
        window.scrollTo({ top: 0, behavior: "instant" });

        // 2. Update Header Title
        const titleMap = {
            intro: "Case Investigation: Mission Intro",
            dashboard: "Case Investigation: Dashboard",
            expenses: "Case Investigation: Expense Records",
            analytics: "Case Investigation: Analytics Reports",
            categories: "Case Investigation: Category Intel"
        };
        if (pageTitle) {
            pageTitle.textContent = titleMap[tabId] || "Case Investigation";
        }

        // 3. Desktop Sidebar Active Class
        document.querySelectorAll(".nav-link").forEach(link => {
            const tabAttr = link.getAttribute("data-tab");
            const symbol = link.querySelector(".material-symbols-outlined");
            if (tabAttr === tabId) {
                link.classList.add("bg-primary-container", "text-on-primary-container", "font-bold");
                link.classList.remove("text-on-surface-variant");
                if (symbol) symbol.style.fontVariationSettings = "'FILL' 1";
            } else {
                link.classList.remove("bg-primary-container", "text-on-primary-container", "font-bold");
                link.classList.add("text-on-surface-variant");
                if (symbol) symbol.style.fontVariationSettings = "'FILL' 0";
            }
        });

        // 4. Mobile Navigation Active Class
        document.querySelectorAll(".mobile-nav-link").forEach(link => {
            const tabAttr = link.getAttribute("data-tab");
            const symbol = link.querySelector(".material-symbols-outlined");
            if (tabAttr === tabId) {
                link.classList.add("text-secondary-fixed", "bg-secondary-container/20", "font-bold");
                link.classList.remove("text-on-surface-variant", "opacity-60");
                if (symbol) symbol.style.fontVariationSettings = "'FILL' 1";
            } else {
                link.classList.remove("text-secondary-fixed", "bg-secondary-container/20", "font-bold");
                link.classList.add("text-on-surface-variant", "opacity-60");
                if (symbol) symbol.style.fontVariationSettings = "'FILL' 0";
            }
        });

        // 5. Hide/Show Tab Panels
        document.querySelectorAll(".tab-panel").forEach(panel => {
            const panelId = panel.id.replace("panel-", "");
            if (panelId === tabId) {
                panel.classList.remove("hidden");
                setTimeout(() => {
                    panel.classList.remove("opacity-0");
                    panel.classList.add("opacity-100");
                    
                    if (tabId === 'analytics') {
                        gsap.fromTo(".radar-segment", 
                            { scale: 0, opacity: 0, transformOrigin: "50% 50%" },
                            { scale: 1, opacity: 1, duration: 1, stagger: 0.15, ease: "elastic.out(1, 0.7)", delay: 0.2 }
                        );
                    }
                    if (tabId === 'categories') {
                        loadCategories();
                    }
                }, 50);
            } else {
                panel.classList.add("hidden", "opacity-0");
                panel.classList.remove("opacity-100");
            }
        });

        // 6. Handle Background Canvas & GSAP ScrollTriggers
        const canvasContainer = document.getElementById("canvas-container");
        const hud = document.querySelector(".hud-layer");
        
        if (tabId === "intro") {
            if (canvasContainer) canvasContainer.style.display = "block";
            if (hud) hud.style.display = "grid";
            
            // Enable ScrollTrigger triggers for Intro
            if (scrollTween && scrollTween.scrollTrigger) scrollTween.scrollTrigger.enable();
            storyTriggers.forEach(t => t.enable());
            
            // Refresh coordinates
            ScrollTrigger.refresh();
        } else {
            if (canvasContainer) canvasContainer.style.display = "none";
            if (hud) hud.style.display = "none";

            // Reveal sidebar & mobile nav smoothly the first time we leave intro
            if (!navShown) {
                navShown = true;
                setTimeout(() => {
                    const sidebarNav = document.getElementById('sidebar-nav');
                    const mobileNav  = document.getElementById('mobile-nav');
                    if (sidebarNav) sidebarNav.classList.add('nav-visible');
                    if (mobileNav)  mobileNav.classList.add('nav-visible');
                }, 350);
            }
            
            // Disable ScrollTriggers so body height returns to normal panel bounds
            if (scrollTween && scrollTween.scrollTrigger) scrollTween.scrollTrigger.disable();
            storyTriggers.forEach(t => t.disable());
            
            if (scrollProgressLine) scrollProgressLine.style.width = "0%";
        }
    };

    const initNavigation = () => {
        // Attach click handlers to nav items
        document.querySelectorAll(".nav-link").forEach(link => {
            link.addEventListener("click", () => {
                const tab = link.getAttribute("data-tab");
                switchTab(tab);
            });
        });

        document.querySelectorAll(".mobile-nav-link").forEach(link => {
            link.addEventListener("click", () => {
                const tab = link.getAttribute("data-tab");
                switchTab(tab);
            });
        });
    };

    const initProfileMenu = () => {
        const menuBtn = document.getElementById("profile-menu-btn");
        const dropdown = document.getElementById("profile-menu-dropdown");
        const logoutBtn = document.getElementById("logout-btn");
        if (!menuBtn || !dropdown || !logoutBtn) return;

        const closeMenu = () => {
            dropdown.classList.add("hidden");
            menuBtn.setAttribute("aria-expanded", "false");
        };

        menuBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const isOpen = !dropdown.classList.contains("hidden");
            if (isOpen) {
                closeMenu();
            } else {
                dropdown.classList.remove("hidden");
                menuBtn.setAttribute("aria-expanded", "true");
            }
        });

        logoutBtn.addEventListener("click", () => {
            closeMenu();
            if (window.PocketJasoosAuth) {
                window.PocketJasoosAuth.logout();
            }
        });

        document.addEventListener("click", (e) => {
            if (!document.getElementById("profile-menu-root")?.contains(e.target)) {
                closeMenu();
            }
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") closeMenu();
        });
    };

    // ----------------------------------------------------
    // 7. Chart Bar Tooltips
    // ----------------------------------------------------
    const initChartTooltips = () => {
        const tooltip    = document.getElementById('chart-tooltip');
        if (!tooltip) return;

        const ttCategory = tooltip.querySelector('.tooltip-category');
        const ttAmount   = tooltip.querySelector('.tooltip-amount');
        let hideTimer;

        const positionTooltip = (x, y) => {
            const tw = tooltip.offsetWidth;
            const vw = window.innerWidth;
            let left = x + 16;
            let top  = y - tooltip.offsetHeight - 14;
            if (left + tw > vw - 12) left = x - tw - 16;
            if (top < 10) top = y + 16;
            tooltip.style.left = left + 'px';
            tooltip.style.top  = top  + 'px';
        };

        const showTooltip = (bar, x, y) => {
            clearTimeout(hideTimer);
            ttCategory.textContent = bar.dataset.category || '';
            ttAmount.textContent   = bar.dataset.amount   || '';
            ttCategory.style.color = getComputedStyle(bar.querySelector('.bar-fill')).backgroundColor;
            tooltip.style.display  = 'block';
            positionTooltip(x, y);
        };

        const hideTooltip = (delay = 0) => {
            hideTimer = setTimeout(() => { tooltip.style.display = 'none'; }, delay);
        };

        document.querySelectorAll('.bar-group').forEach(bar => {
            // Mouse events
            bar.addEventListener('mouseenter', e  => showTooltip(bar, e.clientX, e.clientY));
            bar.addEventListener('mousemove',  e  => positionTooltip(e.clientX, e.clientY));
            bar.addEventListener('mouseleave', () => hideTooltip(80));

            // Touch events (mobile)
            bar.addEventListener('touchstart', e => {
                e.preventDefault();
                const t = e.touches[0];
                showTooltip(bar, t.clientX, t.clientY);
            }, { passive: false });
            bar.addEventListener('touchmove', e => {
                const t = e.touches[0];
                positionTooltip(t.clientX, t.clientY);
            });
            bar.addEventListener('touchend', () => hideTooltip(2200));
        });
    };

    // ----------------------------------------------------
    // 8. Start Preloader and Initialize Auth UI
    // ----------------------------------------------------
    if (window.PocketJasoosAuth) {
        window.PocketJasoosAuth.updateUI();
    }
    initProfileMenu();
    preloadImages();
    initChartTooltips();
    loadCategories();
    initCategoryInteractions();
};

// ----------------------------------------------------
// 9. Categories: Backend-driven data + rendering
// ----------------------------------------------------
const formatINR = (n) => {
    const value = Number(n || 0);
    return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

const hexToRgba = (hex, alpha) => {
    const clean = String(hex || '').replace('#', '');
    if (clean.length !== 6) return undefined;
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const escapeHTML = (str) => {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

const categoryCardHTML = (cat) => {
    const spent = Number(cat.spent) || 0;
    const budget = Number(cat.budget) || 0;
    const remaining = Number(cat.remaining) || 0;
    const over = Boolean(cat.overBudget);
    const color = cat.color || '#ecb2ff';
    const icon = cat.icon || 'category';
    const name = escapeHTML(cat.name || 'Unnamed');
    const description = cat.description ? escapeHTML(cat.description) : '';
    const pct = budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0;
    const fillPct = over ? 100 : pct;

    const iconBg = hexToRgba(color, 0.2) || 'rgba(236,178,255,0.2)';
    const iconBorder = hexToRgba(color, 0.3) || 'rgba(236,178,255,0.3)';

    const body = `
        <div class="flex justify-between items-start">
            <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-full flex items-center justify-center border" style="background:${iconBg};border-color:${iconBorder};">
                    <span class="material-symbols-outlined text-2xl" style="color:${escapeHTML(color)};">${escapeHTML(icon)}</span>
                </div>
                <div>
                    <h3 class="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary transition-colors">${name}</h3>
                    ${description ? `<p class="text-xs text-on-surface-variant">${description}</p>` : ''}
                </div>
            </div>
            <div class="relative category-menu-wrap">
                <button type="button" class="category-menu-btn text-outline hover:text-on-surface transition-colors p-1" aria-haspopup="true" aria-expanded="false" aria-label="Category actions">
                    <span class="material-symbols-outlined text-[20px]">more_vert</span>
                </button>
                <div class="category-menu hidden absolute right-0 top-full mt-1 w-40 glass-card inner-glow rounded-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl py-1 z-50">
                    <button type="button" class="w-full px-4 py-2.5 text-left text-sm text-on-surface hover:bg-surface-variant/30 flex items-center gap-2 transition-colors" data-action="edit">
                        <span class="material-symbols-outlined text-base">edit</span>
                        <span>Edit</span>
                    </button>
                    <button type="button" class="w-full px-4 py-2.5 text-left text-sm text-error hover:bg-error-container/20 flex items-center gap-2 transition-colors" data-action="delete">
                        <span class="material-symbols-outlined text-base">delete</span>
                        <span>Delete</span>
                    </button>
                </div>
            </div>
        </div>
        <div class="mt-2">
            <div class="flex justify-between text-sm mb-2">
                <span class="${over ? 'text-error font-medium' : 'text-on-surface'}">Spent: ${formatINR(spent)}</span>
                <span class="text-on-surface-variant">Budget: ${formatINR(budget)}</span>
            </div>
            <div class="h-2 progress-bar-bg w-full">
                <div class="progress-fill${over ? ' over-budget' : ''}" style="width: ${fillPct}%;"></div>
            </div>
            <p class="text-right text-xs ${over ? 'text-error' : 'text-on-surface-variant'} mt-2 font-label-sm">${
                over
                    ? `Over budget by ${formatINR(Math.abs(remaining))}!`
                    : `${formatINR(Math.max(remaining, 0))} remaining`
            }</p>
        </div>`;

    if (over) {
        return `
            <div class="glass-card inner-glow rounded-xl p-6 flex flex-col gap-4 group hover:border-error/70 hover:bg-error-container/10 transition-all duration-300 cursor-pointer hover:scale-[1.02] border-error/30 relative overflow-visible"
                data-category-card=""
                data-id="${cat._id}"
                data-name="${escapeHTML(cat.name || '')}"
                data-icon="${escapeHTML(cat.icon || 'category')}"
                data-color="${escapeHTML(cat.color || '#ecb2ff')}"
                data-budget="${Number(cat.budget) || ''}"
                data-description="${escapeHTML(cat.description || '')}">
                <div class="absolute top-0 right-0 w-16 h-16 bg-error/10 rounded-bl-full rounded-tr-xl flex items-start justify-end p-2 pointer-events-none">
                    <span class="material-symbols-outlined text-error text-sm">warning</span>
                </div>
                ${body}
            </div>`;
    }

    return `
        <div class="glass-card inner-glow rounded-xl p-6 flex flex-col gap-4 group hover:border-primary/40 transition-colors overflow-visible"
            data-category-card=""
            data-id="${cat._id}"
            data-name="${escapeHTML(cat.name || '')}"
            data-icon="${escapeHTML(cat.icon || 'category')}"
            data-color="${escapeHTML(cat.color || '#ecb2ff')}"
            data-budget="${Number(cat.budget) || ''}"
            data-description="${escapeHTML(cat.description || '')}">
            ${body}
        </div>`;
};

const loadCategories = async () => {
    const grid = document.getElementById('categories-grid');
    const statusEl = document.getElementById('categories-status');
    if (!grid || !window.API || typeof window.API.getCategories !== 'function') return;

    if (statusEl) {
        statusEl.classList.remove('hidden');
        statusEl.textContent = 'Loading category intel...';
        statusEl.className = 'md:col-span-2 lg:col-span-3 text-center text-on-surface-variant font-body-md py-4';
    }

    try {
        const categories = await window.API.getCategories();

        if (!Array.isArray(categories)) {
            throw new Error('Unexpected response from server');
        }

        // Remove previously rendered cards (keep status + create-custom card)
        grid.querySelectorAll('[data-category-card]').forEach((el) => el.remove());

        const totalBudget = categories.reduce((sum, c) => sum + (Number(c.budget) || 0), 0);
        const allocated = categories.reduce((sum, c) => sum + (Number(c.spent) || 0), 0);
        const unallocated = totalBudget - allocated;
        const overBudgetCount = categories.filter((c) => c.overBudget).length;

        const totalEl = document.getElementById('categories-summary-total');
        const allocatedEl = document.getElementById('categories-summary-allocated');
        const unallocatedEl = document.getElementById('categories-summary-unallocated');
        const overBudgetEl = document.getElementById('categories-summary-overbudget');

        if (totalEl) totalEl.textContent = formatINR(totalBudget);
        if (allocatedEl) allocatedEl.textContent = formatINR(allocated);
        if (unallocatedEl) unallocatedEl.textContent = `${formatINR(Math.max(unallocated, 0))} unallocated`;
        if (overBudgetEl) overBudgetEl.textContent = `${overBudgetCount} ${overBudgetCount === 1 ? 'Category' : 'Categories'}`;

        if (categories.length === 0) {
            if (statusEl) {
                statusEl.classList.remove('hidden');
                statusEl.textContent = 'No categories yet. Create your first suspect to start tracking.';
            }
            return;
        }

        if (statusEl) statusEl.classList.add('hidden');

        const createCard = grid.querySelector('.border-dashed');
        categories.forEach((cat) => {
            const wrapper = document.createElement('div');
            wrapper.innerHTML = categoryCardHTML(cat);
            const card = wrapper.firstElementChild;
            if (createCard) {
                grid.insertBefore(card, createCard);
            } else {
                grid.appendChild(card);
            }
        });
    } catch (error) {
        if (statusEl) {
            statusEl.classList.remove('hidden');
            statusEl.textContent = `Could not load categories. ${error.message || 'Please try again later.'}`;
            statusEl.className = 'md:col-span-2 lg:col-span-3 text-center text-error font-body-md py-4';
        }
    }
};

// ----------------------------------------------------
// 10. Categories: Interactions (modal, menu, delete)
// ----------------------------------------------------
let pendingDeleteId = null;

const showToast = (message, type = 'success') => {
    const toast = document.getElementById('toast');
    const messageEl = document.getElementById('toast-message');
    const iconEl = document.getElementById('toast-icon');
    if (!toast || !messageEl || !iconEl) return;

    const isSuccess = type === 'success';
    messageEl.textContent = message;
    iconEl.textContent = isSuccess ? 'check_circle' : 'error';
    iconEl.className = `material-symbols-outlined text-base ${isSuccess ? 'text-secondary-container' : 'text-error'}`;

    toast.classList.remove('hidden');
    toast.classList.add('flex');

    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => {
        toast.classList.add('hidden');
        toast.classList.remove('flex');
    }, 3000);
};

const closeAllCategoryMenus = () => {
    document.querySelectorAll('#categories-grid .category-menu:not(.hidden)').forEach((menu) => {
        menu.classList.add('hidden');
        const btn = menu.closest('.category-menu-wrap')?.querySelector('.category-menu-btn');
        if (btn) btn.setAttribute('aria-expanded', 'false');
    });
};

const toggleCategoryMenu = (btn) => {
    const wrap = btn.closest('.category-menu-wrap');
    const menu = wrap && wrap.querySelector('.category-menu');
    if (!menu) return;

    const wasOpen = !menu.classList.contains('hidden');
    closeAllCategoryMenus();
    if (!wasOpen) {
        menu.classList.remove('hidden');
        btn.setAttribute('aria-expanded', 'true');
    }
};

const showModalError = (id, message) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = message;
    el.classList.remove('hidden');
};

const hideModalError = (id) => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
};

const openCategoryModal = (category = null) => {
    const modal = document.getElementById('category-modal');
    if (!modal) return;

    const isEdit = Boolean(category);

    document.getElementById('category-id').value = isEdit ? category._id : '';
    document.getElementById('category-name').value = isEdit ? (category.name || '') : '';
    document.getElementById('category-budget').value = isEdit ? (catBudgetToString(category.budget)) : '';
    document.getElementById('category-description').value = isEdit ? (category.description || '') : '';

    const title = document.getElementById('category-modal-title');
    const label = document.getElementById('category-save-label');
    const subtitle = document.getElementById('category-modal-subtitle');
    if (title) title.textContent = isEdit ? 'Edit Category' : 'New Category';
    if (label) label.textContent = isEdit ? 'Save Changes' : 'Add Category';
    if (subtitle) subtitle.textContent = isEdit ? 'Update this suspect\'s intel.' : 'Set a budget for a regular suspect.';

    const saveBtn = document.getElementById('category-save-btn');
    if (saveBtn) saveBtn.disabled = false;

    hideModalError('category-modal-error');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    const nameField = document.getElementById('category-name');
    if (nameField) nameField.focus();
};

const catBudgetToString = (value) => {
    const n = Number(value);
    if (Number.isFinite(n) && n >= 0) return String(n);
    return '';
};

const closeCategoryModal = () => {
    const modal = document.getElementById('category-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
};

const handleCategorySubmit = async (e) => {
    e.preventDefault();

    const name = document.getElementById('category-name').value.trim();
    if (!name) {
        showModalError('category-modal-error', 'Category name is required.');
        return;
    }

    const budgetRaw = document.getElementById('category-budget').value;
    if (budgetRaw.trim() === '') {
        showModalError('category-modal-error', 'Monthly budget is required.');
        return;
    }
    const budget = Number(budgetRaw);
    if (!Number.isFinite(budget) || budget < 0) {
        showModalError('category-modal-error', 'Budget must be a valid amount of ₹0 or more.');
        return;
    }

    const payload = {
        name,
        budget,
        description: document.getElementById('category-description').value.trim(),
    };

    const categoryId = document.getElementById('category-id').value;
    const saveBtn = document.getElementById('category-save-btn');
    const saveLabel = document.getElementById('category-save-label');
    const originalLabel = saveLabel ? saveLabel.textContent : 'Add Category';
    if (saveBtn) saveBtn.disabled = true;
    if (saveLabel) saveLabel.textContent = 'Saving...';

    try {
        if (categoryId) {
            await window.API.updateCategory(categoryId, payload);
            showToast('Category updated successfully.');
        } else {
            await window.API.createCategory(payload);
            showToast('Category created successfully.');
        }
        closeCategoryModal();
        loadCategories();
    } catch (error) {
        showModalError('category-modal-error', error.message || 'Something went wrong. Please try again.');
        if (saveBtn) saveBtn.disabled = false;
        if (saveLabel) saveLabel.textContent = originalLabel;
    }
};

const openCategoryDeleteConfirm = (id, name) => {
    pendingDeleteId = id;
    const nameEl = document.getElementById('category-confirm-name');
    if (nameEl) nameEl.textContent = name || 'this category';

    const deleteBtn = document.getElementById('category-confirm-delete');
    if (deleteBtn) {
        deleteBtn.disabled = false;
        deleteBtn.innerHTML = deleteBtn.dataset.originalHtml || '<span class="material-symbols-outlined text-sm">delete</span><span>Delete</span>';
    }

    hideModalError('category-confirm-error');
    const modal = document.getElementById('category-confirm-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
};

const closeCategoryDeleteConfirm = () => {
    pendingDeleteId = null;
    const modal = document.getElementById('category-confirm-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
};

const handleCategoryDelete = async () => {
    if (!pendingDeleteId) return;

    const deleteBtn = document.getElementById('category-confirm-delete');
    const originalHTML = deleteBtn ? deleteBtn.dataset.originalHtml : '';
    if (deleteBtn) {
        if (!deleteBtn.dataset.originalHtml) deleteBtn.dataset.originalHtml = deleteBtn.innerHTML;
        deleteBtn.disabled = true;
        deleteBtn.innerHTML = '<span class="material-symbols-outlined text-sm">hourglass_empty</span><span>Deleting...</span>';
    }

    try {
        await window.API.deleteCategory(pendingDeleteId);
        closeCategoryDeleteConfirm();
        showToast('Category deleted.');
        loadCategories();
    } catch (error) {
        showToast(error.message || 'Could not delete category. Please try again.', 'error');
        if (deleteBtn) {
            deleteBtn.disabled = false;
            deleteBtn.innerHTML = originalHTML || deleteBtn.dataset.originalHtml;
        }
    }
};

const initCategoryInteractions = () => {
    const newBtn = document.getElementById('new-category-btn');
    if (newBtn) newBtn.addEventListener('click', () => openCategoryModal(null));

    const createCard = document.getElementById('create-custom-card');
    if (createCard) createCard.addEventListener('click', () => openCategoryModal(null));

    const grid = document.getElementById('categories-grid');
    if (grid) {
        grid.addEventListener('click', (e) => {
            const menuBtn = e.target.closest('.category-menu-btn');
            if (menuBtn) {
                e.stopPropagation();
                toggleCategoryMenu(menuBtn);
                return;
            }

            const menuItem = e.target.closest('[data-action]');
            if (menuItem) {
                e.stopPropagation();
                const card = menuItem.closest('[data-id]');
                if (!card) return;

                if (menuItem.getAttribute('data-action') === 'edit') {
                    openCategoryModal({
                        _id: card.dataset.id,
                        name: card.dataset.name,
                        icon: card.dataset.icon,
                        color: card.dataset.color,
                        budget: card.dataset.budget,
                        description: card.dataset.description,
                    });
                } else if (menuItem.getAttribute('data-action') === 'delete') {
                    openCategoryDeleteConfirm(card.dataset.id, card.dataset.name);
                }
                closeAllCategoryMenus();
            }
        });
    }

    const form = document.getElementById('category-form');
    if (form) form.addEventListener('submit', handleCategorySubmit);

    const modalCancel = document.getElementById('category-cancel-btn');
    if (modalCancel) modalCancel.addEventListener('click', closeCategoryModal);

    const modalClose = document.getElementById('category-modal-close');
    if (modalClose) modalClose.addEventListener('click', closeCategoryModal);

    const modalBackdrop = document.getElementById('category-modal-backdrop');
    if (modalBackdrop) modalBackdrop.addEventListener('click', closeCategoryModal);

    const confirmCancel = document.getElementById('category-confirm-cancel');
    if (confirmCancel) confirmCancel.addEventListener('click', closeCategoryDeleteConfirm);

    const confirmDelete = document.getElementById('category-confirm-delete');
    if (confirmDelete) confirmDelete.addEventListener('click', handleCategoryDelete);

    const confirmBackdrop = document.getElementById('category-confirm-backdrop');
    if (confirmBackdrop) confirmBackdrop.addEventListener('click', closeCategoryDeleteConfirm);

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.category-menu') && !e.target.closest('.category-menu-btn')) {
            closeAllCategoryMenus();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeCategoryModal();
            closeCategoryDeleteConfirm();
            closeAllCategoryMenus();
        }
    });
};

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}
