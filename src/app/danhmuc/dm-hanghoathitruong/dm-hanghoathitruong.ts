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

import { DmHangHoaThiTruongService } from '../dm-service/dm-hanghoathitruong/dm-hanghoathitruong.api';
import { DmHangHoaThiTruongDto } from '../dm-model/dm-hanghoathitruong.model';
import { PagedRequest, PagedResult } from '../dm-model/page-result';
import { TextHighlightPipe } from '../../share/pipes/TextHighlight.pipe';

@Component({
  selector: 'app-dm-hanghoathitruong',
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
  templateUrl: './dm-hanghoathitruong.html',
  styleUrl: './dm-hanghoathitruong.css'
})
export class DmHanghoathitruong implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns: string[] = ['maHangHoa', 'tenHangHoa', 'nhomHangHoa', 'xuatXu', 'giaThiTruong', 'giaTruocDo', 'ghiChu'];
  dataSource = new MatTableDataSource<DmHangHoaThiTruongDto>([]);
  isLoading = false;
  selectedRow: DmHangHoaThiTruongDto | null = null;

  // Phân trang
  totalCount = 0;
  pageSize = 100;
  pageNumber = 1;
  searchTerm = '';

  // Sắp xếp
  sortBy = 'createdDate';
  sortDescending = true;

  // Tree structure
  private treeData: DmHangHoaThiTruongDto[] = [];
  private flatData: DmHangHoaThiTruongDto[] = [];

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  isSearching = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatTable) table!: MatTable<DmHangHoaThiTruongDto>;

  constructor(
    private hangHoaThiTruongService: DmHangHoaThiTruongService,
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

    // Load all data để xây dựng cây
    this.hangHoaThiTruongService.getAll().subscribe({
      next: (allData: DmHangHoaThiTruongDto[]) => {
        this.flatData = allData;
        this.treeData = this.hangHoaThiTruongService.buildTreeStructure(allData);
        this.updateDisplayData();
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

  updateDisplayData(): void {
    const flattenedData = this.hangHoaThiTruongService.flattenTreeForDisplay(this.treeData);
    this.dataSource.data = flattenedData;
    this.totalCount = flattenedData.length;

    // Cập nhật paginator
    if (this.paginator) {
      this.paginator.length = this.totalCount;
      this.paginator.pageSize = this.pageSize;
      this.paginator.pageIndex = this.pageNumber - 1;
    }
  }

  // Xử lý expand/collapse
  toggleNode(node: DmHangHoaThiTruongDto): void {
    if (node.hasChildren) {
      node.isExpanded = !node.isExpanded;
      this.updateDisplayData();
    }
  }

  // Xử lý sự kiện thay đổi trang
  onPageChange(event: PageEvent): void {
    this.pageNumber = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    // Tree view không cần reload dữ liệu khi thay đổi trang
  }

  // Xử lý sự kiện sắp xếp
  onSortChange(sort: Sort): void {
    if (sort.active && sort.direction) {
      this.sortBy = this.mapSortColumn(sort.active);
      this.sortDescending = sort.direction === 'desc';
      this.pageNumber = 1; // Reset về trang đầu khi sắp xếp
      this.loadData();
    }
  }

  // Map tên cột từ frontend sang backend
  private mapSortColumn(column: string): string {
    const columnMap: { [key: string]: string } = {
      'maHangHoa': 'MaHangHoa',
      'tenHangHoa': 'TenHangHoa',
      'nhomHangHoa': 'NhomHangHoa',
      'xuatXu': 'XuatXu',
      'giaThiTruong': 'GiaThiTruong'
    };
    return columnMap[column] || 'CreatedDate';
  }

  // Xóa bộ lọc tìm kiếm
  clearSearch(): void {
    this.searchTerm = '';
    this.pageNumber = 1;
    this.loadData();
  }

  editSelected(): void {
    if (!this.selectedRow) {
      this.showNotification('Vui lòng chọn một bản ghi để chỉnh sửa', 'error');
      return;
    }
    // TODO: Implement edit dialog
    this.showNotification('Chức năng đang phát triển', 'error');
  }

  deleteSelected(): void {
    if (!this.selectedRow || !this.selectedRow.id) {
      this.showNotification('Vui lòng chọn một bản ghi để xóa', 'error');
      return;
    }
    this.delete(this.selectedRow.id);
  }

  openDialog(hangHoa?: DmHangHoaThiTruongDto): void {
    // TODO: Implement dialog
    this.showNotification('Chức năng đang phát triển', 'error');
  }

  importExcel(): void {
    // TODO: Implement import
    this.showNotification('Chức năng đang phát triển', 'error');
  }

  delete(id: string): void {
    if (confirm('Bạn có chắc chắn muốn xóa hàng hóa này?')) {
      this.hangHoaThiTruongService.delete(id).subscribe({
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

  selectRow(row: DmHangHoaThiTruongDto): void {
    this.selectedRow = this.selectedRow === row ? null : row;
  }

  // Add method to handle direct search input
  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm);
  }

  // Add method to handle search button click
  onSearch(): void {
    this.performSearch();
  }

  // Implement performSearch method
  performSearch(): void {
    if (!this.searchTerm || !this.searchTerm.trim()) {
      this.loadData(); // Fall back to regular data
      return;
    }

    this.isSearching = true;
    this.isLoading = true;
    this.cdr.detectChanges();

    this.hangHoaThiTruongService.search(this.searchTerm).subscribe({
      next: (results) => {
        // Rebuild tree with search results
        this.treeData = this.hangHoaThiTruongService.buildTreeStructure(results);
        this.updateDisplayData();
        this.isSearching = false;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error searching:', error);
        this.showNotification('Lỗi khi tìm kiếm dữ liệu', 'error');
        this.isSearching = false;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Utility methods for tree display
  getIndentation(level: number): string {
    return `${level * 20}px`;
  }

  hasChildren(node: DmHangHoaThiTruongDto): boolean {
    return node.hasChildren || false;
  }

  isExpanded(node: DmHangHoaThiTruongDto): boolean {
    return node.isExpanded || false;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }
}
