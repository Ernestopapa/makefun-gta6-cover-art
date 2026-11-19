// Draws a Cover Press cover: photos arranged in panels, a neon-sunset grade over each photo,
// and a big genre caption in bold lettering. Everything is drawn on a 2D canvas, so the same
// state renders identically at any export size.

/** The five layouts, in the order the editor lists them. */
export const LAYOUTS = ['single', 'panels2', 'grid4', 'hero3', 'fullbleed'];

/** The three grades. */
export const GRADES = ['sunset', 'neon', 'mono'];

/** The three caption styles. */
export const CAPTION_STYLES = ['solid', 'outline', 'band'];

/** The three caption positions. */
export const CAPTION_POSITIONS = ['top', 'middle', 'bottom'];

/** How many photo panels a layout holds. */
export function panelCount(layout) {
  switch (layout) {
    case 'panels2': return 2;
    case 'grid4': return 4;
    case 'hero3': return 4;
    default: return 1;
  }
}

/**
 * The panel rectangles of a layout, in canvas pixels. `g` is the gutter between panels;
 * single and full-bleed are one panel filling the whole canvas.
 */
export function panelRects(layout, w, h) {
  const g = Math.max(2, Math.round(Math.min(w, h) * 0.012));
  switch (layout) {
    case 'panels2': {
      const pw = (w - g) / 2;
      return [
        { x: 0, y: 0, w: pw, h },
        { x: pw + g, y: 0, w: pw, h },
      ];
    }
    case 'grid4': {
      const pw = (w - g) / 2;
      const ph = (h - g) / 2;
      return [
        { x: 0, y: 0, w: pw, h: ph },
        { x: pw + g, y: 0, w: pw, h: ph },
        { x: 0, y: ph + g, w: pw, h: ph },
        { x: pw + g, y: ph + g, w: pw, h: ph },
      ];
    }
    case 'hero3': {
      const hh = Math.round(h * 0.62);
      const bw = (w - 2 * g) / 3;
      const bh = h - hh - g;
      return [
        { x: 0, y: 0, w, h: hh },
        { x: 0, y: hh + g, w: bw, h: bh },
        { x: bw + g, y: hh + g, w: bw, h: bh },
        { x: 2 * (bw + g), y: hh + g, w: bw, h: bh },
      ];
    }
    default:
      return [{ x: 0, y: 0, w, h }];
  }
}

/** The canvas filter a grade applies while a photo is drawn ('' for none). */
function photoFilter(grade) {
  switch (grade) {
    case 'mono': return 'grayscale(1) contrast(1.12) brightness(1.04)';
    case 'neon': return 'saturate(1.7) contrast(1.08)';
    default: return 'saturate(1.15) contrast(1.02)';
  }
}

/** Draws one photo into its panel: cover-fit, then the panel's zoom and offset. */
function drawPanelPhoto(ctx, rect, panel, grade) {
  const img = panel.img;
  if (!img) return;
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const scale = base * panel.zoom;
  const pw = img.naturalWidth * scale;
  const ph = img.naturalHeight * scale;
  const cx = rect.x + rect.w / 2 + (panel.dx * rect.w) / 2;
  let cy = rect.y + rect.h / 2 + (panel.dy * rect.h) / 2;
  // When cover-fit crops vertically (the panel is wider than the photo), centre
  // cropping would cut the top of the photo off — at wide export sizes that
  // takes the subject's head with it. Bias the crop window toward the top of
  // the photo instead: the window starts about 10% down the photo, so the
  // face stays in frame. When there is no vertical crop (excess 0) this is a
  // no-op, so square framing is unchanged.
  const excessY = ph - rect.h;
  if (excessY > 0) {
    const discard = Math.min(excessY, ph * 0.10);
    cy += excessY / 2 - discard;
  }
  ctx.save();
  ctx.filter = photoFilter(grade);
  ctx.drawImage(img, cx - pw / 2, cy - ph / 2, pw, ph);
  ctx.restore();
}

/** The colour wash a grade lays over a photo once it is drawn. */
function gradeWash(ctx, rect, grade) {
  if (grade === 'mono') {
    const cool = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    cool.addColorStop(0, 'rgba(120, 140, 180, 0.10)');
    cool.addColorStop(1, 'rgba(40, 50, 70, 0.16)');
    ctx.fillStyle = cool;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    return;
  }
  if (grade === 'neon') {
    // Two passes, so the neon reads as neon instead of a faint pink tint:
    // a strong `overlay` wash (cyan from the top-left, magenta from the
    // bottom-right), then a `color` pass with the same gradients, which
    // re-hues the photo itself toward cyan and magenta while keeping its
    // light and shade. The photo stays recognisable; the grade is loud.
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    const cyan = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    cyan.addColorStop(0, 'rgba(0, 229, 255, 0.70)');
    cyan.addColorStop(1, 'rgba(0, 229, 255, 0)');
    ctx.fillStyle = cyan;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    const magenta = ctx.createLinearGradient(rect.x + rect.w, rect.y + rect.h, rect.x, rect.y);
    magenta.addColorStop(0, 'rgba(255, 0, 128, 0.70)');
    magenta.addColorStop(1, 'rgba(255, 0, 128, 0)');
    ctx.fillStyle = magenta;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.globalCompositeOperation = 'color';
    const cyanHue = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    cyanHue.addColorStop(0, 'rgba(0, 229, 255, 0.50)');
    cyanHue.addColorStop(1, 'rgba(0, 229, 255, 0)');
    ctx.fillStyle = cyanHue;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    const magentaHue = ctx.createLinearGradient(rect.x + rect.w, rect.y + rect.h, rect.x, rect.y);
    magentaHue.addColorStop(0, 'rgba(255, 0, 128, 0.50)');
    magentaHue.addColorStop(1, 'rgba(255, 0, 128, 0)');
    ctx.fillStyle = magentaHue;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
    return;
  }
  // sunset: warm light from the top, pink heat rising from the bottom.
  const warm = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  warm.addColorStop(0, 'rgba(255, 170, 60, 0.30)');
  warm.addColorStop(0.55, 'rgba(255, 120, 80, 0.12)');
  warm.addColorStop(1, 'rgba(200, 30, 110, 0.45)');
  ctx.fillStyle = warm;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
}

