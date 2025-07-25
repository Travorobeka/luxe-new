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
        button_inline: window.theme.settings.email_popup_button_inline,
        button_icon: window.theme.settings.email_popup_button_icon,
        button_custom_svg: window.theme.settings.email_popup_button_custom_svg,
        button_icon_only: window.theme.settings.email_popup_button_icon_only,
        button_icon_position: window.theme.settings.email_popup_button_icon_position,
        font_family: window.theme.settings.email_popup_font_family,
        heading_font_size: window.theme.settings.email_popup_heading_font_size,
        heading_font_weight: window.theme.settings.email_popup_heading_font_weight,
        heading_color: window.theme.settings.email_popup_heading_color,
        description_font_size: window.theme.settings.email_popup_description_font_size,
        description_font_weight: window.theme.settings.email_popup_description_font_weight,
        description_color: window.theme.settings.email_popup_description_color,
        thankyou_color: window.theme.settings.email_popup_thankyou_color,
        thankyou_font_size: window.theme.settings.email_popup_thankyou_font_size,
        thankyou_font_weight: window.theme.settings.email_popup_thankyou_font_weight,
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

  // Utility: check if mobile (phones only, not tablets/iPads)
  function isMobile() {
    const userAgent = navigator.userAgent;
    const width = window.innerWidth;
    
    // Mobile detection logic (production version)
    
    // Very simple and reliable approach:
    // 1. If it's explicitly a tablet/iPad -> desktop design
    // 2. If width is small (mobile phone size) AND not a tablet -> mobile design  
    // 3. Everything else -> desktop design
    
    const isKnownTablet = /iPad|Tablet|PlayBook|Silk|Kindle/i.test(userAgent) || 
                         (userAgent.includes('Android') && !userAgent.includes('Mobile'));
    
    if (isKnownTablet) {
      return false;
    }
    
    // For mobile detection, prioritize small screen size
    // Most phones are <= 428px width (iPhone 14 Pro Max is 428px)
    // But allow up to 600px to catch larger phones
    const isPhoneSize = width <= 600;
    
    // Return true for phone-sized screens, false for larger screens
    
    return isPhoneSize;
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

  // Icon rendering functions
  function getIconSVG(iconType, size = 20) {
    const icons = {
      arrow: `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-7-7l7 7-7 7"/>
              </svg>`,
      plus: `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
             </svg>`,
      send: `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
             </svg>`,
      chevron: `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>`,
      email: `<svg width="${size}" height="${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>`
    };
    return icons[iconType] || '';
  }

  function createButtonIcon(settings, size = 20) {
    const iconType = settings.button_icon || 'none';
    
    if (iconType === 'none') return '';
    
    if (iconType === 'custom' && settings.button_custom_svg) {
      return settings.button_custom_svg;
    }
    
    return getIconSVG(iconType, size);
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
      
      // Add slight delay to ensure mobile detection works correctly in preview
      setTimeout(() => {
        renderPopup();
        popupShown = true;
      }, 100);
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
    
    // Check mobile status at render time
    const isCurrentlyMobile = isMobile();
    
    // Modal container - mobile first approach
    const modal = document.createElement('div');
    modal.className = 'email-popup-modal ' + (settings.custom_class || '');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    
    // Device-specific responsive positioning
    if (isCurrentlyMobile) {
      // Mobile phones only: Bottom sheet style for touch optimization
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
      // Desktop, tablets, and iPads: Centered modal with enhanced sizing
      modal.style.position = 'fixed';
      modal.style.top = '50%';
      modal.style.left = '50%';
      modal.style.transform = 'translate(-50%, -50%)';
      modal.style.width = '100%';
      modal.style.minWidth = '400px';
      modal.style.maxWidth = '480px';
      modal.style.borderRadius = `${settings.border_radius || 12}px`;
      modal.style.padding = '2.5rem';
      
      // Enhanced desktop animation with bounce effect
      modal.style.opacity = '0';
      modal.style.transform = 'translate(-50%, -50%) scale(0.9)';
      setTimeout(() => {
        modal.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
        modal.style.opacity = '1';
        modal.style.transform = 'translate(-50%, -50%) scale(1)';
      }, 10);
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
      h.style.fontSize = `${settings.heading_font_size || 24}px`;
      h.style.fontWeight = settings.heading_font_weight || '700';
      h.style.color = settings.heading_color || settings.text_color || '#222';
      h.style.margin = '0 0 0.5em 0';
      h.style.lineHeight = '1.2';
      modal.appendChild(h);
    }
    // Description
    if (settings.description) {
      const desc = document.createElement('div');
      desc.className = 'email-popup-desc';
      desc.innerHTML = settings.description;
      desc.style.fontSize = `${settings.description_font_size || 16}px`;
      desc.style.fontWeight = settings.description_font_weight || '400';
      desc.style.color = settings.description_color || '#666';
      desc.style.marginBottom = '1em';
      desc.style.lineHeight = '1.4';
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
    
    // Check if inline layout is enabled
    const isInline = settings.button_inline;
    
    // Input group container for inline layout
    let inputGroup;
    if (isInline) {
      inputGroup = document.createElement('div');
      inputGroup.className = 'email-popup-input-group';
      inputGroup.style.position = 'relative';
      inputGroup.style.display = 'block';
      inputGroup.style.marginBottom = '0.8em';
      inputGroup.style.background = '#fff';
      inputGroup.style.border = '1px solid #ccc';
      inputGroup.style.borderRadius = '6px';
      inputGroup.style.overflow = 'hidden';
    }
    
    // Email input
    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.name = 'email';
    emailInput.placeholder = settings.email_placeholder || 'Enter your email';
    emailInput.required = true;
    emailInput.style.fontSize = '1em';
    emailInput.style.border = '1px solid #ccc';
    
    if (isInline) {
      // Inline layout: input takes most space, button is inside/adjacent
      emailInput.style.width = '100%';
      emailInput.style.padding = isMobile() ? '0.8em 3.5rem 0.8em 0.8em' : '0.8em 4.5rem 0.8em 1rem';
      emailInput.style.border = 'none';
      emailInput.style.borderRadius = '0';
      emailInput.style.outline = 'none';
      emailInput.style.background = 'transparent';
    } else {
      // Standard layout: full width input with bottom margin
      emailInput.style.width = '100%';
      emailInput.style.marginBottom = '0.8em';
      emailInput.style.padding = isMobile() ? '0.8em' : '0.8em 1rem';
      emailInput.style.borderRadius = '6px';
    }
    
    // Append input to form or input group
    if (isInline) {
      inputGroup.appendChild(emailInput);
      form.appendChild(inputGroup);
    } else {
      form.appendChild(emailInput);
    }
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
    // Submit button with advanced customization and icons
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'email-popup-submit';
    
    // Button styling variables
    const buttonStyle = settings.button_style || 'primary';
    const bgColor = settings.button_bg_color || '#007bff';
    const textColor = settings.button_text_color || '#ffffff';
    const borderColor = settings.button_border_color || bgColor;
    const borderWidth = settings.button_border_width || 1;
    const borderRadius = settings.button_border_radius || 6;
    const buttonSize = settings.button_size || 'medium';
    
    // Icon and text setup
    const hasIcon = settings.button_icon && settings.button_icon !== 'none';
    const iconOnly = settings.button_icon_only && hasIcon;
    const iconPosition = settings.button_icon_position || 'right';
    const buttonText = settings.submit_button || 'Subscribe';
    const displayText = settings.button_uppercase ? buttonText.toUpperCase() : buttonText;
    
    // Create button content with icon support
    if (hasIcon && !iconOnly) {
      // Button with text and icon
      const iconSVG = createButtonIcon(settings, isMobile() ? 16 : 18);
      if (iconPosition === 'left') {
        submitBtn.innerHTML = `${iconSVG}<span style="margin-left: 0.5rem;">${displayText}</span>`;
      } else {
        submitBtn.innerHTML = `<span style="margin-right: 0.5rem;">${displayText}</span>${iconSVG}`;
      }
      submitBtn.style.display = 'flex';
      submitBtn.style.alignItems = 'center';
      submitBtn.style.justifyContent = 'center';
    } else if (iconOnly) {
      // Icon only button
      submitBtn.innerHTML = createButtonIcon(settings, isMobile() ? 20 : 22);
      submitBtn.style.display = 'flex';
      submitBtn.style.alignItems = 'center';
      submitBtn.style.justifyContent = 'center';
      submitBtn.setAttribute('aria-label', displayText);
    } else {
      // Text only button
      submitBtn.innerText = displayText;
    }
    
    // Inline vs standard layout positioning
    if (isInline) {
      // Inline button positioning
      submitBtn.style.position = 'absolute';
      submitBtn.style.right = '0.2rem';
      submitBtn.style.top = '50%';
      submitBtn.style.transform = 'translateY(-50%)';
      submitBtn.style.height = 'calc(100% - 0.4rem)';
      submitBtn.style.width = 'auto';
      submitBtn.style.zIndex = '2';
      submitBtn.style.minWidth = isMobile() ? '2.8rem' : '3.5rem';
      
      // Inline button sizing (smaller and better aligned)
      if (iconOnly) {
        submitBtn.style.padding = isMobile() ? '0.5rem' : '0.6rem';
        submitBtn.style.minWidth = isMobile() ? '2.4rem' : '3rem';
      } else {
        submitBtn.style.padding = isMobile() ? '0.4rem 0.6rem' : '0.5rem 0.8rem';
        submitBtn.style.fontSize = isMobile() ? '14px' : '15px';
      }
    } else {
      // Standard layout sizing
      if (buttonSize === 'small') {
        submitBtn.style.padding = iconOnly ? '0.5rem' : '0.5rem 1rem';
      } else if (buttonSize === 'large') {
        submitBtn.style.padding = iconOnly ? '1rem' : '1rem 1.5rem';
      } else {
        submitBtn.style.padding = iconOnly ? '0.75rem' : '0.75rem 1.25rem';
      }
      
      // Full width option for standard layout
      if (settings.button_full_width !== false && !iconOnly) {
        submitBtn.style.width = '100%';
      }
    }
    
    // Apply button style
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
      if (!hasIcon) submitBtn.style.textDecoration = 'underline';
    }
    
    // Common button styles
    submitBtn.style.borderRadius = `${borderRadius}px`;
    submitBtn.style.fontSize = `${settings.button_font_size || 16}px`;
    submitBtn.style.fontWeight = settings.button_font_weight || 500;
    submitBtn.style.cursor = 'pointer';
    submitBtn.style.transition = 'all 0.2s ease';
    
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
    
    // Append button to form or input group
    if (isInline) {
      inputGroup.appendChild(submitBtn);
    } else {
      form.appendChild(submitBtn);
    }
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
      tyMsg.style.fontSize = `${settings.thankyou_font_size || 18}px`;
      tyMsg.style.fontWeight = settings.thankyou_font_weight || '600';
      tyMsg.style.color = settings.thankyou_color || '#28a745';
      tyMsg.style.marginBottom = '0.5em';
      tyMsg.style.lineHeight = '1.3';
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