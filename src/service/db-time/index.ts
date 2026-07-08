export function getToday() {
  return new Date().toISOString().slice(0, 10)
}