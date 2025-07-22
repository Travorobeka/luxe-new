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
    
    // Also check language differences
    const currentLanguageCode = this.currentCountry?.language?.iso_code?.toLowerCase();
    const newLanguageCode = market.language?.iso_code?.toLowerCase();

    const isDifferentCountry = currentCountryCode !== newCountryCode;
    const isDifferentCurrency = currentCurrencyCode !== newCurrencyCode;
    const isDifferentLanguage = currentLanguageCode !== newLanguageCode;

    console.log('🔍 Market comparison:', {
      current: { country: currentCountryCode, currency: currentCurrencyCode, language: currentLanguageCode },
      new: { country: newCountryCode, currency: newCurrencyCode, language: newLanguageCode },
      differences: { country: isDifferentCountry, currency: isDifferentCurrency, language: isDifferentLanguage }
    });

    return isDifferentCountry || isDifferentCurrency || isDifferentLanguage;
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

    // Flag icon
    const flag = document.createElement('div');
    flag.className = 'geolocation-popup__flag';
    flag.textContent = this.getCountryFlag(marketData.country);

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
    content.appendChild(flag);
    content.appendChild(title);
    content.appendChild(message);
    content.appendChild(buttonsContainer);

    return content;
  }

  getCountryFlag(country) {
    // Use flag from country data if available (for preview mode)
    if (country.flag) {
      return country.flag;
    }

    // Map common country codes to flag emojis
    const flagMap = {
      'US': '🇺🇸', 'CA': '🇨🇦', 'GB': '🇬🇧', 'AU': '🇦🇺',
      'FR': '🇫🇷', 'DE': '🇩🇪', 'IT': '🇮🇹', 'ES': '🇪🇸',
      'JP': '🇯🇵', 'KR': '🇰🇷', 'CN': '🇨🇳', 'IN': '🇮🇳',
      'BR': '🇧🇷', 'MX': '🇲🇽', 'AR': '🇦🇷', 'CL': '🇨🇱',
      'NL': '🇳🇱', 'BE': '🇧🇪', 'CH': '🇨🇭', 'AT': '🇦🇹',
      'SE': '🇸🇪', 'NO': '🇳🇴', 'DK': '🇩🇰', 'FI': '🇫🇮',
      'PL': '🇵🇱', 'CZ': '🇨🇿', 'HU': '🇭🇺', 'RO': '🇷🇴',
      'GR': '🇬🇷', 'PT': '🇵🇹', 'IE': '🇮🇪', 'HR': '🇭🇷',
      'SG': '🇸🇬', 'MY': '🇲🇾', 'TH': '🇹🇭', 'PH': '🇵🇭',
      'ID': '🇮🇩', 'VN': '🇻🇳', 'TR': '🇹🇷', 'SA': '🇸🇦',
      'AE': '🇦🇪', 'IL': '🇮🇱', 'ZA': '🇿🇦', 'EG': '🇪🇬',
      'NZ': '🇳🇿', 'RU': '🇷🇺', 'UA': '🇺🇦', 'BY': '🇧🇾'
    };

    return flagMap[country.iso_code] || '🌍';
  }

  replacePlaceholders(text, marketData) {
    let result = text;
    
    if (marketData.country) {
      result = result.replace(/{country}/g, marketData.country.name || marketData.country.iso_code);
      result = result.replace(/COUNTRY_PLACEHOLDER/g, marketData.country.name || marketData.country.iso_code);
    }
    
    if (marketData.currency) {
      result = result.replace(/{currency}/g, marketData.currency.iso_code || marketData.currency.name);
      result = result.replace(/CURRENCY_PLACEHOLDER/g, marketData.currency.iso_code || marketData.currency.name);
    }
    
    if (marketData.language) {
      result = result.replace(/{language}/g, marketData.language.name || marketData.language.iso_code);
      result = result.replace(/LANGUAGE_PLACEHOLDER/g, marketData.language.name || marketData.language.iso_code);
    }
    
    // Enhanced placeholders for better messaging
    if (marketData.currency && marketData.language) {
      const currencyAndLanguage = `${marketData.currency.iso_code} and ${marketData.language.name}`;
      result = result.replace(/{currency_and_language}/g, currencyAndLanguage);
    }
    
    return result;
  }

  showPopup(popup) {
    if (!popup) return;

    // Ensure popup appears in viewport center regardless of scroll position
    this.ensureViewportCentering(popup);

    document.body.appendChild(popup);
    
    // Apply position classes
    this.applyPositionClasses(popup);

    // Show with animation
    setTimeout(() => {
      // Make popup visible first
      popup.style.visibility = 'visible';
      popup.classList.add('geolocation-popup--visible');
      
      // Debug positioning for preview mode
      if (this.settings.previewMode) {
        this.debugPopupPosition(popup);
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

    // Remove from DOM after animation
    setTimeout(() => {
      if (this.popup && this.popup.parentNode) {
        this.popup.parentNode.removeChild(this.popup);
      }
      this.popup = null;
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
    // Get current settings (support both old and new structure)
    const bgColor = this.settings.colors?.background || this.settings.bgColor || '#ffffff';
    const textColor = this.settings.colors?.text || this.settings.textColor || '#333333';
    const accentColor = this.settings.colors?.accent || this.settings.accentColor || '#007bff';
    const borderColor = this.settings.colors?.border || this.settings.borderColor || '#e0e0e0';
    
    // Apply shadow styles
    let shadowStyle = '';
    switch (this.settings.shadow) {
      case 'none':
        shadowStyle = 'none';
        break;
      case 'light':
        shadowStyle = '0 5px 15px rgba(0, 0, 0, 0.08)';
        break;
      case 'medium':
        shadowStyle = '0 20px 40px rgba(0, 0, 0, 0.15), 0 10px 20px rgba(0, 0, 0, 0.1)';
        break;
      case 'heavy':
        shadowStyle = '0 30px 60px rgba(0, 0, 0, 0.25), 0 15px 30px rgba(0, 0, 0, 0.15)';
        break;
      default:
        shadowStyle = '0 20px 40px rgba(0, 0, 0, 0.15), 0 10px 20px rgba(0, 0, 0, 0.1)';
    }

    // Apply CSS custom properties with !important to override existing styles
    const styles = `
      --popup-bg-color: ${bgColor} !important;
      --popup-text-color: ${textColor} !important;
      --popup-accent-color: ${accentColor} !important;
      --popup-border-color: ${borderColor} !important;
      --popup-border-radius: ${this.settings.borderRadius || 8}px !important;
      --popup-max-width: ${this.settings.maxWidth || 400}px !important;
      --popup-shadow: ${shadowStyle} !important;
    `;
    
    // Apply styles directly to popup
    popup.style.cssText += styles;
    
    // Force immediate style application
    popup.style.setProperty('--popup-bg-color', bgColor, 'important');
    popup.style.setProperty('--popup-text-color', textColor, 'important');
    popup.style.setProperty('--popup-accent-color', accentColor, 'important');
    popup.style.setProperty('--popup-border-color', borderColor, 'important');
    popup.style.setProperty('--popup-border-radius', `${this.settings.borderRadius || 8}px`, 'important');
    popup.style.setProperty('--popup-max-width', `${this.settings.maxWidth || 400}px`, 'important');
    popup.style.setProperty('--popup-shadow', shadowStyle, 'important');

    // Apply direct styles to specific elements
    const content = popup.querySelector('.geolocation-popup__content');
    if (content) {
      content.style.padding = `${this.settings.padding || 25}px`;
      content.style.backgroundColor = bgColor;
      content.style.color = textColor;
      content.style.borderColor = borderColor;
      content.style.borderRadius = `${this.settings.borderRadius || 8}px`;
      content.style.boxShadow = shadowStyle;
      content.style.maxWidth = `${this.settings.maxWidth || 400}px`;
    }

    const flag = popup.querySelector('.geolocation-popup__flag');
    if (flag) {
      flag.style.fontSize = `${this.settings.flagSize || 40}px`;
    }

    const title = popup.querySelector('.geolocation-popup__title');
    if (title) {
      title.style.fontSize = `${this.settings.titleSize || 20}px`;
      title.style.color = textColor;
    }

    const message = popup.querySelector('.geolocation-popup__message');
    if (message) {
      message.style.fontSize = `${this.settings.messageSize || 15}px`;
      message.style.color = textColor;
    }

    const buttons = popup.querySelectorAll('.geolocation-popup__button');
    buttons.forEach(button => {
      button.style.fontSize = `${this.settings.buttonSize || 14}px`;
      
      if (button.classList.contains('geolocation-popup__button--accept')) {
        button.style.backgroundColor = accentColor;
        button.style.borderColor = accentColor;
        button.style.color = '#ffffff';
      } else {
        button.style.borderColor = borderColor;
        button.style.color = textColor;
      }
    });
    
    // Force a reflow to ensure styles are applied
    popup.offsetHeight;
  }

  ensureViewportCentering(popup) {
    // Force popup to appear in the center of the current viewport
    if (this.settings.style === 'modal' || this.settings.style === undefined) {
      // Override any existing positioning styles
      popup.style.cssText += `
        position: fixed !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) scale(0.8) !important;
        z-index: 99999 !important;
        margin: 0 !important;
        visibility: hidden;
      `;
      
      // Force a reflow to ensure styles are applied
      popup.offsetHeight;
    }
  }

  debugPopupPosition(popup) {
    const rect = popup.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    console.log('🎯 Popup Position Debug:', {
      popupRect: rect,
      viewportSize: { width: viewportWidth, height: viewportHeight },
      isInViewport: {
        horizontal: rect.left >= 0 && rect.right <= viewportWidth,
        vertical: rect.top >= 0 && rect.bottom <= viewportHeight
      },
      centerPosition: {
        expectedX: viewportWidth / 2,
        expectedY: viewportHeight / 2,
        actualX: rect.left + rect.width / 2,
        actualY: rect.top + rect.height / 2
      },
      styles: {
        position: popup.style.position,
        top: popup.style.top,
        left: popup.style.left,
        transform: popup.style.transform,
        zIndex: popup.style.zIndex
      }
    });
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

      // Handle preview mode
      if (this.settings.previewMode) {
        await this.initializePreviewMode();
        return;
      }

      // Check if popup should be shown
      if (!this.preferenceManager.shouldShowPopup()) {
        return;
      }

      // Detect user location immediately
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

      // Show popup with optional delay
      if (this.settings.delay > 0) {
        await this.waitForDelay();
      }
      await this.showPopup(marketData);
      
      this.isInitialized = true;
    } catch (error) {
      console.warn('Geolocation popup initialization failed:', error);
      this.analytics.trackGeolocationError(error);
    } finally {
      this.isProcessing = false;
    }
  }

  async initializePreviewMode() {
    try {
      if (window.Shopify && window.Shopify.designMode === true) {
        console.log('🎨 Geolocation Popup Preview Mode Active');
        // Create mock market data based on preview country
        const mockMarketData = this.createMockMarketData(this.settings.previewCountry);
        if (!mockMarketData) {
          console.warn('Preview mode: Could not create mock market data');
          return;
        }
        // Show popup immediately without delays or checks
        await this.showPopup(mockMarketData, true);
        this.isInitialized = true;
      }
    } catch (error) {
      console.error('Preview mode initialization failed:', error);
    }
  }

  createMockMarketData(countryCode) {
    const countryData = {
      'CA': { name: 'Canada', currency: 'CAD', currencySymbol: 'C$', flag: '🇨🇦', language: 'en' },
      'GB': { name: 'United Kingdom', currency: 'GBP', currencySymbol: '£', flag: '🇬🇧', language: 'en' },
      'AU': { name: 'Australia', currency: 'AUD', currencySymbol: 'A$', flag: '🇦🇺', language: 'en' },
      'FR': { name: 'France', currency: 'EUR', currencySymbol: '€', flag: '🇫🇷', language: 'fr' },
      'DE': { name: 'Germany', currency: 'EUR', currencySymbol: '€', flag: '🇩🇪', language: 'de' },
      'JP': { name: 'Japan', currency: 'JPY', currencySymbol: '¥', flag: '🇯🇵', language: 'ja' },
      'MX': { name: 'Mexico', currency: 'MXN', currencySymbol: '$', flag: '🇲🇽', language: 'es' },
      'BR': { name: 'Brazil', currency: 'BRL', currencySymbol: 'R$', flag: '🇧🇷', language: 'pt' }
    };

    const country = countryData[countryCode];
    if (!country) return null;

    return {
      country: {
        iso_code: countryCode,
        name: country.name,
        flag: country.flag,
        language: {
          iso_code: country.language,
          name: this.getLanguageName(country.language)
        }
      },
      currency: {
        iso_code: country.currency,
        name: country.currency,
        symbol: country.currencySymbol
      },
      language: {
        iso_code: country.language,
        name: this.getLanguageName(country.language)
      },
      marketUrl: `/${country.language}-${countryCode.toLowerCase()}`
    };
  }
  
  getLanguageName(languageCode) {
    const languages = {
      'en': 'English',
      'fr': 'French',
      'de': 'German',
      'es': 'Spanish',
      'pt': 'Portuguese',
      'ja': 'Japanese'
    };
    return languages[languageCode] || languageCode;
  }

  async waitForDelay() {
    if (this.settings.delay > 0) {
      return new Promise(resolve => setTimeout(resolve, this.settings.delay));
    }
  }

  async showPopup(marketData, isPreview = false) {
    try {
      const popup = this.popupService.createPopup(marketData);
      
      // Set up event handlers
      this.popupService.onUserAction = (action, data) => {
        this.handleUserAction(action, data, isPreview);
      };

      // Add preview mode indicator
      if (isPreview) {
        this.addPreviewModeIndicator(popup);
      }

      this.popupService.showPopup(popup);
      
      if (!isPreview) {
        this.preferenceManager.markPopupShown();
        this.analytics.trackPopupDisplayed(marketData);
      } else {
        console.log('🎨 Preview popup displayed with sample data for:', marketData.country.name);
      }
    } catch (error) {
      console.error('Failed to show geolocation popup:', error);
      if (!isPreview) {
        this.analytics.trackGeolocationError(error);
      }
    }
  }

  addPreviewModeIndicator(popup) {
    const indicator = document.createElement('div');
    indicator.className = 'geolocation-popup__preview-indicator';
    indicator.innerHTML = '🎨 Preview Mode';
    indicator.style.cssText = `
      position: absolute;
      top: -25px;
      left: 0;
      background: #ff6b35;
      color: white;
      padding: 4px 8px;
      font-size: 11px;
      font-weight: bold;
      border-radius: 4px 4px 0 0;
      z-index: 10;
      letter-spacing: 0.5px;
    `;
    popup.style.position = 'relative';
    popup.appendChild(indicator);
  }

  async handleUserAction(action, marketData, isPreview = false) {
    if (isPreview) {
      // Handle preview mode actions
      switch (action) {
        case 'accept':
          const languageInfo = marketData.language ? ` and ${marketData.language.name} language` : '';
          console.log('🎨 Preview: User would accept switch to', marketData.currency.iso_code, 'and', marketData.language?.name);
          alert(`Preview Mode: Would redirect to ${marketData.country.name} market with ${marketData.currency.iso_code} currency${languageInfo}.\n\nURL: ${marketData.marketUrl}`);
          break;
        case 'decline':
          console.log('🎨 Preview: User would decline the suggestion');
          alert('Preview Mode: User would decline the localization suggestion.');
          break;
        case 'dismiss':
          console.log('🎨 Preview: User would dismiss the popup');
          break;
      }
      return;
    }

    // Handle normal mode actions
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

// Real-time customization preview for theme editor
class GeolocationPopupCustomizer {
  constructor() {
    this.currentPopupService = null;
    this.isInThemeEditor = this.detectThemeEditor();
    this.lastSettings = null;
    
    if (this.isInThemeEditor) {
      this.initializeCustomizer();
    }
  }
  
  detectThemeEditor() {
    return window.Shopify && window.Shopify.designMode === true;
  }
  
  initializeCustomizer() {
    console.log('🎨 Theme editor detected - enabling real-time preview');
    
    // Listen for Shopify theme setting changes
    document.addEventListener('shopify:section:load', () => this.handleSettingsChange());
    document.addEventListener('shopify:section:reorder', () => this.handleSettingsChange());
    document.addEventListener('shopify:section:select', () => this.handleSettingsChange());
    document.addEventListener('shopify:section:deselect', () => this.handleSettingsChange());
    
    // Listen for input changes in theme settings
    this.setupInputListeners();
    
    // Watch for DOM changes that might indicate settings updates
    this.setupMutationObserver();
    
    // Poll for settings changes as fallback
    setInterval(() => this.checkForSettingsChanges(), 500);
    
    // Enable preview mode by default in theme editor
    if (window.geolocationPopupSettings) {
      window.geolocationPopupSettings.previewMode = true;
      window.geolocationPopupSettings.previewCountry = window.geolocationPopupSettings.previewCountry || 'CA';
    }
    
    // Show initial preview
    setTimeout(() => this.updatePreview(), 1000);
  }
  
  setupInputListeners() {
    // Listen for changes to any input fields that might affect the popup
    document.addEventListener('input', (event) => {
      const input = event.target;
      if (input.name && input.name.includes('geolocation_popup')) {
        console.log('🎛️ Input change detected:', input.name, input.value);
        // Immediate update for color pickers and range sliders
        if (input.type === 'color' || input.type === 'range') {
          this.handleSettingsChange();
        }
      }
    });
    
    document.addEventListener('change', (event) => {
      const input = event.target;
      if (input.name && input.name.includes('geolocation_popup')) {
        console.log('🔄 Input value changed:', input.name, input.value);
        this.handleSettingsChange();
      }
    });
    
    // Special handling for common theme editor events
    document.addEventListener('keyup', (event) => {
      const input = event.target;
      if (input.name && input.name.includes('geolocation_popup') && input.type === 'text') {
        // Debounced update for text inputs
        clearTimeout(this.textInputTimeout);
        this.textInputTimeout = setTimeout(() => {
          this.handleSettingsChange();
        }, 500);
      }
    });
  }
  
  setupMutationObserver() {
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          // Check if any script tags with settings were modified
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.tagName === 'SCRIPT' && node.textContent.includes('geolocationPopupSettings')) {
                console.log('🔄 Settings script updated');
                this.handleSettingsChange();
              }
            });
          }
        });
      });
      
      observer.observe(document.head, {
        childList: true,
        subtree: true
      });
    }
  }
  
  handleSettingsChange() {
    console.log('📝 Settings changed - updating preview');
    setTimeout(() => this.updatePreview(), 100);
  }
  
  checkForSettingsChanges() {
    if (!window.geolocationPopupSettings) return;
    
    const currentSettings = JSON.stringify(window.geolocationPopupSettings);
    if (this.lastSettings && currentSettings !== this.lastSettings) {
      console.log('🔄 Settings change detected');
      this.updatePreview();
    }
    this.lastSettings = currentSettings;
  }
  
  updatePreview() {
    // Hide current popup
    this.hideCurrentPopup();
    
    // Reload settings from DOM inputs
    this.refreshSettingsFromDOM();
    
    // Wait a moment then show updated popup
    setTimeout(() => {
      if (window.geolocationPopupSettings && window.geolocationPopupSettings.enabled) {
        window.geolocationPopupSettings.previewMode = true;
        
        // Create a new service with fresh settings
        this.currentPopupService = new GeolocationPopupService(window.geolocationPopupSettings);
        
        // Force the popup service to use updated settings
        this.currentPopupService.popupService.settings = this.mergeSettings(window.geolocationPopupSettings);
        
        this.currentPopupService.initialize();
      }
    }, 200);
  }
  
  mergeSettings(newSettings) {
    return {
      style: newSettings.style || 'modal',
      position: newSettings.position || 'center',
      animation: newSettings.animation || 'fade',
      delay: newSettings.delay || 0,
      autoDismiss: newSettings.autoDismiss || 0,
      previewMode: newSettings.previewMode || false,
      previewCountry: newSettings.previewCountry || 'CA',
      
      // Color settings
      bgColor: newSettings.bgColor || '#ffffff',
      textColor: newSettings.textColor || '#333333',
      accentColor: newSettings.accentColor || '#007bff',
      borderColor: newSettings.borderColor || '#e0e0e0',
      
      // Size settings
      borderRadius: newSettings.borderRadius || 8,
      maxWidth: newSettings.maxWidth || 400,
      padding: newSettings.padding || 25,
      shadow: newSettings.shadow || 'medium',
      
      // Font settings
      flagSize: newSettings.flagSize || 40,
      titleSize: newSettings.titleSize || 20,
      messageSize: newSettings.messageSize || 15,
      buttonSize: newSettings.buttonSize || 14,
      
      // Text content
      text: {
        title: newSettings.title || 'Shop in your local currency',
        message: newSettings.message || 'We detected you\'re in {country}. Would you like to shop in {currency}?',
        acceptButton: newSettings.acceptButton || 'Yes, switch to {currency}',
        declineButton: newSettings.declineButton || 'No, keep current settings'
      },
      
      // Legacy color structure for backward compatibility
      colors: {
        background: newSettings.bgColor || '#ffffff',
        text: newSettings.textColor || '#333333',
        accent: newSettings.accentColor || '#007bff',
        border: newSettings.borderColor || '#e0e0e0'
      }
    };
  }
  
  refreshSettingsFromDOM() {
    if (!window.geolocationPopupSettings) return;
    
    // Map of setting names to their input selectors
    const settingMappings = {
      'enabled': 'input[name*="geolocation_popup_enabled"]',
      'style': 'select[name*="geolocation_popup_style"]',
      'position': 'select[name*="geolocation_popup_position"]',
      'delay': 'input[name*="geolocation_popup_delay"]',
      'autoDismiss': 'input[name*="geolocation_popup_auto_dismiss"]',
      'animation': 'select[name*="geolocation_popup_animation"]',
      'title': 'input[name*="geolocation_popup_title"]',
      'message': 'textarea[name*="geolocation_popup_message"]',
      'acceptButton': 'input[name*="geolocation_popup_accept_button"]',
      'declineButton': 'input[name*="geolocation_popup_decline_button"]',
      'bgColor': 'input[name*="geolocation_popup_bg_color"]',
      'textColor': 'input[name*="geolocation_popup_text_color"]',
      'accentColor': 'input[name*="geolocation_popup_accent_color"]',
      'borderColor': 'input[name*="geolocation_popup_border_color"]',
      'borderRadius': 'input[name*="geolocation_popup_border_radius"]',
      'maxWidth': 'input[name*="geolocation_popup_max_width"]',
      'padding': 'input[name*="geolocation_popup_padding"]',
      'shadow': 'select[name*="geolocation_popup_shadow"]',
      'flagSize': 'input[name*="geolocation_popup_flag_size"]',
      'titleSize': 'input[name*="geolocation_popup_title_size"]',
      'messageSize': 'input[name*="geolocation_popup_message_size"]',
      'buttonSize': 'input[name*="geolocation_popup_button_size"]',
      'previewMode': 'input[name*="geolocation_popup_preview_mode"]',
      'previewCountry': 'select[name*="geolocation_popup_preview_country"]'
    };
    
    // Update settings from current DOM values
    Object.keys(settingMappings).forEach(key => {
      const input = document.querySelector(settingMappings[key]);
      if (input) {
        let value = input.value;
        
        // Handle different input types
        if (input.type === 'checkbox') {
          value = input.checked;
        } else if (input.type === 'number' || input.type === 'range') {
          value = parseInt(value, 10) || 0;
        }
        
        window.geolocationPopupSettings[key] = value;
        console.log(`Updated ${key}: ${value}`);
      }
    });
  }
  
  hideCurrentPopup() {
    // Remove existing popups
    const existingPopups = document.querySelectorAll('.geolocation-popup');
    existingPopups.forEach(popup => {
      if (popup.parentNode) {
        popup.parentNode.removeChild(popup);
      }
    });
    
    // Clear current service
    if (this.currentPopupService) {
      this.currentPopupService.hide();
      this.currentPopupService = null;
    }
  }
}

// Performance optimizations and initialization
if (typeof window !== 'undefined') {
  window.GeolocationPopupService = GeolocationPopupService;
  window.GeolocationPopupCustomizer = GeolocationPopupCustomizer;
  
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
      
      // Initialize immediately for better user experience
      service.initialize();
    }
  }

  // Initialize customizer for theme editor
  const customizer = new GeolocationPopupCustomizer();
  window.geolocationCustomizer = customizer;
  
  // Global function to manually refresh preview
  window.refreshGeolocationPreview = function() {
    if (customizer) {
      customizer.updatePreview();
    }
  };
  
  // Optimize initialization based on loading state
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', lazyInitialize);
  } else if (document.readyState === 'interactive' || document.readyState === 'complete') {
    // Page already loaded, initialize immediately
    lazyInitialize();
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