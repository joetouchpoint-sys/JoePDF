import type { Command } from '@/types/command'
import type { AnnotationUpdate } from '@/types/annotation'
import { useStore } from '@/store'

export class UpdateAnnotationCommand implements Command {
  readonly description = 'Update annotation'

  constructor(
    private pageIndex: number,
    private id: string,
    private oldValues: AnnotationUpdate,
    private newValues: AnnotationUpdate,
  ) {}

  execute(): void {
    useStore.getState().updateAnnotation(this.pageIndex, this.id, this.newValues)
  }

  undo(): void {
    useStore.getState().updateAnnotation(this.pageIndex, this.id, this.oldValues)
  }
}
