import { db } from '../../db/schema/init'
import type { Task } from '../../db/schema/tables'

export async function getTasksByDate(date: string): Promise<Task[]> {
  const all = await db.getItem<Record<string, Task>>('tasks') || {}
  return Object.values(all).filter(t => t.date === date)
}

export async function saveTask(task: Task) {
  const all = await db.getItem<Record<string, Task>>('tasks') || {}
  all[task.id] = task
  await db.setItem('tasks', all)
}