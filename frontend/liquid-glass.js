// Liquid glass effect for sections
window.addEventListener('load', () => {
    const sections = document.querySelectorAll('.how-it-works, .stats-section, .features-section, .cta-section');
    console.log('Found sections:', sections.length);
    sections.forEach((section, index) => {
        console.log('Processing section', index, section.className);
        const canvas = document.createElement('canvas');
        canvas.className = 'liquid-glass-overlay';
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '10';
        canvas.style.opacity = '1';
        canvas.style.mixBlendMode = 'normal';
        
        console.log('Creating canvas for:', section.className);
        section.style.position = 'relative';
        section.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        let width = section.offsetWidth;
        let height = section.offsetHeight;
        canvas.width = width;
        canvas.height = height;
        
        console.log('Canvas dimensions for', section.className, ':', width, 'x', height);
        
        const points = [];
        const rows = 20;
        const cols = 30;
        const spacing = width / cols;
        
        for (let i = 0; i <= rows; i++) {
            for (let j = 0; j <= cols; j++) {
                points.push({
                    x: j * spacing,
                    y: i * (height / rows),
                    originalX: j * spacing,
                    originalY: i * (height / rows),
                    vx: 0,
                    vy: 0
                });
            }
        }
        
        let mouseX = -1000;
        let mouseY = -1000;
        
        section.addEventListener('mousemove', (e) => {
            const rect = section.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
        });
        
        section.addEventListener('mouseleave', () => {
            mouseX = -1000;
            mouseY = -1000;
        });
        
        function animate() {
            ctx.clearRect(0, 0, width, height);
            
            points.forEach(point => {
                const dx = mouseX - point.x;
                const dy = mouseY - point.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 120) {
                    const force = (120 - dist) / 120;
                    const angle = Math.atan2(dy, dx);
                    point.vx -= Math.cos(angle) * force * 3;
                    point.vy -= Math.sin(angle) * force * 3;
                }
                
                point.vx += (point.originalX - point.x) * 0.05;
                point.vy += (point.originalY - point.y) * 0.05;
                
                point.vx *= 0.9;
                point.vy *= 0.9;
                
                point.x += point.vx;
                point.y += point.vy;
            });
            
            ctx.fillStyle = 'transparent';
            ctx.strokeStyle = 'rgba(82, 121, 111, 0.2)';
            ctx.lineWidth = 1;
            
            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    const index = i * (cols + 1) + j;
                    const p1 = points[index];
                    const p2 = points[index + 1];
                    const p3 = points[index + cols + 2];
                    const p4 = points[index + cols + 1];
                    
                    if (p1 && p2 && p3 && p4) {
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.lineTo(p3.x, p3.y);
                        ctx.lineTo(p4.x, p4.y);
                        ctx.closePath();
                        ctx.fill();
                        ctx.stroke();
                    }
                }
            }
            
            requestAnimationFrame(animate);
        }
        
        animate();
        
        // Recalculate dimensions when section becomes visible
        const resizeObserver = new ResizeObserver(() => {
            width = section.offsetWidth;
            height = section.offsetHeight;
            if (width > 0 && height > 0) {
                canvas.width = width;
                canvas.height = height;
                console.log('Resized canvas for', section.className, ':', width, 'x', height);
            }
        });
        resizeObserver.observe(section);
        
        window.addEventListener('resize', () => {
            width = section.offsetWidth;
            height = section.offsetHeight;
            canvas.width = width;
            canvas.height = height;
        });
    });
});
