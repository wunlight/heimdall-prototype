import { hydrateEntities } from '../composables/task/hydrate-entities.task'
import { versionCheck } from '../composables/task/version-check.task'
import type { AppTask } from '../types/app-task.type'

export const INITIAL_TASKS: AppTask[] = [
  {
    name: 'Version Check',
    weight: 1,
    action: versionCheck,
  },
  {
    name: 'Hydrate Entities',
    weight: 3,
    action: hydrateEntities,
  },
]
