/**
 * Email Popup System
 * Enterprise-level email capture with sophisticated customization and error handling
 */

(function() {
  'use strict';

  // Error Management System (Task 13.1)
  class ErrorManager {
    constructor() {
      this.errors = [];
      this.errorTypes = {
        VALIDATION: 'validation',
        NETWORK: 'network',
        API: 'api',
        STORAGE: 'storage',
        INTEGRATION: 'integration',
        CONFIG: 'config'
      };
    }

    logError(type, message, details = {}) {
      const error = {
        type,
        message,
        details,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      this.errors.push(error);
      
      // Console logging for development
      if (window.console && typeof console.error === 'function') {
        console.error(`[EmailPopup ${type}]`, message, details);
      }
      
      // Send to monitoring service if available
      this.sendToMonitoring(error);
    }

    sendToMonitoring(error) {
      try {
        // Check if monitoring service is available
        if (window.dataLayer) {
          window.dataLayer.push({
            event: 'email_popup_error',
            error_type: error.type,
            error_message: error.message,
            error_details: error.details
          });
        }
      } catch (e) {
        // Silently fail if monitoring is not available
      }
    }

    getUserFriendlyMessage(type, originalMessage) {
      const messages = {
        [this.errorTypes.VALIDATION]: 'Please check your email address and try again.',
        [this.errorTypes.NETWORK]: 'Please check your connection and try again.',
        [this.errorTypes.API]: 'We encountered a temporary issue. Please try again in a moment.',
        [this.errorTypes.STORAGE]: 'There was an issue saving your preferences.',
        [this.errorTypes.INTEGRATION]: 'We encountered an issue with our email service. Please try again.',
        [this.errorTypes.CONFIG]: 'There was a configuration issue. Please contact support.'
      };
      
      return messages[type] || 'An unexpected error occurred. Please try again.';
    }
  }

  // Storage Manager
  class StorageManager {
    constructor(errorManager) {
      this.errorManager = errorManager;
      this.prefix = 'emailPopup_';
      this.isAvailable = this.checkAvailability();
    }

    checkAvailability() {
      try {
        const test = '__localStorage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
      } catch (e) {
        this.errorManager.logError(
          this.errorManager.errorTypes.STORAGE,
          'localStorage not available',
          { error: e.message }
        );
        return false;
      }
    }

    get(key) {
      if (!this.isAvailable) return null;
      
      try {
        const item = localStorage.getItem(this.prefix + key);
        return item ? JSON.parse(item) : null;
      } catch (e) {
        this.errorManager.logError(
          this.errorManager.errorTypes.STORAGE,
          'Failed to get item from localStorage',
          { key, error: e.message }
        );
        return null;
      }
    }

    set(key, value) {
      if (!this.isAvailable) return false;
      
      try {
        localStorage.setItem(this.prefix + key, JSON.stringify(value));
        return true;
      } catch (e) {
        this.errorManager.logError(
          this.errorManager.errorTypes.STORAGE,
          'Failed to set item in localStorage',
          { key, error: e.message }
        );
        return false;
      }
    }

    remove(key) {
      if (!this.isAvailable) return false;
      
      try {
        localStorage.removeItem(this.prefix + key);
        return true;
      } catch (e) {
        this.errorManager.logError(
          this.errorManager.errorTypes.STORAGE,
          'Failed to remove item from localStorage',
          { key, error: e.message }
        );
        return false;
      }
    }
  }

  // Validation Manager
  class ValidationManager {
    constructor(errorManager) {
      this.errorManager = errorManager;
    }

    validateEmail(email) {
      try {
        if (!email || typeof email !== 'string') {
          return { isValid: false, message: 'Email address is required.' };
        }

        email = email.trim();
        
        if (email.length === 0) {
          return { isValid: false, message: 'Email address is required.' };
        }

        if (email.length > 254) {
          return { isValid: false, message: 'Email address is too long.' };
        }

        // RFC 5322 compliant regex (simplified)
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        
        if (!emailRegex.test(email)) {
          return { isValid: false, message: 'Please enter a valid email address.' };
        }

        return { isValid: true, email: email };
      } catch (e) {
        this.errorManager.logError(
          this.errorManager.errorTypes.VALIDATION,
          'Email validation failed',
          { email: email ? '[email provided]' : '[no email]', error: e.message }
        );
        return { isValid: false, message: 'Please enter a valid email address.' };
      }
    }
  }

  // Trigger Manager
  class TriggerManager {
    constructor(config, storageManager, errorManager) {
      this.config = config;
      this.storage = storageManager;
      this.errorManager = errorManager;
      this.listeners = new Map();
      this.triggered = false;
    }

    init() {
      try {
        this.setupTriggers();
      } catch (e) {
        this.errorManager.logError(
          this.errorManager.errorTypes.CONFIG,
          'Failed to initialize triggers',
          { error: e.message }
        );
      }
    }

    setupTriggers() {
      const triggers = this.config.triggers || {};

      // Time delay trigger
      if (triggers.timeDelay > 0) {
        setTimeout(() => {
          this.checkAndTrigger('timeDelay');
        }, triggers.timeDelay * 1000);
      }

      // Scroll percentage trigger
      if (triggers.scrollPercentage > 0) {
        this.addScrollListener(triggers.scrollPercentage);
      }

      // Exit intent trigger
      if (triggers.exitIntent) {
        this.addExitIntentListener();
      }

      // Page views trigger
      if (triggers.pageViews > 0) {
        this.checkPageViews(triggers.pageViews);
      }

      // Session duration trigger
      if (triggers.sessionDuration > 0) {
        setTimeout(() => {
          this.checkAndTrigger('sessionDuration');
        }, triggers.sessionDuration * 1000);
      }
    }

    addScrollListener(percentage) {
      const scrollHandler = this.debounce(() => {
        try {
          const scrolled = (window.pageYOffset / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
          if (scrolled >= percentage) {
            this.checkAndTrigger('scroll');
            this.removeListener('scroll');
          }
        } catch (e) {
          this.errorManager.logError(
            this.errorManager.errorTypes.CONFIG,
            'Scroll trigger failed',
            { error: e.message }
          );
        }
      }, 100);

      window.addEventListener('scroll', scrollHandler, { passive: true });
      this.listeners.set('scroll', scrollHandler);
    }

    addExitIntentListener() {
      const exitHandler = (e) => {
        try {
          if (e.clientY <= 0) {
            this.checkAndTrigger('exitIntent');
            this.removeListener('exitIntent');
          }
        } catch (error) {
          this.errorManager.logError(
            this.errorManager.errorTypes.CONFIG,
            'Exit intent trigger failed',
            { error: error.message }
          );
        }
      };

      document.addEventListener('mouseleave', exitHandler);
      this.listeners.set('exitIntent', exitHandler);
    }

    checkPageViews(requiredViews) {
      try {
        const pageViews = this.storage.get('pageViews') || 0;
        const newPageViews = pageViews + 1;
        this.storage.set('pageViews', newPageViews);

        if (newPageViews >= requiredViews) {
          this.checkAndTrigger('pageViews');
        }
      } catch (e) {
        this.errorManager.logError(
          this.errorManager.errorTypes.STORAGE,
          'Page views check failed',
          { error: e.message }
        );
      }
    }

    checkAndTrigger(triggerType) {
      try {
        if (this.triggered) return;

        // Check if popup should be shown based on user state
        if (!this.shouldShowPopup()) return;

        this.triggered = true;
        this.onTrigger(triggerType);
      } catch (e) {
        this.errorManager.logError(
          this.errorManager.errorTypes.CONFIG,
          'Trigger check failed',
          { triggerType, error: e.message }
        );
      }
    }

    shouldShowPopup() {
      try {
        const targeting = this.config.targeting || {};
        const userState = this.storage.get('userState') || {};

        // Check if user has already subscribed
        if (userState.hasSubscribed) {
          return false;
        }

        // Check show once setting
        if (this.config.triggers.showOnce && userState.hasSeenPopup) {
          const lastShown = new Date(userState.lastShownDate);
          const cookieDuration = this.config.triggers.cookieDuration || 30;
          const daysSinceShown = (Date.now() - lastShown.getTime()) / (1000 * 60 * 60 * 24);
          
          if (daysSinceShown < cookieDuration) {
            return false;
          }
        }

        // Check device targeting
        const isMobile = window.innerWidth <= 768;
        if (isMobile && !targeting.mobileDevices) return false;
        if (!isMobile && !targeting.desktopDevices) return false;

        // Check visitor type targeting
        const isReturningVisitor = this.storage.get('isReturningVisitor') || false;
        if (isReturningVisitor && !targeting.returningVisitors) return false;
        if (!isReturningVisitor && !targeting.newVisitors) return false;

        // Check page targeting
        if (targeting.specificPages && targeting.specificPages.length > 0) {
          const currentPath = window.location.pathname;
          const pagesToShow = targeting.specificPages.split('\n').map(page => page.trim()).filter(page => page);
          if (pagesToShow.length > 0 && !pagesToShow.some(page => currentPath.includes(page))) {
            return false;
          }
        }

        return true;
      } catch (e) {
        this.errorManager.logError(
          this.errorManager.errorTypes.CONFIG,
          'Should show popup check failed',
          { error: e.message }
        );
        return false;
      }
    }

    onTrigger(triggerType) {
      if (typeof this.triggerCallback === 'function') {
        this.triggerCallback(triggerType);
      }
    }

    setTriggerCallback(callback) {
      this.triggerCallback = callback;
    }

    removeListener(type) {
      const listener = this.listeners.get(type);
      if (listener) {
        if (type === 'scroll') {
          window.removeEventListener('scroll', listener);
        } else if (type === 'exitIntent') {
          document.removeEventListener('mouseleave', listener);
        }
        this.listeners.delete(type);
      }
    }

    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }

    destroy() {
      this.listeners.forEach((listener, type) => {
        this.removeListener(type);
      });
    }
  }

  // Integration Manager
  class IntegrationManager {
    constructor(config, errorManager) {
      this.config = config;
      this.errorManager = errorManager;
      this.retryQueue = [];
    }

    async submitEmail(email, additionalData = {}) {
      try {
        // Submit to Shopify customer API first
        const shopifyResult = await this.submitToShopify(email, additionalData);
        
        // Submit to webhooks if enabled
        if (this.config.integrations && this.config.integrations.enabled) {
          await this.submitToWebhooks(email, additionalData);
        }

        return { success: true, result: shopifyResult };
      } catch (e) {
        this.errorManager.logError(
          this.errorManager.errorTypes.API,
          'Email submission failed',
          { email: '[email provided]', error: e.message }
        );
        
        // Add to retry queue
        this.addToRetryQueue(email, additionalData);
        
        throw new Error(this.errorManager.getUserFriendlyMessage(
          this.errorManager.errorTypes.API,
          e.message
        ));
      }
    }

    async submitToShopify(email, additionalData) {
      try {
        const formData = new FormData();
        formData.append('form_type', 'customer');
        formData.append('utf8', '✓');
        formData.append('contact[email]', email);
        formData.append('contact[tags]', 'newsletter,email-popup');

        // Add any additional data
        Object.keys(additionalData).forEach(key => {
          formData.append(`contact[${key}]`, additionalData[key]);
        });

        const response = await fetch('/contact', {
          method: 'POST',
          body: formData,
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return { source: 'shopify', status: 'success' };
      } catch (e) {
        this.errorManager.logError(
          this.errorManager.errorTypes.API,
          'Shopify submission failed',
          { error: e.message }
        );
        throw e;
      }
    }

    async submitToWebhooks(email, additionalData) {
      const integrations = this.config.integrations;
      if (!integrations.webhookUrl) return;

      try {
        const payload = {
          email,
          timestamp: new Date().toISOString(),
          source: 'email-popup',
          ...additionalData
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), (integrations.timeout || 10) * 1000);

        const response = await fetch(integrations.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Source': 'shopify-email-popup'
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
        }

        return { source: 'webhook', status: 'success' };
      } catch (e) {
        this.errorManager.logError(
          this.errorManager.errorTypes.INTEGRATION,
          'Webhook submission failed',
          { url: integrations.webhookUrl, error: e.message }
        );
        
        // Don't throw for webhook failures, as Shopify submission might have succeeded
        return { source: 'webhook', status: 'failed', error: e.message };
      }
    }

    addToRetryQueue(email, additionalData) {
      this.retryQueue.push({
        email,
        additionalData,
        attempts: 0,
        timestamp: Date.now()
      });
      
      // Try to process retry queue
      this.processRetryQueue();
    }

    async processRetryQueue() {
      if (this.retryQueue.length === 0) return;

      const maxAttempts = this.config.integrations?.retryAttempts || 3;
      const retryDelay = (this.config.integrations?.retryDelay || 2) * 1000;

      const item = this.retryQueue[0];
      if (item.attempts >= maxAttempts) {
        this.retryQueue.shift();
        this.errorManager.logError(
          this.errorManager.errorTypes.INTEGRATION,
          'Max retry attempts reached',
          { email: '[email provided]', attempts: item.attempts }
        );
        return;
      }

      item.attempts++;
      
      try {
        await new Promise(resolve => setTimeout(resolve, retryDelay * item.attempts));
        await this.submitEmail(item.email, item.additionalData);
        this.retryQueue.shift(); // Remove successful item
      } catch (e) {
        // Will retry on next call
      }
    }
  }

  // Animation Manager
  class AnimationManager {
    constructor(errorManager) {
      this.errorManager = errorManager;
    }

    show(element, animation = 'fade', duration = 300) {
      try {
        if (!element) return Promise.resolve();

        element.style.display = 'block';
        element.classList.add('is-visible');
        
        if (animation !== 'none') {
          element.setAttribute('data-animation', animation);
        }

        return new Promise(resolve => {
          setTimeout(resolve, duration);
        });
      } catch (e) {
        this.errorManager.logError(
          this.errorManager.errorTypes.CONFIG,
          'Animation show failed',
          { animation, error: e.message }
        );
        return Promise.resolve();
      }
    }

    hide(element, animation = 'fade', duration = 300) {
      try {
        if (!element) return Promise.resolve();

        element.classList.remove('is-visible');

        return new Promise(resolve => {
          setTimeout(() => {
            element.style.display = 'none';
            resolve();
          }, duration);
        });
      } catch (e) {
        this.errorManager.logError(
          this.errorManager.errorTypes.CONFIG,
          'Animation hide failed',
          { animation, error: e.message }
        );
        return Promise.resolve();
      }
    }
  }

  // Main EmailPopup Class
  class EmailPopup {
    constructor(element) {
      this.element = element;
      this.errorManager = new ErrorManager();
      this.storage = new StorageManager(this.errorManager);
      this.validator = new ValidationManager(this.errorManager);
      this.animations = new AnimationManager(this.errorManager);
      
      this.state = {
        isVisible: false,
        isSubmitted: false,
        isLoading: false,
        hasError: false,
        currentState: 'form' // 'form', 'success', 'error'
      };

      this.elements = {
        overlay: null,
        container: null,
        closeButton: null,
        form: null,
        emailInput: null,
        submitButton: null,
        errorDisplay: null,
        formState: null,
        successState: null,
        errorState: null
      };

      try {
        this.init();
      } catch (e) {
        this.errorManager.logError(
          this.errorManager.errorTypes.CONFIG,
          'EmailPopup initialization failed',
          { error: e.message }
        );
      }
    }

    init() {
      this.parseConfig();
      this.findElements();
      this.setupEventListeners();
      this.initializeTriggers();
      this.markAsReturningVisitor();
      this.applyCustomStyling();
    }

    parseConfig() {
      try {
        const configElement = this.element.querySelector('[data-popup-config]');
        if (configElement) {
          this.config = JSON.parse(configElement.getAttribute('data-popup-config'));
        } else {
          throw new Error('Configuration not found');
        }
      } catch (e) {
        this.errorManager.logError(
          this.errorManager.errorTypes.CONFIG,
          'Failed to parse configuration',
          { error: e.message }
        );
        this.config = this.getDefaultConfig();
      }
    }

    getDefaultConfig() {
      return {
        enabled: true,
        previewMode: false,
        content: {
          headline: 'Join Our Newsletter',
          description: 'Get exclusive offers and updates.',
          buttonText: 'Subscribe Now',
          placeholderText: 'Enter your email address'
        },
        triggers: {
          timeDelay: 5,
          scrollPercentage: 50,
          exitIntent: true,
          showOnce: true,
          cookieDuration: 30
        },
        targeting: {
          newVisitors: true,
          returningVisitors: true,
          mobileDevices: true,
          desktopDevices: true
        },
        styling: {
          animation: {
            entrance: 'fade',
            duration: 300
          }
        }
      };
    }

    findElements() {
      try {
        this.elements.overlay = this.element.querySelector('[data-popup-overlay]');
        this.elements.container = this.element.querySelector('[data-popup-container]');
        this.elements.closeButton = this.element.querySelector('[data-popup-close]');
        this.elements.form = this.element.querySelector('[data-popup-form]');
        this.elements.emailInput = this.element.querySelector('[data-popup-email-input]');
        this.elements.submitButton = this.element.querySelector('[data-popup-submit]');
        this.elements.errorDisplay = this.element.querySelector('[data-popup-error]');
        this.elements.formState = this.element.querySelector('[data-popup-form-state]');
        this.elements.successState = this.element.querySelector('[data-popup-success-state]');
        this.elements.errorState = this.element.querySelector('[data-popup-error-state]');
      } catch (e) {
        this.errorManager.logError(
          this.errorManager.errorTypes.CONFIG,
          'Failed to find required elements',
          { error: e.message }
        );
      }
    }

    setupEventListeners() {
      try {
        // Close button
        if (this.elements.closeButton) {
          this.elements.closeButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.hide();
          });
        }

        // Overlay click to close
        if (this.elements.overlay) {
          this.elements.overlay.addEventListener('click', (e) => {
            if (e.target === this.elements.overlay) {
              this.hide();
            }
          });
        }

        // Escape key to close
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && this.state.isVisible) {
            this.hide();
          }
        });

        // Form submission
        if (this.elements.form) {
          this.elements.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
          });
        }

        // Real-time email validation
        if (this.elements.emailInput) {
          this.elements.emailInput.addEventListener('input', () => {
            this.clearErrors();
          });

          this.elements.emailInput.addEventListener('blur', () => {
            const email = this.elements.emailInput.value.trim();
            if (email) {
              this.validateEmailInput(email);
            }
          });
        }

        // Retry button in error state
        const retryButton = this.element.querySelector('[data-retry-button]');
        if (retryButton) {
          retryButton.addEventListener('click', () => {
            this.showFormState();
          });
        }

      } catch (e) {
        this.errorManager.logError(
          this.errorManager.errorTypes.CONFIG,
          'Failed to setup event listeners',
          { error: e.message }
        );
      }
    }

    initializeTriggers() {
      if (this.config.previewMode && this.element.hasAttribute('data-preview-mode')) {
        // Show immediately in preview mode
        setTimeout(() => this.show('preview'), 100);
        return;
      }

      if (!this.config.enabled) return;

      this.triggerManager = new TriggerManager(this.config, this.storage, this.errorManager);
      this.triggerManager.setTriggerCallback((triggerType) => {
        this.show(triggerType);
      });
      this.triggerManager.init();
    }

    markAsReturningVisitor() {
      try {
        const hasVisited = this.storage.get('hasVisited');
        if (hasVisited) {
          this.storage.set('isReturningVisitor', true);
        } else {
          this.storage.set('hasVisited', true);
          this.storage.set('isReturningVisitor', false);
        }
      } catch (e) {
        this.errorManager.logError(
          this.errorManager.errorTypes.STORAGE,
          'Failed to mark returning visitor',
          { error: e.message }
        );
      }
    }

    applyCustomStyling() {
      try {
        if (!this.config.styling) return;

        const container = this.elements.container;
        if (!container) return;

        const styling = this.config.styling;

        // Apply colors
        if (styling.colors) {
          if (styling.colors.primary) {
            container.style.setProperty('--popup-primary-color', styling.colors.primary);
          }
          if (styling.colors.secondary) {
            container.style.setProperty('--popup-secondary-color', styling.colors.secondary);
            container.style.backgroundColor = styling.colors.secondary;
          }
          if (styling.colors.accent) {
            container.style.setProperty('--popup-accent-color', styling.colors.accent);
          }
          if (styling.colors.text) {
            container.style.setProperty('--popup-text-color', styling.colors.text);
          }
        }

        // Apply layout
        if (styling.layout) {
          if (styling.layout.width) {
            container.setAttribute('data-size', styling.layout.width);
          }
          if (styling.layout.borderRadius) {
            container.style.borderRadius = styling.layout.borderRadius + 'px';
          }
          if (styling.layout.shadow) {
            container.setAttribute('data-shadow', styling.layout.shadow);
          }
          if (styling.layout.position && this.elements.overlay) {
            this.elements.overlay.setAttribute('data-position', styling.layout.position);
          }
        }

        // Apply overlay opacity
        if (styling.layout && styling.layout.overlayOpacity && this.elements.overlay) {
          const opacity = styling.layout.overlayOpacity / 100;
          this.elements.overlay.style.backgroundColor = `rgba(0, 0, 0, ${opacity})`;
        }

      } catch (e) {
        this.errorManager.logError(
          this.errorManager.errorTypes.CONFIG,
          'Failed to apply custom styling',
          { error: e.message }
        );
      }
    }

    async show(triggerType = 'manual') {
      try {
        if (this.state.isVisible) return;

        this.state.isVisible = true;
        this.trackEvent('impression', { triggerType });

        // Update user state
        const userState = this.storage.get('userState') || {};
        userState.hasSeenPopup = true;
        userState.lastShownDate = new Date().toISOString();
        this.storage.set('userState', userState);

        // Show with animation
        const animation = this.config.styling?.animation?.entrance || 'fade';
        const duration = this.config.styling?.animation?.duration || 300;
        
        await this.animations.show(this.element, animation, duration);

        // Focus management for accessibility
        this.manageFocus();

      } catch (e) {
        this.errorManager.logError(
          this.errorManager.errorTypes.CONFIG,
          'Failed to show popup',
          { triggerType, error: e.message }
        );
      }
    }

    async hide() {
      try {
        if (!this.state.isVisible) return;

        this.state.isVisible = false;
        this.trackEvent('dismissal');

        const animation = this.config.styling?.animation?.exit || 'fade';
        const duration = this.config.styling?.animation?.duration || 300;
        
        await this.animations.hide(this.element, animation, duration);

        // Return focus to previous element
        this.restoreFocus();

      } catch (e) {
        this.errorManager.logError(
          this.errorManager.errorTypes.CONFIG,
          'Failed to hide popup',
          { error: e.message }
        );
      }
    }

    manageFocus() {
      try {
        // Store current focus
        this.previousFocus = document.activeElement;

        // Focus on email input
        if (this.elements.emailInput) {
          setTimeout(() => {
            this.elements.emailInput.focus();
          }, 100);
        }
      } catch (e) {
        this.errorManager.logError(
          this.errorManager.errorTypes.CONFIG,
          'Focus management failed',
          { error: e.message }
        );
      }
    }

    restoreFocus() {
      try {
        if (this.previousFocus && typeof this.previousFocus.focus === 'function') {
          this.previousFocus.focus();
        }
      } catch (e) {
        this.errorManager.logError(
          this.errorManager.errorTypes.CONFIG,
          'Focus restoration failed',
          { error: e.message }
        );
      }
    }

    validateEmailInput(email) {
      try {
        const validation = this.validator.validateEmail(email);
        
        if (!validation.isValid) {
          this.showError(validation.message);
          return false;
        }

        this.clearErrors();
        return true;
      } catch (e) {
        this.errorManager.logError(
          this.errorManager.errorTypes.VALIDATION,
          'Email input validation failed',
          { error: e.message }
        );
        return false;
      }
    }

    async handleSubmit() {
      try {
        if (this.state.isLoading) return;

        const email = this.elements.emailInput?.value?.trim();
        if (!email) {
          this.showError('Please enter your email address.');
          return;
        }

        // Validate email
        const validation = this.validator.validateEmail(email);
        if (!validation.isValid) {
          this.showError(validation.message);
          return;
        }

        this.setLoadingState(true);
        this.clearErrors();

        // Initialize integration manager
        if (!this.integrationManager) {
          this.integrationManager = new IntegrationManager(this.config, this.errorManager);
        }

        // Submit email
        const result = await this.integrationManager.submitEmail(validation.email);

        // Mark as subscribed
        const userState = this.storage.get('userState') || {};
        userState.hasSubscribed = true;
        userState.subscribedDate = new Date().toISOString();
        this.storage.set('userState', userState);

        this.trackEvent('conversion', { email: '[email provided]' });
        this.showSuccessState();

      } catch (e) {
        this.errorManager.logError(
          this.errorManager.errorTypes.API,
          'Form submission failed',
          { error: e.message }
        );
        this.showError(e.message);
      } finally {
        this.setLoadingState(false);
      }
    }

    setLoadingState(isLoading) {
      try {
        this.state.isLoading = isLoading;

        if (this.elements.submitButton) {
          this.elements.submitButton.disabled = isLoading;
          
          const submitText = this.elements.submitButton.querySelector('[data-popup-submit-text]');
          const submitLoading = this.elements.submitButton.querySelector('[data-popup-submit-loading]');
          
          if (submitText && submitLoading) {
            submitText.style.display = isLoading ? 'none' : 'inline';
            submitLoading.style.display = isLoading ? 'flex' : 'none';
          }
        }

        if (this.elements.emailInput) {
          this.elements.emailInput.disabled = isLoading;
        }
      } catch (e) {
        this.errorManager.logError(
          this.errorManager.errorTypes.CONFIG,
          'Failed to set loading state',
          { isLoading, error: e.message }
        );
      }
    }

    showError(message) {
      try {
        if (this.elements.errorDisplay) {
          this.elements.errorDisplay.textContent = message;
          this.elements.errorDisplay.style.display = 'block';
          this.elements.errorDisplay.setAttribute('aria-live', 'polite');
        }

        if (this.elements.emailInput) {
          this.elements.emailInput.classList.add('has-error');
          this.elements.emailInput.setAttribute('aria-invalid', 'true');
        }

        this.state.hasError = true;
      } catch (e) {
        this.errorManager.logError(
          this.errorManager.errorTypes.CONFIG,
          'Failed to show error',
          { message, error: e.message }
        );
      }
    }

    clearErrors() {
      try {
        if (this.elements.errorDisplay) {
          this.elements.errorDisplay.style.display = 'none';
          this.elements.errorDisplay.textContent = '';
        }

        if (this.elements.emailInput) {
          this.elements.emailInput.classList.remove('has-error');
          this.elements.emailInput.setAttribute('aria-invalid', 'false');
        }

        this.state.hasError = false;
      } catch (e) {
        this.errorManager.logError(
          this.errorManager.errorTypes.CONFIG,
          'Failed to clear errors',
          { error: e.message }
        );
      }
    }

    showSuccessState() {
      try {
        this.state.currentState = 'success';
        this.state.isSubmitted = true;

        if (this.elements.formState) {
          this.elements.formState.style.display = 'none';
        }

        if (this.elements.successState) {
          this.elements.successState.style.display = 'block';
        }

        // Auto-close after delay if configured
        if (this.config.autoClose) {
          setTimeout(() => {
            this.hide();
          }, this.config.autoCloseDelay || 3000);
        }
      } catch (e) {
        this.errorManager.logError(
          this.errorManager.errorTypes.CONFIG,
          'Failed to show success state',
          { error: e.message }
        );
      }
    }

    showFormState() {
      try {
        this.state.currentState = 'form';

        if (this.elements.formState) {
          this.elements.formState.style.display = 'block';
        }

        if (this.elements.successState) {
          this.elements.successState.style.display = 'none';
        }

        if (this.elements.errorState) {
          this.elements.errorState.style.display = 'none';
        }

        this.clearErrors();
        this.setLoadingState(false);
      } catch (e) {
        this.errorManager.logError(
          this.errorManager.errorTypes.CONFIG,
          'Failed to show form state',
          { error: e.message }
        );
      }
    }

    trackEvent(eventType, data = {}) {
      try {
        // Track with Google Analytics if available
        if (typeof gtag === 'function') {
          gtag('event', `email_popup_${eventType}`, {
            event_category: 'Email Popup',
            event_label: data.triggerType || 'unknown',
            ...data
          });
        }

        // Track with Google Tag Manager if available
        if (window.dataLayer) {
          window.dataLayer.push({
            event: `email_popup_${eventType}`,
            eventCategory: 'Email Popup',
            eventAction: eventType,
            eventLabel: data.triggerType || 'unknown',
            ...data
          });
        }

        // Track with custom analytics if available
        if (window.analytics && typeof window.analytics.track === 'function') {
          window.analytics.track(`Email Popup ${eventType}`, data);
        }
      } catch (e) {
        this.errorManager.logError(
          this.errorManager.errorTypes.CONFIG,
          'Event tracking failed',
          { eventType, error: e.message }
        );
      }
    }

    destroy() {
      try {
        if (this.triggerManager) {
          this.triggerManager.destroy();
        }

        // Remove event listeners
        // Note: In a production environment, you'd want to store references to bound functions
        // for proper cleanup. This is a simplified version.

        this.hide();
      } catch (e) {
        this.errorManager.logError(
          this.errorManager.errorTypes.CONFIG,
          'Cleanup failed',
          { error: e.message }
        );
      }
    }
  }

  // Initialize email popups when DOM is ready
  function initializeEmailPopups() {
    try {
      const popups = document.querySelectorAll('[data-section-type="email-popup"]');
      const instances = [];

      popups.forEach(popup => {
        try {
          const instance = new EmailPopup(popup);
          instances.push(instance);
        } catch (e) {
          console.error('Failed to initialize email popup:', e);
        }
      });

      // Store instances globally for potential external access
      window.emailPopupInstances = instances;
    } catch (e) {
      console.error('Failed to initialize email popups:', e);
    }
  }

  // Handle different loading scenarios
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEmailPopups);
  } else {
    initializeEmailPopups();
  }

  // Graceful degradation for JavaScript-disabled environments
  // Add a noscript fallback or ensure the form works without JS
  try {
    const noscriptStyle = document.createElement('style');
    noscriptStyle.textContent = `
      .email-popup-section:not(.js-enabled) {
        position: static !important;
        opacity: 1 !important;
        visibility: visible !important;
      }
    `;
    document.head.appendChild(noscriptStyle);
  } catch (e) {
    // Silently fail if we can't add noscript styles
  }

})();