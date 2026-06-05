import type { Command } from '@/types/command'
import { useStore } from '@/store'

export class ReorderPagesCommand implements Command {
  readonly description = 'Reorder pages'

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
