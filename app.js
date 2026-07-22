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
        gsap.registerPlugin(ScrollTrigger);

        // Frame scrub tween
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

        // Cards fade trigger
        const sections = document.querySelectorAll(".story-section");
        sections.forEach((section) => {
            const wrapper = section.querySelector(".content-wrapper");
            if (!wrapper) return;
            
            // Fade In ScrollTrigger
            const inTrigger = ScrollTrigger.create({
                trigger: section,
                start: "top 75%",
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
                start: "bottom 60%",
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
    // 6. Start Preloader
    // ----------------------------------------------------
    preloadImages();
});
