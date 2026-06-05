import type { Command } from '@/types/command'
import type { Annotation } from '@/types/annotation'
import { useStore } from '@/store'

export class AddAnnotationCommand implements Command {
  readonly description: string

  constructor(
    private pageIndex: number,
    private annotation: Annotation,
  ) {
    this.description = `Add ${annotation.type}`
  }

  execute(): void {
    useStore.getState().addAnnotation(this.pageIndex, this.annotation)
  }

  undo(): void {
    useStore.getState().removeAnnotation(this.pageIndex, this.annotation.id)
  }
}
