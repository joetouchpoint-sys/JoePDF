export interface Command {
  execute(): void
  undo(): void
  description: string
}

export interface HistoryState {
  stack: Command[]
  pointer: number
}
