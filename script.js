// Global variables
let registrationCount = 0;
const MAX_PARTICIPANTS = 10;
const CAPTCHA_ANSWER = "GOA";

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    setupScrollAnimations();
});

// Initialize application state
function initializeApp() {
    // Load registration count from localStorage
    registrationCount = parseInt(localStorage.getItem('goaTripRegistrations') || '0');
    
    // Update UI based on current registration count
    updateRegistrationUI();
    
    // Check if trip is full
    if (registrationCount >= MAX_PARTICIPANTS) {
        showTripFullMessage();
    }
}

// Set up all event listeners
function setupEventListeners() {
    const form = document.getElementById('registrationForm');
    const smoothScrollLinks = document.querySelectorAll('a[href^="#"]');
    
    // Form submission
    form.addEventListener('submit', handleFormSubmission);
    
    // Real-time form validation
    setupFormValidation();
    
    // Smooth scrolling for navigation links
    smoothScrollLinks.forEach(link => {
        link.addEventListener('click', handleSmoothScroll);
    });
    
    // Input formatters
    setupInputFormatters();
}

// Handle form submission
function handleFormSubmission(e) {
    e.preventDefault();
    
    // Check if trip is full
    if (registrationCount >= MAX_PARTICIPANTS) {
        showTripFullMessage();
        return;
    }
    
    // Validate form
    if (!validateForm()) {
        return;
    }
    
    // Check for duplicate email
    const email = document.getElementById('email').value;
    if (isDuplicateEmail(email)) {
        showError('email', 'This email is already registered for the trip');
        return;
    }
    
    // Show loading state
    setFormLoading(true);
    
    // Submit form to FormSubmit.co
    const formData = new FormData(e.target);
    
    fetch(e.target.action, {
        method: 'POST',
        body: formData,
        headers: {
            'Accept': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            // Save registration locally
            saveRegistration(email);
            
            // Update registration count
            registrationCount++;
            localStorage.setItem('goaTripRegistrations', registrationCount.toString());
            
            // Update UI
            updateRegistrationUI();
            
            // Show success message
            showSuccessMessage();
            
            // Reset form
            document.getElementById('registrationForm').reset();
            setFormLoading(false);
            
            // Check if trip is now full
            if (registrationCount >= MAX_PARTICIPANTS) {
                setTimeout(() => {
                    showTripFullMessage();
                }, 3000);
            }
        } else {
            throw new Error('Form submission failed');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        setFormLoading(false);
        alert('There was an error submitting the form. Please try again.');
    });
}

// Validate entire form
function validateForm() {
    let isValid = true;
    
    // Clear previous errors
    clearAllErrors();
    
    // Validate name
    const name = document.getElementById('name').value.trim();
    if (name.length < 2) {
        showError('name', 'Name must be at least 2 characters long');
        isValid = false;
    } else if (!/^[a-zA-Z\s]+$/.test(name)) {
        showError('name', 'Name should only contain letters and spaces');
        isValid = false;
    }
    
    // Validate email
    const email = document.getElementById('email').value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('email', 'Please enter a valid email address');
        isValid = false;
    }
    
    // Validate phone
    const phone = document.getElementById('phone').value.trim();
    const phoneRegex = /^[\+]?[1-9][\d]{3,14}$/;
    if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
        showError('phone', 'Please enter a valid phone number');
        isValid = false;
    }
    
    // Validate CAPTCHA
    const captcha = document.getElementById('captcha').value.trim().toUpperCase();
    if (captcha !== CAPTCHA_ANSWER) {
        showError('captcha', 'Please type "GOA" to verify you are not a bot');
        isValid = false;
    }
    
    return isValid;
}

// Set up real-time form validation
function setupFormValidation() {
    const inputs = ['name', 'email', 'phone', 'captcha'];
    
    inputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        input.addEventListener('blur', () => validateField(inputId));
        input.addEventListener('input', () => clearError(inputId));
    });
}

// Validate individual field
function validateField(fieldId) {
    const field = document.getElementById(fieldId);
    const value = field.value.trim();
    
    switch(fieldId) {
        case 'name':
            if (value.length > 0 && value.length < 2) {
                showError(fieldId, 'Name must be at least 2 characters long');
            } else if (value.length > 0 && !/^[a-zA-Z\s]+$/.test(value)) {
                showError(fieldId, 'Name should only contain letters and spaces');
            } else if (value.length >= 2) {
                showSuccess(fieldId);
            }
            break;
            
        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (value.length > 0 && !emailRegex.test(value)) {
                showError(fieldId, 'Please enter a valid email address');
            } else if (emailRegex.test(value)) {
                if (isDuplicateEmail(value)) {
                    showError(fieldId, 'This email is already registered');
                } else {
                    showSuccess(fieldId);
                }
            }
            break;
            
        case 'phone':
            const phoneRegex = /^[\+]?[1-9][\d]{3,14}$/;
            if (value.length > 0 && !phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
                showError(fieldId, 'Please enter a valid phone number');
            } else if (phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
                showSuccess(fieldId);
            }
            break;
            
        case 'captcha':
            if (value.length > 0 && value.toUpperCase() !== CAPTCHA_ANSWER) {
                showError(fieldId, 'Please type "GOA" to verify');
            } else if (value.toUpperCase() === CAPTCHA_ANSWER) {
                showSuccess(fieldId);
            }
            break;
    }
}

