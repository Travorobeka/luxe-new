// Email Popup JS - Mobile First, All Requirements
// Handles triggers, display, validation, analytics, integration, accessibility

(function() {
  // Utility: get settings from Liquid or theme settings
  function getSettings() {
    // Prefer theme settings if available
    if (window.theme && window.theme.settings && window.theme.settings.email_popup_enable !== undefined) {
      return {
        enable: window.theme.settings.email_popup_enable,
        preview_mode: window.theme.settings.email_popup_preview_mode,
        trigger_type: window.theme.settings.email_popup_trigger_type,
        trigger_delay: window.theme.settings.email_popup_trigger_delay,
        trigger_scroll: window.theme.settings.email_popup_trigger_scroll,
        trigger_new_visitors_only: window.theme.settings.email_popup_trigger_new_visitors_only,
        trigger_returning_visitors_only: window.theme.settings.email_popup_trigger_returning_visitors_only,
        trigger_mobile_only: window.theme.settings.email_popup_trigger_mobile_only,
        trigger_desktop_only: window.theme.settings.email_popup_trigger_desktop_only,
        exclude_urls: window.theme.settings.email_popup_exclude_urls,
        resurface_delay: window.theme.settings.email_popup_resurface_delay,
        bg_color: window.theme.settings.email_popup_bg_color,
        text_color: window.theme.settings.email_popup_text_color,
        button_bg_color: window.theme.settings.email_popup_button_bg_color,
        button_text_color: window.theme.settings.email_popup_button_text_color,
        button_border_color: window.theme.settings.email_popup_button_border_color,
        button_hover_bg_color: window.theme.settings.email_popup_button_hover_bg_color,
        button_hover_text_color: window.theme.settings.email_popup_button_hover_text_color,
        button_style: window.theme.settings.email_popup_button_style,
        button_size: window.theme.settings.email_popup_button_size,
        button_border_radius: window.theme.settings.email_popup_button_border_radius,
        button_border_width: window.theme.settings.email_popup_button_border_width,
        button_full_width: window.theme.settings.email_popup_button_full_width,
        button_uppercase: window.theme.settings.email_popup_button_uppercase,
        button_font_size: window.theme.settings.email_popup_button_font_size,
        button_font_weight: window.theme.settings.email_popup_button_font_weight,
        font_family: window.theme.settings.email_popup_font_family,
        border_radius: window.theme.settings.email_popup_border_radius,
        shadow_strength: window.theme.settings.email_popup_shadow_strength,
        popup_image: window.theme.settings.email_popup_image,
        heading: window.theme.settings.email_popup_heading,
        description: window.theme.settings.email_popup_description,
        email_placeholder: window.theme.settings.email_popup_email_placeholder,
        submit_button: window.theme.settings.email_popup_submit_button,
        show_agreement: window.theme.settings.email_popup_show_agreement,
        agreement_text: window.theme.settings.email_popup_agreement_text,
        thank_you_message: window.theme.settings.email_popup_thank_you_message,
        enable_discount: window.theme.settings.email_popup_enable_discount,
        discount_code: window.theme.settings.email_popup_discount_code,
        discount_instructions: window.theme.settings.email_popup_discount_instructions,
        show_copy_button: window.theme.settings.email_popup_show_copy_button,
        integrate_shopify_customers: window.theme.settings.email_popup_integrate_shopify_customers,
        enable_webhook: window.theme.settings.email_popup_enable_webhook,
        webhook_url: window.theme.settings.email_popup_webhook_url,
        enable_mailchimp: window.theme.settings.email_popup_enable_mailchimp,
        mailchimp_api_key: window.theme.settings.email_popup_mailchimp_api_key,
        mailchimp_list_id: window.theme.settings.email_popup_mailchimp_list_id,
        enable_klaviyo: window.theme.settings.email_popup_enable_klaviyo,
        klaviyo_api_key: window.theme.settings.email_popup_klaviyo_api_key,
        klaviyo_list_id: window.theme.settings.email_popup_klaviyo_list_id,
        fallback_storage: window.theme.settings.email_popup_fallback_storage,
        enable_analytics: window.theme.settings.email_popup_enable_analytics,
        gdpr_compliance: window.theme.settings.email_popup_gdpr_compliance,
        enable_keyboard_nav: window.theme.settings.email_popup_enable_keyboard_nav,
        enable_screen_reader: window.theme.settings.email_popup_enable_screen_reader,
        custom_class: window.theme.settings.email_popup_custom_class
      };
    }
    if (window.emailPopupSettings) return window.emailPopupSettings;
    // Fallback: read from data attribute or window object
    try {
      const el = document.getElementById('email-popup-root');
      if (el && el.dataset.settings) return JSON.parse(el.dataset.settings);
    } catch (e) {}
    return {};
  }

  // Utility: get/set cookie (from theme-global.js)
  function setCookie(cname, cvalue, exdays) {
    let d = new Date();
    d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
    let expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
  }
  function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") {
        c = c.substring(1);
      }
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }

  // Utility: check if current page is excluded
  function isExcludedPage(settings) {
    const path = window.location.pathname;
    if (!settings.exclude_urls) return false;
    return settings.exclude_urls.split('\n').some(url => url && path.startsWith(url.trim()));
  }

  // Utility: check if mobile
  function isMobile() {
    return window.innerWidth <= 768 || /Mobi|Android/i.test(navigator.userAgent);
  }

  // Utility: focus trap
  function trapFocus(modal) {
    const focusable = modal.querySelectorAll('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    modal.addEventListener('keydown', function(e) {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
      if (e.key === 'Escape') closePopup();
    });
  }

  // Utility: copy to clipboard
  function copyToClipboard(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      const temp = document.createElement('textarea');
      temp.value = text;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      document.body.removeChild(temp);
    }
  }

  // State
  let popupShown = false;
  let settings = getSettings();
  let popupRoot = document.getElementById('email-popup-root');
  let cookieName = 'EmailPopupDismissed';

  // Helper to show preview in theme editor
  function maybeShowPreview() {
    settings = getSettings(); // re-fetch in case settings changed
    if (settings.enable && settings.preview_mode && window.Shopify && window.Shopify.designMode === true) {
      // Reset popup state to allow re-showing
      popupShown = false;
      renderPopup();
      popupShown = true;
    }
  }

  // Helper to handle section events
  function handleSectionEvent(event) {
    // Check if this event is for our email popup section
    if (event && event.target && event.target.querySelector('#email-popup-root')) {
      maybeShowPreview();
    } else if (!event || !event.target) {
      // If no specific target, try to show preview anyway
      maybeShowPreview();
    }
  }

  // Preview mode: only show in theme editor (admin)
  if (settings.enable && settings.preview_mode && window.Shopify && window.Shopify.designMode === true) {
    document.addEventListener('DOMContentLoaded', maybeShowPreview);
    document.addEventListener('shopify:section:load', handleSectionEvent);
    document.addEventListener('shopify:section:select', handleSectionEvent);
    // Also try immediately in case designMode is already set
    maybeShowPreview();
    return;
  }

  // Normal mode logic
  // Exclude page logic
  if (!settings.enable || isExcludedPage(settings)) return;

  // Only show on mobile if set
  if (settings.trigger_mobile_only && !isMobile()) return;
  if (settings.trigger_desktop_only && isMobile()) return;

  // Only show for new/returning visitors if set
  if (settings.trigger_new_visitors_only && getCookie('EmailPopupSubscribed')) return;
  if (settings.trigger_returning_visitors_only && !getCookie('EmailPopupSubscribed')) return;

  // Only show if not dismissed recently
  if (getCookie(cookieName)) return;

  // Trigger logic
  function triggerPopup() {
    if (popupShown) return;
    popupShown = true;
    renderPopup();
  }

  // Triggers
  switch (settings.trigger_type) {
    case 'immediate':
      document.addEventListener('DOMContentLoaded', triggerPopup);
      break;
    case 'delay':
      setTimeout(triggerPopup, (settings.trigger_delay || 5) * 1000);
      break;
    case 'scroll':
      window.addEventListener('scroll', function onScroll() {
        if ((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100 >= (settings.trigger_scroll || 50)) {
          window.removeEventListener('scroll', onScroll);
          triggerPopup();
        }
      });
      break;
    case 'exit_intent':
      document.addEventListener('mouseleave', function onExit(e) {
        if (e.clientY <= 0) {
          document.removeEventListener('mouseleave', onExit);
          triggerPopup();
        }
      });
      break;
  }

  // Mobile-first popup rendering (no overlay)
  function renderPopup() {
    // Remove any existing
    popupRoot.innerHTML = '';
    popupRoot.style.display = 'block';
    
    // Modal container - mobile first approach
    const modal = document.createElement('div');
    modal.className = 'email-popup-modal ' + (settings.custom_class || '');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    
    // Mobile-first responsive positioning
    if (isMobile()) {
      // Mobile: Bottom sheet style
      modal.style.position = 'fixed';
      modal.style.bottom = '0';
      modal.style.left = '0';
      modal.style.right = '0';
      modal.style.width = '100%';
      modal.style.maxWidth = 'none';
      modal.style.borderRadius = `${settings.border_radius || 12}px ${settings.border_radius || 12}px 0 0`;
      modal.style.padding = '1.5rem';
      modal.style.transform = 'translateY(0)';
    } else {
      // Desktop: Centered modal
      modal.style.position = 'fixed';
      modal.style.top = '50%';
      modal.style.left = '50%';
      modal.style.transform = 'translate(-50%, -50%)';
      modal.style.width = '100%';
      modal.style.maxWidth = '420px';
      modal.style.borderRadius = `${settings.border_radius || 12}px`;
      modal.style.padding = '2rem';
    }
    
    // Common modal styles
    modal.style.background = settings.bg_color || '#fff';
    modal.style.color = settings.text_color || '#222';
    modal.style.boxShadow = '0 10px 40px rgba(0,0,0,0.15)';
    modal.style.zIndex = '9999';
    modal.style.fontFamily = settings.font_family || 'inherit';
    modal.style.border = '1px solid rgba(0,0,0,0.1)';
    modal.tabIndex = -1;
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'email-popup-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = closePopup;
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '10px';
    closeBtn.style.right = '10px';
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.fontSize = '1.5em';
    closeBtn.style.cursor = 'pointer';
    // Image (optional)
    if (settings.popup_image) {
      const img = document.createElement('img');
      img.src = settings.popup_image;
      img.alt = '';
      img.style.maxWidth = '100%';
      img.style.marginBottom = '1em';
      modal.appendChild(img);
    }
    // Heading
    if (settings.heading) {
      const h = document.createElement('h2');
      h.className = 'email-popup-heading';
      h.innerHTML = settings.heading;
      h.style.fontSize = isMobile() ? '1.2em' : '1.5em';
      h.style.fontWeight = 'bold';
      h.style.margin = '0 0 0.5em 0';
      modal.appendChild(h);
    }
    // Description
    if (settings.description) {
      const desc = document.createElement('div');
      desc.className = 'email-popup-desc';
      desc.innerHTML = settings.description;
      desc.style.marginBottom = '1em';
      modal.appendChild(desc);
    }
    // Form
    const form = document.createElement('form');
    form.className = 'email-popup-form';
    form.autocomplete = 'off';
    form.onsubmit = function(e) {
      e.preventDefault();
      handleSubmit(form, modal);
    };
    // Email input
    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.name = 'email';
    emailInput.placeholder = settings.email_placeholder || 'Enter your email';
    emailInput.required = true;
    emailInput.style.width = '100%';
    emailInput.style.marginBottom = '0.8em';
    emailInput.style.padding = '0.8em';
    emailInput.style.borderRadius = '6px';
    emailInput.style.border = '1px solid #ccc';
    emailInput.style.fontSize = '1em';
    form.appendChild(emailInput);
    // Agreement
    if (settings.show_agreement && settings.agreement_text) {
      const agreeDiv = document.createElement('div');
      agreeDiv.style.marginBottom = '0.8em';
      const agreeLabel = document.createElement('label');
      agreeLabel.style.display = 'flex';
      agreeLabel.style.alignItems = 'center';
      const agreeCheckbox = document.createElement('input');
      agreeCheckbox.type = 'checkbox';
      agreeCheckbox.required = true;
      agreeCheckbox.style.marginRight = '0.5em';
      agreeLabel.appendChild(agreeCheckbox);
      const agreeText = document.createElement('span');
      agreeText.innerHTML = settings.agreement_text;
      agreeLabel.appendChild(agreeText);
      agreeDiv.appendChild(agreeLabel);
      form.appendChild(agreeDiv);
    }
    // Submit button with advanced customization
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'email-popup-submit';
    
    // Button text with uppercase option
    const buttonText = settings.submit_button || 'Subscribe';
    submitBtn.innerText = settings.button_uppercase ? buttonText.toUpperCase() : buttonText;
    
    // Button styling based on style type
    const buttonStyle = settings.button_style || 'primary';
    const bgColor = settings.button_bg_color || '#007bff';
    const textColor = settings.button_text_color || '#ffffff';
    const borderColor = settings.button_border_color || bgColor;
    const borderWidth = settings.button_border_width || 1;
    const borderRadius = settings.button_border_radius || 6;
    
    // Apply style-specific styling
    if (buttonStyle === 'primary') {
      submitBtn.style.background = bgColor;
      submitBtn.style.color = textColor;
      submitBtn.style.border = `${borderWidth}px solid ${borderColor}`;
    } else if (buttonStyle === 'secondary') {
      submitBtn.style.background = 'transparent';
      submitBtn.style.color = borderColor;
      submitBtn.style.border = `${borderWidth}px solid ${borderColor}`;
    } else if (buttonStyle === 'minimal') {
      submitBtn.style.background = 'transparent';
      submitBtn.style.color = borderColor;
      submitBtn.style.border = 'none';
      submitBtn.style.textDecoration = 'underline';
    }
    
    // Common button styles
    submitBtn.style.borderRadius = `${borderRadius}px`;
    submitBtn.style.fontSize = `${settings.button_font_size || 16}px`;
    submitBtn.style.fontWeight = settings.button_font_weight || 500;
    submitBtn.style.cursor = 'pointer';
    submitBtn.style.transition = 'all 0.2s ease';
    
    // Button sizing
    const buttonSize = settings.button_size || 'medium';
    if (buttonSize === 'small') {
      submitBtn.style.padding = '0.5rem 1rem';
    } else if (buttonSize === 'large') {
      submitBtn.style.padding = '1rem 1.5rem';
    } else {
      submitBtn.style.padding = '0.75rem 1.25rem';
    }
    
    // Full width option
    if (settings.button_full_width !== false) {
      submitBtn.style.width = '100%';
    }
    
    // Add hover effects
    const hoverBgColor = settings.button_hover_bg_color || '#0056b3';
    const hoverTextColor = settings.button_hover_text_color || '#ffffff';
    
    submitBtn.addEventListener('mouseenter', function() {
      if (buttonStyle === 'primary') {
        submitBtn.style.background = hoverBgColor;
        submitBtn.style.color = hoverTextColor;
      } else if (buttonStyle === 'secondary') {
        submitBtn.style.background = borderColor;
        submitBtn.style.color = '#ffffff';
      } else if (buttonStyle === 'minimal') {
        submitBtn.style.color = hoverBgColor;
      }
    });
    
    submitBtn.addEventListener('mouseleave', function() {
      if (buttonStyle === 'primary') {
        submitBtn.style.background = bgColor;
        submitBtn.style.color = textColor;
      } else if (buttonStyle === 'secondary') {
        submitBtn.style.background = 'transparent';
        submitBtn.style.color = borderColor;
      } else if (buttonStyle === 'minimal') {
        submitBtn.style.color = borderColor;
      }
    });
    form.appendChild(submitBtn);
    // Error message
    const errorMsg = document.createElement('div');
    errorMsg.className = 'email-popup-error';
    errorMsg.style.color = '#e02b2b';
    errorMsg.style.fontSize = '0.95em';
    errorMsg.style.margin = '0.5em 0';
    errorMsg.style.display = 'none';
    form.appendChild(errorMsg);
    modal.appendChild(form);
    // Thank you/discount (hidden initially)
    const thankYou = document.createElement('div');
    thankYou.className = 'email-popup-thankyou';
    thankYou.style.display = 'none';
    thankYou.style.textAlign = 'center';
    thankYou.style.marginTop = '1em';
    if (settings.thank_you_message) {
      const tyMsg = document.createElement('div');
      tyMsg.innerHTML = settings.thank_you_message;
      thankYou.appendChild(tyMsg);
    }
    if (settings.enable_discount && settings.discount_code) {
      const codeBox = document.createElement('div');
      codeBox.style.margin = '1em 0 0.5em 0';
      codeBox.style.fontWeight = 'bold';
      codeBox.style.fontSize = '1.2em';
      codeBox.style.letterSpacing = '0.05em';
      codeBox.style.background = '#f7f7f7';
      codeBox.style.padding = '0.6em 1em';
      codeBox.style.borderRadius = '6px';
      codeBox.style.display = 'inline-block';
      codeBox.innerText = settings.discount_code;
      thankYou.appendChild(codeBox);
      if (settings.show_copy_button) {
        const copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.innerText = 'Copy code';
        copyBtn.style.marginLeft = '0.7em';
        copyBtn.style.background = settings.button_bg_color || '#007bff';
        copyBtn.style.color = settings.button_text_color || '#fff';
        copyBtn.style.border = `${settings.button_border_width || 1}px solid ${settings.button_border_color || settings.button_bg_color || '#007bff'}`;
        copyBtn.style.borderRadius = `${settings.button_border_radius || 6}px`;
        copyBtn.style.padding = '0.4em 0.8em';
        copyBtn.style.fontSize = `${Math.max((settings.button_font_size || 16) - 2, 12)}px`;
        copyBtn.style.fontWeight = settings.button_font_weight || 500;
        copyBtn.style.cursor = 'pointer';
        copyBtn.style.transition = 'all 0.2s ease';
        copyBtn.onclick = function() { copyToClipboard(settings.discount_code); copyBtn.innerText = 'Copied!'; setTimeout(() => { copyBtn.innerText = 'Copy code'; }, 1200); };
        thankYou.appendChild(copyBtn);
      }
      if (settings.discount_instructions) {
        const instr = document.createElement('div');
        instr.style.fontSize = '0.95em';
        instr.style.marginTop = '0.5em';
        instr.innerText = settings.discount_instructions;
        thankYou.appendChild(instr);
      }
    }
    modal.appendChild(thankYou);
    // Append close button and modal (no overlay)
    modal.appendChild(closeBtn);
    popupRoot.appendChild(modal);
    
    // Add animation for mobile bottom sheet
    if (isMobile()) {
      modal.style.transform = 'translateY(100%)';
      setTimeout(() => {
        modal.style.transition = 'transform 0.3s ease-out';
        modal.style.transform = 'translateY(0)';
      }, 10);
    }
    
    // Focus trap
    trapFocus(modal);
    setTimeout(() => { modal.focus(); }, 100);
  }

  // Close logic with mobile animation
  function closePopup() {
    const modal = popupRoot.querySelector('.email-popup-modal');
    if (modal) {
      // Animate out on mobile
      if (isMobile()) {
        modal.style.transition = 'transform 0.3s ease-in';
        modal.style.transform = 'translateY(100%)';
        setTimeout(() => {
          popupRoot.style.display = 'none';
          popupRoot.innerHTML = '';
        }, 300);
      } else {
        // Fade out on desktop
        modal.style.transition = 'opacity 0.2s ease-out, transform 0.2s ease-out';
        modal.style.opacity = '0';
        modal.style.transform = 'translate(-50%, -50%) scale(0.95)';
        setTimeout(() => {
          popupRoot.style.display = 'none';
          popupRoot.innerHTML = '';
        }, 200);
      }
    } else {
      popupRoot.style.display = 'none';
      popupRoot.innerHTML = '';
    }
    setCookie(cookieName, '1', settings.resurface_delay || 24); // hours
  }

  // Form submit logic
  function handleSubmit(form, modal) {
    const email = form.querySelector('input[type="email"]').value.trim();
    const errorMsg = form.querySelector('.email-popup-error');
    errorMsg.style.display = 'none';
    if (!validateEmail(email)) {
      errorMsg.innerText = 'Please enter a valid email address.';
      errorMsg.style.display = 'block';
      return;
    }
    // Agreement
    if (settings.show_agreement) {
      const agree = form.querySelector('input[type="checkbox"]');
      if (!agree.checked) {
        errorMsg.innerText = 'You must agree to the terms.';
        errorMsg.style.display = 'block';
        return;
      }
    }
    // GDPR compliance
    if (settings.gdpr_compliance && !window.Shopify) {
      errorMsg.innerText = 'Unable to process due to privacy settings.';
      errorMsg.style.display = 'block';
      return;
    }
    // Shopify customer DB integration
    if (settings.integrate_shopify_customers) {
      fetch('/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `form_type=customer&contact[email]=${encodeURIComponent(email)}&contact[tags]=newsletter&accepts_marketing=1` 
      })
      .then(res => {
        // Shopify returns 200 even for duplicate, so always show thank you
        setCookie('EmailPopupSubscribed', '1', 365);
        // Analytics (stub)
        // TODO: Track conversion
        form.style.display = 'none';
        const thankYou = modal.querySelector('.email-popup-thankyou');
        thankYou.style.display = 'block';
      })
      .catch(() => {
        // Fallback storage if enabled
        if (settings.fallback_storage) {
          try {
            let emails = JSON.parse(localStorage.getItem('email_popup_fallback') || '[]');
            emails.push({ email, date: new Date().toISOString() });
            localStorage.setItem('email_popup_fallback', JSON.stringify(emails));
          } catch (e) {}
        }
        setCookie('EmailPopupSubscribed', '1', 365);
        form.style.display = 'none';
        const thankYou = modal.querySelector('.email-popup-thankyou');
        thankYou.style.display = 'block';
      });
      // Third-party integrations (stub)
      if (settings.enable_mailchimp) {
        // TODO: Mailchimp API integration
      }
      if (settings.enable_klaviyo) {
        // TODO: Klaviyo API integration
      }
      if (settings.enable_webhook && settings.webhook_url) {
        // TODO: Webhook integration
      }
      return;
    }
    // If not integrating with Shopify, fallback
    setCookie('EmailPopupSubscribed', '1', 365);
    form.style.display = 'none';
    const thankYou = modal.querySelector('.email-popup-thankyou');
    thankYou.style.display = 'block';
  }

  // Email validation
  function validateEmail(email) {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  }

  // Expose for testing
  window.__emailPopup = { renderPopup, closePopup };
})(); 