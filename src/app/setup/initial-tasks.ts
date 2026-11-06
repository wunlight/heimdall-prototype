import { databaseSeeding } from './tasks/database-seeding.task'
import { preLoadBuildings } from './tasks/preload-building.task'
import type { AppTask } from './types/task.type'

export const INITIAL_TASKS: AppTask[] = [
  {
    name: 'Database Seeding',
    action: databaseSeeding,
  },
  {
    name: 'Preload Buildings & Floors',
    action: preLoadBuildings,
  },
]
