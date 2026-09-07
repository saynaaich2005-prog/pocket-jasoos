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
            // Safety timeout: Ensure loader dismisses smoothly even on slow networks or restricted file protocols
            const safetyTimer = setTimeout(() => {
                if (!isPreloadDone) {
                    progressBar.style.width = "100%";
                    progressText.textContent = "100%";
                    onPreloadComplete(resolve);
                }
            }, 3500);

            for (let i = 1; i <= frameCount; i++) {
                const img = new Image();
                img.onload = () => {
                    loadedCount++;
                    const progress = Math.round((loadedCount / frameCount) * 100);
                    progressBar.style.width = `${progress}%`;
                    progressText.textContent = `${progress}%`;
                    
                    if (loadedCount === frameCount) {
                        clearTimeout(safetyTimer);
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
                            clearTimeout(safetyTimer);
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
        if (isPreloadDone) return;
        isPreloadDone = true;
        resizeCanvas();
        renderFrame(1);
        
        setTimeout(() => {
            loader.style.opacity = 0;
            loader.style.visibility = "hidden";
            
            // Ensure agent session is active
            if (window.PocketJasoosAuth) {
                window.PocketJasoosAuth.ensureUser();
                window.PocketJasoosAuth.updateUI();
            }
            
            // Initialize animations and navigation
            initGSAP();
            initNavigation();
            if (resolve) resolve();
        }, 400);
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
        if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
        gsap.registerPlugin(ScrollTrigger);

        // Frame scrub tween directly linked to scrolling down #panel-intro
        scrollTween = gsap.to(playhead, {
            frame: frameCount,
            snap: "frame",
            ease: "none",
            scrollTrigger: {
                trigger: "#panel-intro",
                start: "top top",
                end: "bottom bottom",
                scrub: 0.5,
                onUpdate: (self) => {
                    renderFrame(Math.round(playhead.frame));
                    if (scrollProgressLine) {
                        scrollProgressLine.style.width = `${self.progress * 100}%`;
                    }
                }
            }
        });

        // Story Cards fade in and out as user scrolls through the chapters
        const sections = document.querySelectorAll(".story-section");
        sections.forEach((section) => {
            const wrapper = section.querySelector(".content-wrapper");
            if (!wrapper) return;
            
            // Fade In ScrollTrigger
            const inTrigger = ScrollTrigger.create({
                trigger: section,
                start: "top 80%",
                end: "top 35%",
                scrub: true,
                onUpdate: (self) => {
                    gsap.set(wrapper, {
                        opacity: self.progress,
                        y: 50 - (self.progress * 50)
                    });
                }
            });
            storyTriggers.push(inTrigger);

            // Fade Out ScrollTrigger
            const outTrigger = ScrollTrigger.create({
                trigger: section,
                start: "bottom 65%",
                end: "bottom 20%",
                scrub: true,
                onUpdate: (self) => {
                    gsap.set(wrapper, {
                        opacity: 1 - self.progress,
                        y: -self.progress * 50
                    });
                }
            });
            storyTriggers.push(outTrigger);
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
                        if (typeof initMonthlySpendingGraph === 'function') {
                            initMonthlySpendingGraph();
                        }
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
    // 8. Realistic Monthly Spending Graph
    // ----------------------------------------------------
    const initMonthlySpendingGraph = () => {
        const svg = document.getElementById("spending-trend-svg");
        if (!svg) return;

        const tooltip = document.getElementById("graph-forensic-tooltip");
        const ttMonth = document.getElementById("tt-month-name");
        const ttStatus = document.getElementById("tt-status-badge");
        const ttAmount = document.getElementById("tt-amount");
        const ttSuspect = document.getElementById("tt-suspect");
        const ttBurnRate = document.getElementById("tt-burn-rate");

        const statTotal = document.getElementById("stat-total-burn");
        const statAvg = document.getElementById("stat-monthly-avg");
        const statPeak = document.getElementById("stat-peak-month");

        const timeframeSelect = document.getElementById("monthly-timeframe-select");
        const btnSpline = document.getElementById("btn-mode-spline");
        const btnBars = document.getElementById("btn-mode-bars");

        let currentMode = "spline";
        let currentTimeframe = "6m";

        const dataSets = {
            "6m": [
                { label: "Jun", month: "June 2023", amount: 8420, suspect: "Shopping (₹2.8k)", status: "Under Budget", isOver: false, change: "-8.4% vs May" },
                { label: "Jul", month: "July 2023", amount: 10150, suspect: "Food (₹3.1k)", status: "Normal", isOver: false, change: "+20.5% vs Jun" },
                { label: "Aug", month: "August 2023", amount: 14200, suspect: "Shopping (₹5.2k)", status: "Over Limit", isOver: true, change: "+39.9% vs Jul" },
                { label: "Sep", month: "September 2023", amount: 11380, suspect: "Food (₹3.5k)", status: "Under Budget", isOver: false, change: "-19.8% vs Aug" },
                { label: "Oct", month: "October 2023", amount: 15620, suspect: "Electronics (₹6.4k)", status: "Critical Peak", isOver: true, change: "+37.2% vs Sep" },
                { label: "Nov", month: "November 2023", amount: 11480, suspect: "Shopping (₹3.6k)", status: "Active Case", isOver: false, change: "-26.5% vs Oct" }
            ],
            "12m": [
                { label: "Jan", month: "January 2023", amount: 9200, suspect: "Bills (₹3.2k)", status: "Normal", isOver: false, change: "-12.0%" },
                { label: "Feb", month: "February 2023", amount: 8750, suspect: "Food (₹2.8k)", status: "Lowest", isOver: false, change: "-4.8%" },
                { label: "Mar", month: "March 2023", amount: 11400, suspect: "Shopping (₹3.6k)", status: "Normal", isOver: false, change: "+30.2%" },
                { label: "Apr", month: "April 2023", amount: 10800, suspect: "Food (₹3.2k)", status: "Normal", isOver: false, change: "-5.2%" },
                { label: "May", month: "May 2023", amount: 12950, suspect: "Travel (₹4.5k)", status: "Normal", isOver: false, change: "+19.9%" },
                { label: "Jun", month: "June 2023", amount: 8420, suspect: "Shopping (₹2.8k)", status: "Under Budget", isOver: false, change: "-34.9%" },
                { label: "Jul", month: "July 2023", amount: 10150, suspect: "Food (₹3.1k)", status: "Normal", isOver: false, change: "+20.5%" },
                { label: "Aug", month: "August 2023", amount: 14200, suspect: "Shopping (₹5.2k)", status: "Over Limit", isOver: true, change: "+39.9%" },
                { label: "Sep", month: "September 2023", amount: 11380, suspect: "Food (₹3.5k)", status: "Under Budget", isOver: false, change: "-19.8%" },
                { label: "Oct", month: "October 2023", amount: 15620, suspect: "Festivities (₹6.4k)", status: "Critical Peak", isOver: true, change: "+37.2%" },
                { label: "Nov", month: "November 2023", amount: 11480, suspect: "Shopping (₹3.6k)", status: "Active Case", isOver: false, change: "-26.5%" },
                { label: "Dec", month: "December 2023", amount: 13900, suspect: "Gifts (₹4.8k)", status: "Projected", isOver: true, change: "+21.0%" }
            ]
        };

        const BUDGET_LIMIT = 13500;
        const MAX_VAL = 20000;
        const CHART_WIDTH = 680;
        const CHART_HEIGHT = 180;
        const PADDING_TOP = 25;
        const PADDING_BOTTOM = 30;
        const PADDING_LEFT = 55;
        const PADDING_RIGHT = 30;

        const renderChart = () => {
            const data = dataSets[currentTimeframe] || dataSets["6m"];
            const count = data.length;

            const total = data.reduce((acc, d) => acc + d.amount, 0);
            const avg = Math.round(total / count);
            const peak = data.reduce((max, d) => d.amount > max.amount ? d : max, data[0]);

            if (statTotal) statTotal.textContent = `₹${total.toLocaleString('en-IN')}`;
            if (statAvg) statAvg.textContent = `₹${avg.toLocaleString('en-IN')}`;
            if (statPeak) statPeak.textContent = `${peak.label} (₹${(peak.amount / 1000).toFixed(1)}k)`;

            const innerWidth = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
            const innerHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

            const getY = (val) => {
                const clamped = Math.max(0, Math.min(MAX_VAL, val));
                return PADDING_TOP + innerHeight - (clamped / MAX_VAL) * innerHeight;
            };

            const getX = (index) => {
                if (count <= 1) return PADDING_LEFT + innerWidth / 2;
                return PADDING_LEFT + (index / (count - 1)) * innerWidth;
            };

            const budgetY = getY(BUDGET_LIMIT);

            let svgContent = `
                <defs>
                    <linearGradient id="splineAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#00eefc" stop-opacity="0.38" />
                        <stop offset="60%" stop-color="#bd00ff" stop-opacity="0.12" />
                        <stop offset="100%" stop-color="#131314" stop-opacity="0" />
                    </linearGradient>
                    <linearGradient id="splineStrokeGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stop-color="#00eefc" />
                        <stop offset="50%" stop-color="#ecb2ff" />
                        <stop offset="100%" stop-color="#00eefc" />
                    </linearGradient>
                    <linearGradient id="barColumnGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#00eefc" stop-opacity="0.95" />
                        <stop offset="100%" stop-color="#bd00ff" stop-opacity="0.4" />
                    </linearGradient>
                    <linearGradient id="barOverGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#ffb4ab" stop-opacity="0.95" />
                        <stop offset="100%" stop-color="#cf4900" stop-opacity="0.4" />
                    </linearGradient>
                    <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                <!-- Background Grid & Y-Axis Reference Lines -->
                <g class="chart-grid" opacity="0.3">
            `;

            const gridSteps = [0, 5000, 10000, 15000, 20000];
            gridSteps.forEach(step => {
                const y = getY(step);
                const label = step === 0 ? "₹0" : `₹${step / 1000}k`;
                svgContent += `
                    <line x1="${PADDING_LEFT - 10}" y1="${y}" x2="${CHART_WIDTH - PADDING_RIGHT}" y2="${y}" stroke="rgba(255,255,255,0.15)" stroke-dasharray="3 4" stroke-width="1" />
                    <text x="${PADDING_LEFT - 14}" y="${y + 4}" fill="#d4c0d7" font-size="10" font-family="'Space Grotesk', monospace" text-anchor="end">${label}</text>
                `;
            });

            svgContent += `
                </g>
                <!-- Target Budget Threshold -->
                <g class="budget-threshold-line">
                    <line x1="${PADDING_LEFT}" y1="${budgetY}" x2="${CHART_WIDTH - PADDING_RIGHT}" y2="${budgetY}" stroke="#ffb4ab" stroke-dasharray="4 4" stroke-width="1.5" opacity="0.75" />
                    <text x="${CHART_WIDTH - PADDING_RIGHT}" y="${budgetY - 6}" fill="#ffb4ab" font-size="9" font-family="'Space Grotesk', monospace" text-anchor="end" font-weight="bold">TARGET LIMIT: ₹13.5k</text>
                </g>
            `;

            const points = data.map((d, i) => ({
                x: getX(i),
                y: getY(d.amount),
                data: d,
                index: i
            }));

            if (currentMode === "spline") {
                let pathD = `M ${points[0].x} ${points[0].y}`;
                for (let i = 0; i < points.length - 1; i++) {
                    const p0 = points[i];
                    const p1 = points[i + 1];
                    const cp1x = p0.x + (p1.x - p0.x) * 0.45;
                    const cp1y = p0.y;
                    const cp2x = p0.x + (p1.x - p0.x) * 0.55;
                    const cp2y = p1.y;
                    pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
                }

                const lastPoint = points[points.length - 1];
                const bottomY = PADDING_TOP + innerHeight;
                const areaD = `${pathD} L ${lastPoint.x} ${bottomY} L ${points[0].x} ${bottomY} Z`;

                svgContent += `
                    <!-- Gradient Area Fill -->
                    <path d="${areaD}" fill="url(#splineAreaGrad)" class="graph-area-path" />

                    <!-- Glowing Spline Waveform -->
                    <path d="${pathD}" fill="none" stroke="url(#splineStrokeGrad)" stroke-width="3.5" filter="url(#neonGlow)" class="graph-spline-path" stroke-linecap="round" stroke-linejoin="round" />
                `;
            } else {
                const barWidth = Math.min(36, (innerWidth / count) * 0.55);
                points.forEach(p => {
                    const barHeight = (PADDING_TOP + innerHeight) - p.y;
                    const grad = p.data.isOver ? "url(#barOverGrad)" : "url(#barColumnGrad)";
                    const strokeCol = p.data.isOver ? "#ffb4ab" : "#00eefc";
                    svgContent += `
                        <rect x="${p.x - barWidth / 2}" y="${p.y}" width="${barWidth}" height="${barHeight}" rx="4" fill="${grad}" stroke="${strokeCol}" stroke-width="1.5" class="graph-column-bar" data-index="${p.index}" />
                    `;
                });
            }

            svgContent += `
                <!-- Laser Guide -->
                <line id="graph-cursor-guide" x1="0" y1="${PADDING_TOP}" x2="0" y2="${PADDING_TOP + innerHeight}" stroke="#00eefc" stroke-width="1.5" stroke-dasharray="2 3" opacity="0" pointer-events="none" />
            `;

            points.forEach((p) => {
                const strokeColor = p.data.isOver ? "#ffb4ab" : "#00eefc";
                const fillColor = p.data.isOver ? "#cf4900" : "#00363a";

                svgContent += `
                    <g class="graph-node-group" data-index="${p.index}" style="cursor:pointer;">
                        ${p.data.isOver ? `<circle cx="${p.x}" cy="${p.y}" r="12" fill="none" stroke="#ffb4ab" stroke-width="1.5" class="node-pulse-ring" opacity="0.6" />` : ""}
                        <circle cx="${p.x}" cy="${p.y}" r="5.5" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2.5" class="graph-node" />
                        <circle cx="${p.x}" cy="${p.y}" r="22" fill="transparent" class="graph-hit-area" data-index="${p.index}" />
                        <text x="${p.x}" y="${PADDING_TOP + innerHeight + 20}" fill="${p.data.isOver ? '#ffb4ab' : '#e5e2e3'}" font-size="11" font-family="'Space Grotesk', monospace" text-anchor="middle" font-weight="${p.data.isOver ? 'bold' : 'normal'}">${p.data.label}</text>
                    </g>
                `;
            });

            svg.innerHTML = svgContent;
            setupGraphInteractions(points);
        };

        const setupGraphInteractions = (points) => {
            const container = document.getElementById("spending-graph-container");
            const guide = document.getElementById("graph-cursor-guide");

            const showDetail = (p) => {
                if (!tooltip || !container) return;

                document.querySelectorAll(".graph-node").forEach((node, idx) => {
                    if (idx === p.index) {
                        node.classList.add("active-node");
                    } else {
                        node.classList.remove("active-node");
                    }
                });

                if (guide) {
                    guide.setAttribute("x1", p.x);
                    guide.setAttribute("x2", p.x);
                    guide.setAttribute("opacity", "0.85");
                }

                if (ttMonth) ttMonth.textContent = p.data.month;
                if (ttAmount) ttAmount.textContent = `₹${p.data.amount.toLocaleString('en-IN')}`;
                if (ttSuspect) ttSuspect.textContent = p.data.suspect;
                if (ttBurnRate) {
                    ttBurnRate.textContent = p.data.change;
                    ttBurnRate.className = p.data.change.startsWith("+") ? "text-error font-medium" : "text-green-400 font-medium";
                }
                if (ttStatus) {
                    ttStatus.textContent = p.data.status;
                    ttStatus.className = p.data.isOver
                        ? "text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-error/20 text-error border border-error/30"
                        : "text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-secondary/20 text-secondary border border-secondary/30";
                }

                tooltip.classList.remove("hidden");
                const rect = container.getBoundingClientRect();
                let left = (p.x / CHART_WIDTH) * rect.width - tooltip.offsetWidth / 2;
                let top = (p.y / CHART_HEIGHT) * rect.height - tooltip.offsetHeight - 15;

                if (left < 10) left = 10;
                if (left + tooltip.offsetWidth > rect.width - 10) left = rect.width - tooltip.offsetWidth - 10;
                if (top < 5) top = (p.y / CHART_HEIGHT) * rect.height + 25;

                tooltip.style.left = `${left}px`;
                tooltip.style.top = `${top}px`;
            };

            const hideDetail = () => {
                if (tooltip) tooltip.classList.add("hidden");
                if (guide) guide.setAttribute("opacity", "0");
                document.querySelectorAll(".graph-node").forEach(node => node.classList.remove("active-node"));
            };

            document.querySelectorAll(".graph-node-group, .graph-column-bar").forEach(el => {
                const idx = parseInt(el.getAttribute("data-index"), 10);
                const p = points[idx];
                if (!p) return;

                el.addEventListener("mouseenter", () => showDetail(p));
                el.addEventListener("touchstart", (e) => {
                    e.preventDefault();
                    showDetail(p);
                }, { passive: false });
            });

            if (container) {
                container.addEventListener("mouseleave", hideDetail);
            }
        };

        if (btnSpline && btnBars) {
            btnSpline.onclick = () => {
                currentMode = "spline";
                btnSpline.classList.add("bg-primary-container", "text-on-primary-container");
                btnSpline.classList.remove("text-on-surface-variant");
                btnBars.classList.remove("bg-primary-container", "text-on-primary-container");
                btnBars.classList.add("text-on-surface-variant");
                renderChart();
            };

            btnBars.onclick = () => {
                currentMode = "bars";
                btnBars.classList.add("bg-primary-container", "text-on-primary-container");
                btnBars.classList.remove("text-on-surface-variant");
                btnSpline.classList.remove("bg-primary-container", "text-on-primary-container");
                btnSpline.classList.add("text-on-surface-variant");
                renderChart();
            };
        }

        if (timeframeSelect) {
            timeframeSelect.onchange = (e) => {
                currentTimeframe = e.target.value;
                renderChart();
            };
        }

        renderChart();
    };

    // ----------------------------------------------------
    // 9. Dashboard Spending Timeline Toggle (Week / Month)
    // ----------------------------------------------------
    const initDashboardTimelineToggle = () => {
        const btnWeek = document.getElementById("timeline-btn-week");
        const btnMonth = document.getElementById("timeline-btn-month");
        const container = document.getElementById("dashboard-timeline-container");
        if (!btnWeek || !btnMonth || !container) return;

        const weekData = [
            { label: "Mon", amount: "₹420", height: 35, category: "Food", color: "#fbbc05" },
            { label: "Tue", amount: "₹850", height: 60, category: "Shopping", color: "#ffb59a" },
            { label: "Wed", amount: "₹1,200", height: 85, category: "Movies", color: "#ecb2ff" },
            { label: "Thu", amount: "₹340", height: 28, category: "Food", color: "#fbbc05" },
            { label: "Fri", amount: "₹1,850", height: 125, category: "Games", color: "#34a853" },
            { label: "Sat", amount: "₹2,640", height: 160, category: "Shopping", color: "#ffb59a" },
            { label: "Sun", amount: "₹1,120", height: 78, category: "Food", color: "#fbbc05" }
        ];

        const monthData = [
            { label: "Shopping", amount: "₹3,620", height: 140, category: "Shopping", color: "#ffb59a" },
            { label: "Food", amount: "₹2,840", height: 110, category: "Food", color: "#fbbc05" },
            { label: "Movies", amount: "₹1,250", height: 49, category: "Movies", color: "#ecb2ff" },
            { label: "Games", amount: "₹1,150", height: 45, category: "Games", color: "#34a853" }
        ];

        const renderBars = (items, isWeek = false) => {
            let barsHtml = `
                <div class="relative flex items-end justify-around h-[170px] mb-2">
                    <div class="absolute inset-0 flex flex-col justify-between border-l border-b border-white/10 pb-2 pl-2 pointer-events-none">
                        <div class="w-full h-[1px] bg-white/5"></div>
                        <div class="w-full h-[1px] bg-white/5"></div>
                        <div class="w-full h-[1px] bg-white/5"></div>
                        <div class="w-full h-[1px] bg-white/5"></div>
                    </div>
            `;

            const barWidth = isWeek ? "11%" : "20%";

            items.forEach(item => {
                barsHtml += `
                    <div class="bar-group flex flex-col gap-0.5 z-10" style="width:${barWidth};" data-category="${item.category}" data-amount="${item.amount}">
                        <div class="w-full rounded-t-sm" style="height:4px;background:${item.color}40;"></div>
                        <div class="bar-fill w-full rounded-b-sm" style="height:${item.height}px;background:${item.color}e0;box-shadow:0 0 14px ${item.color}66;--bar-glow:${item.color}99;"></div>
                    </div>
                `;
            });

            barsHtml += `</div><div class="flex justify-around">`;

            items.forEach(item => {
                barsHtml += `
                    <span class="text-[10px] font-semibold text-center tracking-wide" style="width:${barWidth};color:${item.color}e0;">${item.label}</span>
                `;
            });

            barsHtml += `</div>`;
            container.innerHTML = barsHtml;

            initChartTooltips();
        };

        btnWeek.onclick = () => {
            btnWeek.className = "px-3 py-1 rounded bg-primary-container/20 text-xs text-primary font-medium border border-primary/20 transition-all cursor-pointer";
            btnMonth.className = "px-3 py-1 rounded bg-surface-variant/50 text-xs text-on-surface-variant hover:text-on-surface font-medium border border-white/5 transition-all cursor-pointer";
            renderBars(weekData, true);
        };

        btnMonth.onclick = () => {
            btnMonth.className = "px-3 py-1 rounded bg-primary-container/20 text-xs text-primary font-medium border border-primary/20 transition-all cursor-pointer";
            btnWeek.className = "px-3 py-1 rounded bg-surface-variant/50 text-xs text-on-surface-variant hover:text-on-surface font-medium border border-white/5 transition-all cursor-pointer";
            renderBars(monthData, false);
        };
    };

    // ----------------------------------------------------
    // 10. Start Preloader and Initialize Auth UI
    // ----------------------------------------------------
    if (window.PocketJasoosAuth) {
        window.PocketJasoosAuth.ensureUser();
        window.PocketJasoosAuth.updateUI();
    }
    initProfileMenu();
    preloadImages();
    initChartTooltips();
    initMonthlySpendingGraph();
    initDashboardTimelineToggle();
};

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}
