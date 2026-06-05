import type { Command } from '@/types/command'
import type { RedactAnnotation } from '@/types/annotation'
import { useStore } from '@/store'

export class AddRedactBoxCommand implements Command {
  readonly description = 'Add redaction box'

  constructor(
    private pageIndex: number,
    private annotation: RedactAnnotation,
  ) {}

  execute(): void {
    useStore.getState().addAnnotation(this.pageIndex, this.annotation)
  }

  undo(): void {
    useStore.getState().removeAnnotation(this.pageIndex, this.annotation.id)
  }
}

export class RemoveRedactBoxCommand implements Command {
  readonly description = 'Remove redaction box'

  constructor(
    private pageIndex: number,
    private annotation: RedactAnnotation,
  ) {}

  execute(): void {
    useStore.getState().removeAnnotation(this.pageIndex, this.annotation.id)
  }

  undo(): void {
    useStore.getState().addAnnotation(this.pageIndex, this.annotation)
  }
}
