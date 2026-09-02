import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
page.on('pageerror', (error) => console.log('PAGEERROR:' + error.message));
page.on('console', (msg) => console.log('CONSOLE:' + msg.type() + ':' + msg.text()));
page.on('requestfailed', (req) => console.log('REQUESTFAILED:' + req.url() + ' -> ' + req.failure()?.errorText));
await page.goto('http://localhost:8080', { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForTimeout(8000);
console.log('TITLE=' + await page.title());
try {
  const body = await page.locator('body').innerText();
  console.log('BODY_START=' + body.slice(0, 300));
} catch (error) {
  console.log('BODYERROR=' + error.message);
}
await browser.close();
