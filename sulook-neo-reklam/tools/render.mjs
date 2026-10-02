// Kare kare render: node tools/render.mjs --f 916 --out out.mp4 [--from 0 --to 28.5] [--stills 1,2.5,...] [--workers 3]
import { createRequire } from 'module';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dirname, '../src');
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') && a.push([v.slice(2), arr[i + 1]]), a), []));
const FMT = args.f || '916';
const W = 1080, H = FMT === '45' ? 1350 : 1920;
const FPS = +(args.fps || 30);
const WORKERS = +(args.workers || 3);

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const p = path.join(SRC, decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'max-age=3600' }); res.end(d); });
});
await new Promise(r => server.listen(0, r));
const URL = `http://127.0.0.1:${server.address().port}/index.html?f=${FMT}`;

const browser = await chromium.launch({ executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? undefined : undefined, args: ['--font-render-hinting=none', '--disable-gpu-vsync', '--force-color-profile=srgb'] });
async function newPage() {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('PAGEERROR', e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
  await page.goto(URL);
  await page.evaluate(() => window.ready);
  return page;
}

if (args.cues) {
  const page = await newPage();
  const cues = await page.evaluate(() => ({ T: window.T, POPS: window.POPS.map(p => ({ t: p.t, k: p.k, a: p.a })) }));
  fs.writeFileSync(args.cues, JSON.stringify(cues, null, 1));
  console.log('cues ->', args.cues);
  await browser.close(); server.close(); process.exit(0);
}
if (args.stills) {
  const outDir = args.out || path.resolve(__dirname, '../stills');
  fs.mkdirSync(outDir, { recursive: true });
  const page = await newPage();
  for (const ts of args.stills.split(',').map(Number)) {
    await page.evaluate(t => window.seek(t), ts);
    await page.screenshot({ path: path.join(outDir, `${FMT}_${ts.toFixed(2)}.jpg`), type: 'jpeg', quality: 88 });
  }
  console.log('stills ->', outDir);
  await browser.close(); server.close(); process.exit(0);
}

// tam render: işçiler kare aralıklarına bölünür, PNG -> ffmpeg
const page0 = await newPage();
const DUR = +(args.to || await page0.evaluate(() => window.DURATION));
const FROM = +(args.from || 0);
await page0.close();
const N = Math.round((DUR - FROM) * FPS);
const tmp = args.tmp || path.resolve(__dirname, `../.frames_${FMT}`);
fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp, { recursive: true });
console.log(`render ${FMT} ${N} kare @${FPS}fps, ${WORKERS} işçi`);
const t0 = Date.now();
let done = 0;
async function worker(w) {
  const page = await newPage();
  const per = Math.ceil(N / WORKERS);
  const a = w * per, b = Math.min(N, a + per);
  // ısınma: GSAP başlangıç değerlerini sırayla yakalasın
  for (let wt = 0; wt < FROM + a / FPS; wt += .25) await page.evaluate(t => window.seek(t), wt);
  for (let i = a; i < b; i++) {
    const t = FROM + i / FPS;
    await page.evaluate(tt => window.seek(tt), t);
    await page.screenshot({ path: path.join(tmp, `f${String(i).padStart(5, '0')}.png`), type: 'png' });
    done++;
    if (done % 60 === 0) console.log(`  ${done}/${N}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  await page.close();
}
await Promise.all([...Array(WORKERS)].map((_, w) => worker(w)));
await browser.close(); server.close();
console.log(`kareler tamam ${((Date.now() - t0) / 1000).toFixed(0)}s`);
if (args.out) {
  await new Promise((res, rej) => {
    const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-framerate', String(FPS), '-i', path.join(tmp, 'f%05d.png'),
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', args.out], { stdio: 'inherit' });
    ff.on('close', c => c ? rej(new Error('ffmpeg ' + c)) : res());
  });
  console.log('->', args.out);
}
