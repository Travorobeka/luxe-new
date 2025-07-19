class GeolocationDetectionService {
  constructor(options = {}) {
    this.timeout = options.timeout || 5000;
    this.enableHighAccuracy = options.enableHighAccuracy || false;
    this.maximumAge = options.maximumAge || 300000; // 5 minutes
  }

  async detectLocation() {
    if (!this.isGeolocationSupported()) {
      throw new Error('Geolocation is not supported by this browser');
    }

    try {
      const position = await this.getCurrentPosition();
      const countryCode = await this.getCountryFromCoordinates(position.coords.latitude, position.coords.longitude);
      
      return {
        country: countryCode,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      };
    } catch (error) {
      throw this.handleGeolocationError(error);
    }
  }

  isGeolocationSupported() {
    return 'geolocation' in navigator;
  }

  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      const options = {
        enableHighAccuracy: this.enableHighAccuracy,
        timeout: this.timeout,
        maximumAge: this.maximumAge
      };

      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  }

  async getCountryFromCoordinates(latitude, longitude) {
    try {
      // Use a reverse geocoding service to get country from coordinates
      // This is a fallback implementation using a free service
      const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
      
      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }

      const data = await response.json();
      return data.countryCode || null;
    } catch (error) {
      console.warn('Failed to get country from coordinates:', error);
      return null;
    }
  }

  handleGeolocationError(error) {
    let errorMessage = 'Geolocation failed';
    let errorType = 'UNKNOWN_ERROR';

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'User denied the request for geolocation';
        errorType = 'PERMISSION_DENIED';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information is unavailable';
        errorType = 'POSITION_UNAVAILABLE';
        break;
      case error.TIMEOUT:
        errorMessage = 'The request to get user location timed out';
        errorType = 'TIMEOUT';
        break;
      default:
        errorMessage = 'An unknown error occurred while retrieving location';
        errorType = 'UNKNOWN_ERROR';
        break;
    }

    return new Error(`${errorType}: ${errorMessage}`);
  }
}

class MarketMatchingService {
  constructor(shopifyMarketsData) {
    this.marketsData = shopifyMarketsData || {};
    this.availableCountries = this.marketsData.available_countries || [];
    this.currentCountry = this.marketsData.current_country || null;
    this.currentCurrency = this.marketsData.current_currency || null;
  }

  findMatchingMarket(countryCode) {
    if (!countryCode) return null;

    const market = this.availableCountries.find(country => 
      country.iso_code && country.iso_code.toLowerCase() === countryCode.toLowerCase()
    );

    if (!market) return null;

    return {
      country: market,
      currency: market.currency,
      language: market.language || null,
      marketUrl: this.buildMarketUrl(market)
    };
  }

  isMarketDifferentFromCurrent(market) {
    if (!market || !market.country) return false;

    const currentCountryCode = this.currentCountry?.iso_code?.toLowerCase();
    const newCountryCode = market.country.iso_code?.toLowerCase();
    
    const currentCurrencyCode = this.currentCurrency?.iso_code?.toLowerCase();
    const newCurrencyCode = market.currency?.iso_code?.toLowerCase();

    return currentCountryCode !== newCountryCode || currentCurrencyCode !== newCurrencyCode;
  }

  buildMarketUrl(market) {
    if (!market || !market.iso_code) return null;

    // Build URL based on Shopify Markets structure
    const countryCode = market.iso_code.toLowerCase();
    const languageCode = market.language?.iso_code?.toLowerCase() || 'en';
    
    return `/${languageCode}-${countryCode}`;
  }

  getAvailableMarkets() {
    return this.availableCountries;
  }

  getCurrentMarket() {
    return {
      country: this.currentCountry,
      currency: this.currentCurrency
    };
  }
}

class UserPreferenceManager {
  constructor() {
    this.storageKey = 'geolocation_popup_preferences';
    this.sessionKey = 'geolocation_popup_session';
  }

