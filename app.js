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
                    // Fallback to animation/ directory if needed
                    img.src = `animation/ezgif-frame-${pad(i, 3)}.jpg`;
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
            
            // Initialize animations and navigation
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
                                if (typeof switchTab === 'function') switchTab('dashboard');
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
    // 6. Advanced Hover Animations
    // ----------------------------------------------------
    const timelineCard = document.getElementById('spending-timeline-card');
    if (timelineCard) {
        timelineCard.addEventListener('mouseenter', () => {
            const bars = timelineCard.querySelectorAll('.group > div:last-child');
            gsap.fromTo(bars, 
                { scaleY: 0, transformOrigin: "bottom" },
                { scaleY: 1, duration: 0.6, ease: "back.out(1.5)", stagger: 0.05 }
            );
        });
    }

    const radarPathsContainer = document.getElementById('radar-paths');
    if (radarPathsContainer) {
        const segments = radarPathsContainer.querySelectorAll('.radar-segment');
        segments.forEach(segment => {
            segment.addEventListener('mouseenter', () => {
                gsap.to(segment, {
                    scale: 1.15,
                    transformOrigin: "center",
                    duration: 0.4,
                    ease: "elastic.out(1, 0.4)"
                });
            });
            segment.addEventListener('mouseleave', () => {
                gsap.to(segment, {
                    scale: 1,
                    duration: 0.3,
                    ease: "power2.out"
                });
            });
        });
    }

    // ----------------------------------------------------
    // 7. Start Preloader
    // ----------------------------------------------------
    preloadImages();
});
