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
import { Dm_HangHoaThiTruongDto } from '../dm-model/dm-hanghoathitruong.model';
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
  displayedColumns: string[] = ['ma', 'ten', 'donViTinhTen', 'dacTinh'];
  dataSource = new MatTableDataSource<Dm_HangHoaThiTruongDto>([]);
  isLoading = false;
  selectedRow: Dm_HangHoaThiTruongDto | null = null;

  // Phân trang
  totalCount = 0;
  pageSize = 100;
  pageNumber = 1;
  searchTerm = '';

  // Sắp xếp
  sortBy = 'CreatedDate';
  sortDescending = true;

  // Tree structure
  private treeData: Dm_HangHoaThiTruongDto[] = [];
  private expandedNodes = new Set<string>();

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  isSearching = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatTable) table!: MatTable<Dm_HangHoaThiTruongDto>;

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
      this.loadTopLevelData(); // Reload data với search term
    });

    this.loadTopLevelData();
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

  loadTopLevelData(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.hangHoaThiTruongService.getTopLevelItems().subscribe({
      next: (data: Dm_HangHoaThiTruongDto[]) => {
        // Khởi tạo tree data với level 0 và hasChildren = true (giả định có children)
        this.treeData = data.map(item => ({
          ...item,
          level: 0,
          isExpanded: false,
          hasChildren: true, // Giả định có children, sẽ kiểm tra khi expand
          children: []
        }));
        
        this.updateDisplayData();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Lỗi khi tải dữ liệu cấp cao nhất:', error);
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
  toggleNode(node: Dm_HangHoaThiTruongDto): void {
    if (!node.hasChildren) return;

    if (node.isExpanded) {
      // Collapse node
      node.isExpanded = false;
      this.expandedNodes.delete(node.id);
      this.updateDisplayData();
    } else {
      // Expand node - load children if not loaded
      if (!node.children || node.children.length === 0) {
        this.loadChildren(node);
      } else {
        node.isExpanded = true;
        this.expandedNodes.add(node.id);
        this.updateDisplayData();
      }
    }
  }

  loadChildren(parentNode: Dm_HangHoaThiTruongDto): void {
    this.isLoading = true;
    
    const request = {
      pageNumber: 1,
      pageSize: 1000, // Load all children
      sortBy: this.sortBy,
      sortDescending: this.sortDescending
    };

    this.hangHoaThiTruongService.getChildren(parentNode.id, request, this.searchTerm).subscribe({
      next: (result) => {
        const children = result.items.map(item => ({
          ...item,
          level: (parentNode.level || 0) + 1,
          isExpanded: false,
          hasChildren: true, // Giả định có children
          children: []
        }));

        parentNode.children = children;
        parentNode.isExpanded = true;
        parentNode.hasChildren = children.length > 0;
        this.expandedNodes.add(parentNode.id);
        
        this.updateDisplayData();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Lỗi khi tải dữ liệu con:', error);
        this.showNotification('Không thể tải dữ liệu con, vui lòng thử lại sau', 'error');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
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
      this.loadTopLevelData();
    }
  }

  // Map tên cột từ frontend sang backend
  private mapSortColumn(column: string): string {
    const columnMap: { [key: string]: string } = {
      'ma': 'Ma',
      'ten': 'Ten',
      'donViTinhTen': 'DonViTinhTen',
      'dacTinh': 'DacTinh'
    };
    return columnMap[column] || 'CreatedDate';
  }

  // Xóa bộ lọc tìm kiếm
  clearSearch(): void {
    this.searchTerm = '';
    this.pageNumber = 1;
    this.loadTopLevelData();
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
    // TODO: Implement delete
    this.showNotification('Chức năng đang phát triển', 'error');
  }

  openDialog(hangHoa?: Dm_HangHoaThiTruongDto): void {
    // TODO: Implement dialog
    this.showNotification('Chức năng đang phát triển', 'error');
  }

  importExcel(): void {
    // TODO: Implement import
    this.showNotification('Chức năng đang phát triển', 'error');
  }

  showNotification(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Đóng', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: type === 'success' ? ['success-snackbar'] : ['error-snackbar']
    });
  }

  selectRow(row: Dm_HangHoaThiTruongDto): void {
    this.selectedRow = this.selectedRow === row ? null : row;
  }

  // Add method to handle direct search input
  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm);
  }

  // Add method to handle search button click
  onSearch(): void {
    this.loadTopLevelData();
  }

  // Utility methods for tree display
  getIndentation(level: number): string {
    return `${level * 20}px`;
  }

  hasChildren(node: Dm_HangHoaThiTruongDto): boolean {
    return node.hasChildren || false;
  }

  isExpanded(node: Dm_HangHoaThiTruongDto): boolean {
    return node.isExpanded || false;
  }
}