  hasUserDeclined() {
    const preferences = this.getPreferences();
    const sessionData = this.getSessionData();
    
    // Check both persistent and session storage
    return preferences.hasDeclined || sessionData.hasDeclined;
  }

  setUserDeclined(declined = true) {
    const sessionData = this.getSessionData();
    sessionData.hasDeclined = declined;
    sessionData.declinedAt = declined ? Date.now() : null;
    this.setSessionData(sessionData);
  }

  hasUserManuallySelectedLocalization() {
    const preferences = this.getPreferences();
    return preferences.hasManuallySelected;
  }

  setUserManuallySelected(selected = true) {
    const preferences = this.getPreferences();
    preferences.hasManuallySelected = selected;
    preferences.selectedAt = selected ? Date.now() : null;
    this.setPreferences(preferences);
  }

  shouldShowPopup() {
    if (this.hasUserDeclined()) return false;
    if (this.hasUserManuallySelectedLocalization()) return false;
    
    const sessionData = this.getSessionData();
    const now = Date.now();
    
    // Don't show popup if shown recently (within 1 hour)
    if (sessionData.lastShownAt && (now - sessionData.lastShownAt) < 3600000) {
      return false;
    }
    
    return true;
  }

  markPopupShown() {
    const sessionData = this.getSessionData();
    sessionData.lastShownAt = Date.now();
    this.setSessionData(sessionData);
  }

  clearPreferences() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(this.sessionKey);
    }
  }

  getPreferences() {
    if (typeof localStorage === 'undefined') return {};
    
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('Failed to read geolocation preferences:', error);
      return {};
    }
  }

  setPreferences(preferences) {
    if (typeof localStorage === 'undefined') return;
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(preferences));
    } catch (error) {
      console.warn('Failed to save geolocation preferences:', error);
    }
  }

  getSessionData() {
    if (typeof sessionStorage === 'undefined') return {};
    
    try {
      const stored = sessionStorage.getItem(this.sessionKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('Failed to read geolocation session data:', error);
      return {};
    }
  }

  setSessionData(sessionData) {
    if (typeof sessionStorage === 'undefined') return;
    
    try {
      sessionStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
    } catch (error) {
      console.warn('Failed to save geolocation session data:', error);
    }
  }
}

class LocalizationRedirectService {
  constructor() {
    this.localizationForm = this.findLocalizationForm();
  }

  findLocalizationForm() {
    // Look for Shopify's localization form
    const form = document.querySelector('form[action*="/localization"]') || 
                 document.querySelector('localization-form form') ||
                 document.querySelector('.localization-form form');
    
    if (!form) {
      console.warn('Shopify localization form not found');
    }
    
    return form;
  }

  async updateLocalization(marketData) {
    if (!marketData || !marketData.country) {
      throw new Error('Invalid market data provided');
    }

    try {
      // Method 1: Use existing localization form if available
      if (this.localizationForm) {
        return await this.updateViaForm(marketData);
      }

      // Method 2: Direct redirect to market URL
      return await this.redirectToMarket(marketData);
    } catch (error) {
      console.error('Failed to update localization:', error);
      throw error;
    }
  }

