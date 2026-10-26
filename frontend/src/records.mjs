export function availablePage(page, pages) {
  return Math.max(1, Math.min(page, Math.max(1, pages)));
}
