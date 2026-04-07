window.addEventListener('load', () => {
    const logoText = document.getElementById('logoText');
    const envelope = document.getElementById('envelope');
    const paperPlane = document.getElementById('paperPlane');
    
    function runAnimation() {
        logoText.style.animation = 'none';
        envelope.style.animation = 'none';
        paperPlane.style.animation = 'none';
        
        void logoText.offsetWidth;
        
        logoText.style.animation = 'logoFadeOut 0.8s ease-in-out 2s forwards';
        envelope.style.animation = 'envelopeSequence 3s ease-in-out 2.8s forwards';
        paperPlane.style.animation = 'planeFly 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) 5.3s forwards';
        
        setTimeout(() => {
            logoText.style.animation = 'logoFadeIn 0.8s ease-in-out forwards';
            setTimeout(runAnimation, 3000);
        }, 7300);
    }
            
    setTimeout(runAnimation, 500);
});
