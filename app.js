// Pocket Jasoos Unified Application Logic

document.addEventListener("DOMContentLoaded", () => {
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
        if (!canvas || !ctx) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = window.innerWidth;
        const h = window.innerHeight;

        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        if (isPreloadDone) {
            renderFrame(Math.round(playhead.frame));
        }
    };

    window.addEventListener("resize", resizeCanvas);

    const drawImageProp = (ctx, img, x = 0, y = 0, w = canvas.width, h = canvas.height, offsetX = 0.5, offsetY = 0.5) => {
        const iw = img.naturalWidth || img.width;
        const ih = img.naturalHeight || img.height;
        if (!iw || !ih) return;
        
        const r = Math.max(w / iw, h / ih);
        let nw = iw * r;
        let nh = ih * r;

        let cx = (nw - w) * offsetX;
        let cy = (nh - h) * offsetY;

        ctx.clearRect(0, 0, w, h);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, iw, ih, -cx, -cy, nw, nh);
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

    // Helper to reveal top header bar with pop-out spring effect
    const revealTopHeader = () => {
        const topHeader = document.getElementById("top-header");
        if (topHeader && !topHeader.classList.contains("header-visible")) {
            topHeader.classList.remove("-translate-y-full", "opacity-0", "pointer-events-none");
            topHeader.classList.add("header-visible");
            gsap.fromTo("#top-header", 
                { y: -100, opacity: 0 },
                { y: 0, opacity: 1, duration: 1.1, ease: "elastic.out(1, 0.65)" }
            );
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
                // 1. Pop out top header AFTER animation completes
                revealTopHeader();

                // 2. Show radiant intro overlay
                const radiant = document.getElementById('radiant-intro');
                if (radiant) {
                    radiant.classList.remove('hidden');
                    // Allow CSS display to apply before opacity transition
                    setTimeout(() => {
                        radiant.classList.remove('opacity-0', 'pointer-events-none');
                        
                        // 3D Pop out animation for Logo, Title, and Welcome badge
                        gsap.fromTo("#intro-logo", 
                            { scale: 0, rotation: -15 }, 
                            { scale: 1, rotation: 0, duration: 1.2, ease: "elastic.out(1, 0.5)", delay: 0.1 }
                        );
                        gsap.fromTo("#intro-title", 
                            { scale: 0, y: 30 }, 
                            { scale: 1, y: 0, duration: 1.2, ease: "elastic.out(1, 0.5)", delay: 0.3 }
                        );
                        gsap.fromTo("#intro-welcome", 
                            { opacity: 0, y: 30 }, 
                            { opacity: 1, y: 0, duration: 1, ease: "power2.out", delay: 0.8 }
                        );
                        
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

        // Ensure top header is visible when tab changes
        revealTopHeader();

        // 1. Scroll user to the top immediately
        window.scrollTo({ top: 0, behavior: "instant" });

        // 2. Update Header Title (Desktop & Mobile)
        const titleMap = {
            intro: "Case Investigation: Mission Intro",
            dashboard: "Case Investigation: Dashboard",
            expenses: "Case Investigation: Expense Records",
            analytics: "Case Investigation: Analytics Reports",
            categories: "Case Investigation: Category Intel"
        };
        const newTitle = titleMap[tabId] || "Case Investigation";
        if (pageTitle) pageTitle.textContent = newTitle;
        const pageTitleMobile = document.getElementById("dynamic-page-title-mobile");
        if (pageTitleMobile) pageTitleMobile.textContent = newTitle;

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
    preloadImages();
    initChartTooltips();
});
