import { renderToday } from './today/components/TodayPage'
import { renderTimeline } from './timeline/components/TimelinePage'
import { renderCalendar } from './calendar/components/CalendarPage'

const routes: Record<string, () => void> = {
  '/': renderToday,
  '/timeline': renderTimeline,
  '/calendar': renderCalendar
}

export function initRouter() {
  function go(path: string) {
    history.pushState(null, '', path)
    render()
  }

  function render() {
    const path = location.pathname
    ;(routes[path] || renderToday)()
  }

  window.addEventListener('popstate', render)
  render()

  ;(window as any).go = go
}