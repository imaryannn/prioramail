// Smooth scroll with momentum and section snapping
let scrollCount = 0;
let lastScrollTime = 0;
let isSnapping = false;
let lastDirection = 0;
const SCROLL_THRESHOLD = 2;
const RESET_TIME = 1500;
const SNAP_COOLDOWN = 1000;

const scrollLoginScreen = document.getElementById('login-screen');

if (scrollLoginScreen) {
    let currentSectionIndex = 0;
    const sections = document.querySelectorAll('.hero-section, .how-it-works, .stats-section, .features-section, .cta-section, .footer');
    
    // Activate hero section on load
    if (sections.length > 0) {
        sections[0].classList.add('active');
    }
    
    scrollLoginScreen.addEventListener('wheel', (e) => {
        if (isSnapping) {
            e.preventDefault();
            return;
        }
        
        e.preventDefault();
        
        const currentTime = Date.now();
        const direction = e.deltaY > 0 ? 1 : -1;
        
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
            
            if (targetIndex !== currentSectionIndex) {
                const prevIndex = currentSectionIndex;
                currentSectionIndex = targetIndex;
                
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
                const duration = 1000;
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
                setTimeout(() => {
                    sections[targetIndex].style.opacity = targetAnim.in.opacity;
                    sections[targetIndex].style.transform = targetAnim.in.transform;
                }, 200);
                
                // Reset previous section after transition
                setTimeout(() => {
                    sections.forEach((section, index) => {
                        if (index !== targetIndex) {
                            section.style.opacity = '1';
                            section.style.transform = animations[index].in.transform;
                            section.classList.remove('active');
                        }
                    });
                }, 800);
            }
            
            setTimeout(() => {
                isSnapping = false;
                console.log('Snap complete, ready for next scroll');
            }, SNAP_COOLDOWN);
        }
    }, { passive: false });
}
