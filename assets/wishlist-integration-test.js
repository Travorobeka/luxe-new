// Wishlist Integration Test
// This file tests the integration between wishlist drawer and main wishlist system
// Run this in the browser console to test functionality

function testWishlistIntegration() {
  console.log('🧪 Starting Wishlist Integration Test...');
  
  const testHandle = 'test-product-handle';
  const storageKey = 'm-wishlist-products';
  
  // Clear any existing wishlist data
  localStorage.removeItem(storageKey);
  localStorage.removeItem('minimog-wishlist');
  localStorage.removeItem('wishlist');
  
  console.log('✅ Cleared existing wishlist data');
  
  // Test 1: Add to wishlist via main system
  console.log('🔬 Test 1: Adding via main wishlist system...');
  if (window.MinimogTheme && window.MinimogTheme.Wishlist) {
    window.MinimogTheme.Wishlist.addToWishlist(testHandle);
    const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (stored.includes(testHandle)) {
      console.log('✅ Test 1 PASSED: Item added via main system');
    } else {
      console.log('❌ Test 1 FAILED: Item not found in storage');
    }
  } else {
    console.log('⚠️  Test 1 SKIPPED: Main wishlist system not available');
  }
  
  // Test 2: Add to wishlist via drawer system
  console.log('🔬 Test 2: Adding via drawer system...');
  const drawer = document.querySelector('#MinimogWishlistDrawer');
  if (drawer && drawer.addToWishlist) {
    drawer.addToWishlist('test-product-handle-2');
    const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (stored.includes('test-product-handle-2')) {
      console.log('✅ Test 2 PASSED: Item added via drawer system');
    } else {
      console.log('❌ Test 2 FAILED: Item not found in storage');
    }
  } else {
    console.log('⚠️  Test 2 SKIPPED: Drawer system not available');
  }
  
  // Test 3: Check counter synchronization
  console.log('🔬 Test 3: Checking counter synchronization...');
  const counters = document.querySelectorAll('.m-wishlist-count');
  let countersSynced = true;
  const expectedCount = JSON.parse(localStorage.getItem(storageKey) || '[]').length;
  
  counters.forEach(counter => {
    if (parseInt(counter.textContent) !== expectedCount) {
      countersSynced = false;
    }
  });
  
  if (countersSynced) {
    console.log(`✅ Test 3 PASSED: All counters show ${expectedCount} items`);
  } else {
    console.log(`❌ Test 3 FAILED: Counters not synchronized`);
  }
  
  // Test 4: Test migration functionality
  console.log('🔬 Test 4: Testing migration from old format...');
  localStorage.removeItem(storageKey);
  localStorage.setItem('minimog-wishlist', JSON.stringify(['123', '456']));
  
  if (drawer && drawer.loadWishlistItems) {
    console.log('✅ Test 4 setup complete - migration will be tested when drawer opens');
  } else {
    console.log('⚠️  Test 4 SKIPPED: Drawer not available for migration test');
  }
  
  // Clean up
  localStorage.removeItem(storageKey);
  localStorage.removeItem('minimog-wishlist');
  localStorage.removeItem('wishlist');
  
  console.log('🧪 Wishlist Integration Test Complete!');
  console.log('📝 To test migration, add some items using old format and open the wishlist drawer');
}

// Export for console use
window.testWishlistIntegration = testWishlistIntegration;

console.log('🚀 Wishlist integration test loaded. Run testWishlistIntegration() in console to test.');