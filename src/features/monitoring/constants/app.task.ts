import { databaseSeeding, loadBuildings } from '../services/task.service.ts'
import type { AppTask } from '../types/task.type.ts'

export const INITIAL_TASKS: AppTask[] = [
  {
    name: 'Database Seeding',
    action: databaseSeeding,
  },
  {
    name: 'Load Buildings',
    action: loadBuildings,
  },
]
