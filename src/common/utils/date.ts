export function nowDate() {
  return new Date().toISOString().split('T')[0]
}

export function formatDate(d: Date) {
  return d.toLocaleDateString()
}