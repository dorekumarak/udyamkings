/**
 * UdyamKings - Main JavaScript
 * Handles interactive elements and functionality
 */

// Enhanced loading overlay removal
function removeLoading() {
    try {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            // Add fade out effect
            loadingElement.style.opacity = '0';
            // Remove from DOM after animation
            setTimeout(() => {
                loadingElement.style.display = 'none';
                // Also remove any body classes that might be causing blur
                document.body.classList.remove('overflow-hidden', 'blur-sm');
            }, 300);
        }
    } catch (error) {
        console.error('Error removing loading overlay:', error);
    }
}

// Remove loader when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Try to remove immediately
    removeLoading();
    
    // Also set up the window load listener as a backup
    window.addEventListener('load', removeLoading);
});

// Absolute failsafe - remove after 3 seconds no matter what
setTimeout(removeLoading, 3000);

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            const isExpanded = mobileMenuButton.getAttribute('aria-expanded') === 'true';
            mobileMenuButton.setAttribute('aria-expanded', !isExpanded);
            mobileMenu.classList.toggle('hidden');
            
            // Toggle menu icon between hamburger and X
            const menuIcon = mobileMenuButton.querySelector('svg');
            if (menuIcon) {
                menuIcon.innerHTML = isExpanded 
                    ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />' 
                    : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />';
            }
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!mobileMenu.contains(e.target) && !mobileMenuButton.contains(e.target)) {
                mobileMenu.classList.add('hidden');
                mobileMenuButton.setAttribute('aria-expanded', 'false');
                const menuIcon = mobileMenuButton.querySelector('svg');
                if (menuIcon) {
                    menuIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />';
                }
            }
        });
    }

    // Back to top button
    const backToTopButton = document.getElementById('back-to-top');
    
    if (backToTopButton) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTopButton.classList.remove('opacity-0', 'invisible');
                backToTopButton.classList.add('opacity-100', 'visible');
            } else {
                backToTopButton.classList.add('opacity-0', 'invisible');
                backToTopButton.classList.remove('opacity-100', 'visible');
            }
        });

        backToTopButton.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Add styles for validation
    const style = document.createElement('style');
    style.textContent = `
        .was-validated .form-control:invalid,
        .form-control.is-invalid {
            border-color: #F87171;
            padding-right: calc(1.5em + 0.75rem);
            background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23DC2626'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath stroke-linejoin='round' d='M5.8 3.6h.4L6 6.5z'/%3e%3ccircle cx='6' cy='8.2' r='.6' fill='%23DC2626' stroke='none'/%3e%3c/svg%3e");
            background-repeat: no-repeat;
            background-position: right calc(0.375em + 0.1875rem) center;
            background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
        }
        
        .was-validated .form-control:valid,
        .form-control.is-valid {
            border-color: #34D399;
            padding-right: calc(1.5em + 0.75rem);
            background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'%3e%3cpath fill='%2334D399' d='M2.3 6.73L.6 4.53c-.4-1.04.46-1.4 1.1-.8l1.1 1.4 3.4-3.8c.6-.63 1.6-.27 1.2.7l-4 4.6c-.43.5-.8.4-1.1.1z'/%3e%3c/svg%3e");
            background-repeat: no-repeat;
            background-position: right calc(0.375em + 0.1875rem) center;
            background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
        }
        
        .invalid-feedback {
            display: none;
            width: 100%;
            margin-top: 0.25rem;
            font-size: 0.875em;
            color: #DC2626;
        }
        
        .was-validated .form-control:invalid ~ .invalid-feedback,
        .was-validated .form-control:invalid ~ .invalid-tooltip,
        .form-control.is-invalid ~ .invalid-feedback,
        .form-control.is-invalid ~ .invalid-tooltip {
            display: block;
        }
        
        /* Alert styles */
        .alert {
            padding: 1rem;
            margin-bottom: 1rem;
            border: 1px solid transparent;
            border-radius: 0.375rem;
        }
        
        .alert-success {
            background-color: #D1FAE5;
            color: #065F46;
            border-color: #34D399;
        }
        
        .alert-danger {
            background-color: #FEE2E2;
            color: #991B1B;
            border-color: #F87171;
        }
        
        .alert-info {
            background-color: #DBEAFE;
            color: #1E40AF;
            border-color: #60A5FA;
        }
    `;
    
    document.head.appendChild(style);

    // Form validation
    const forms = document.querySelectorAll('.needs-validation');
    
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            
            form.classList.add('was-validated');
        }, false);
    });

    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialize popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    // Animate on scroll
    const animateOnScroll = () => {
        const elements = document.querySelectorAll('.animate-on-scroll');
        
        elements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150;
            
            if (elementTop < window.innerHeight - elementVisible) {
                element.classList.add('animate-fade-in-up');
            }
        });
    };
    
    // Run once on page load
    animateOnScroll();
    
    // Run on scroll
    window.addEventListener('scroll', animateOnScroll);

    // Show alert message
    const showAlert = (type, message, container = 'body', dismissible = true) => {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} fixed top-4 right-4 z-50 max-w-sm`;
        alertDiv.role = 'alert';
        
        // Add close button if dismissible
        const closeBtn = dismissible ? 
            '<button type="button" class="close-btn absolute top-2 right-2 text-gray-500 hover:text-gray-700" aria-label="Close">' +
            '<span aria-hidden="true">&times;</span></button>' : '';
            
        alertDiv.innerHTML = `
            <div class="relative p-4 rounded-md ${type === 'success' ? 'bg-green-50' : 'bg-red-50'} 
                ${type === 'success' ? 'text-green-800' : 'text-red-800'}">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 ${type === 'success' ? 'text-green-400' : 'text-red-400'}" 
                            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm font-medium">${message}</p>
                    </div>
                    ${closeBtn}
                </div>
            </div>
        `;
        
        const containerEl = container === 'body' ? document.body : document.querySelector(container);
        containerEl.appendChild(alertDiv);
        
        // Auto-remove after 5 seconds
        if (dismissible) {
            setTimeout(() => {
                alertDiv.remove();
            }, 5000);
            
            // Close button functionality
            const closeBtn = alertDiv.querySelector('.close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    alertDiv.remove();
                });
            }
        }
    };

    // Format phone number input
    const formatPhoneNumber = (input) => {
        // Remove all non-digit characters
        let phoneNumber = input.value.replace(/\D/g, '');
        
        // Format as (XXX) XXX-XXXX
        if (phoneNumber.length > 0) {
            phoneNumber = phoneNumber.match(/(\d{0,3})(\d{0,3})(\d{0,4})/);
            phoneNumber = !phoneNumber[2] 
                ? phoneNumber[1] 
                : `(${phoneNumber[1]}) ${phoneNumber[2]}` + (phoneNumber[3] ? `-${phoneNumber[3]}` : '');
        }
        
        input.value = phoneNumber;
    };
    
    // Initialize phone number formatter
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', () => formatPhoneNumber(input));
    });

    // Handle file upload size validation
    const validateFileSize = (input, maxSizeMB) => {
        if (input.files.length > 0) {
            const fileSizeMB = input.files[0].size / (1024 * 1024); // Convert to MB
            
            if (fileSizeMB > maxSizeMB) {
                showAlert('danger', `File size must be less than ${maxSizeMB}MB`);
                input.value = ''; // Clear the file input
                return false;
            }
        }
        return true;
    };
    
    // Add event listeners for file inputs with data-max-size attribute
    document.querySelectorAll('input[type="file"][data-max-size]').forEach(input => {
        input.addEventListener('change', function() {
            const maxSizeMB = parseFloat(this.getAttribute('data-max-size'));
            validateFileSize(this, maxSizeMB);
        });
    });

    // Handle form submissions with fetch API
    const handleFormSubmit = async (formId, successMessage = 'Form submitted successfully!', errorMessage = 'There was an error. Please try again.') => {
        const form = document.getElementById(formId);
        if (!form) return;

        try {
            const formData = new FormData(form);
            const response = await fetch(form.action || window.location.href, {
                method: form.method || 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                showAlert('success', successMessage);
                form.reset();
            } else {
                throw new Error('Network response was not ok');
            }
        } catch (error) {
            console.error('Error:', error);
            showAlert('danger', errorMessage);
        }
    };

    // Expose functions to global scope if needed
    window.showAlert = showAlert;
    window.handleFormSubmit = handleFormSubmit;
    window.formatPhoneNumber = formatPhoneNumber;
    window.validateFileSize = validateFileSize;

    // Initialize lazy loading for images
    if ('loading' in HTMLImageElement.prototype) {
        const lazyImages = document.querySelectorAll('img[loading="lazy"]');
        lazyImages.forEach(img => {
            if (img.dataset.src) {
                img.src = img.dataset.src;
            }
        });
    } else if (!document.querySelector('script[src*="lazysizes"]')) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
        script.integrity = 'sha512-q583ppKrCRc7N5O0n2nzUiJ+suUv7Et1JGels4bXOaMFQcamPk9HjdUknZuuFjBNs7tsMu+5v7Nk0v1e8q9jQ==';
        script.crossOrigin = 'anonymous';
        document.body.appendChild(script);
    }
});
