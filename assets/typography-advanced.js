/**
 * Advanced Typography JavaScript
 * Handles dynamic typography features and ensures proper functionality
 */

(function() {
  'use strict';

  // Typography handler class
  class TypographyHandler {
    constructor() {
      this.init();
    }

    init() {
      // Initialize on DOM ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setup());
      } else {
        this.setup();
      }
    }

    setup() {
      this.applyLinkDecoration();
      this.initializeDropCaps();
      this.handleMobileTypography();
      this.initializeTextObserver();
      this.applyTypographyClasses();
    }

    // Apply link decoration based on settings
    applyLinkDecoration() {
      const linkDecoration = document.body.getAttribute('data-link-decoration');
      if (!linkDecoration) return;

      const links = document.querySelectorAll('a:not(.m-button):not(.m-button--link)');
      links.forEach(link => {
        link.setAttribute('data-link-decoration', linkDecoration);
      });
    }

    // Initialize drop caps
    initializeDropCaps() {
      const dropCapsEnabled = document.body.getAttribute('data-drop-caps') === 'true';
      if (!dropCapsEnabled) return;

      // Apply to article content
      const articleParagraphs = document.querySelectorAll('.article-content > p:first-of-type, .rte > p:first-of-type');
      articleParagraphs.forEach(p => {
        if (p.textContent.trim().length > 0) {
          p.setAttribute('data-drop-caps', 'true');
        }
      });
    }

    // Handle mobile typography scaling
    handleMobileTypography() {
      const isMobile = window.innerWidth <= 767;
      if (!isMobile) return;

      // Apply mobile-specific classes
      document.body.classList.add('is-mobile-typography');
    }

    // Initialize mutation observer for dynamic content
    initializeTextObserver() {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Reapply typography settings to new content
            this.applyLinkDecoration();
            this.applyTypographyClasses();
          }
        });
      });

      // Observe body for changes
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    // Apply typography utility classes based on context
    applyTypographyClasses() {
      // Apply text rendering optimization to body
      document.body.classList.add('text-rendering-optimize');

      // Handle responsive typography classes
      this.handleResponsiveTypography();

      // Apply font features where needed
      this.applyFontFeatures();
    }

    // Handle responsive typography
    handleResponsiveTypography() {
      const handleResize = () => {
        const width = window.innerWidth;
        
        // Remove all responsive classes
        document.body.classList.remove('typography-mobile', 'typography-tablet', 'typography-desktop');
        
        // Add appropriate class
        if (width <= 767) {
          document.body.classList.add('typography-mobile');
        } else if (width <= 1023) {
          document.body.classList.add('typography-tablet');
        } else {
          document.body.classList.add('typography-desktop');
        }
      };

      // Initial call
      handleResize();

      // Debounced resize handler
      let resizeTimeout;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(handleResize, 250);
      });
    }

    // Apply font features to specific elements
    applyFontFeatures() {
      // Apply tabular numbers to price elements
      const priceElements = document.querySelectorAll('.price, .m-price, [data-price]');
      priceElements.forEach(el => {
        el.classList.add('font-feature-tabular-nums');
      });

      // Apply ligatures to headings
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      headings.forEach(heading => {
        heading.classList.add('font-feature-ligatures');
      });
    }
  }

  // Typography utilities
  const TypographyUtils = {
    // Calculate optimal line length
    calculateLineLength(element) {
      const fontSize = parseFloat(window.getComputedStyle(element).fontSize);
      const optimalChars = 65; // Optimal characters per line
      const charWidth = fontSize * 0.5; // Approximate character width
      return optimalChars * charWidth;
    },

    // Apply optimal line length to containers
    applyOptimalLineLength(selector = '.rte, .article-content') {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        const maxWidth = this.calculateLineLength(el);
        el.style.maxWidth = `${maxWidth}px`;
        el.style.marginLeft = 'auto';
        el.style.marginRight = 'auto';
      });
    },

    // Enhance readability with hyphenation
    enableHyphenation(selector = '.rte p, .article-content p') {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        el.classList.add('hyphens-auto');
        el.setAttribute('lang', document.documentElement.lang || 'en');
      });
    },

    // Balance text in headings
    balanceHeadings() {
      if (!CSS.supports('text-wrap', 'balance')) return;
      
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      headings.forEach(heading => {
        heading.style.textWrap = 'balance';
      });
    }
  };

  // Initialize typography handler
  const typographyHandler = new TypographyHandler();

  // Export for global access if needed
  window.TypographyHandler = TypographyHandler;
  window.TypographyUtils = TypographyUtils;

  // Apply utilities on load
  document.addEventListener('DOMContentLoaded', () => {
    // Apply optimal line length for better readability
    TypographyUtils.applyOptimalLineLength();
    
    // Enable hyphenation for long text
    TypographyUtils.enableHyphenation();
    
    // Balance heading text
    TypographyUtils.balanceHeadings();
  });

  // Handle Shopify theme editor
  if (Shopify && Shopify.designMode) {
    document.addEventListener('shopify:section:load', () => {
      typographyHandler.setup();
      TypographyUtils.applyOptimalLineLength();
      TypographyUtils.balanceHeadings();
    });
  }

})();