import type { Command } from '@/types/command'
import type { Annotation } from '@/types/annotation'
import { useStore } from '@/store'

export class DeletePageCommand implements Command {
  readonly description = 'Delete page'

  constructor(
    private logicalIndex: number,
    private oldOrder: number[],
    private newOrder: number[],
    private removedAnnotations: Annotation[],
  ) {}

  execute(): void {
    const store = useStore.getState()
    store.setPageOrder(this.newOrder)
    store.clearPageAnnotations(this.logicalIndex)
  }

  undo(): void {
    const store = useStore.getState()
    store.setPageOrder(this.oldOrder)
    this.removedAnnotations.forEach((a) =>
      store.addAnnotation(this.logicalIndex, a),
    )
  }
}
