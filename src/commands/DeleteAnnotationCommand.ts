import type { Command } from '@/types/command'
import type { Annotation } from '@/types/annotation'
import { useStore } from '@/store'

export class DeleteAnnotationCommand implements Command {
  readonly description: string

  constructor(
    private pageIndex: number,
    private annotation: Annotation,
  ) {
    this.description = `Delete ${annotation.type}`
  }

  execute(): void {
    useStore.getState().removeAnnotation(this.pageIndex, this.annotation.id)
  }

  undo(): void {
    useStore.getState().addAnnotation(this.pageIndex, this.annotation)
  }
}
