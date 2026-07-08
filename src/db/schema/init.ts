import localforage from 'localforage'

localforage.config({
  name: 'PMS3',
  version: 1,
  storeName: 'tasks'
})

export const db = localforage