  async updateViaForm(marketData) {
    const form = this.localizationForm;
    const formData = new FormData(form);

    // Update country
    if (marketData.country && marketData.country.iso_code) {
      formData.set('country_code', marketData.country.iso_code);
    }

    // Update currency
    if (marketData.currency && marketData.currency.iso_code) {
      formData.set('currency_code', marketData.currency.iso_code);
    }

    // Update language if available
    if (marketData.language && marketData.language.iso_code) {
      formData.set('language_code', marketData.language.iso_code);
    }

    // Submit form
    const response = await fetch(form.action, {
      method: 'POST',
      body: formData,
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    if (!response.ok) {
      throw new Error(`Localization update failed: ${response.status}`);
    }

    // Reload page to apply changes
    window.location.reload();
  }

  async redirectToMarket(marketData) {
    const url = this.buildRedirectUrl(marketData);
    if (url) {
      window.location.href = url;
    } else {
      throw new Error('Unable to build redirect URL');
    }
  }

  buildRedirectUrl(marketData) {
    if (!marketData.marketUrl) return null;

    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;
    
    // Remove existing locale from path if present
    const cleanPath = currentPath.replace(/^\/[a-z]{2}(-[a-z]{2})?/, '');
    
    return `${marketData.marketUrl}${cleanPath}${currentSearch}`;
  }
}

class PopupDisplayService {
  constructor(settings = {}) {
    this.settings = {
      style: settings.style || 'modal',
      position: settings.position || 'center',
      animation: settings.animation || 'fade',
      delay: settings.delay || 2000,
      autoDismiss: settings.autoDismiss || 0,
      colors: {
        background: settings.bgColor || '#ffffff',
        text: settings.textColor || '#333333',
        accent: settings.accentColor || '#007bff',
        border: settings.borderColor || '#e0e0e0'
      },
      borderRadius: settings.borderRadius || 8,
      maxWidth: settings.maxWidth || 400,
      text: {
        title: settings.title || 'Shop in your local currency',
        message: settings.message || 'We detected you\'re in {country}. Would you like to shop in {currency}?',
        acceptButton: settings.acceptButton || 'Yes, switch to {currency}',
        declineButton: settings.declineButton || 'No, keep current settings'
      }
    };

    this.popup = null;
    this.overlay = null;
    this.autoDismissTimer = null;
  }

  createPopup(marketData) {
    if (!marketData || !marketData.country) {
      throw new Error('Market data is required to create popup');
    }

    const popupContainer = document.createElement('div');
    popupContainer.className = `geolocation-popup geolocation-popup--${this.settings.style}`;
    popupContainer.setAttribute('role', 'dialog');
    popupContainer.setAttribute('aria-modal', 'true');
    popupContainer.setAttribute('aria-labelledby', 'geolocation-popup-title');

    const popupContent = this.createPopupContent(marketData);
    popupContainer.appendChild(popupContent);

    this.applyStyles(popupContainer);
    this.popup = popupContainer;

    return popupContainer;
  }

  createPopupContent(marketData) {
    const content = document.createElement('div');
    content.className = 'geolocation-popup__content';

    // Close button
    const closeButton = document.createElement('button');
    closeButton.className = 'geolocation-popup__close';
    closeButton.innerHTML = '&times;';
    closeButton.setAttribute('aria-label', 'Close');
    closeButton.addEventListener('click', () => this.handleUserAction('dismiss', marketData));

    // Title
    const title = document.createElement('h3');
    title.id = 'geolocation-popup-title';
    title.className = 'geolocation-popup__title';
    title.textContent = this.replacePlaceholders(this.settings.text.title, marketData);

    // Message
    const message = document.createElement('p');
    message.className = 'geolocation-popup__message';
    message.textContent = this.replacePlaceholders(this.settings.text.message, marketData);

    // Buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'geolocation-popup__buttons';

    // Accept button
    const acceptButton = document.createElement('button');
    acceptButton.className = 'geolocation-popup__button geolocation-popup__button--accept';
    acceptButton.textContent = this.replacePlaceholders(this.settings.text.acceptButton, marketData);
    acceptButton.addEventListener('click', () => this.handleUserAction('accept', marketData));

    // Decline button
    const declineButton = document.createElement('button');
    declineButton.className = 'geolocation-popup__button geolocation-popup__button--decline';
    declineButton.textContent = this.replacePlaceholders(this.settings.text.declineButton, marketData);
    declineButton.addEventListener('click', () => this.handleUserAction('decline', marketData));

    buttonsContainer.appendChild(acceptButton);
    buttonsContainer.appendChild(declineButton);

    content.appendChild(closeButton);
    content.appendChild(title);
    content.appendChild(message);
    content.appendChild(buttonsContainer);

    return content;
  }

  replacePlaceholders(text, marketData) {
    let result = text;
    
    if (marketData.country) {
      result = result.replace(/{country}/g, marketData.country.name || marketData.country.iso_code);
    }
    
    if (marketData.currency) {
      result = result.replace(/{currency}/g, marketData.currency.iso_code || marketData.currency.name);
    }
    
    if (marketData.language) {
      result = result.replace(/{language}/g, marketData.language.name || marketData.language.iso_code);
    }
    
    return result;
  }

  showPopup(popup) {
    if (!popup) return;

    // Create overlay for modal style
    if (this.settings.style === 'modal') {
      this.overlay = document.createElement('div');
      this.overlay.className = 'geolocation-popup__overlay';
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) {
          this.handleUserAction('dismiss');
        }
      });
      document.body.appendChild(this.overlay);
    }

