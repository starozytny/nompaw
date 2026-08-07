// Template for the `visual-check` skill.
// Copy this into the session scratchpad as visual_check.js and adapt:
//   - the credentials (must match a user you seeded in the real DB)
//   - the target URL(s)
//   - the interactions/screenshots list for the feature under test

const { chromium } = require('playwright');

const BASE = 'http://nginx';
const OUT = '/work/pw-output'; // must be under the -v mounted volume

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  await page.setViewportSize({ width: 1440, height: 950 });

  // --- login ---
  await page.goto(`${BASE}/connexion`);
  await page.fill('#username', 'playwright-visual-check');
  await page.fill('#password', 'CHANGE_ME');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');

  // --- navigate to the page under test ---
  await page.goto(`${BASE}/espace-membre/CHANGE_ME`);
  await page.waitForSelector('#CHANGE_ME'); // a mount point / stable element on the page
  await page.waitForTimeout(800); // let React hydrate + finish rendering
  await page.screenshot({ path: `${OUT}/01-initial.png`, fullPage: true });

  // --- example: open a panel/dialog and screenshot it ---
  // const btn = page.locator('button:has-text("Ajouter")').first();
  // await btn.click();
  // await page.waitForTimeout(400);
  // await page.screenshot({ path: `${OUT}/02-panel.png`, fullPage: true });
  // await page.keyboard.press('Escape');

  // --- example: switch tabs and confirm previous content is actually hidden ---
  // await page.click('button:has-text("SomeTab")');
  // await page.waitForTimeout(500);
  // await page.screenshot({ path: `${OUT}/03-tab.png`, fullPage: true });

  await browser.close();
  console.log('DONE');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
