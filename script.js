document.addEventListener('DOMContentLoaded', () => {

    // Mobile Navigation Toggle
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';

            // Basic mobile menu styling injection for toggle state
            if (navMenu.style.display === 'flex') {
                navMenu.style.position = 'absolute';
                navMenu.style.top = '100%';
                navMenu.style.left = '0';
                navMenu.style.width = '100%';
                navMenu.style.flexDirection = 'column';
                navMenu.style.background = 'white';
                navMenu.style.padding = '1rem';
                navMenu.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            }
        });
    }

    // FAQ Accordion (Global if present)
    const accHeaders = document.querySelectorAll('.accordion-header');
    accHeaders.forEach(header => {
        header.addEventListener('click', () => {
            // Close other open items
            const currentContent = header.nextElementSibling;

            // Toggle active state
            header.classList.toggle('active');
            currentContent.classList.toggle('active');
        });
    });

    // Count Up Animation for Stats
    const counters = document.querySelectorAll('.counter'); // Check if functionality is needed
    // ... (Keep existing counter logic if elements exist, otherwise it's harmless)

});