    document.body.appendChild(popup);
    
    // Apply position classes
    this.applyPositionClasses(popup);

    // Show with animation
    setTimeout(() => {
      popup.classList.add('geolocation-popup--visible');
      if (this.overlay) {
        this.overlay.classList.add('geolocation-popup__overlay--visible');
      }
    }, 50);

    // Set up auto dismiss
    if (this.settings.autoDismiss > 0) {
      this.autoDismissTimer = setTimeout(() => {
        this.handleUserAction('dismiss');
      }, this.settings.autoDismiss);
    }

    // Focus management for accessibility
    popup.focus();
  }

  hidePopup() {
    if (!this.popup) return;

    this.popup.classList.remove('geolocation-popup--visible');
    if (this.overlay) {
      this.overlay.classList.remove('geolocation-popup__overlay--visible');
    }

    // Remove from DOM after animation
    setTimeout(() => {
      if (this.popup && this.popup.parentNode) {
        this.popup.parentNode.removeChild(this.popup);
      }
      if (this.overlay && this.overlay.parentNode) {
        this.overlay.parentNode.removeChild(this.overlay);
      }
      this.popup = null;
      this.overlay = null;
    }, 300);

    // Clear auto dismiss timer
    if (this.autoDismissTimer) {
      clearTimeout(this.autoDismissTimer);
      this.autoDismissTimer = null;
    }
  }

  handleUserAction(action, marketData = null) {
    if (this.onUserAction) {
      this.onUserAction(action, marketData);
    }
    this.hidePopup();
  }

  applyStyles(popup) {
    const styles = `
      --popup-bg-color: ${this.settings.colors.background};
      --popup-text-color: ${this.settings.colors.text};
      --popup-accent-color: ${this.settings.colors.accent};
      --popup-border-color: ${this.settings.colors.border};
      --popup-border-radius: ${this.settings.borderRadius}px;
      --popup-max-width: ${this.settings.maxWidth}px;
    `;
    popup.style.cssText = styles;
  }

  applyPositionClasses(popup) {
    popup.classList.add(`geolocation-popup--${this.settings.position}`);
    popup.classList.add(`geolocation-popup--${this.settings.animation}`);
  }

  onUserAction(callback) {
    this.onUserAction = callback;
  }
}

class GeolocationAnalytics {
  constructor(enabled = true) {
    this.enabled = enabled;
    this.events = [];
  }

  trackEvent(eventType, data = {}) {
    if (!this.enabled) return;

    const event = {
      type: eventType,
      timestamp: Date.now(),
      data: data,
      sessionId: this.getSessionId()
    };

    this.events.push(event);
    this.sendEvent(event);
  }

  trackPopupDisplayed(marketData) {
    this.trackEvent('popup_displayed', {
      detectedCountry: marketData?.country?.iso_code,
      suggestedCurrency: marketData?.currency?.iso_code,
      currentCountry: window.Shopify?.country,
      currentCurrency: window.Shopify?.currency?.active
    });
  }

