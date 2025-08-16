import { Component, OnInit, OnDestroy, Inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil, switchMap, startWith, map } from 'rxjs/operators';

export interface PopupTableColumn {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
}

export interface PopupTableData<T = any> {
  title: string;
  columns: PopupTableColumn[];
  searchPlaceholder?: string;
  enablePagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  loadData: (searchTerm: string, page: number, pageSize: number) => Observable<{
    items: T[];
    totalCount: number;
  }>;
  displayFn?: (item: T) => string;
  trackByFn?: (index: number, item: T) => any;
}

export interface PopupTableResult<T = any> {
  selectedItem: T;
}

@Component({
  selector: 'app-popup-table-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    
  ],
  templateUrl: './popup-table-dialog.html',
  styleUrl: './popup-table-dialog.css'
})
export class PopupTableDialog<T = any> implements OnInit, OnDestroy {
  searchControl = new FormControl('');
  displayedColumns: string[] = [];
  dataSource: T[] = [];
  totalCount = 0;
  pageIndex = 0;
  pageSize = 10;
  isLoading = false;
  selectedItem: T | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private dialogRef: MatDialogRef<PopupTableDialog<T>>,
    @Inject(MAT_DIALOG_DATA) public data: PopupTableData<T>,
    private cdr: ChangeDetectorRef
  ) {
    this.pageSize = data.pageSize || 10;
    this.displayedColumns = data.columns.map(col => col.key);
  }

  ngOnInit(): void {
    this.setupSearch();
    // Không gọi loadData() ở đây nữa vì setupSearch() đã xử lý
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearch(): void {
    this.searchControl.valueChanges
      .pipe(
        startWith(''), // Này sẽ trigger lần đầu với empty string
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
        switchMap(searchTerm => {
          this.pageIndex = 0; // Reset to first page when searching
          return this.loadDataInternal(searchTerm || '', this.pageIndex, this.pageSize);
        })
      )
      .subscribe();
  }

  private loadDataInternal(
    searchTerm: string,
    page: number,
    pageSize: number
  ): Observable<{ items: T[]; totalCount: number }> {
    this.isLoading = true;
    this.cdr.markForCheck();

    const actualPage = this.data.enablePagination === false ? 1 : page + 1;

    return this.data.loadData(searchTerm, actualPage, pageSize).pipe(
      takeUntil(this.destroy$),
      map(result => {
        this.dataSource = result.items;
        this.totalCount = result.totalCount;
        this.isLoading = false;
        this.selectedItem = null;
        this.cdr.markForCheck();
        return result;
      })
    );
  }

  onPageChange(event: PageEvent): void {
    // Chỉ xử lý page change nếu pagination được bật
    if (this.data.enablePagination !== false) {
      this.pageIndex = event.pageIndex;
      this.pageSize = event.pageSize;
      const searchTerm = this.searchControl.value || '';
      this.loadDataInternal(searchTerm, this.pageIndex, this.pageSize).subscribe();
    }
  }

  onRowClick(item: T): void {
    this.selectedItem = item;
    this.cdr.markForCheck();
  }

  onRowDoubleClick(item: T): void {
    this.selectedItem = item;
    this.onConfirm();
  }

  onConfirm(): void {
    if (this.selectedItem) {
      const result: PopupTableResult<T> = {
        selectedItem: this.selectedItem
      };
      this.dialogRef.close(result);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getColumnWidth(column: PopupTableColumn): string {
    return column.width || 'auto';
  }

  getDisplayValue(item: T, columnKey: string): string {
    const value = (item as any)[columnKey];
    return value != null ? value.toString() : '';
  }

  trackByFn = (index: number, item: T): any => {
    if (this.data.trackByFn) {
      return this.data.trackByFn(index, item);
    }
    return (item as any).id || index;
  }

  get isPaginationEnabled(): boolean {
    return this.data.enablePagination !== false && this.totalCount > this.pageSize;
  }

  get pageSizeOptions(): number[] {
    return this.data.pageSizeOptions || [5, 10, 25, 50];
  }
}
