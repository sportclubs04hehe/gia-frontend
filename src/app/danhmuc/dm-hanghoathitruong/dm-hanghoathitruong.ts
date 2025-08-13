import {
  Component,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
  AfterViewInit,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatTableModule,
  MatTable,
  MatTableDataSource
} from '@angular/material/table';
import {
  MatPaginatorModule,
  MatPaginator,
  PageEvent
} from '@angular/material/paginator';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  MatSnackBar,
  MatSnackBarModule
} from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { ScrollingModule, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

import { DmHangHoaThiTruongService } from '../dm-service/dm-hanghoathitruong/dm-hanghoathitruong.api';
import { Dm_HangHoaThiTruongDto } from '../dm-model/dm-hanghoathitruong.model';
import { TextHighlightPipe } from '../../share/pipes/TextHighlight.pipe';
import { PagedRequest } from '../dm-model/page-result';

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
    TextHighlightPipe,
    ScrollingModule
  ],
  templateUrl: './dm-hanghoathitruong.html',
  styleUrl: './dm-hanghoathitruong.css'
})
export class DmHanghoathitruong implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns: string[] = ['ma', 'ten', 'donViTinhTen', 'dacTinh'];
  dataSource = new MatTableDataSource<Dm_HangHoaThiTruongDto>([]);
  isLoading = false;
  selectedRow: Dm_HangHoaThiTruongDto | null = null;

  totalCount = 0;
  pageSize = 100;
  pageNumber = 1;
  searchTerm = '';

  sortBy = 'CreatedDate';
  sortDescending = true;

  private treeData: Dm_HangHoaThiTruongDto[] = [];
  private expandedNodes = new Set<string>();

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  isSearching = false;

  // Constants
  private readonly CHILDREN_PAGE_SIZE = 150;
  private readonly SCROLL_THRESHOLD = 0.8; // Load more when 80% scrolled
  
  // Track loading state for each parent
  private loadingChildren = new Map<string, boolean>();
  private childrenPageNumbers = new Map<string, number>();
  private childrenHasMore = new Map<string, boolean>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatTable) table!: MatTable<Dm_HangHoaThiTruongDto>;
  @ViewChild(CdkVirtualScrollViewport) virtualScrollViewport!: CdkVirtualScrollViewport;

  constructor(
    private hangHoaThiTruongService: DmHangHoaThiTruongService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(term => {
        this.searchTerm = term;
        this.pageNumber = 1;
        this.loadTopLevelData();
      });

    this.loadTopLevelData();
  }

  ngAfterViewInit(): void {
    if (this.paginator) {
      this.paginator.pageSize = this.pageSize;
      this.paginator.pageIndex = this.pageNumber - 1;
    }

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
        this.treeData = data.map(item => ({
          ...item,
          level: 0,
          isExpanded: false,
          hasChildren: item.hasChildren,
          children: []
        }));
        this.updateDisplayData();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
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

    if (this.paginator) {
      this.paginator.length = this.totalCount;
      this.paginator.pageSize = this.pageSize;
      this.paginator.pageIndex = this.pageNumber - 1;
    }
  }

  toggleNode(node: Dm_HangHoaThiTruongDto): void {
    if (!node.hasChildren) return;

    if (node.isExpanded) {
      // Collapse
      node.isExpanded = false;
      this.expandedNodes.delete(node.id);
      this.updateDisplayData();
    } else {
      // Expand
      if (!node.children || node.children.length === 0) {
        // First time loading
        this.loadChildren(node, false);
      } else {
        // Already has data, just expand
        node.isExpanded = true;
        this.expandedNodes.add(node.id);
        this.updateDisplayData();
      }
    }
  }

  loadChildren(parentNode: Dm_HangHoaThiTruongDto, loadMore: boolean = false): void {
    const parentId = parentNode.id;
    
    // Prevent duplicate loading
    if (this.loadingChildren.get(parentId)) {
      return;
    }

    this.loadingChildren.set(parentId, true);
    
    // Get current page number for this parent
    let currentPage = this.childrenPageNumbers.get(parentId) || 1;
    if (loadMore) {
      currentPage++;
    } else {
      currentPage = 1; // Reset for fresh load
    }

    const request: PagedRequest = {
      pageNumber: currentPage,
      pageSize: this.CHILDREN_PAGE_SIZE,
      sortBy: 'Ma', // Fixed sort for children
      sortDescending: false // Thêm dòng này - mặc định sort ascending
    };

    this.hangHoaThiTruongService.getChildren(parentNode.id, request, this.searchTerm).subscribe({
      next: (result) => {
        const newChildren = result.items.map(item => ({
          ...item,
          level: (parentNode.level || 0) + 1,
          isExpanded: false,
          hasChildren: item.hasChildren,
          children: []
        }));

        if (loadMore && parentNode.children) {
          // Append to existing children
          parentNode.children = [...parentNode.children, ...newChildren];
        } else {
          // Fresh load
          parentNode.children = newChildren;
          parentNode.isExpanded = true;
          this.expandedNodes.add(parentNode.id);
        }

        // Update tracking
        this.childrenPageNumbers.set(parentId, currentPage);
        this.childrenHasMore.set(parentId, newChildren.length === this.CHILDREN_PAGE_SIZE);
        this.loadingChildren.set(parentId, false);

        this.updateDisplayData();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ loadChildren ERROR:', error);
        this.loadingChildren.set(parentId, false);
        this.showNotification('Không thể tải dữ liệu con, vui lòng thử lại sau', 'error');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Handle scroll events for lazy loading
  onTableScroll(event: Event): void {
    const element = event.target as HTMLElement;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;
    
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
    
    // Load more when scrolled 80%
    if (scrollPercentage >= this.SCROLL_THRESHOLD) {
      this.loadMoreChildrenIfNeeded();
    }
  }

  private loadMoreChildrenIfNeeded(): void {
    // Find parent nodes that are expanded and can load more
    const expandedParents = this.findExpandedParentsNeedingMore();
    
    expandedParents.forEach(parent => {
      if (this.childrenHasMore.get(parent.id) && !this.loadingChildren.get(parent.id)) {
        this.loadChildren(parent, true);
      }
    });
  }

  private findExpandedParentsNeedingMore(): Dm_HangHoaThiTruongDto[] {
    const result: Dm_HangHoaThiTruongDto[] = [];
    
    const checkNode = (node: Dm_HangHoaThiTruongDto) => {
      if (node.isExpanded && node.children && this.childrenHasMore.get(node.id)) {
        result.push(node);
      }
      
      if (node.children) {
        node.children.forEach(child => checkNode(child));
      }
    };
    
    this.treeData.forEach(node => checkNode(node));
    return result;
  }

  onPageChange(event: PageEvent): void {
    this.pageNumber = event.pageIndex + 1;
    this.pageSize = event.pageSize;
  }

  onSortChange(sort: Sort): void {
    if (sort.active && sort.direction) {
      this.sortBy = this.mapSortColumn(sort.active);
      this.sortDescending = sort.direction === 'desc';
      this.pageNumber = 1;
      this.loadTopLevelData();
    }
  }

  private mapSortColumn(column: string): string {
    const columnMap: { [key: string]: string } = {
      'ma': 'Ma',
      'ten': 'Ten',
      'donViTinhTen': 'DonViTinhTen',
      'dacTinh': 'DacTinh'
    };
    return columnMap[column] || 'CreatedDate';
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.pageNumber = 1;
    
    // Clear children tracking
    this.childrenPageNumbers.clear();
    this.childrenHasMore.clear();
    this.loadingChildren.clear();
    this.expandedNodes.clear();
    
    this.loadTopLevelData();
  }

  editSelected(): void {
    if (!this.selectedRow) {
      this.showNotification('Vui lòng chọn một bản ghi để chỉnh sửa', 'error');
      return;
    }
    this.showNotification('Chức năng đang phát triển', 'error');
  }

  deleteSelected(): void {
    if (!this.selectedRow || !this.selectedRow.id) {
      this.showNotification('Vui lòng chọn một bản ghi để xóa', 'error');
      return;
    }
    this.showNotification('Chức năng đang phát triển', 'error');
  }

  openDialog(hangHoa?: Dm_HangHoaThiTruongDto): void {
    this.showNotification('Chức năng đang phát triển', 'error');
  }

  importExcel(): void {
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

  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm);
  }

  onSearch(): void {
    this.loadTopLevelData();
  }

  getIndentation(level: number): string {
    return `${level * 20}px`;
  }

  hasChildren(node: Dm_HangHoaThiTruongDto): boolean {
    return node.hasChildren || false;
  }

  isExpanded(node: Dm_HangHoaThiTruongDto): boolean {
    return node.isExpanded || false;
  }

  // Helper method to check if parent can load more
  canLoadMore(parentId: string): boolean {
    return this.childrenHasMore.get(parentId) === true && 
           this.loadingChildren.get(parentId) !== true;
  }

  // Helper method to get loading state
  isLoadingChildren(parentId: string): boolean {
    return this.loadingChildren.get(parentId) === true;
  }
}