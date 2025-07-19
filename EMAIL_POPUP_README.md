# Email Popup System Documentation

## Overview

This email popup system is an enterprise-level solution for capturing visitor email addresses with sophisticated customization options, beautiful responsive design, and optimal performance. It's built specifically for Shopify themes and provides a seamless user experience across all devices.

## Features

### ✅ Core Functionality
- **Email Capture**: Sophisticated email collection with Shopify customer integration
- **Form Validation**: Real-time client-side validation with user-friendly error messages
- **Success States**: Customizable thank you messages with optional discount codes
- **Error Handling**: Robust error management with graceful degradation

### ✅ Customization Options
- **Design**: Colors, typography, layout, borders, shadows, and animations
- **Content**: Headlines, descriptions, button text, and privacy notices
- **Discounts**: Configurable discount codes with copy-to-clipboard functionality
- **Branding**: Custom images, logos, and brand-specific styling

### ✅ Trigger Conditions
- **Time-based**: Immediate, after X seconds, on scroll percentage
- **Behavior-based**: Exit intent, page views, session duration
- **Targeting**: New vs returning visitors, device-specific, page-specific

### ✅ Performance & Accessibility
- **Fast Loading**: Under 100ms initialization with lazy loading
- **Responsive**: Mobile-first design with touch-friendly targets
- **Accessible**: WCAG 2.1 AA compliant with screen reader support
- **Cross-browser**: Compatible with all modern browsers

### ✅ Integrations
- **Shopify**: Native customer database integration
- **Webhooks**: Third-party email service integration
- **Analytics**: Google Analytics, GTM, and custom tracking
- **Offline**: Queue submissions for offline scenarios

## Installation

### 1. Upload Files

Upload these files to your Shopify theme:

```
sections/email-popup.liquid          # Main section file
snippets/email-popup-form.liquid     # Form component
snippets/email-popup-success.liquid  # Success state component
assets/email-popup.css              # Stylesheet
assets/email-popup.js               # Core functionality
```

### 2. Add Section to Templates

Add the Email Popup section to any template (e.g., `templates/index.json`):

```json
{
  "sections": {
    "email-popup": {
      "type": "email-popup",
      "settings": {
        "enabled": true,
        "headline": "Join Our Newsletter",
        "description": "Get exclusive offers and updates.",
        "time_delay": 5,
        "scroll_percentage": 50
      }
    }
  },
  "order": ["email-popup", "other-sections"]
}
```

### 3. Configure Settings

Access the theme customizer and configure:
- **General Settings**: Enable/disable, preview mode
- **Content**: Headlines, descriptions, button text
- **Design**: Colors, typography, layout
- **Triggers**: Time delay, scroll, exit intent
- **Targeting**: Device and visitor targeting
- **Integrations**: Webhooks and third-party services

## Configuration

### Basic Configuration

```liquid
<!-- Minimal setup -->
{
  "enabled": true,
  "headline": "Join Our Newsletter",
  "description": "Get exclusive offers and updates.",
  "button_text": "Subscribe Now",
  "time_delay": 5
}
```

### Advanced Configuration

```liquid
<!-- Full feature configuration -->
{
  "enabled": true,
  "preview_mode": false,
  "headline": "Exclusive Offers Await!",
  "description": "Join 10,000+ subscribers and get 15% off your first order.",
  "discount_enabled": true,
  "discount_code": "WELCOME15",
  "discount_type": "percentage",
  "discount_value": 15,
  "time_delay": 3,
  "scroll_percentage": 60,
  "exit_intent": true,
  "target_new_visitors": true,
  "target_mobile": true,
  "webhook_url": "https://your-service.com/webhook"
}
```

## API Reference

### Events

The popup system emits custom events for integration:

```javascript
// Listen for popup events
document.addEventListener('emailPopupShown', function(e) {
  console.log('Popup shown:', e.detail.triggerType);
});

document.addEventListener('emailPopupSubmitted', function(e) {
  console.log('Email submitted:', e.detail.email);
});

document.addEventListener('emailPopupClosed', function(e) {
  console.log('Popup closed');
});
```

### JavaScript API

```javascript
// Access popup instances
const popups = window.emailPopupInstances;

// Manually show popup
if (popups && popups[0]) {
  popups[0].show('manual');
}

// Manually hide popup
if (popups && popups[0]) {
  popups[0].hide();
}

// Reset user state
localStorage.removeItem('emailPopup_userState');
```

### Custom Styling

```css
/* Override default styles */
:root {
  --popup-primary-color: #your-brand-color;
  --popup-accent-color: #your-accent-color;
  --popup-border-radius: 12px;
}

/* Custom popup container */
.email-popup-container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Custom form styling */
.email-popup-form__input {
  border: 2px solid #your-brand-color;
}
```

## Testing

### Manual Testing

1. **Load Test Page**: Open `assets/email-popup-integration-test.html`
2. **Run Tests**: Click test buttons to verify functionality
3. **Check Results**: Review test outputs in the console

### Automated Testing

```javascript
// Load and run unit tests
<script src="{{ 'email-popup-tests.js' | asset_url }}"></script>

// Check test results
console.log(window.emailPopupTestResults);
```

### Performance Testing

```javascript
// Monitor performance
performance.mark('popup-start');
// ... popup operations ...
performance.mark('popup-end');
performance.measure('popup-duration', 'popup-start', 'popup-end');
```

## Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 60+ | ✅ Full |
| Firefox | 55+ | ✅ Full |
| Safari | 12+ | ✅ Full |
| Edge | 79+ | ✅ Full |
| IE | 11 | ⚠️ Limited |

## Troubleshooting

### Common Issues

**Popup not showing:**
1. Check if `enabled: true` in settings
2. Verify trigger conditions are met
3. Check browser console for errors
4. Ensure user hasn't already subscribed

**Form submission failing:**
1. Check network connectivity
2. Verify webhook URL is correct
3. Check Shopify customer form requirements
4. Review error logs in browser console

**Styling issues:**
1. Check CSS file is loaded
2. Verify custom CSS syntax
3. Clear browser cache
4. Check for CSS conflicts

**Performance issues:**
1. Minimize custom CSS/JS
2. Optimize images and assets
3. Check for memory leaks
4. Test on slower devices

### Debug Mode

Enable debug mode by adding to localStorage:

```javascript
localStorage.setItem('emailPopup_debug', 'true');
```

This will log detailed information to the browser console.

## Security Considerations

### Data Protection
- Email validation prevents injection attacks
- CSRF protection via Shopify tokens
- Rate limiting prevents spam submissions
- All user inputs are sanitized

### Privacy Compliance
- GDPR compliant consent mechanisms
- Configurable data retention policies
- Minimal cookie usage
- Privacy-compliant webhook handling

## Performance Optimizations

### Loading Strategy
- Lazy loading initialization
- Critical CSS inlined
- Non-critical assets loaded asynchronously
- Optimized bundle sizes

### Runtime Performance
- Efficient event handling
- Debounced scroll listeners
- Memory leak prevention
- GPU-accelerated animations

## Changelog

### Version 1.0.0
- ✅ Initial release with all core features
- ✅ Complete customization options
- ✅ Responsive design
- ✅ Accessibility compliance
- ✅ Performance optimizations
- ✅ Comprehensive testing suite

## Support

For technical support or feature requests:

1. Check this documentation first
2. Review test results and error logs
3. Check browser compatibility
4. Verify configuration settings

## License

This email popup system is designed for use with Shopify themes and follows Shopify's development guidelines and best practices.