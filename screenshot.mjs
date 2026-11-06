import puppeteer from 'puppeteer-core';
import { mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';
const OUT = join(process.cwd(), 'temporary screenshots');
await mkdir(OUT, { recursive: true });

const existing = (await readdir(OUT)).filter(f => /^screenshot-\d+/.test(f));
const n = existing.reduce((m, f) => Math.max(m, parseInt(f.match(/^screenshot-(\d+)/)[1])), 0) + 1;
const name = `screenshot-${n}${label ? '-' + label : ''}.png`;

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--force-device-scale-factor=2'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
// Force scroll-reveal elements into their final visible state for capture
await page.evaluate(() => {
  document.querySelectorAll('.reveal').forEach(el => {
    el.style.transitionDelay = '0ms';
    el.classList.add('in');
  });
  window.scrollTo(0, 0);
});
await new Promise(r => setTimeout(r, 1000));
await page.screenshot({ path: join(OUT, name), fullPage: true });
await browser.close();
console.log('Saved', join(OUT, name));