  trackUserAccepted(marketData) {
    this.trackEvent('user_accepted', {
      detectedCountry: marketData?.country?.iso_code,
      selectedCurrency: marketData?.currency?.iso_code,
      previousCountry: window.Shopify?.country,
      previousCurrency: window.Shopify?.currency?.active
    });
  }

  trackUserDeclined(marketData) {
    this.trackEvent('user_declined', {
      detectedCountry: marketData?.country?.iso_code,
      rejectedCurrency: marketData?.currency?.iso_code,
      currentCountry: window.Shopify?.country,
      currentCurrency: window.Shopify?.currency?.active
    });
  }

  trackGeolocationError(error) {
    this.trackEvent('geolocation_error', {
      errorType: error.message?.split(':')[0] || 'UNKNOWN_ERROR',
      errorMessage: error.message
    });
  }

  sendEvent(event) {
    // Send to various analytics platforms
    this.sendToGoogleAnalytics(event);
    this.sendToShopifyAnalytics(event);
    this.sendToCustomAnalytics(event);
  }

  sendToGoogleAnalytics(event) {
    if (typeof gtag !== 'undefined') {
      gtag('event', event.type, {
        custom_parameter_1: event.data,
        event_category: 'geolocation_popup'
      });
    }
  }

  sendToShopifyAnalytics(event) {
    if (window.ShopifyAnalytics && window.ShopifyAnalytics.track) {
      window.ShopifyAnalytics.track(event.type, event.data);
    }
  }

  sendToCustomAnalytics(event) {
    // Custom analytics implementation
    console.log('Geolocation Event:', event);
  }

  getSessionId() {
    let sessionId = sessionStorage.getItem('geolocation_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('geolocation_session_id', sessionId);
    }
    return sessionId;
  }
}

class GeolocationPopupService {
  constructor(settings = {}) {
    this.settings = settings;
    this.geolocationService = new GeolocationDetectionService({
      timeout: settings.timeout || 5000
    });
    this.marketService = new MarketMatchingService(window.Shopify?.localization || {});
    this.preferenceManager = new UserPreferenceManager();
    this.redirectService = new LocalizationRedirectService();
    this.popupService = new PopupDisplayService(settings);
    this.analytics = new GeolocationAnalytics(settings.analyticsEnabled !== false);
    
    this.isInitialized = false;
    this.isProcessing = false;
  }

  async initialize() {
    if (this.isInitialized || this.isProcessing) return;
    
    this.isProcessing = true;

    try {
      // Check if feature is enabled
      if (!this.settings.enabled) {
        return;
      }

      // Check if popup should be shown
      if (!this.preferenceManager.shouldShowPopup()) {
        return;
      }

      // Wait for page load and settings delay
      await this.waitForDelay();

      // Detect user location
      const locationData = await this.geolocationService.detectLocation();
      
      if (!locationData || !locationData.country) {
        this.analytics.trackGeolocationError(new Error('No country detected'));
        return;
      }

      // Find matching market
      const marketData = this.marketService.findMatchingMarket(locationData.country);
      
      if (!marketData) {
        this.analytics.trackGeolocationError(new Error('No matching market found'));
        return;
      }

      // Check if market is different from current
      if (!this.marketService.isMarketDifferentFromCurrent(marketData)) {
        return;
      }

      // Show popup
      await this.showPopup(marketData);
      
      this.isInitialized = true;
    } catch (error) {
      console.warn('Geolocation popup initialization failed:', error);
      this.analytics.trackGeolocationError(error);
    } finally {
      this.isProcessing = false;
    }
  }

  async waitForDelay() {
    if (this.settings.delay > 0) {
      return new Promise(resolve => setTimeout(resolve, this.settings.delay));
    }
  }

