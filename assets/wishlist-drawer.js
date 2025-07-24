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

    // Get wishlist from localStorage (mimicking existing wishlist.js functionality)
    let wishlistItems = [];
    try {
      const stored = localStorage.getItem('minimog-wishlist') || localStorage.getItem('wishlist');
      if (stored) {
        wishlistItems = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Error loading wishlist:', e);
    }

    if (wishlistItems.length === 0) {
      this.showEmptyState();
      return;
    }

    // Fetch product data for wishlist items
    this.fetchWishlistProducts(wishlistItems);
  }

  async fetchWishlistProducts(productIds) {
    try {
      const productPromises = productIds.map(id => 
        fetch(`/products/${id}.js`)
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
      <div class="m-wishlist-drawer__item" data-product-id="${product.id}">
        <div class="m:flex m:gap-4 m:p-4 m:border-b">
          <div class="m:flex-shrink-0">
            <a href="${product.url}" class="m:block">
              <img src="${image}" alt="${product.title}" class="m:w-16 m:h-16 m:object-cover m:rounded">
            </a>
          </div>
          <div class="m:flex-grow m:min-w-0">
            <div class="m:flex m:justify-between m:items-start">
              <div class="m:flex-grow m:pr-4">
                <h4 class="m:text-sm m:font-medium m:line-clamp-2">
                  <a href="${product.url}" class="m:text-current m:no-underline">${product.title}</a>
                </h4>
                <div class="m:mt-1 m:text-sm">
                  ${comparePrice ? `<span class="m:line-through m:opacity-60">${comparePrice}</span>` : ''}
                  <span class="m:font-medium">${price}</span>
                </div>
              </div>
              <button 
                class="m-wishlist-remove-btn m:text-gray-400 hover:m:text-red-500 m:transition-colors"
                data-product-id="${product.id}"
                aria-label="Remove ${product.title} from wishlist"
                title="Remove ${product.title} from wishlist"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div class="m:mt-3">
              <button 
                class="m-button m-button--small m-button--secondary m:text-xs"
                onclick="this.closest('.m-wishlist-drawer__item').querySelector('form').submit()"
                aria-label="Add ${product.title} to cart"
              >
                Add to Cart
              </button>
              <form action="/cart/add" method="post" enctype="multipart/form-data" class="m:hidden">
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
        const productId = button.dataset.productId;
        this.removeFromWishlist(productId);
      });
    });
  }

  removeFromWishlist(productId) {
    try {
      // Remove from localStorage
      let wishlistItems = [];
      const stored = localStorage.getItem('minimog-wishlist') || localStorage.getItem('wishlist');
      if (stored) {
        wishlistItems = JSON.parse(stored);
      }
      
      wishlistItems = wishlistItems.filter(id => id != productId);
      localStorage.setItem('minimog-wishlist', JSON.stringify(wishlistItems));
      localStorage.setItem('wishlist', JSON.stringify(wishlistItems));

      // Remove from DOM
      const itemElement = this.querySelector(`[data-product-id="${productId}"]`);
      if (itemElement) {
        itemElement.remove();
      }

      // Check if empty
      const remainingItems = this.querySelectorAll('.m-wishlist-drawer__item');
      if (remainingItems.length === 0) {
        this.showEmptyState();
      }

      // Update wishlist counter if it exists
      this.updateWishlistCounter();

    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  }

  showEmptyState() {
    this.wishlistLoadingState.style.display = 'none';
    this.wishlistItemsContainer.innerHTML = '';
    this.wishlistEmptyState.classList.remove('m:hidden');
  }

  updateWishlistCounter() {
    // Update any wishlist counters on the page
    const wishlistCounters = document.querySelectorAll('.m-wishlist-count');
    try {
      const stored = localStorage.getItem('minimog-wishlist') || localStorage.getItem('wishlist');
      const count = stored ? JSON.parse(stored).length : 0;
      wishlistCounters.forEach(counter => {
        counter.textContent = count;
        counter.style.display = count > 0 ? 'inline' : 'none';
      });
    } catch (e) {
      wishlistCounters.forEach(counter => {
        counter.style.display = 'none';
      });
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