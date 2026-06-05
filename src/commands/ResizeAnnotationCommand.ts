import type { Command } from '@/types/command'
import { useStore } from '@/store'

interface Geometry {
  x: number
  y: number
  width: number
  height: number
}

export class ResizeAnnotationCommand implements Command {
  readonly description = 'Resize'

  constructor(
    private pageIndex: number,
    private id: string,
    private oldGeometry: Geometry,
    private newGeometry: Geometry,
  ) {}

  execute(): void {
    useStore.getState().updateAnnotation(this.pageIndex, this.id, this.newGeometry)
  }

  undo(): void {
    useStore.getState().updateAnnotation(this.pageIndex, this.id, this.oldGeometry)
  }
}
