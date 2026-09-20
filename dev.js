const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SRC_UI = path.join(__dirname, 'src/ui.html');
const SRC_CSS = path.join(__dirname, 'src/styles.css');
const DIST_CSS = path.join(__dirname, 'dist/styles.css');
const OUT_UI = path.join(__dirname, 'ui.html');

fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });

let building = false;
let pending = false;

function buildOnce(reason) {
  if (building) {
    pending = true;
    return;
  }
  building = true;

  const t0 = Date.now();
  console.log('[build] start —', reason);

  // 1) Compile Tailwind one-shot
  const tw = spawnSync(
    'npx',
    ['@tailwindcss/cli', '-i', 'src/styles.css', '-o', 'dist/styles.css', '--minify'],
    { stdio: ['ignore', 'inherit', 'inherit'] }
  );

  if (tw.status !== 0) {
    console.error('[build] tailwind failed');
    building = false;
    return;
  }

  // 2) Inject CSS into template
  try {
    const template = fs.readFileSync(SRC_UI, 'utf8');
    const css = fs.readFileSync(DIST_CSS, 'utf8');
    const output = template.replace('/* __INJECT_CSS__ */', css);
    fs.writeFileSync(OUT_UI, output);
    console.log('[build] done in ' + (Date.now() - t0) + 'ms');
  } catch (err) {
    console.error('[build] inject error:', err.message);
  }

  building = false;

  if (pending) {
    pending = false;
    buildOnce('coalesced');
  }
}

// Initial build
buildOnce('initial');

// Poll for changes
let debounce;
function schedule(reason) {
  clearTimeout(debounce);
  debounce = setTimeout(() => buildOnce(reason), 80);
}

fs.watchFile(SRC_UI, { interval: 200 }, (curr, prev) => {
  if (curr.mtimeMs !== prev.mtimeMs) schedule('src/ui.html changed');
});
fs.watchFile(SRC_CSS, { interval: 200 }, (curr, prev) => {
  if (curr.mtimeMs !== prev.mtimeMs) schedule('src/styles.css changed');
});

console.log('[watch] polling src/ui.html and src/styles.css every 200ms');

process.on('SIGINT', () => {
  fs.unwatchFile(SRC_UI);
  fs.unwatchFile(SRC_CSS);
  process.exit(0);
});
