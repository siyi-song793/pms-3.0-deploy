export function listenSwipe(el: HTMLElement, onSwipeLeft: () => void, onSwipeRight: () => void) {
  let startX = 0
  el.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX
  })
  el.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX
    if (dx < -50) onSwipeLeft()
    if (dx > 50) onSwipeRight()
  })
}