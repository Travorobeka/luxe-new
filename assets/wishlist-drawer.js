class MWishlistDrawer extends HTMLElement {
  constructor() {
    super();
    this.isLoaded = false;
    this.isInitialized = false;
  }

  get wishlistDrawerInner() {
    return this.querySelector(".m-wishlist-drawer__inner");
  }

  get wishlistDrawerCloseIcon() {
    return this.querySelector(".m-wishlist-drawer__close");
  }

  get wishlistItemsContainer() {
    return this.querySelector("#wishlist-drawer-items");
  }

  get wishlistEmptyState() {
    return this.querySelector(".m-wishlist-drawer__empty");
  }

  get wishlistLoadingState() {
    return this.querySelector(".m-wishlist-drawer__loading");
  }

  connectedCallback() {
    // Delay initialization to ensure DOM is ready
    setTimeout(() => {
      this.setHeaderWishlistIconAccessibility();
      this.setupCloseButton();
      this.isInitialized = true;
    }, 100);
    
    this.addEventListener("click", (event) => {
      // Close if clicking outside the drawer inner content
      if (!event.target.closest(".m-wishlist-drawer__inner")) {
        this.close();
      }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.classList.contains('m-wishlist-drawer--active')) {
        this.close();
      }
    });

    // Listen for storage changes to sync with main wishlist
    window.addEventListener('storage', (e) => {
      if (e.key === 'm-wishlist-products' && this.isLoaded) {
        console.log('Wishlist storage updated, refreshing drawer...');
        this.isLoaded = false; // Force reload
        if (this.classList.contains('m-wishlist-drawer--active')) {
          this.loadWishlistItems();
        }
      }
    });
  }

  setupCloseButton() {
    const closeButton = this.wishlistDrawerCloseIcon;
    if (closeButton) {
      const handleCloseEvent = (event) => {
        event.preventDefault();
        event.stopPropagation();
        console.log('Close button clicked');
        this.close();
      };

      closeButton.addEventListener("click", handleCloseEvent);
      closeButton.addEventListener("touchend", handleCloseEvent);
      
      // Ensure close button is properly styled for touch
      closeButton.style.cursor = 'pointer';
      closeButton.style.touchAction = 'manipulation';
      closeButton.style.userSelect = 'none';
      closeButton.style.webkitUserSelect = 'none';
      closeButton.style.webkitTapHighlightColor = 'transparent';
    }
  }

  setHeaderWishlistIconAccessibility() {
    const wishlistTriggers = document.querySelectorAll("[data-open-wishlist-drawer]");
    console.log('Found wishlist triggers:', wishlistTriggers.length);
    
    wishlistTriggers.forEach((trigger) => {
      trigger.setAttribute("role", "button");
      trigger.setAttribute("aria-haspopup", "dialog");
      trigger.setAttribute("aria-expanded", "false");
      trigger.setAttribute("aria-controls", "MinimogWishlistDrawer");
      
      // Handle both click and touch events for mobile
      const handleTriggerEvent = (event) => {
        event.preventDefault();
        event.stopPropagation();
        console.log('Wishlist trigger activated');
        this.open(trigger);
      };
      
      trigger.addEventListener("click", handleTriggerEvent);
      trigger.addEventListener("touchend", handleTriggerEvent);
      
      // Ensure proper cursor and touch styles
      trigger.style.cursor = 'pointer';
      trigger.style.touchAction = 'manipulation';
      trigger.style.userSelect = 'none';
      trigger.style.webkitUserSelect = 'none';
      trigger.style.webkitTapHighlightColor = 'transparent';
    });
  }

  open(triggeredBy) {
    console.log('Opening wishlist drawer');
    
    if (triggeredBy) {
      this.setActiveElement(triggeredBy);
      triggeredBy.setAttribute("aria-expanded", "true");
    }
    this.classList.add("m-wishlist-drawer--active");
    this.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("prevent-scroll");
    
    // Load wishlist items if not already loaded
    if (!this.isLoaded) {
      this.loadWishlistItems();
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.style.setProperty("--m-bg-opacity", "0.5");
        this.style.setProperty("--translate-x", "0");
        
        // Focus management
        this.trapFocus();
        if (this.wishlistDrawerCloseIcon) {
          this.wishlistDrawerCloseIcon.focus();
        }
      });
    });
  }

  close() {
    this.style.setProperty("--m-bg-opacity", "0");
    this.style.setProperty("--translate-x", "100%");
    this.setAttribute("aria-hidden", "true");
    
    // Update trigger aria-expanded
    if (this.activeElement) {
      this.activeElement.setAttribute("aria-expanded", "false");
    }
    
    setTimeout(() => {
      this.classList.remove("m-wishlist-drawer--active");
      document.documentElement.classList.remove("prevent-scroll");
      
      // Return focus to trigger element
      if (this.activeElement) {
        this.activeElement.focus();
      }
      
      this.removeFocusTrap();
    }, 300);
  }

  setActiveElement(element) {
    this.activeElement = element;
  }

  loadWishlistItems() {
    this.isLoaded = true;
    this.wishlistLoadingState.style.display = 'block';
    this.wishlistEmptyState.classList.add('m:hidden');

    // Get wishlist from localStorage using same storage key as main wishlist system
    let wishlistItems = [];
    try {
      const stored = localStorage.getItem('m-wishlist-products');
      if (stored) {
        wishlistItems = JSON.parse(stored);
      }
      
      // Migration: Check for old storage formats and migrate if needed
      if (wishlistItems.length === 0) {
        const oldStored = localStorage.getItem('minimog-wishlist') || localStorage.getItem('wishlist');
        if (oldStored) {
          const oldItems = JSON.parse(oldStored);
          // Convert product IDs to handles by fetching product data
          this.migrateOldWishlistData(oldItems);
          return;
        }
      }
    } catch (e) {
      console.warn('Error loading wishlist:', e);
    }

    if (wishlistItems.length === 0) {
      this.showEmptyState();
      return;
    }

    // Fetch product data for wishlist items (handles)
    this.fetchWishlistProducts(wishlistItems);
  }

  async fetchWishlistProducts(productHandles) {
    try {
      const productPromises = productHandles.map(handle => 
        fetch(`/products/${handle}.js`)
          .then(response => response.json())
          .catch(() => null)
      );

      const products = await Promise.all(productPromises);
      const validProducts = products.filter(product => product !== null);

      if (validProducts.length === 0) {
        this.showEmptyState();
        return;
      }

      this.renderWishlistItems(validProducts);
    } catch (error) {
      console.error('Error fetching wishlist products:', error);
      this.showEmptyState();
    }
  }

  renderWishlistItems(products) {
    this.wishlistLoadingState.style.display = 'none';
    
    const itemsHTML = products.map(product => this.createWishlistItemHTML(product)).join('');
    this.wishlistItemsContainer.innerHTML = itemsHTML;

    // Add remove functionality
    this.addRemoveListeners();
  }

  createWishlistItemHTML(product) {
    const variant = product.variants[0];
    const image = product.featured_image || product.images[0];
    const price = this.formatMoney(variant.price);
    const comparePrice = variant.compare_at_price ? this.formatMoney(variant.compare_at_price) : null;

    return `
      <div class="m-wishlist-drawer__item" data-product-handle="${product.handle}" role="listitem">
        <div class="m-wishlist-drawer__item-content">
          <div class="m-wishlist-drawer__item-image">
            <a href="${product.url}" class="m-wishlist-drawer__item-link" aria-label="View ${product.title}">
              <img src="${image}" alt="${product.title}" class="m-wishlist-drawer__product-image" loading="lazy">
            </a>
          </div>
          <div class="m-wishlist-drawer__item-details">
            <div class="m-wishlist-drawer__item-header">
              <div class="m-wishlist-drawer__item-info">
                <h4 class="m-wishlist-drawer__product-title">
                  <a href="${product.url}" class="m-wishlist-drawer__product-link">${product.title}</a>
                </h4>
                <div class="m-wishlist-drawer__price-container">
                  ${comparePrice ? `<span class="m-wishlist-drawer__compare-price">${comparePrice}</span>` : ''}
                  <span class="m-wishlist-drawer__current-price">${price}</span>
                </div>
              </div>
              <button 
                class="m-wishlist-remove-btn"
                data-product-handle="${product.handle}"
                aria-label="Remove ${product.title} from wishlist"
                title="Remove from wishlist"
                type="button"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div class="m-wishlist-drawer__item-actions">
              <button 
                class="m-button m-button--small m-button--secondary m-wishlist-drawer__add-to-cart"
                onclick="this.closest('.m-wishlist-drawer__item').querySelector('form').submit()"
                aria-label="Add ${product.title} to cart"
                type="button"
              >
                Add to Cart
              </button>
              <form action="/cart/add" method="post" enctype="multipart/form-data" class="m:hidden" aria-hidden="true">
                <input type="hidden" name="id" value="${variant.id}">
                <input type="hidden" name="quantity" value="1">
              </form>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  addRemoveListeners() {
    const removeButtons = this.querySelectorAll('.m-wishlist-remove-btn');
    removeButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const productHandle = button.dataset.productHandle;
        this.removeFromWishlist(productHandle);
      });
    });
  }

  removeFromWishlist(productHandle) {
    try {
      // Remove from localStorage using the same storage key as main wishlist
      let wishlistItems = [];
      const stored = localStorage.getItem('m-wishlist-products');
      if (stored) {
        wishlistItems = JSON.parse(stored);
      }
      
      wishlistItems = wishlistItems.filter(handle => handle !== productHandle);
      localStorage.setItem('m-wishlist-products', JSON.stringify(wishlistItems));

      // Remove from DOM
      const itemElement = this.querySelector(`[data-product-handle="${productHandle}"]`);
      if (itemElement) {
        itemElement.remove();
      }

      // Check if empty
      const remainingItems = this.querySelectorAll('.m-wishlist-drawer__item');
      if (remainingItems.length === 0) {
        this.showEmptyState();
      }

      // Update wishlist counter and sync with main wishlist system
      this.updateWishlistCounter();
      this.syncWithMainWishlist(productHandle, 'remove');

    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  }

  showEmptyState() {
    this.wishlistLoadingState.style.display = 'none';
    this.wishlistItemsContainer.innerHTML = '';
    this.wishlistEmptyState.classList.remove('m:hidden');
  }

  addToWishlist(productHandle) {
    try {
      let wishlistItems = [];
      const stored = localStorage.getItem('m-wishlist-products');
      if (stored) {
        wishlistItems = JSON.parse(stored);
      }
      
      if (!wishlistItems.includes(productHandle)) {
        wishlistItems.push(productHandle);
        localStorage.setItem('m-wishlist-products', JSON.stringify(wishlistItems));
        this.updateWishlistCounter();
        this.syncWithMainWishlist(productHandle, 'add');
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
    }
  }

  updateWishlistCounter() {
    // Update any wishlist counters on the page
    const wishlistCounters = document.querySelectorAll('.m-wishlist-count');
    try {
      const stored = localStorage.getItem('m-wishlist-products');
      const count = stored ? JSON.parse(stored).length : 0;
      wishlistCounters.forEach(counter => {
        counter.textContent = count;
        counter.style.display = count > 0 ? 'inline' : 'none';
        // Remove hidden class if count > 0
        if (count > 0) {
          counter.classList.remove('m:hidden');
        } else {
          counter.classList.add('m:hidden');
        }
      });
      
      // Update body class for wishlist state
      const method = count > 0 ? 'add' : 'remove';
      document.body.classList[method]('wishlist-has-item');
      
    } catch (e) {
      wishlistCounters.forEach(counter => {
        counter.style.display = 'none';
        counter.classList.add('m:hidden');
      });
    }
  }

  async migrateOldWishlistData(productIds) {
    try {
      console.log('Migrating old wishlist data...');
      const handlePromises = productIds.map(async (id) => {
        try {
          const response = await fetch(`/products/${id}.js`);
          const product = await response.json();
          return product.handle;
        } catch (e) {
          console.warn(`Failed to migrate product ID ${id}:`, e);
          return null;
        }
      });
      
      const handles = await Promise.all(handlePromises);
      const validHandles = handles.filter(handle => handle !== null);
      
      if (validHandles.length > 0) {
        localStorage.setItem('m-wishlist-products', JSON.stringify(validHandles));
        // Clean up old storage
        localStorage.removeItem('minimog-wishlist');
        localStorage.removeItem('wishlist');
        
        // Load the migrated data
        this.loadWishlistItems();
      } else {
        this.showEmptyState();
      }
    } catch (error) {
      console.error('Error migrating wishlist data:', error);
      this.showEmptyState();
    }
  }

  syncWithMainWishlist(productHandle, action) {
    // Trigger events to sync with main wishlist system
    if (window.MinimogTheme && window.MinimogTheme.Wishlist) {
      if (action === 'remove') {
        window.MinimogTheme.Wishlist.removeFromWishlist(productHandle);
        window.MinimogTheme.Wishlist.updateWishlistCount();
        window.MinimogTheme.Wishlist.setWishlistButtonsState();
      } else if (action === 'add') {
        window.MinimogTheme.Wishlist.addToWishlist(productHandle);
        window.MinimogTheme.Wishlist.updateWishlistCount();
        window.MinimogTheme.Wishlist.setWishlistButtonsState();
      }
    }
  }

  formatMoney(cents) {
    // Simple money formatting - you may want to use Shopify's money format
    return '$' + (cents / 100).toFixed(2);
  }

  trapFocus() {
    this.focusableElements = this.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
    );
    this.firstFocusableElement = this.focusableElements[0];
    this.lastFocusableElement = this.focusableElements[this.focusableElements.length - 1];

    this.addEventListener('keydown', this.handleFocusTrap.bind(this));
  }

  removeFocusTrap() {
    this.removeEventListener('keydown', this.handleFocusTrap.bind(this));
  }

  handleFocusTrap(e) {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === this.firstFocusableElement) {
        this.lastFocusableElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === this.lastFocusableElement) {
        this.firstFocusableElement.focus();
        e.preventDefault();
      }
    }
  }
}

customElements.define("m-wishlist-drawer", MWishlistDrawer);

// Fallback initialization for mobile
document.addEventListener('DOMContentLoaded', function() {
  const wishlistDrawer = document.querySelector('#MinimogWishlistDrawer');
  if (wishlistDrawer && !wishlistDrawer.isInitialized) {
    console.log('Fallback: Initializing wishlist drawer');
    setTimeout(() => {
      wishlistDrawer.setHeaderWishlistIconAccessibility();
      wishlistDrawer.setupCloseButton();
      wishlistDrawer.isInitialized = true;
    }, 500);
  }
});

// Additional fallback for slow loading
window.addEventListener('load', function() {
  const wishlistDrawer = document.querySelector('#MinimogWishlistDrawer');
  if (wishlistDrawer && !wishlistDrawer.isInitialized) {
    console.log('Window load: Initializing wishlist drawer');
    wishlistDrawer.setHeaderWishlistIconAccessibility();
    wishlistDrawer.setupCloseButton();
    wishlistDrawer.isInitialized = true;
  }
});