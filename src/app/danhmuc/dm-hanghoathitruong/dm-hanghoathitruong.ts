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
import { DmHanghoathitruongDialog } from './dm-hanghoathitruong-dialog/dm-hanghoathitruong-dialog';

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
  
  // Constants
  private readonly CHILDREN_PAGE_SIZE = 150;
  private readonly SCROLL_THRESHOLD = 0.8;
  
  // Simplified tracking
  private nodeStates = new Map<string, {
    loading: boolean;
    pageNumber: number;
    hasMore: boolean;
  }>();

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
    this.setupSearch();
    this.loadTopLevelData();
  }

  ngAfterViewInit(): void {
    this.setupPaginator();
    this.setupSort();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearch(): void {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(term => {
        this.searchTerm = term;
        this.pageNumber = 1;
        this.loadTopLevelData();
      });
  }

  private setupPaginator(): void {
    if (this.paginator) {
      this.paginator.pageSize = this.pageSize;
      this.paginator.pageIndex = this.pageNumber - 1;
    }
  }

  private setupSort(): void {
    if (this.sort) {
      this.sort.active = this.sortBy;
      this.sort.direction = this.sortDescending ? 'desc' : 'asc';
    }
  }

  loadTopLevelData(): void {
    this.setLoading(true);

    this.hangHoaThiTruongService.getTopLevelItems().subscribe({
      next: (data: Dm_HangHoaThiTruongDto[]) => {
        this.treeData = data.map(item => ({
          ...item,
          level: 0,
          isExpanded: false,
          children: []
        }));
        this.updateDisplayData();
        this.setLoading(false);
      },
      error: () => {
        this.showNotification('Không thể tải dữ liệu, vui lòng thử lại sau', 'error');
        this.setLoading(false);
      }
    });
  }

  private setLoading(loading: boolean): void {
    this.isLoading = loading;
    this.cdr.detectChanges();
  }

  updateDisplayData(): void {
    const flattenedData = this.hangHoaThiTruongService.flattenTreeForDisplay(this.treeData);
    
    const processedData = flattenedData.map(item => ({
      ...item,
      hasChildren: item.isParent === true,
      isNodeExpanded: item.isExpanded || false
    }));
    
    this.dataSource.data = processedData;
    this.totalCount = processedData.length;

    this.updatePaginator();
    this.cdr.markForCheck();
  }

  private updatePaginator(): void {
    if (this.paginator) {
      this.paginator.length = this.totalCount;
      this.paginator.pageSize = this.pageSize;
      this.paginator.pageIndex = this.pageNumber - 1;
    }
  }

  toggleNode(node: Dm_HangHoaThiTruongDto): void {
    if (!node.isParent) return;

    const treeNode = this.findNodeInTree(node.id);
    if (!treeNode) return;

    if (treeNode.isExpanded) {
      this.collapseNode(treeNode);
    } else {
      this.expandNode(treeNode);
    }
  }

  private collapseNode(node: Dm_HangHoaThiTruongDto): void {
    node.isExpanded = false;
    this.expandedNodes.delete(node.id);
    this.updateDisplayData();
  }

  private expandNode(node: Dm_HangHoaThiTruongDto): void {
    if (!node.children || node.children.length === 0) {
      this.loadChildren(node, false);
    } else {
      node.isExpanded = true;
      this.expandedNodes.add(node.id);
      this.updateDisplayData();
    }
  }

  loadChildren(parentNode: Dm_HangHoaThiTruongDto, loadMore: boolean = false): void {
    const parentId = parentNode.id;
    const state = this.getNodeState(parentId);
    
    if (state.loading) return;

    this.setNodeLoading(parentId, true);
    
    const currentPage = loadMore ? state.pageNumber + 1 : 1;
    const request: PagedRequest = {
      pageNumber: currentPage,
      pageSize: this.CHILDREN_PAGE_SIZE,
      sortBy: 'Ma',
      sortDescending: false
    };

    this.hangHoaThiTruongService.getChildren(parentNode.id, request, this.searchTerm).subscribe({
      next: (result) => {
        const newChildren = result.items.map(item => ({
          ...item,
          level: (parentNode.level || 0) + 1,
          isExpanded: false,
          children: []
        }));

        this.updateTreeWithChildren(parentId, newChildren, loadMore);
        this.updateNodeState(parentId, currentPage, newChildren.length === this.CHILDREN_PAGE_SIZE);
        this.setNodeLoading(parentId, false);
        this.updateDisplayData();
      },
      error: (error) => {
        console.error('❌ loadChildren ERROR:', error);
        this.setNodeLoading(parentId, false);
        this.showNotification('Không thể tải dữ liệu con, vui lòng thử lại sau', 'error');
      }
    });
  }

  private getNodeState(nodeId: string) {
    if (!this.nodeStates.has(nodeId)) {
      this.nodeStates.set(nodeId, { loading: false, pageNumber: 1, hasMore: true });
    }
    return this.nodeStates.get(nodeId)!;
  }

  private setNodeLoading(nodeId: string, loading: boolean): void {
    const state = this.getNodeState(nodeId);
    state.loading = loading;
    this.cdr.markForCheck();
  }

  private updateNodeState(nodeId: string, pageNumber: number, hasMore: boolean): void {
    const state = this.getNodeState(nodeId);
    state.pageNumber = pageNumber;
    state.hasMore = hasMore;
  }

  private updateTreeWithChildren(parentId: string, newChildren: Dm_HangHoaThiTruongDto[], loadMore: boolean): void {
    const treeParent = this.findNodeInTree(parentId);
    if (!treeParent) return;

    if (loadMore && treeParent.children) {
      treeParent.children = [...treeParent.children, ...newChildren];
    } else {
      treeParent.children = newChildren;
      treeParent.isExpanded = true;
      this.expandedNodes.add(parentId);
    }
  }

  private findNodeInTree(nodeId: string): Dm_HangHoaThiTruongDto | null {
    const findNode = (nodes: Dm_HangHoaThiTruongDto[]): Dm_HangHoaThiTruongDto | null => {
      for (const node of nodes) {
        if (node.id === nodeId) return node;
        if (node.children) {
          const found = findNode(node.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    return findNode(this.treeData);
  }

  // Event handlers
  onTableScroll(event: Event): void {
    const element = event.target as HTMLElement;
    const scrollPercentage = (element.scrollTop + element.clientHeight) / element.scrollHeight;
    
    if (scrollPercentage >= this.SCROLL_THRESHOLD) {
      this.loadMoreChildrenIfNeeded();
    }
  }

  private loadMoreChildrenIfNeeded(): void {
    this.findExpandedParentsNeedingMore().forEach(parent => {
      const state = this.getNodeState(parent.id);
      if (state.hasMore && !state.loading) {
        this.loadChildren(parent, true);
      }
    });
  }

  private findExpandedParentsNeedingMore(): Dm_HangHoaThiTruongDto[] {
    const result: Dm_HangHoaThiTruongDto[] = [];
    
    const checkNode = (node: Dm_HangHoaThiTruongDto) => {
      const state = this.getNodeState(node.id);
      if (node.isExpanded && node.children && state.hasMore) {
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
    this.nodeStates.clear();
    this.expandedNodes.clear();
    this.loadTopLevelData();
  }

  // Dialog operations
  openDialog(hangHoa?: Dm_HangHoaThiTruongDto): void {
    this.openDialogWithData(hangHoa, hangHoa ? 'edit' : 'create');
  }

  editSelected(): void {
    if (!this.selectedRow) {
      this.showNotification('Vui lòng chọn một bản ghi để chỉnh sửa', 'error');
      return;
    }
    this.openDialogWithData(this.selectedRow, 'edit');
  }

  private openDialogWithData(hangHoa: Dm_HangHoaThiTruongDto | undefined, mode: 'edit' | 'create'): void {
    const dialogRef = this.dialog.open(DmHanghoathitruongDialog, {
      width: '1200px',
      maxWidth: '95vw',
      height: 'auto',
      maxHeight: '90vh',
      data: { hangHoa, mode },
      disableClose: true,
      panelClass: 'custom-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const message = mode === 'edit' ? 'Cập nhật hàng hóa thành công' : 'Thêm mới hàng hóa thành công';
        this.showNotification(message, 'success');
        
        setTimeout(() => {
          this.loadTopLevelData();
        }, 100);
      }
    });
  }

  deleteSelected(): void {
    if (!this.selectedRow?.id) {
      this.showNotification('Vui lòng chọn một bản ghi để xóa', 'error');
      return;
    }
    this.showNotification('Chức năng đang phát triển', 'error');
  }

  importExcel(): void {
    this.showNotification('Chức năng đang phát triển', 'error');
  }

  // Utility methods
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

  canLoadMore(parentId: string): boolean {
    const state = this.getNodeState(parentId);
    return state.hasMore && !state.loading;
  }

  isLoadingChildren(parentId: string): boolean {
    return this.getNodeState(parentId).loading;
  }
}