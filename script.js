document.addEventListener('DOMContentLoaded', () => {

    // Mobile Navigation Toggle
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            // Toggle icon between bars and times (X)
            const icon = mobileToggle.querySelector('i');
            if (icon) {
                if (navMenu.classList.contains('active')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
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

    // Count Up Animation for Stats
    const counters = document.querySelectorAll('.counter'); // Check if functionality is needed
    // ... (Keep existing counter logic if elements exist, otherwise it's harmless)


});