// Set up input formatters
function setupInputFormatters() {
    // Phone number formatter
    const phoneInput = document.getElementById('phone');
    phoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 10) {
            value = value.substring(0, 10);
        }
        e.target.value = value;
    });
    
    // Name formatter (capitalize first letter of each word)
    const nameInput = document.getElementById('name');
    nameInput.addEventListener('blur', function(e) {
        const words = e.target.value.toLowerCase().split(' ');
        const capitalizedWords = words.map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        );
        e.target.value = capitalizedWords.join(' ');
    });
}

// Show error message
function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(fieldId + 'Error');
    
    field.classList.add('error');
    field.classList.remove('success');
    errorElement.textContent = message;
}

// Show success state
function showSuccess(fieldId) {
    const field = document.getElementById(fieldId);
    field.classList.add('success');
    field.classList.remove('error');
    clearError(fieldId);
}

// Clear error message
function clearError(fieldId) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(fieldId + 'Error');
    
    field.classList.remove('error');
    errorElement.textContent = '';
}

// Clear all errors
function clearAllErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    const inputElements = document.querySelectorAll('.form-group input, .form-group select');
    
    errorElements.forEach(element => element.textContent = '');
    inputElements.forEach(element => {
        element.classList.remove('error', 'success');
    });
}

// Check for duplicate email
function isDuplicateEmail(email) {
    const registeredEmails = JSON.parse(localStorage.getItem('goaTripEmails') || '[]');
    return registeredEmails.includes(email.toLowerCase());
}

// Save registration data
function saveRegistration(email) {
    const registeredEmails = JSON.parse(localStorage.getItem('goaTripEmails') || '[]');
    registeredEmails.push(email.toLowerCase());
    localStorage.setItem('goaTripEmails', JSON.stringify(registeredEmails));
}

// Update registration UI
function updateRegistrationUI() {
    const spotsLeft = MAX_PARTICIPANTS - registrationCount;
    const progressPercentage = (registrationCount / MAX_PARTICIPANTS) * 100;
    
    document.getElementById('spotsLeft').textContent = spotsLeft;
    document.getElementById('progressFill').style.width = progressPercentage + '%';
    
    // Change progress bar color as it fills up
    const progressFill = document.getElementById('progressFill');
    if (progressPercentage >= 80) {
        progressFill.style.background = 'linear-gradient(45deg, #FF6B35, #dc3545)';
    } else if (progressPercentage >= 50) {
        progressFill.style.background = 'linear-gradient(45deg, #FFE066, #FF6B35)';
    }
}

// Set form loading state
function setFormLoading(loading) {
    const submitButton = document.getElementById('submitButton');
    const buttonText = submitButton.querySelector('.button-text');
    const buttonLoader = submitButton.querySelector('.button-loader');
    
    if (loading) {
        submitButton.disabled = true;
        buttonText.style.display = 'none';
        buttonLoader.style.display = 'flex';
    } else {
        submitButton.disabled = false;
        buttonText.style.display = 'inline';
        buttonLoader.style.display = 'none';
    }
}

// Show success message
function showSuccessMessage() {
    const successMessage = document.getElementById('successMessage');
    const form = document.getElementById('registrationForm');
    
    form.style.display = 'none';
    successMessage.style.display = 'flex';
    
    // Add animation class
    successMessage.classList.add('animate__animated', 'animate__fadeIn');
}

// Show trip full message
function showTripFullMessage() {
    const tripFullMessage = document.getElementById('tripFullMessage');
    const form = document.getElementById('registrationForm');
    
    form.style.display = 'none';
    tripFullMessage.style.display = 'flex';
    
    // Add animation class
    tripFullMessage.classList.add('animate__animated', 'animate__fadeIn');
}

// Handle smooth scrolling
function handleSmoothScroll(e) {
    e.preventDefault();
    
    const targetId = e.target.getAttribute('href');
    const targetElement = document.querySelector(targetId);
    
    if (targetElement) {
        const offsetTop = targetElement.offsetTop - 80;
        
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }
}

// Set up scroll animations
function setupScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate__animated:not(.animate__infinite)');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.visibility = 'visible';
                entry.target.style.animationDelay = '0.1s';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    animatedElements.forEach(element => {
        if (!element.classList.contains('animate__infinite')) {
            element.style.visibility = 'hidden';
            observer.observe(element);
        }
    });
}

// Utility function to add animation delays
function addAnimationDelays() {
    const cards = document.querySelectorAll('.highlight-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });
}

// Initialize animation delays
document.addEventListener('DOMContentLoaded', addAnimationDelays);

// Add some fun interactive elements
document.addEventListener('DOMContentLoaded', function() {
    // Add floating effect to hero badges
    const badges = document.querySelectorAll('.badge');
    badges.forEach((badge, index) => {
        badge.style.animationDelay = `${index * 0.5}s`;
        badge.style.animation = 'float 3s ease-in-out infinite alternate';
    });
    
    // Add hover effect to highlight cards
    const highlightCards = document.querySelectorAll('.highlight-card');
    highlightCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
});

// Add CSS animation for floating badges
const style = document.createElement('style');
style.textContent = `
    @keyframes float {
        0% { transform: translateY(0px); }
        100% { transform: translateY(-10px); }
    }
`;
document.head.appendChild(style);

// Console easter egg
console.log(`
👥 Welcome to Goa Friends Trip! 👥
Thanks for checking out the console!
Making new friends through code and travel! 
Email us at dev@goafriendstrip.com
`);