  async showPopup(marketData) {
    try {
      const popup = this.popupService.createPopup(marketData);
      
      // Set up event handlers
      this.popupService.onUserAction = (action, data) => {
        this.handleUserAction(action, data);
      };

      this.popupService.showPopup(popup);
      this.preferenceManager.markPopupShown();
      this.analytics.trackPopupDisplayed(marketData);
    } catch (error) {
      console.error('Failed to show geolocation popup:', error);
      this.analytics.trackGeolocationError(error);
    }
  }

  async handleUserAction(action, marketData) {
    switch (action) {
      case 'accept':
        this.analytics.trackUserAccepted(marketData);
        try {
          await this.redirectService.updateLocalization(marketData);
        } catch (error) {
          console.error('Failed to update localization:', error);
        }
        break;

      case 'decline':
        this.analytics.trackUserDeclined(marketData);
        this.preferenceManager.setUserDeclined(true);
        break;

      case 'dismiss':
        this.preferenceManager.setUserDeclined(true);
        break;
    }
  }

  // Public methods for manual control
  show() {
    if (!this.isInitialized) {
      this.initialize();
    }
  }

  hide() {
    if (this.popupService) {
      this.popupService.hidePopup();
    }
  }

  reset() {
    this.preferenceManager.clearPreferences();
    this.isInitialized = false;
  }
}

// Performance optimizations and initialization
if (typeof window !== 'undefined') {
  window.GeolocationPopupService = GeolocationPopupService;
  
  // Throttle function for performance
  function throttle(func, wait) {
    let timeout;
    let previous = 0;
    return function(...args) {
      const now = Date.now();
      const remaining = wait - (now - previous);
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        func.apply(this, args);
      } else if (!timeout) {
        timeout = setTimeout(() => {
          previous = Date.now();
          timeout = null;
          func.apply(this, args);
        }, remaining);
      }
    };
  }

  // Debounce function for performance
  function debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // Lazy loading optimization
  function lazyInitialize() {
    if (window.geolocationPopupSettings && window.geolocationPopupSettings.enabled) {
      // Check if user has already interacted or if conditions don't require popup
      const preferenceManager = new UserPreferenceManager();
      if (!preferenceManager.shouldShowPopup()) {
        return;
      }

      // Initialize service only when needed
      const service = new GeolocationPopupService(window.geolocationPopupSettings);
      
      // Use requestIdleCallback for better performance if available
      if (window.requestIdleCallback) {
        requestIdleCallback(() => {
          service.initialize();
        }, { timeout: 3000 });
      } else {
        // Fallback to setTimeout for older browsers
        setTimeout(() => {
          service.initialize();
        }, 100);
      }
    }
  }

  // Optimize initialization based on loading state
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', lazyInitialize);
  } else if (document.readyState === 'interactive' || document.readyState === 'complete') {
    // Page already loaded, delay initialization to avoid blocking
    if (window.requestIdleCallback) {
      requestIdleCallback(lazyInitialize, { timeout: 2000 });
    } else {
      setTimeout(lazyInitialize, 50);
    }
  }

  // Handle page visibility changes for performance
  document.addEventListener('visibilitychange', throttle(() => {
    if (document.hidden) {
      // Page is hidden, pause any ongoing operations
      if (window.geolocationPopupServiceInstance) {
        // Could pause timers or other operations here
      }
    }
  }, 1000));

  // Memory cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (window.geolocationPopupServiceInstance) {
      // Clear any timers or references
      const service = window.geolocationPopupServiceInstance;
      if (service.popupService && service.popupService.autoDismissTimer) {
        clearTimeout(service.popupService.autoDismissTimer);
      }
    }
  });

  // Intersection Observer for better performance (if supported)
  if (window.IntersectionObserver) {
    // This could be used to trigger popup only when certain elements are visible
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };
    
    // Observer could be used for advanced triggering logic
    window.geolocationObserver = new IntersectionObserver((entries) => {
      // Custom logic for when to show popup based on viewport
    }, observerOptions);
  }
}