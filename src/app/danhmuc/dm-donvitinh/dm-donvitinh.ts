import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTable } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatNativeDateModule } from '@angular/material/core';

import { DmDonvitinh as DmDonvitinhService } from '../dm-service/dm-donvitinh/dm-donvitinh.api';
import { DmDonViTinhDto } from '../dm-model/dm-donvitinh.model';
import { DmDonvitinhDialogComponent } from './dm-donvitinh-dialog/dm-donvitinh-dialog';

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
    MatNativeDateModule
  ],
  templateUrl: './dm-donvitinh.html',
  styleUrl: './dm-donvitinh.css'
})
export class DmDonvitinh implements OnInit {
  displayedColumns: string[] = ['ma', 'ten', 'ghiChu', 'ngayHieuLuc', 'ngayHetHieuLuc', 'actions'];
  dataSource: DmDonViTinhDto[] = [];
  isLoading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatTable) table!: MatTable<DmDonViTinhDto>;

  constructor(
    private donViTinhService: DmDonvitinhService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef  
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.cdr.detectChanges(); 
    
    this.donViTinhService.getAll().subscribe({
      next: (data) => {
        this.dataSource = data;
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

  openDialog(donViTinh?: DmDonViTinhDto): void {
    const dialogRef = this.dialog.open(DmDonvitinhDialogComponent, {
      width: '500px',
      data: donViTinh || null
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
}
