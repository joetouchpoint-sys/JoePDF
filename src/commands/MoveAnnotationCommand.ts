import type { Command } from '@/types/command'
import { useStore } from '@/store'

export class MoveAnnotationCommand implements Command {
  readonly description = 'Move'

  constructor(
    private pageIndex: number,
    private id: string,
    private oldPos: { x: number; y: number },
    private newPos: { x: number; y: number },
  ) {}

  execute(): void {
    useStore.getState().updateAnnotation(this.pageIndex, this.id, this.newPos)
  }

  undo(): void {
    useStore.getState().updateAnnotation(this.pageIndex, this.id, this.oldPos)
  }
}
