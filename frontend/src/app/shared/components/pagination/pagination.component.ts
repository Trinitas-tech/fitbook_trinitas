import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (pageCount() > 1) {
      <nav class="pagination" aria-label="Pagination">
        <button type="button" class="btn btn-outline btn-sm" [disabled]="page() <= 1" (click)="go(page() - 1)">
          ‹ Précédent
        </button>
        <span class="muted small">Page {{ page() }} / {{ pageCount() }} · {{ total() }} résultat(s)</span>
        <button type="button" class="btn btn-outline btn-sm" [disabled]="page() >= pageCount()" (click)="go(page() + 1)">
          Suivant ›
        </button>
      </nav>
    }
  `,
  styles: `
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin-top: 20px;
      flex-wrap: wrap;
    }
  `,
})
export class PaginationComponent {
  readonly page = input(1);
  readonly total = input(0);
  readonly limit = input(20);
  readonly pageChange = output<number>();

  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.total() / Math.max(1, this.limit()))));

  go(page: number): void {
    if (page >= 1 && page <= this.pageCount()) {
      this.pageChange.emit(page);
    }
  }
}
