// Wires Cover Press: pick a layout, put photos in its panels, crop each one, pick a grade,
// write a caption in big genre lettering, and export a PNG at the size you need.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
// Photos never leave the machine: uploads are read with object URLs and drawn locally.

import { drawCover, panelCount, panelRects, LAYOUTS, GRADES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const captionInput = document.getElementById('caption');
const status = document.getElementById('status');
const panelName = document.getElementById('panel-name');
const panelTabs = document.getElementById('panel-tabs');
const zoomInput = document.getElementById('zoom');
const zoomVal = document.getElementById('zoom-val');
const dxInput = document.getElementById('dx');
const dyInput = document.getElementById('dy');
const csizeInput = document.getElementById('csize');
const csizeVal = document.getElementById('csize-val');
const cstyleInput = document.getElementById('cstyle');
const cposInput = document.getElementById('cpos');
const exportSizeInput = document.getElementById('export-size');

/** One panel's photo and crop: zoom 1-3, dx/dy -1..1 as a share of the panel. */
function blankPanel() {
  return { img: null, sample: null, zoom: 1, dx: 0, dy: 0 };
}

const state = {
  layout: 'single',
  grade: 'sunset',
  caption: { text: 'Sunset Heist', style: 'solid', size: 1, pos: 'bottom' },
  panels: [blankPanel(), blankPanel(), blankPanel(), blankPanel()],
  selected: 0,
  exportSize: '1080x1080',
};

const samples = {};

function redraw() {
  drawCover(canvas, state);
}

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** The panel being edited right now. */
function selectedPanel() {
  return state.panels[state.selected];
}

/** Rebuilds the panel tabs for the current layout (one tab per panel). */
function buildPanelTabs() {
  const n = panelCount(state.layout);
  state.selected = Math.min(state.selected, n - 1);
  panelTabs.replaceChildren();
  for (let i = 0; i < n; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = `Panel ${i + 1}`;
    b.setAttribute('aria-pressed', String(i === state.selected));
    b.addEventListener('click', () => {
      state.selected = i;
      syncControls();
    });
    panelTabs.appendChild(b);
  }
  panelName.textContent = String(state.selected + 1);
}

/** Copies the state into every control, so the controls always show what the cover shows. */
function syncControls() {
  document.querySelectorAll('input[name="layout"]').forEach((r) => {
    r.checked = r.value === state.layout;
  });
  document.querySelectorAll('input[name="grade"]').forEach((r) => {
    r.checked = r.value === state.grade;
  });
  buildPanelTabs();
  const panel = selectedPanel();
  zoomInput.value = String(Math.round(panel.zoom * 100));
  zoomVal.textContent = `${Math.round(panel.zoom * 100)}%`;
  dxInput.value = String(Math.round(panel.dx * 100));
  dyInput.value = String(Math.round(panel.dy * 100));
  captionInput.value = state.caption.text;
  cstyleInput.value = state.caption.style;
  csizeInput.value = String(Math.round(state.caption.size * 100));
  csizeVal.textContent = `${Math.round(state.caption.size * 100)}%`;
  cposInput.value = state.caption.pos;
  exportSizeInput.value = state.exportSize;
  redraw();
}

/** Puts a loaded image into the selected panel. */
function setPanelPhoto(img, sample) {
  const panel = selectedPanel();
  panel.img = img;
  panel.sample = sample;
  panel.zoom = 1;
  panel.dx = 0;
  panel.dy = 0;
  syncControls();
}

/**
 * Copies the first filled panel's photo into every empty panel of the current layout
 * (same image, zoom 1, dx/dy 0), so switching to a layout with more panels never
 * leaves a new panel empty. Never overwrites a panel the user already filled.
 */
function autoFillEmptyPanels() {
  const n = panelCount(state.layout);
  const source = state.panels.slice(0, n).find((p) => p.img);
  if (!source) return;
  for (let i = 0; i < n; i++) {
    if (!state.panels[i].img) {
      state.panels[i] = { img: source.img, sample: source.sample, zoom: 1, dx: 0, dy: 0 };
    }
  }
}

/**
 * Puts the named sample in the selected panel and in every other currently empty
 * panel of the layout (same image, zoom 1, dx/dy 0). Panels the user already
 * filled with something else are left alone.
 */
function fillPanelsWithSample(name) {
  const selected = selectedPanel();
  selected.img = samples[name];
  selected.sample = name;
  selected.zoom = 1;
  selected.dx = 0;
  selected.dy = 0;
  const n = panelCount(state.layout);
  for (let i = 0; i < n; i++) {
    if (!state.panels[i].img) {
      state.panels[i] = { img: samples[name], sample: name, zoom: 1, dx: 0, dy: 0 };
    }
  }
  syncControls();
}

/** Gives every panel of the current layout a sample photo, alternating the two samples. */
function fillPanelsWithSamples(first) {
  const names = first === 'boulevard' ? ['boulevard', 'pier'] : ['pier', 'boulevard'];
  const n = panelCount(state.layout);
  for (let i = 0; i < n; i++) {
    const name = names[i % 2];
    state.panels[i] = { img: samples[name], sample: name, zoom: 1, dx: 0, dy: 0 };
  }
}

document.querySelectorAll('input[name="layout"]').forEach((r) => {
  r.addEventListener('change', () => {
    state.layout = r.value;
    autoFillEmptyPanels();
    syncControls();
  });
});
document.querySelectorAll('input[name="grade"]').forEach((r) => {
  r.addEventListener('change', () => {
    state.grade = r.value;
    redraw();
  });
});
document.getElementById('sample-pier').addEventListener('click', () => fillPanelsWithSample('pier'));
document.getElementById('sample-boulevard').addEventListener('click', () => fillPanelsWithSample('boulevard'));
document.getElementById('photo').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  setPanelPhoto(await loadImage(URL.createObjectURL(file)), null);
  e.target.value = '';
});
zoomInput.addEventListener('input', () => {
  selectedPanel().zoom = Number(zoomInput.value) / 100;
  zoomVal.textContent = `${zoomInput.value}%`;
  redraw();
});
dxInput.addEventListener('input', () => {
  selectedPanel().dx = Number(dxInput.value) / 100;
  redraw();
});
dyInput.addEventListener('input', () => {
  selectedPanel().dy = Number(dyInput.value) / 100;
  redraw();
});
document.getElementById('reset-crop').addEventListener('click', () => {
  const panel = selectedPanel();
  panel.zoom = 1;
  panel.dx = 0;
  panel.dy = 0;
  syncControls();
});
captionInput.addEventListener('input', () => {
  state.caption.text = captionInput.value;
  redraw();
});
cstyleInput.addEventListener('change', () => {
  state.caption.style = cstyleInput.value;
  redraw();
});
csizeInput.addEventListener('input', () => {
  state.caption.size = Number(csizeInput.value) / 100;
  csizeVal.textContent = `${csizeInput.value}%`;
  redraw();
});
cposInput.addEventListener('change', () => {
  state.caption.pos = cposInput.value;
  redraw();
});
exportSizeInput.addEventListener('change', () => {
  state.exportSize = exportSizeInput.value;
});

