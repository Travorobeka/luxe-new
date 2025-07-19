/**
 * Advanced Button JavaScript
 * Handles dynamic button features and animations
 */

(function() {
  'use strict';

  class ButtonHandler {
    constructor() {
      this.init();
    }

    init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setup());
      } else {
        this.setup();
      }
    }

    setup() {
      this.applyButtonSettings();
      this.initializeRippleEffect();
      this.initializeLoadingStates();
      this.initializeToggleButtons();
      this.initializeButtonGroups();
      this.handleDynamicButtons();
    }

    // Apply settings from theme customizer
    applyButtonSettings() {
      const buttons = document.querySelectorAll('.m-button, .shopify-payment-button__button, button[type="submit"]');
      
      buttons.forEach(button => {
        // Apply hover effect based on settings
        const hoverEffect = getComputedStyle(document.documentElement).getPropertyValue('--btn-hover-effect').trim();
        if (hoverEffect && hoverEffect !== 'none') {
          button.classList.add(`m-button--${hoverEffect}`);
        }

        // Apply click animation
        const clickAnimation = getComputedStyle(document.documentElement).getPropertyValue('--btn-click-animation').trim();
        if (clickAnimation && clickAnimation !== 'none') {
          button.classList.add(`m-button--${clickAnimation}`);
        }

        // Apply gradient if enabled
        const gradientBg = getComputedStyle(document.documentElement).getPropertyValue('--btn-gradient-bg').trim();
        if (gradientBg && gradientBg !== 'none') {
          button.setAttribute('data-gradient', 'true');
        }

        // Apply icon animation
        if (button.classList.contains('m-button--text-with-icon')) {
          const iconAnimation = getComputedStyle(document.documentElement).getPropertyValue('--btn-icon-animation').trim();
          button.setAttribute('data-icon-animation', iconAnimation);
        }
      });
    }

    // Initialize ripple effect
    initializeRippleEffect() {
      const rippleButtons = document.querySelectorAll('.m-button--ripple');
      
      rippleButtons.forEach(button => {
        button.addEventListener('click', function(e) {
          const ripple = document.createElement('span');
          const rect = this.getBoundingClientRect();
          const size = Math.max(rect.width, rect.height);
          const x = e.clientX - rect.left - size / 2;
          const y = e.clientY - rect.top - size / 2;
          
          ripple.style.width = ripple.style.height = size + 'px';
          ripple.style.left = x + 'px';
          ripple.style.top = y + 'px';
          ripple.classList.add('ripple-effect');
          
          this.appendChild(ripple);
          
          setTimeout(() => {
            ripple.remove();
          }, 600);
        });
      });
    }

    // Initialize loading states
    initializeLoadingStates() {
      // Add loading state to forms on submit
      const forms = document.querySelectorAll('form[action*="/cart/add"]');
      
      forms.forEach(form => {
        form.addEventListener('submit', (e) => {
          const submitButton = form.querySelector('[type="submit"]');
          if (submitButton && !submitButton.classList.contains('m-button--loading')) {
            this.setButtonLoading(submitButton, true);
            
            // Remove loading state after a timeout (in case of error)
            setTimeout(() => {
              this.setButtonLoading(submitButton, false);
            }, 5000);
          }
        });
      });
    }

    // Set button loading state
    setButtonLoading(button, isLoading) {
      const loadingStyle = getComputedStyle(document.documentElement).getPropertyValue('--btn-loading-style').trim();
      
      if (isLoading) {
        button.classList.add('m-button--loading');
        button.classList.add(`m-button--loading-${loadingStyle}`);
        button.disabled = true;
        button.setAttribute('data-original-text', button.textContent);
      } else {
        button.classList.remove('m-button--loading');
        button.classList.remove(`m-button--loading-${loadingStyle}`);
        button.disabled = false;
        const originalText = button.getAttribute('data-original-text');
        if (originalText) {
          button.textContent = originalText;
        }
      }
    }

    // Initialize toggle buttons
    initializeToggleButtons() {
      const toggleButtons = document.querySelectorAll('.m-button--toggle');
      
      toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
          button.classList.toggle('is-active');
          const isActive = button.classList.contains('is-active');
          button.setAttribute('aria-pressed', isActive);
          
          // Trigger custom event
          button.dispatchEvent(new CustomEvent('toggle', { detail: { active: isActive } }));
        });
      });
    }

    // Initialize button groups
    initializeButtonGroups() {
      const buttonGroups = document.querySelectorAll('.m-button-group[data-toggle="true"]');
      
      buttonGroups.forEach(group => {
        const buttons = group.querySelectorAll('.m-button');
        
        buttons.forEach(button => {
          button.addEventListener('click', () => {
            // Remove active from all buttons in group
            buttons.forEach(btn => btn.classList.remove('is-active'));
            // Add active to clicked button
            button.classList.add('is-active');
            
            // Trigger custom event
            group.dispatchEvent(new CustomEvent('change', { 
              detail: { value: button.getAttribute('data-value') || button.textContent }
            }));
          });
        });
      });
    }

    // Handle dynamically added buttons
    handleDynamicButtons() {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === 1) { // Element node
                const buttons = node.querySelectorAll ? node.querySelectorAll('.m-button') : [];
                buttons.forEach(button => {
                  this.applyButtonSettings();
                });
              }
            });
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }

  // Button utilities
  const ButtonUtils = {
    // Create a button programmatically
    createButton(options = {}) {
      const button = document.createElement('button');
      button.className = 'm-button';
      
      // Apply options
      if (options.text) button.textContent = options.text;
      if (options.variant) button.classList.add(`m-button--${options.variant}`);
      if (options.size) button.classList.add(`m-button--${options.size}`);
      if (options.icon) this.addIcon(button, options.icon, options.iconPosition);
      if (options.onClick) button.addEventListener('click', options.onClick);
      if (options.disabled) button.disabled = true;
      if (options.classes) button.className += ` ${options.classes}`;
      
      return button;
    },

    // Add icon to button
    addIcon(button, iconName, position = 'right') {
      const icon = document.createElement('span');
      icon.className = 'icon';
      icon.innerHTML = `<svg><!-- Icon SVG here --></svg>`;
      
      button.classList.add('m-button--text-with-icon');
      if (position === 'left') {
        button.classList.add('icon-left');
        button.prepend(icon);
      } else {
        button.append(icon);
      }
    },

    // Show success state
    showSuccess(button, message = 'Success!', duration = 2000) {
      const originalContent = button.innerHTML;
      button.innerHTML = `<span class="icon">✓</span> ${message}`;
      button.classList.add('m-button--success');
      button.disabled = true;
      
      setTimeout(() => {
        button.innerHTML = originalContent;
        button.classList.remove('m-button--success');
        button.disabled = false;
      }, duration);
    },

    // Show error state
    showError(button, message = 'Error!', duration = 2000) {
      const originalContent = button.innerHTML;
      button.innerHTML = `<span class="icon">✗</span> ${message}`;
      button.classList.add('m-button--error');
      button.disabled = true;
      
      setTimeout(() => {
        button.innerHTML = originalContent;
        button.classList.remove('m-button--error');
        button.disabled = false;
      }, duration);
    }
  };

  // Initialize button handler
  const buttonHandler = new ButtonHandler();

  // Export utilities for global access
  window.ButtonHandler = ButtonHandler;
  window.ButtonUtils = ButtonUtils;

  // Add CSS for ripple effect
  const style = document.createElement('style');
  style.textContent = `
    .ripple-effect {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.6);
      transform: scale(0);
      animation: ripple-animation 0.6s ease-out;
      pointer-events: none;
    }
    
    @keyframes ripple-animation {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
    
    .m-button--success {
      background: #4caf50 !important;
      color: white !important;
    }
    
    .m-button--error {
      background: #f44336 !important;
      color: white !important;
    }
  `;
  document.head.appendChild(style);

})();