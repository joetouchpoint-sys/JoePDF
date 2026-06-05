import type { Command } from '@/types/command'
import { useStore } from '@/store'

export class DuplicatePageCommand implements Command {
  readonly description = 'Duplicate page'

  constructor(
    private oldOrder: number[],
    private newOrder: number[],
  ) {}

  execute(): void {
    useStore.getState().setPageOrder(this.newOrder)
  }

  undo(): void {
    useStore.getState().setPageOrder(this.oldOrder)
  }
}