/** Renders the cover at `w` x `h` and resolves to the PNG blob. */
export function exportBlob(w, h) {
  return new Promise((resolve) => {
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    drawCover(off, state);
    off.toBlob((blob) => resolve(blob), 'image/png');
  });
}

document.getElementById('export').addEventListener('click', async () => {
  const [w, h] = state.exportSize.split('x').map(Number);
  const blob = await exportBlob(w, h);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `cover-${w}x${h}.png`;
  a.click();
  status.textContent = `Saved cover-${w}x${h}.png`;
});

/** Clicking the preview picks the panel under the click, so its photo and crop can be edited. */
canvas.addEventListener('click', (e) => {
  const box = canvas.getBoundingClientRect();
  const x = ((e.clientX - box.left) / box.width) * canvas.width;
  const y = ((e.clientY - box.top) / box.height) * canvas.height;
  const rects = panelRects(state.layout, canvas.width, canvas.height);
  const hit = rects.findIndex((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
  if (hit >= 0) {
    state.selected = hit;
    syncControls();
  }
});

/** A hook for checks: the state and the export path, without touching the page. */
window.__coverPress = { state, exportBlob };

/** Sets up a fixed scene for a screenshot: layout, grade and caption come from the query. */
async function setupShot(query) {
  const layout = query.get('layout');
  if (LAYOUTS.includes(layout)) state.layout = layout;
  const grade = query.get('grade');
  if (GRADES.includes(grade)) state.grade = grade;
  const style = query.get('cstyle');
  if (['solid', 'outline', 'band'].includes(style)) state.caption.style = style;
  const pos = query.get('cpos');
  if (['top', 'middle', 'bottom'].includes(pos)) state.caption.pos = pos;
  const size = Number(query.get('csize'));
  if (Number.isFinite(size) && size > 0) state.caption.size = size;
  const text = query.get('caption');
  if (text) state.caption.text = text;
  fillPanelsWithSamples(query.get('photo') ?? 'pier');
  // `dy` shifts the first panel's photo down (positive) or up, so a shot can keep
  // a face in frame inside a wide hero panel instead of cropping it at the edge.
  const dy = Number(query.get('dy'));
  if (Number.isFinite(dy)) state.panels[0].dy = dy;
  syncControls();
}

samples.pier = await loadImage('samples/pier.jpg');
samples.boulevard = await loadImage('samples/boulevard.jpg');

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  await runShot(shot, new URLSearchParams(location.search), setupShot);
} else {
  fillPanelsWithSamples('pier');
  syncControls();
}