/** Draws one panel: a dark base, its photo, its grade wash, and a hairline edge. */
function drawPanel(ctx, rect, panel, grade) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  const base = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  base.addColorStop(0, '#2b1838');
  base.addColorStop(1, '#160d20');
  ctx.fillStyle = base;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  drawPanelPhoto(ctx, rect, panel, grade);
  gradeWash(ctx, rect, grade);
  ctx.restore();
  if (!panel.img) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = Math.max(1, Math.min(rect.w, rect.h) * 0.004);
    ctx.setLineDash([Math.max(6, rect.w * 0.02), Math.max(6, rect.w * 0.02)]);
    ctx.strokeRect(rect.x + 8, rect.y + 8, rect.w - 16, rect.h - 16);
    ctx.restore();
  }
}

/** The caption's font size: a share of the cover height, scaled by the size control, shrunk to fit. */
function captionSize(ctx, text, w, h, sizeScale) {
  let size = h * 0.11 * sizeScale;
  ctx.font = `bold ${size}px sans-serif`;
  try { ctx.letterSpacing = `${size * 0.04}px`; } catch { /* older canvas: no letter spacing */ }
  while (ctx.measureText(text).width > w * 0.92 && size > 12) {
    size -= 2;
    ctx.font = `bold ${size}px sans-serif`;
  }
  return size;
}

/** Draws the caption in big bold genre lettering, at its style, size and position. */
function drawCaption(ctx, w, h, caption) {
  const text = caption.text.trim().toUpperCase();
  if (!text) return;
  const size = captionSize(ctx, text, w, h, caption.size);
  ctx.textAlign = 'center';
  let y;
  let baseline = 'alphabetic';
  if (caption.pos === 'top') {
    y = h * 0.06 + size;
  } else if (caption.pos === 'middle') {
    y = h / 2;
    baseline = 'middle';
  } else {
    y = h - h * 0.05;
  }
  ctx.textBaseline = baseline;
  ctx.font = `bold ${size}px sans-serif`;
  try { ctx.letterSpacing = `${size * 0.04}px`; } catch { /* older canvas: no letter spacing */ }

  if (caption.style === 'band') {
    const tw = ctx.measureText(text).width;
    const padX = size * 0.5;
    const bandH = size * 1.45;
    let bandY;
    if (caption.pos === 'top') bandY = h * 0.06;
    else if (caption.pos === 'middle') bandY = h / 2 - bandH / 2;
    else bandY = h - h * 0.05 - size - (bandH - size) / 2;
    ctx.fillStyle = '#ff2e88';
    ctx.fillRect((w - tw) / 2 - padX, bandY, tw + padX * 2, bandH);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, w / 2, y);
    return;
  }

  if (caption.style === 'outline') {
    ctx.lineWidth = Math.max(2, size * 0.07);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = 'rgba(20, 10, 25, 0.55)';
    ctx.fillText(text, w / 2, y);
    ctx.strokeText(text, w / 2, y);
    return;
  }

  // solid: white capitals with a soft drop shadow.
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = size * 0.2;
  ctx.shadowOffsetY = size * 0.04;
  ctx.fillText(text, w / 2, y);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
}

/**
 * Draws the whole cover onto `canvas` from `state`:
 * `{ layout, grade, caption: { text, style, size, pos }, panels: [{ img, zoom, dx, dy }] }`.
 * Panels beyond the layout's count are ignored; missing panels draw as empty slots.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  ctx.save();
  try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  ctx.fillStyle = '#140f1c';
  ctx.fillRect(0, 0, w, h);
  const rects = panelRects(state.layout, w, h);
  rects.forEach((rect, i) => {
    const panel = state.panels[i] ?? { img: null, zoom: 1, dx: 0, dy: 0 };
    drawPanel(ctx, rect, panel, state.grade);
  });
  if (state.layout === 'single') {
    // Single gets a thin poster frame, so it reads differently from full-bleed.
    const inset = Math.max(10, Math.min(w, h) * 0.02);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.004);
    ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
  }
  // A scrim under a bottom or middle caption keeps the words readable over any photo.
  if (captionNeedsScrim(state.caption)) {
    const scrim = ctx.createLinearGradient(0, h * 0.55, 0, h);
    scrim.addColorStop(0, 'rgba(10, 5, 18, 0)');
    scrim.addColorStop(1, 'rgba(10, 5, 18, 0.55)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, 0, w, h);
  }
  drawCaption(ctx, w, h, state.caption);
  ctx.restore();
}

/** Whether the caption style needs a dark scrim behind it (solid and outline do; band brings its own). */
function captionNeedsScrim(caption) {
  return caption.style !== 'band' && caption.pos !== 'top' && caption.text.trim() !== '';
}
