import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('review_screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runReview() {
  console.log('🚀 Starting Comprehensive Review of Customer Checkout & Admin Dashboard...');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  const appUrl = 'http://localhost:5181';

  // Listen to console and errors
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.toString()));

  // =========================================================================
  // 1. DESKTOP REVIEW (1440 x 900)
  // =========================================================================
  console.log('--- 1. Testing Desktop Customer Checkout ---');
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto(appUrl, { waitUntil: 'networkidle0' });

  // 1a. Add a 50ml perfume (BLUE HAVEN) to bag
  console.log('Adding Blue Haven 50ml to bag...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const addBtn = buttons.find(b => b.textContent.includes('Add to Bag'));
    if (addBtn) addBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // 1b. Open Bag Drawer
  console.log('Opening shopping bag...');
  await page.evaluate(() => {
    const bagBtn = document.querySelector('button[aria-label^="Open shopping bag"]');
    if (bagBtn) bagBtn.click();
  });
  await new Promise(r => setTimeout(r, 700));

  // 1c. Click "Proceed to Secure Checkout"
  console.log('Opening Checkout Modal...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const chkBtn = buttons.find(b => b.textContent.includes('Proceed to Secure Checkout'));
    if (chkBtn) chkBtn.click();
  });
  await page.waitForSelector('#checkout-order-form', { timeout: 5000 });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_desktop_checkout_form.png') });
  console.log('📸 01_desktop_checkout_form.png captured');

  // 1d. Fill in customer details
  console.log('Filling customer checkout fields...');
  await page.type('#customer_name', 'Mrs. Sunita Kapoor');
  await page.type('#phone', '9819283746');
  await page.type('#email', 'sunita.kapoor@example.com');
  await page.type('#address_line1', 'Penthouse 14A, Gulmohar Enclave, Juhu');
  await page.type('#address_line2', 'Near Palm Beach Road');
  await page.type('#city', 'Mumbai');
  await page.type('#pincode', '400049');
  await page.type('#order_notes', 'Please pack in luxury gift box with golden ribbon');

  // Scroll submit button into view and click
  console.log('Submitting order...');
  await page.click('#checkout-submit-btn');

  // Wait for order confirmation view
  await page.waitForFunction(
    () => document.body.innerText.includes('Order Placed Successfully'),
    { timeout: 10000 }
  );
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_desktop_order_confirmation.png') });
  console.log('📸 02_desktop_order_confirmation.png captured');

  // Extract placed Order ID
  const placedOrderId = await page.evaluate(() => {
    const el = document.querySelector('.font-mono.text-lg.font-bold');
    return el ? el.textContent.trim() : null;
  });
  console.log('Placed Order ID:', placedOrderId);

  // Close checkout modal
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const contBtn = buttons.find(b => b.textContent.includes('Continue Exploring'));
    if (contBtn) contBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // =========================================================================
  // 2. DESKTOP ORDER TRACKING
  // =========================================================================
  console.log('--- 2. Testing Customer Order Tracker ---');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const trackBtn = buttons.find(b => b.textContent.includes('Track Order'));
    if (trackBtn) trackBtn.click();
  });
  await page.waitForSelector('input[placeholder*="MNG-"]', { timeout: 5000 });

  if (placedOrderId) {
    await page.type('input[placeholder*="MNG-"]', placedOrderId);
    // Click track button
    await page.evaluate(() => {
      const form = document.querySelector('input[placeholder*="MNG-"]').closest('form');
      if (form) form.requestSubmit();
    });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_desktop_order_tracking_result.png') });
    console.log('📸 03_desktop_order_tracking_result.png captured');
  }

  // Close tracker
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 500));

  // =========================================================================
  // 3. PRIVATE ADMIN DASHBOARD (DESKTOP)
  // =========================================================================
  console.log('--- 3. Testing Private Admin Dashboard ---');
  // Clear any existing token to test login screen first
  await page.evaluate(() => localStorage.removeItem('mangaalam_admin_token'));
  await page.goto(`${appUrl}/#admin`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('#admin-login-form', { timeout: 5000 });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_desktop_admin_login_screen.png') });
  console.log('📸 04_desktop_admin_login_screen.png captured');

  // Log in
  console.log('Logging in as admin...');
  await page.type('#admin-login-email', 'admin@mangaalam.com');
  await page.type('#admin-login-password', 'Mangaalam@2026');
  await page.click('#admin-login-btn');

  // Wait for dashboard to load
  await page.waitForSelector('#tab-btn-orders', { timeout: 10000 });
  await page.waitForSelector('table', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_desktop_admin_dashboard_orders.png') });
  console.log('📸 05_desktop_admin_dashboard_orders.png captured');

  // Click "Manage" on the first order in table
  console.log('Opening order management drawer...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const manageBtn = buttons.find(b => b.textContent.includes('Manage'));
    if (manageBtn) manageBtn.click();
  });
  await page.waitForSelector('#admin-save-order-btn', { timeout: 5000 });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_desktop_admin_manage_order_modal.png') });
  console.log('📸 06_desktop_admin_manage_order_modal.png captured');

  // Update order status to Confirmed, add carrier and tracking
  console.log('Updating order status & tracking info...');
  await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    if (selects.length >= 2) {
      selects[0].value = 'Confirmed';
      selects[0].dispatchEvent(new Event('change', { bubbles: true }));
      selects[1].value = 'paid';
      selects[1].dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  const carrierInput = await page.$('input[placeholder*="Blue Dart"]');
  if (carrierInput) await carrierInput.type('Blue Dart Luxury Express');

  const trackingInput = await page.$('input[placeholder*="BD849204928IN"]');
  if (trackingInput) await trackingInput.type('BD992817263IN');

  const noteInput = await page.$('input[placeholder*="Verified payment"]');
  if (noteInput) await noteInput.type('Confirmed via boutique phone call; luxury gift ribbon attached.');

  // Click Save
  await page.click('#admin-save-order-btn');
  await new Promise(r => setTimeout(r, 1200));

  // Close modal if still open
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 500));

  // Switch to Inventory Tab
  console.log('Navigating to Inventory Tab...');
  await page.click('#tab-btn-inventory');
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_desktop_admin_inventory_tab.png') });
  console.log('📸 07_desktop_admin_inventory_tab.png captured');

  // Switch to Config Tab
  console.log('Navigating to Config Tab...');
  await page.click('#tab-btn-config');
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_desktop_admin_config_tab.png') });
  console.log('📸 08_desktop_admin_config_tab.png captured');

  // =========================================================================
  // 4. MOBILE EXPERIENCE (390 x 844 - iPhone 14/15)
  // =========================================================================
  console.log('--- 4. Testing Mobile Experience (390x844) ---');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  // Mobile Storefront
  await page.goto(appUrl, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  // Open mobile menu
  await page.click('button[aria-label="Toggle navigation menu"]');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_mobile_menu_with_admin_link.png') });
  console.log('📸 09_mobile_menu_with_admin_link.png captured');

  // Open Admin on mobile (admin token is preserved in localStorage)
  console.log('Opening mobile admin dashboard...');
  await page.goto(`${appUrl}/#admin`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('#tab-btn-orders', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_mobile_admin_orders.png') });
  console.log('📸 10_mobile_admin_orders.png captured');

  // Mobile Admin Inventory Tab
  await page.click('#tab-btn-inventory');
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_mobile_admin_inventory.png') });
  console.log('📸 11_mobile_admin_inventory.png captured');

  await browser.close();
  console.log('🎉 ALL REVIEW STEPS COMPLETED SUCCESSFULLY!');
}

runReview().catch(err => {
  console.error('Review script failed:', err);
  process.exit(1);
});
