import { Component, OnInit, ViewChild, ChangeDetectorRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTable, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { DmDonvitinh as DmDonvitinhService } from '../dm-service/dm-donvitinh/dm-donvitinh.api';
import { DmDonViTinhDto } from '../dm-model/dm-donvitinh.model';
import { PagedRequest, PagedResult } from '../dm-model/page-result';
import { DmDonvitinhDialogComponent } from './dm-donvitinh-dialog/dm-donvitinh-dialog';
import { DmDonvitinhImport } from './dm-donvitinh-import/dm-donvitinh-import';
import { TextHighlightPipe } from '../../share/pipes/TextHighlight.pipe';

@Component({
  selector: 'app-dm-donvitinh',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    TextHighlightPipe
  ],
  templateUrl: './dm-donvitinh.html',
  styleUrl: './dm-donvitinh.css'
})
export class DmDonvitinh implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns: string[] = ['ma', 'ten', 'ghiChu', 'ngayHieuLuc', 'ngayHetHieuLuc'];
  dataSource = new MatTableDataSource<DmDonViTinhDto>([]);
  isLoading = false;
  selectedRow: DmDonViTinhDto | null = null;

  // Phân trang
  totalCount = 0;
  pageSize = 50;
  pageNumber = 1;
  searchTerm = '';

  // Sắp xếp
  sortBy = 'CreatedDate';
  sortDescending = true;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  isSearching = false;
  
  // Chế độ tìm kiếm
  isInSearchMode = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatTable) table!: MatTable<DmDonViTinhDto>;

  constructor(
    private donViTinhService: DmDonvitinhService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Initialize search with debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      this.searchTerm = term;
      this.pageNumber = 1; // Reset to first page on search
      this.performSearch();
    });

    this.loadData();
  }

  ngAfterViewInit(): void {
    // Cấu hình paginator
    if (this.paginator) {
      this.paginator.pageSize = this.pageSize;
      this.paginator.pageIndex = this.pageNumber - 1;
    }

    // Cấu hình sort
    if (this.sort) {
      this.sort.active = this.sortBy;
      this.sort.direction = this.sortDescending ? 'desc' : 'asc';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    const request: PagedRequest = {
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      searchTerm: this.searchTerm || undefined,
      sortBy: this.sortBy,
      sortDescending: this.sortDescending
    };

    this.donViTinhService.getPaged(request).subscribe({
      next: (result: PagedResult<DmDonViTinhDto>) => {
        this.dataSource.data = result.items;
        this.totalCount = result.totalCount;

        // Cập nhật paginator
        if (this.paginator) {
          this.paginator.length = this.totalCount;
          this.paginator.pageSize = result.pageSize;
          this.paginator.pageIndex = result.pageNumber - 1;
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Lỗi khi tải dữ liệu:', error);
        this.showNotification('Không thể tải dữ liệu, vui lòng thử lại sau', 'error');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Xử lý sự kiện thay đổi trang
  onPageChange(event: PageEvent): void {
    this.pageNumber = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    
    // sử dụng chế độ tìm kiếm nếu đang có searchTerm
    if (this.searchTerm && this.searchTerm.trim()) {
      this.performSearch(false); // false: không reset trang
    } else {
      this.loadData();
    }
  }

  // Xử lý sự kiện sắp xếp
  onSortChange(sort: Sort): void {
    if (sort.active && sort.direction) {
      this.sortBy = this.mapSortColumn(sort.active);
      this.sortDescending = sort.direction === 'desc';
      this.pageNumber = 1; // Reset về trang đầu khi sắp xếp
      
      // Sử dụng chế độ tìm kiếm nếu đang tìm kiếm
      if (this.isInSearchMode && this.searchTerm) {
        this.performSearch(true);
      } else {
        this.loadData();
      }
    }
  }

  // Map tên cột từ frontend sang backend
  private mapSortColumn(column: string): string {
    const columnMap: { [key: string]: string } = {
      'ma': 'Ma',
      'ten': 'Ten',
      'ngayHieuLuc': 'NgayHieuLuc',
      'ngayHetHieuLuc': 'NgayHetHieuLuc'
    };
    return columnMap[column] || 'CreatedDate';
  }

  // Xóa bộ lọc tìm kiếm
  clearSearch(): void {
    this.searchTerm = '';
    this.pageNumber = 1;
    this.isInSearchMode = false; // Tắt chế độ tìm kiếm
    this.loadData();
  }

  editSelected(): void {
    if (!this.selectedRow) {
      this.showNotification('Vui lòng chọn một bản ghi để chỉnh sửa', 'error');
      return;
    }
    this.openDialog(this.selectedRow);
  }

  deleteSelected(): void {
    if (!this.selectedRow || !this.selectedRow.id) {
      this.showNotification('Vui lòng chọn một bản ghi để xóa', 'error');
      return;
    }
    this.delete(this.selectedRow.id);
  }

  openDialog(donViTinh?: DmDonViTinhDto): void {
    const dialogRef = this.dialog.open(DmDonvitinhDialogComponent, {
      width: '500px',
      data: donViTinh || null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData();
        this.selectedRow = null;
      }
    });
  }

  importExcel(): void {
    const dialogRef = this.dialog.open(DmDonvitinhImport, {
      width: '80%',
      maxWidth: '1200px',
      height: '90vh'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData();
      }
    });
  }

  delete(id: string): void {
    if (confirm('Bạn có chắc chắn muốn xóa đơn vị tính này?')) {
      this.donViTinhService.delete(id).subscribe({
        next: () => {
          this.showNotification('Xóa thành công', 'success');
          this.loadData();
          this.selectedRow = null;
        },
        error: (error) => {
          console.error('Lỗi khi xóa:', error);
          this.showNotification('Không thể xóa, vui lòng thử lại sau', 'error');
        }
      });
    }
  }

  showNotification(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Đóng', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: type === 'success' ? ['success-snackbar'] : ['error-snackbar']
    });
  }

  selectRow(row: DmDonViTinhDto): void {
    this.selectedRow = this.selectedRow === row ? null : row;
  }

  // Add method to handle direct search input
  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm);
  }

  // Add method to handle search button click
  onSearch(): void {
    this.performSearch(true); // true: reset về trang 1
  }

  // Update performSearch method
  performSearch(resetToFirstPage: boolean = true): void {
    if (!this.searchTerm || !this.searchTerm.trim()) {
      this.isInSearchMode = false;
      this.loadData(); // Fall back to regular paginated data
      return;
    }

    if (resetToFirstPage) {
      this.pageNumber = 1;
    }

    this.isInSearchMode = true;
    this.isLoading = true;
    this.cdr.detectChanges();

    // Log để debug
    console.log(`Searching for "${this.searchTerm}" on page ${this.pageNumber}`);

    this.donViTinhService.search(this.searchTerm, this.pageNumber, this.pageSize).subscribe({
      next: (result) => {
        this.dataSource.data = result.items;
        this.totalCount = result.totalCount;
        
        // Update paginator
        if (this.paginator) {
          this.paginator.length = this.totalCount;
          this.paginator.pageSize = result.pageSize;
          this.paginator.pageIndex = result.pageNumber - 1;
        }
        
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error searching:', error);
        this.showNotification('Lỗi khi tìm kiếm dữ liệu', 'error');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
