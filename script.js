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

    // Contact Form WhatsApp Submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Get values
            const fullName = document.getElementById('fullName').value;
            const mobileNumber = document.getElementById('mobileNumber').value;
            const emailAddress = document.getElementById('emailAddress').value;
            const cityState = document.getElementById('cityState').value;
            const debtType = document.getElementById('debtType').value;
            const loanAmount = document.getElementById('loanAmount').value;
            const message = document.getElementById('message').value;
            const bestTime = document.getElementById('bestTime').value;

            // Get selected radio button
            const contactPref = document.querySelector('input[name="contact-pref"]:checked')?.value || 'Not Specified';

            // Format WhatsApp Message
            let waMessage = `*New Confidential Case Review Request*%0a%0a`;
            waMessage += `*Name:* ${fullName}%0a`;
            waMessage += `*Mobile:* ${mobileNumber}%0a`;
            waMessage += `*Email:* ${emailAddress}%0a`;
            waMessage += `*Location:* ${cityState}%0a`;
            waMessage += `*Debt Type:* ${debtType}%0a`;
            waMessage += `*Amount:* ${loanAmount}%0a`;
            waMessage += `*Challenges:* ${message}%0a`;
            waMessage += `*Contact Preference:* ${contactPref}%0a`;
            waMessage += `*Best Time:* ${bestTime}`;

            // Redirect to WhatsApp
            const waNumber = "917042538878";
            window.open(`https://wa.me/${waNumber}?text=${waMessage}`, '_blank');
        });
    }

});
