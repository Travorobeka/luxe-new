/**
 * Geolocation Popup Test Suite
 * 
 * Basic test suite for the geolocation popup functionality.
 * This can be run in the browser console for manual testing.
 * 
 * Usage:
 * 1. Open browser console
 * 2. Copy and paste this file content
 * 3. Run: GeolocationPopupTests.runAllTests()
 */

window.GeolocationPopupTests = {
  testResults: [],
  
  // Test runner
  runAllTests() {
    console.log('🧪 Starting Geolocation Popup Tests...\n');
    this.testResults = [];
    
    // Core service tests
    this.testGeolocationDetectionService();
    this.testMarketMatchingService();
    this.testUserPreferenceManager();
    this.testPopupDisplayService();
    this.testLocalizationRedirectService();
    this.testAnalytics();
    
    // Integration tests
    this.testMainService();
    
    // Performance tests
    this.testPerformance();
    
    // Accessibility tests
    this.testAccessibility();
    
    this.printResults();
  },
  
  // Test utilities
  assert(condition, message) {
    if (condition) {
      this.testResults.push({ status: '✅', message });
    } else {
      this.testResults.push({ status: '❌', message });
      console.error('Test failed:', message);
    }
  },
  
  assertThrows(fn, message) {
    try {
      fn();
      this.testResults.push({ status: '❌', message: `${message} (should have thrown)` });
    } catch (error) {
      this.testResults.push({ status: '✅', message });
    }
  },
  
  // GeolocationDetectionService tests
  testGeolocationDetectionService() {
    console.log('Testing GeolocationDetectionService...');
    
    const service = new GeolocationDetectionService();
    
    this.assert(
      typeof service.isGeolocationSupported === 'function',
      'GeolocationDetectionService has isGeolocationSupported method'
    );
    
    this.assert(
      typeof service.detectLocation === 'function',
      'GeolocationDetectionService has detectLocation method'
    );
    
    this.assert(
      typeof service.handleGeolocationError === 'function',
      'GeolocationDetectionService has handleGeolocationError method'
    );
    
    // Test error handling
    const mockError = { code: 1, message: 'Permission denied' };
    const handledError = service.handleGeolocationError(mockError);
    this.assert(
      handledError instanceof Error,
      'GeolocationDetectionService properly handles errors'
    );
  },
  
  // MarketMatchingService tests
  testMarketMatchingService() {
    console.log('Testing MarketMatchingService...');
    
    const mockMarketsData = {
      available_countries: [
        {
          iso_code: 'US',
          name: 'United States',
          currency: { iso_code: 'USD', name: 'US Dollar', symbol: '$' }
        },
        {
          iso_code: 'CA',
          name: 'Canada',
          currency: { iso_code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' }
        }
      ],
      current_country: {
        iso_code: 'US',
        name: 'United States',
        currency: { iso_code: 'USD', name: 'US Dollar', symbol: '$' }
      }
    };
    
    const service = new MarketMatchingService(mockMarketsData);
    
    this.assert(
      service.availableCountries.length === 2,
      'MarketMatchingService loads available countries'
    );
    
    const usMarket = service.findMatchingMarket('US');
    this.assert(
      usMarket && usMarket.country.iso_code === 'US',
      'MarketMatchingService finds correct market for US'
    );
    
    const unknownMarket = service.findMatchingMarket('XX');
    this.assert(
      unknownMarket === null,
      'MarketMatchingService returns null for unknown country'
    );
    
    const caMarket = service.findMatchingMarket('CA');
    this.assert(
      service.isMarketDifferentFromCurrent(caMarket),
      'MarketMatchingService detects different market correctly'
    );
  },
  
  // UserPreferenceManager tests
  testUserPreferenceManager() {
    console.log('Testing UserPreferenceManager...');
    
    const manager = new UserPreferenceManager();
    
    // Clear any existing preferences
    manager.clearPreferences();
    
    this.assert(
      !manager.hasUserDeclined(),
      'UserPreferenceManager starts with no decline preference'
    );
    
    this.assert(
      manager.shouldShowPopup(),
      'UserPreferenceManager should show popup initially'
    );
    
    // Set user declined
    manager.setUserDeclined(true);
    this.assert(
      manager.hasUserDeclined(),
      'UserPreferenceManager records user decline'
    );
    
    this.assert(
      !manager.shouldShowPopup(),
      'UserPreferenceManager should not show popup after decline'
    );
    
    // Clean up
    manager.clearPreferences();
  },
  
  // PopupDisplayService tests
  testPopupDisplayService() {
    console.log('Testing PopupDisplayService...');
    
    const settings = {
      style: 'modal',
      title: 'Test Title',
      message: 'Test message for {country}',
      acceptButton: 'Accept {currency}',
      declineButton: 'Decline'
    };
    
    const service = new PopupDisplayService(settings);
    
    this.assert(
      service.settings.style === 'modal',
      'PopupDisplayService stores settings correctly'
    );
    
    const mockMarketData = {
      country: { name: 'Canada', iso_code: 'CA' },
      currency: { iso_code: 'CAD', name: 'Canadian Dollar' }
    };
    
    const popup = service.createPopup(mockMarketData);
    this.assert(
      popup instanceof HTMLElement,
      'PopupDisplayService creates HTML element'
    );
    
    this.assert(
      popup.querySelector('.geolocation-popup__title'),
      'PopupDisplayService creates title element'
    );
    
    this.assert(
      popup.querySelector('.geolocation-popup__message'),
      'PopupDisplayService creates message element'
    );
    
    // Test placeholder replacement
    const titleText = popup.querySelector('.geolocation-popup__title').textContent;
    this.assert(
      titleText === 'Test Title',
      'PopupDisplayService renders title correctly'
    );
    
    const messageText = popup.querySelector('.geolocation-popup__message').textContent;
    this.assert(
      messageText.includes('Canada'),
      'PopupDisplayService replaces country placeholder'
    );
  },
  
  // LocalizationRedirectService tests
  testLocalizationRedirectService() {
    console.log('Testing LocalizationRedirectService...');
    
    const service = new LocalizationRedirectService();
    
    this.assert(
      typeof service.buildRedirectUrl === 'function',
      'LocalizationRedirectService has buildRedirectUrl method'
    );
    
    const mockMarketData = {
      marketUrl: '/en-ca',
      country: { iso_code: 'CA' },
      currency: { iso_code: 'CAD' }
    };
    
    const url = service.buildRedirectUrl(mockMarketData);
    this.assert(
      typeof url === 'string' && url.includes('/en-ca'),
      'LocalizationRedirectService builds correct URL'
    );
  },
  
  // Analytics tests
  testAnalytics() {
    console.log('Testing GeolocationAnalytics...');
    
    const analytics = new GeolocationAnalytics(true);
    
    this.assert(
      analytics.enabled === true,
      'GeolocationAnalytics enables correctly'
    );
    
    analytics.trackEvent('test_event', { test: 'data' });
    this.assert(
      analytics.events.length === 1,
      'GeolocationAnalytics tracks events'
    );
    
    this.assert(
      analytics.events[0].type === 'test_event',
      'GeolocationAnalytics stores event type correctly'
    );
  },
  
  // Main service integration tests
  testMainService() {
    console.log('Testing GeolocationPopupService...');
    
    const settings = {
      enabled: true,
      delay: 0,
      analyticsEnabled: true
    };
    
    const service = new GeolocationPopupService(settings);
    
    this.assert(
      service.settings.enabled === true,
      'GeolocationPopupService stores settings'
    );
    
    this.assert(
      service.geolocationService instanceof GeolocationDetectionService,
      'GeolocationPopupService creates geolocation service'
    );
    
    this.assert(
      service.marketService instanceof MarketMatchingService,
      'GeolocationPopupService creates market service'
    );
    
    this.assert(
      service.preferenceManager instanceof UserPreferenceManager,
      'GeolocationPopupService creates preference manager'
    );
    
    this.assert(
      typeof service.initialize === 'function',
      'GeolocationPopupService has initialize method'
    );
  },
  
  // Performance tests
  testPerformance() {
    console.log('Testing Performance...');
    
    // Test script loading time
    const startTime = performance.now();
    new GeolocationPopupService({ enabled: false });
    const endTime = performance.now();
    
    this.assert(
      (endTime - startTime) < 50,
      'GeolocationPopupService initialization is fast (< 50ms)'
    );
    
    // Test memory usage (basic check)
    const service = new GeolocationPopupService({ enabled: false });
    this.assert(
      typeof service === 'object',
      'GeolocationPopupService creates without memory errors'
    );
    
    // Test DOM manipulation performance
    const displayService = new PopupDisplayService();
    const startDOMTime = performance.now();
    const popup = displayService.createPopup({
      country: { name: 'Test', iso_code: 'TS' },
      currency: { iso_code: 'TST', name: 'Test Currency' }
    });
    const endDOMTime = performance.now();
    
    this.assert(
      (endDOMTime - startDOMTime) < 10,
      'Popup creation is fast (< 10ms)'
    );
  },
  
  // Accessibility tests
  testAccessibility() {
    console.log('Testing Accessibility...');
    
    const service = new PopupDisplayService();
    const popup = service.createPopup({
      country: { name: 'Test', iso_code: 'TS' },
      currency: { iso_code: 'TST', name: 'Test Currency' }
    });
    
    this.assert(
      popup.getAttribute('role') === 'dialog',
      'Popup has correct ARIA role'
    );
    
    this.assert(
      popup.getAttribute('aria-modal') === 'true',
      'Popup has aria-modal attribute'
    );
    
    this.assert(
      popup.getAttribute('aria-labelledby'),
      'Popup has aria-labelledby attribute'
    );
    
    const closeButton = popup.querySelector('.geolocation-popup__close');
    this.assert(
      closeButton.getAttribute('aria-label'),
      'Close button has aria-label'
    );
    
    // Test keyboard navigation
    const buttons = popup.querySelectorAll('button');
    buttons.forEach(button => {
      this.assert(
        button.tabIndex >= 0,
        'Buttons are keyboard accessible'
      );
    });
  },
  
  // Print test results
  printResults() {
    console.log('\n📊 Test Results:');
    console.log('================');
    
    let passed = 0;
    let failed = 0;
    
    this.testResults.forEach(result => {
      console.log(`${result.status} ${result.message}`);
      if (result.status === '✅') passed++;
      else failed++;
    });
    
    console.log(`\nTotal: ${this.testResults.length} tests`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success rate: ${((passed / this.testResults.length) * 100).toFixed(1)}%`);
    
    if (failed === 0) {
      console.log('\n🎉 All tests passed!');
    } else {
      console.log('\n⚠️  Some tests failed. Check the console for details.');
    }
  },
  
  // Manual test helpers
  simulateGeolocation(countryCode = 'CA') {
    console.log(`🌍 Simulating geolocation for ${countryCode}...`);
    
    // Mock navigator.geolocation
    const mockGeolocation = {
      getCurrentPosition: (success, error, options) => {
        setTimeout(() => {
          success({
            coords: {
              latitude: countryCode === 'CA' ? 45.4215 : 40.7128,
              longitude: countryCode === 'CA' ? -75.6972 : -74.0060,
              accuracy: 100
            },
            timestamp: Date.now()
          });
        }, 100);
      }
    };
    
    // Temporarily replace geolocation
    const originalGeolocation = navigator.geolocation;
    navigator.geolocation = mockGeolocation;
    
    // Initialize popup
    if (window.geolocationPopupSettings) {
      const service = new GeolocationPopupService(window.geolocationPopupSettings);
      service.initialize();
    }
    
    // Restore original geolocation after 5 seconds
    setTimeout(() => {
      navigator.geolocation = originalGeolocation;
    }, 5000);
    
    console.log('✅ Simulation started. Popup should appear soon.');
  },
  
  resetPreferences() {
    console.log('🔄 Resetting user preferences...');
    const manager = new UserPreferenceManager();
    manager.clearPreferences();
    console.log('✅ Preferences cleared.');
  },

  enablePreviewMode(countryCode = 'CA') {
    console.log(`🎨 Enabling preview mode for ${countryCode}...`);
    
    if (!window.geolocationPopupSettings) {
      console.error('❌ Geolocation popup settings not found. Make sure the feature is enabled.');
      return;
    }

    // Enable preview mode
    window.geolocationPopupSettings.previewMode = true;
    window.geolocationPopupSettings.previewCountry = countryCode;
    
    // Initialize service with preview mode
    const service = new GeolocationPopupService(window.geolocationPopupSettings);
    service.initialize();
    
    console.log(`✅ Preview mode enabled for ${countryCode}. Popup should appear immediately.`);
  },

  disablePreviewMode() {
    console.log('🔄 Disabling preview mode...');
    
    if (window.geolocationPopupSettings) {
      window.geolocationPopupSettings.previewMode = false;
    }
    
    // Hide any existing popups
    const existingPopups = document.querySelectorAll('.geolocation-popup');
    existingPopups.forEach(popup => {
      if (popup.parentNode) {
        popup.parentNode.removeChild(popup);
      }
    });
    
    // Remove overlays
    const overlays = document.querySelectorAll('.geolocation-popup__overlay');
    overlays.forEach(overlay => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    });
    
    console.log('✅ Preview mode disabled.');
  },

  testPreviewMode() {
    console.log('🧪 Testing preview mode functionality...');
    
    const countries = ['CA', 'GB', 'AU', 'FR', 'DE', 'JP', 'MX', 'BR'];
    let currentIndex = 0;
    
    const showNextPreview = () => {
      if (currentIndex >= countries.length) {
        this.disablePreviewMode();
        console.log('🎉 Preview mode testing complete!');
        return;
      }
      
      const country = countries[currentIndex];
      console.log(`Testing preview for: ${country}`);
      
      this.disablePreviewMode(); // Clear previous
      setTimeout(() => {
        this.enablePreviewMode(country);
        currentIndex++;
        setTimeout(showNextPreview, 3000); // Show each for 3 seconds
      }, 500);
    };
    
    showNextPreview();
  }
};

// Auto-run tests if in development mode
if (window.location.hostname === 'localhost' || window.location.hostname.includes('myshopify.com')) {
  console.log('🔧 Development mode detected. Geolocation popup tests are available.');
  console.log('Available commands:');
  console.log('  GeolocationPopupTests.runAllTests() - Run complete test suite');
  console.log('  GeolocationPopupTests.simulateGeolocation("CA") - Simulate geolocation for country');
  console.log('  GeolocationPopupTests.enablePreviewMode("CA") - Enable preview mode for country');
  console.log('  GeolocationPopupTests.disablePreviewMode() - Disable preview mode');
  console.log('  GeolocationPopupTests.testPreviewMode() - Test all preview countries');
  console.log('  GeolocationPopupTests.resetPreferences() - Reset user preferences');
}