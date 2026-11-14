/* يولّد أيقونات التطبيق (PNG) من الرسم نفسه المستعمل في التطبيق.
   التشغيل:  node tools/make-icons.js
   يتطلب Playwright (الموجود في بيئة التطوير). */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'icons');

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent('<html><body></body></html>');
  await page.addScriptTag({ path: path.join(ROOT, 'js/core/art.js') });

  // نركّب الأيقونة: سماء + شمس + تلال + القطار في الوسط (المحتوى داخل المنطقة الآمنة ٧٠٪)
  const svg = await page.evaluate(() => {
    const train = Bustan.art.gameIcon('train').replace(/^<svg[^>]*>|<\/svg>$/g, '');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#74C6F0"/><stop offset="1" stop-color="#E3F5FF"/></linearGradient></defs>
<rect width="512" height="512" fill="url(#g)"/>
<circle cx="390" cy="130" r="74" fill="#FFF3B0" opacity=".5"/><circle cx="390" cy="130" r="46" fill="#FFD34E"/>
<path d="M0 340Q120 250 250 320T512 310V512H0Z" fill="#9ADFD0"/>
<path d="M0 400Q150 330 300 392T512 380V512H0Z" fill="#5CCBAE"/>
<path d="M0 450Q170 400 330 440T512 430V512H0Z" fill="#19B394"/>
<g transform="translate(106 118) scale(3.0)">${train}</g>
</svg>`;
  });
  fs.writeFileSync(path.join(OUT, 'icon.svg'), svg);

  const sizes = [
    ['icon-192.png', 192],
    ['icon-512.png', 512],
    ['icon-maskable-512.png', 512],
    ['apple-touch-icon.png', 180]
  ];
  for (const [name, size] of sizes) {
    const p = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await p.setContent(`<html><body style="margin:0;background:#CFEBFF"><div style="width:${size}px;height:${size}px">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</div></body></html>`);
    await p.screenshot({ path: path.join(OUT, name), omitBackground: false });
    await p.close();
    console.log('تم:', name);
  }
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
