export interface AppTask {
  name: string
  weight?: number
  action: (updateProgress: (msg: string) => void) => Promise<void>
}
