export function $(sel: string) {
  return document.querySelector(sel)
}

export function $$(sel: string) {
  return Array.from(document.querySelectorAll(sel))
}

export function html(id: string, content: string) {
  const el = document.getElementById(id)
  if (el) el.innerHTML = content
}