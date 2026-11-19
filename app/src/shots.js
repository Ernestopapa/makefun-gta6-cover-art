// Fixed scenes for screenshots: ?shot=editor shows the page with sample photos;
// ?shot=cover shows the cover alone. `layout`, `grade`, `cstyle`, `cpos`, `csize`,
// `dy` (the first panel's vertical photo shift), `photo` (the first sample) and
// `caption` come from the query.
// window.__shotReady is set once painted.
export async function runShot(shot, query, setup) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  await setup(query);
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
