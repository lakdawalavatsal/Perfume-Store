import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('review_screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runReview() {
  console.log('Launching browser for storefront review...');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  const consoleMessages = [];
  const pageErrors = [];

  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  page.on('pageerror', err => {
    pageErrors.push(err.toString());
  });

  // 1. DESKTOP REVIEW (1440 x 900)
  console.log('--- Reviewing Desktop Layout (1440x900) ---');
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  const appPort = 5181;
  await page.goto(`http://localhost:${appPort}`, { waitUntil: 'networkidle0' });

  // Hero section viewport screenshot
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_desktop_hero.png') });

  // Hero full section screenshot
  const heroSection = await page.$('#home');
  if (heroSection) {
    await heroSection.screenshot({ path: path.join(SCREENSHOT_DIR, '01b_desktop_hero_full.png') });
  }

  // Hover/Select second bottle (OPULENT) in hero lineup
  const secondBottle = await page.$('#hero-bottle-btn-1') || await page.$('#gallery-bottle-btn-1');
  if (secondBottle) {
    await secondBottle.hover();
    await secondBottle.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_desktop_hero_selected.png') });
  }

  // Shop section
  const shopSection = await page.$('#shop');
  if (shopSection) {
    await shopSection.scrollIntoView();
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_desktop_shop_all.png') });

    // Click 50ml filter
    const filter50Btn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button[role="tab"]'));
      return buttons.find(b => b.textContent.includes('50 ml'));
    });
    if (filter50Btn) {
      await filter50Btn.click();
      await new Promise(r => setTimeout(r, 500));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03b_desktop_shop_50ml.png') });
    }

    // Click 20ml filter
    const filter20Btn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button[role="tab"]'));
      return buttons.find(b => b.textContent.includes('20 ml'));
    });
    if (filter20Btn) {
      await filter20Btn.click();
      await new Promise(r => setTimeout(r, 500));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03c_desktop_shop_20ml.png') });
    }

    // Reset to all
    const filterAllBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button[role="tab"]'));
      return buttons.find(b => b.textContent.includes('All Fragrances'));
    });
    if (filterAllBtn) await filterAllBtn.click();
  }

  // Our Story section
  const storySection = await page.$('#story');
  if (storySection) {
    await storySection.scrollIntoView();
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_desktop_story.png') });
  }

  // Contact section
  const contactSection = await page.$('#contact');
  if (contactSection) {
    await contactSection.scrollIntoView();
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_desktop_contact.png') });
  }

  // Test Modal by clicking "View Fragrance" on first card
  const viewFirstFragrance = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => b.textContent.includes('View Fragrance'));
  });
  if (viewFirstFragrance) {
    await viewFirstFragrance.click();
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_desktop_modal.png') });

    // Test box view if available
    const boxBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.textContent.includes('Presentation Box'));
    });
    if (boxBtn) {
      await boxBtn.click();
      await new Promise(r => setTimeout(r, 500));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06b_desktop_modal_box.png') });
    }

    // Add to bag from modal
    const addModalBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.textContent.includes('Add to Bag'));
    });
    if (addModalBtn) {
      await addModalBtn.click();
      await new Promise(r => setTimeout(r, 500));
    }

    // Close modal
    const closeBtn = await page.$('button[aria-label="Close details"]');
    if (closeBtn) await closeBtn.click();
    await new Promise(r => setTimeout(r, 500));
  }

  // Open Cart Drawer
  const bagBtn = await page.$('button[aria-label^="Open shopping bag"]');
  if (bagBtn) {
    await bagBtn.click();
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_desktop_cart_drawer.png') });

    // Close cart
    const closeBagBtn = await page.$('button[aria-label="Close bag"]');
    if (closeBagBtn) await closeBagBtn.click();
    await new Promise(r => setTimeout(r, 500));
  }

  // 2. MOBILE REVIEW (390 x 844 - iPhone 14/15 size)
  console.log('--- Reviewing Mobile Layout (390x844) ---');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(`http://localhost:${appPort}`, { waitUntil: 'networkidle0' });

  // Mobile Hero initial screen
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_mobile_hero.png') });

  // Mobile Hero full section
  const mobileHero = await page.$('#home');
  if (mobileHero) {
    await mobileHero.screenshot({ path: path.join(SCREENSHOT_DIR, '08b_mobile_hero_full.png') });
  }

  // Mobile Hamburger menu open
  const menuBtn = await page.$('button[aria-label="Toggle navigation menu"]');
  if (menuBtn) {
    await menuBtn.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_mobile_menu_open.png') });
    // Close menu
    const closeMenuBtn = await page.$('button[aria-label="Close menu"]');
    if (closeMenuBtn) await closeMenuBtn.click();
    await new Promise(r => setTimeout(r, 500));
  }

  // Tap Next button in mobile hero to test prominent bottle cycling
  const nextBtn = await page.$('button[aria-label^="Next perfume"]');
  if (nextBtn) {
    await nextBtn.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_mobile_hero_next.png') });
  }

  // Mobile Shop
  const mobileShop = await page.$('#shop');
  if (mobileShop) {
    await mobileShop.scrollIntoView();
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_mobile_shop.png') });
  }

  // Mobile Story
  const mobileStory = await page.$('#story');
  if (mobileStory) {
    await mobileStory.scrollIntoView();
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_mobile_story.png') });
  }

  console.log('=== Review Summary ===');
  console.log(`Page Errors: ${pageErrors.length}`);
  if (pageErrors.length > 0) {
    console.error('Errors found:', pageErrors);
  }
  console.log(`Console messages: ${consoleMessages.length}`);
  const warningsAndErrors = consoleMessages.filter(m => m.type === 'error' || m.type === 'warning');
  if (warningsAndErrors.length > 0) {
    console.warn('Console warnings/errors:', warningsAndErrors);
  } else {
    console.log('No console warnings or errors detected!');
  }

  await browser.close();
  console.log('All screenshots captured in review_screenshots/');
}

runReview().catch(err => {
  console.error('Review script failed:', err);
  process.exit(1);
});
