document.addEventListener('DOMContentLoaded', () => {

    // Mobile Navigation Toggle
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (mobileToggle && navMenu) {
        const setMenu = (open) => {
            navMenu.classList.toggle('active', open);
            mobileToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            mobileToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
            const icon = mobileToggle.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars', !open);
                icon.classList.toggle('fa-times', open);
            }
        };
        const toggleMenu = () => setMenu(!navMenu.classList.contains('active'));

        mobileToggle.addEventListener('click', toggleMenu);
        // Keyboard support (Enter / Space) since toggle is role="button"
        mobileToggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleMenu();
            }
        });
        // Close menu when a nav link is tapped
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => setMenu(false));
        });
        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navMenu.classList.contains('active')) setMenu(false);
        });
    }

    // FAQ Accordion (Global if present)
    const accHeaders = document.querySelectorAll('.accordion-header');
    accHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const currentContent = header.nextElementSibling;
            const isActive = header.classList.contains('active');

            // Close all items first
            accHeaders.forEach(h => {
                h.classList.remove('active');
                if (h.nextElementSibling) {
                    h.nextElementSibling.classList.remove('active');
                }
            });

            // Toggle the clicked one if it wasn't active
            if (!isActive) {
                header.classList.add('active');
                currentContent.classList.add('active');
            }
        });
    });

    // Lightweight scroll-reveal (fade/slide-in). Respects reduced motion.
    const revealEls = document.querySelectorAll('.reveal');
    if (revealEls.length) {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce || !('IntersectionObserver' in window)) {
            revealEls.forEach(el => el.classList.add('is-visible'));
        } else {
            const io = new IntersectionObserver((entries, obs) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        obs.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
            revealEls.forEach(el => io.observe(el));
        }
    }

});
