// Smooth scroll with momentum and section snapping
let scrollCount = 0;
let lastScrollTime = 0;
let isSnapping = false;
let lastDirection = 0;
let touchStartY = 0;
let touchStartScrollTop = 0;
let isTouching = false;
const SCROLL_THRESHOLD = 2;
const RESET_TIME = 1500;
const SNAP_COOLDOWN = 1000;
const TOUCH_SNAP_COOLDOWN = 600; // Shorter cooldown for touch
const TOUCH_THRESHOLD = 50; // Minimum swipe distance
const TOUCH_DURATION = 600; // Faster animation for touch

const scrollLoginScreen = document.getElementById('login-screen');

if (scrollLoginScreen) {
    let currentSectionIndex = 0;
    const sections = document.querySelectorAll('.hero-section, .how-it-works, .stats-section, .features-section, .cta-section, .footer');
    
    // Activate hero section on load
    if (sections.length > 0) {
        sections[0].classList.add('active');
    }
    
    function handleScroll(direction, isTouchEvent = false) {
        if (isSnapping) {
            return;
        }
        
        const currentTime = Date.now();
        
        // For touch events, skip the count logic and snap immediately
        if (isTouchEvent) {
            isSnapping = true;
            scrollCount = 0;
            
            const targetIndex = Math.max(0, Math.min(sections.length - 1, currentSectionIndex + direction));
            
            console.log('Touch: Snapping from section', currentSectionIndex, 'to', targetIndex);
            
            performSnap(targetIndex, true);
            return;
        }
        
        // For mouse wheel, use the 2-scroll requirement
        // Reset count if too much time has passed or direction changed
        if (currentTime - lastScrollTime > RESET_TIME || direction !== lastDirection) {
            scrollCount = 0;
        }
        
        lastScrollTime = currentTime;
        lastDirection = direction;
        scrollCount++;
        
        console.log('Scroll count:', scrollCount, 'Direction:', direction > 0 ? 'down' : 'up');
        
        // Snap after 2 scrolls
        if (scrollCount >= SCROLL_THRESHOLD) {
            isSnapping = true;
            scrollCount = 0;
            
            const targetIndex = Math.max(0, Math.min(sections.length - 1, currentSectionIndex + direction));
            
            console.log('Snapping from section', currentSectionIndex, 'to', targetIndex);
            
            performSnap(targetIndex, false);
        }
    }
    
    function performSnap(targetIndex, isTouchEvent = false) {
        if (targetIndex !== currentSectionIndex) {
            const prevIndex = currentSectionIndex;
            currentSectionIndex = targetIndex;
            
            const duration = isTouchEvent ? TOUCH_DURATION : 1000;
            
            // Different animations based on section
            const animations = [
                { // Hero - fade
                    out: { opacity: '0', transform: 'scale(0.95)' },
                    in: { opacity: '1', transform: 'scale(1)' }
                },
                { // How it works - slide from right
                    out: { opacity: '0.3', transform: 'translateX(-50px)' },
                    in: { opacity: '1', transform: 'translateX(0)' }
                },
                { // Stats - slide from left
                    out: { opacity: '0.3', transform: 'translateX(50px)' },
                    in: { opacity: '1', transform: 'translateX(0)' }
                },
                { // Features - slide from bottom
                    out: { opacity: '0.3', transform: 'translateY(50px)' },
                    in: { opacity: '1', transform: 'translateY(0)' }
                },
                { // CTA - zoom in
                    out: { opacity: '0', transform: 'scale(1.05)' },
                    in: { opacity: '1', transform: 'scale(1)' }
                },
                { // Footer - fade up
                    out: { opacity: '0.3', transform: 'translateY(30px)' },
                    in: { opacity: '1', transform: 'translateY(0)' }
                }
            ];
            
            // Animate out current section
            const prevAnim = animations[prevIndex];
            sections[prevIndex].style.opacity = prevAnim.out.opacity;
            sections[prevIndex].style.transform = prevAnim.out.transform;
            
            // Scroll to target with custom smooth animation
            const start = scrollLoginScreen.scrollTop;
            const target = sections[targetIndex].offsetTop;
            const distance = target - start;
            let startTime = null;
            
            function animate(currentTime) {
                if (!startTime) startTime = currentTime;
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Ease in-out cubic
                const easeProgress = progress < 0.5
                    ? 4 * progress * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
                
                scrollLoginScreen.scrollTop = start + distance * easeProgress;
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            }
            
            requestAnimationFrame(animate);
            
            // Animate in target section
            const targetAnim = animations[targetIndex];
            sections[targetIndex].classList.add('active');
            const fadeInDelay = isTouchEvent ? 100 : 200;
            setTimeout(() => {
                sections[targetIndex].style.opacity = targetAnim.in.opacity;
                sections[targetIndex].style.transform = targetAnim.in.transform;
            }, fadeInDelay);
            
            // Reset previous section after transition
            const resetDelay = isTouchEvent ? 500 : 800;
            setTimeout(() => {
                sections.forEach((section, index) => {
                    if (index !== targetIndex) {
                        section.style.opacity = '1';
                        section.style.transform = animations[index].in.transform;
                        section.classList.remove('active');
                    }
                });
            }, resetDelay);
        }
        
        const cooldown = isTouchEvent ? TOUCH_SNAP_COOLDOWN : SNAP_COOLDOWN;
        setTimeout(() => {
            isSnapping = false;
            console.log('Snap complete, ready for next scroll');
        }, cooldown);
    }
    
    // Mouse wheel events
    scrollLoginScreen.addEventListener('wheel', (e) => {
        // Don't interfere with touch scrolling
        if (isTouching) return;
        
        if (isSnapping) {
            e.preventDefault();
            return;
        }
        
        e.preventDefault();
        const direction = e.deltaY > 0 ? 1 : -1;
        handleScroll(direction);
    }, { passive: false });
    
    // Touch events - allow native scrolling
    scrollLoginScreen.addEventListener('touchstart', (e) => {
        isTouching = true;
        touchStartY = e.touches[0].clientY;
        touchStartScrollTop = scrollLoginScreen.scrollTop;
    }, { passive: true });
    
    scrollLoginScreen.addEventListener('touchmove', (e) => {
        if (!isTouching) return;
        
        const touchY = e.touches[0].clientY;
        const deltaY = touchStartY - touchY;
        
        // Check if we've scrolled enough to trigger a section change
        if (Math.abs(deltaY) > TOUCH_THRESHOLD) {
            const direction = deltaY > 0 ? 1 : -1;
            
            // Check if we can move to next/prev section
            const targetIndex = currentSectionIndex + direction;
            if (targetIndex >= 0 && targetIndex < sections.length && !isSnapping) {
                // Trigger snap immediately without waiting for touchend
                isTouching = false;
                handleScroll(direction, true);
            }
        }
    }, { passive: true });
    
    scrollLoginScreen.addEventListener('touchend', (e) => {
        if (!isTouching) return;
        
        setTimeout(() => {
            isTouching = false;
        }, 100);
        
        if (isSnapping) return;
        
        // Find the closest section to current scroll position
        let closestIndex = 0;
        let minDistance = Infinity;
        
        sections.forEach((section, index) => {
            const distance = Math.abs(section.offsetTop - scrollLoginScreen.scrollTop);
            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = index;
            }
        });
        
        // Snap to closest section
        isSnapping = true;
        
        console.log('Touch end: Snapping to closest section', closestIndex);
        
        performSnap(closestIndex, true);
    }, { passive: true });
}
