type Callback = (...args: any[]) => void

const bus: Record<string, Callback[]> = {}

export const eventBus = {
  on(key: string, cb: Callback) {
    bus[key] = bus[key] || []
    bus[key].push(cb)
  },
  emit(key: string, ...args: any[]) {
    bus[key]?.forEach(cb => cb(...args))
  }
}