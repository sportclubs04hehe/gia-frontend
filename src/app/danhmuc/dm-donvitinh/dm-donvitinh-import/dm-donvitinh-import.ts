import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import * as XLSX from 'xlsx';
import { DmDonvitinh } from '../../dm-service/dm-donvitinh/dm-donvitinh.api';
import { DmDonViTinhImportDto } from '../../dm-model/dm-donvitinh.model';
import { ImportErrorDto, ImportResultDto } from '../../dm-model/import-model';
import { MatTooltipModule } from '@angular/material/tooltip';
import { saveAs } from 'file-saver'; 

@Component({
  selector: 'app-dm-donvitinh-import',
  standalone: true,
  imports: [
    CommonModule,
    MatStepperModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule
  ],
  templateUrl: './dm-donvitinh-import.html',
  styleUrls: ['./dm-donvitinh-import.css']
})
export class DmDonvitinhImport implements OnInit {
  @ViewChild('fileInput') fileInput: any;
  isLoading = false;
  currentStep = 0;
  selectedFile: File | null = null;
  importData: DmDonViTinhImportDto[] = [];
  dataSource = new MatTableDataSource<DmDonViTinhImportDto & { hasError?: boolean, errorMessage?: string }>();
  displayedColumns: string[] = ['rowNum', 'ma', 'ten', 'ghiChu', 'status'];
  importResult: ImportResultDto | null = null;

  constructor(
    private donViTinhService: DmDonvitinh,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<DmDonvitinhImport>
  ) {}

  ngOnInit(): void {}

  /**
   * Tải file mẫu Excel về
   */
  downloadTemplate(): void {
    try {
      // Trong trường hợp thực, sẽ gọi API để lấy template
      // Trong demo này, chúng ta tạo file mẫu trực tiếp
      const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet([
        { 'Mã': 'DVT001', 'Tên': 'Cái', 'Ghi chú': 'Đơn vị đếm cơ bản' },
        { 'Mã': 'DVT002', 'Tên': 'Thùng', 'Ghi chú': '24 chai/thùng' }
      ]);
      
      const workbook: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Đơn vị tính');
      
      // Xuất file Excel
      const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'mau_don_vi_tinh.xlsx');
      
      this.showNotification('Tải file mẫu thành công', 'success');
    } catch (error) {
      console.error('Error downloading template:', error);
      this.showNotification('Không thể tải file mẫu', 'error');
    }
  }

  /**
   * Chọn file để import
   */
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    // Kiểm tra định dạng file
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (fileExt !== 'xlsx' && fileExt !== 'xls') {
      this.showNotification('Chỉ chấp nhận file Excel (.xlsx, .xls)', 'error');
      this.resetFileInput();
      return;
    }

    // Kiểm tra kích thước file (tối đa 10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.showNotification('Kích thước file vượt quá 10MB', 'error');
      this.resetFileInput();
      return;
    }

    this.selectedFile = file;
    this.readExcelFile(file);
  }

  /**
   * Đọc nội dung file Excel và hiển thị trong bảng
   */
  readExcelFile(file: File): void {
    this.isLoading = true;
    const reader = new FileReader();

    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Chuyển đổi dữ liệu Excel sang JSON
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 'A' });
        
        if (jsonData.length <= 1) {
          this.showNotification('File không có dữ liệu', 'error');
          this.isLoading = false;
          this.resetFileInput();
          return;
        }
        
        // Xác định header row
        const headerRow = jsonData[0];
        if (!headerRow['A'] || !headerRow['B'] || !headerRow['C']) {
          this.showNotification('File không đúng định dạng, thiếu cột header', 'error');
          this.isLoading = false;
          this.resetFileInput();
          return;
        }

        // Kiểm tra tên cột header
        if (headerRow['A'] !== 'Mã' || headerRow['B'] !== 'Tên') {
          this.showNotification('File không đúng định dạng, tên cột không đúng', 'error');
          this.isLoading = false;
          this.resetFileInput();
          return;
        }

        // Bỏ qua header row và chuyển đổi dữ liệu
        this.importData = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row['A'] && !row['B'] && !row['C']) continue; // Bỏ qua dòng trống
          
          this.importData.push({
            ma: row['A'] || '',
            ten: row['B'] || '',
            ghiChu: row['C'] || ''
          });
        }
        
        // Cập nhật bảng dữ liệu
        this.dataSource.data = this.importData.map((item, index) => ({
          ...item,
          rowNum: index + 1,
          hasError: false
        }));
        
        // Nếu không có dữ liệu hợp lệ
        if (this.importData.length === 0) {
          this.showNotification('Không tìm thấy dữ liệu hợp lệ trong file', 'error');
          this.resetFileInput();
        } else {
          this.currentStep = 1; // Chuyển sang bước xem trước dữ liệu
        }
      } catch (error) {
        console.error('Error reading Excel file:', error);
        this.showNotification('Không thể đọc file Excel', 'error');
        this.resetFileInput();
      } finally {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    };

    reader.onerror = () => {
      this.isLoading = false;
      this.showNotification('Lỗi khi đọc file', 'error');
      this.resetFileInput();
      this.cdr.detectChanges();
    };

    reader.readAsArrayBuffer(file);
  }

  /**
   * Thực hiện import dữ liệu lên server
   */
  importDataToServer(): void {
    if (!this.selectedFile) {
      this.showNotification('Vui lòng chọn file để import', 'error');
      return;
    }

    this.isLoading = true;
    
    this.donViTinhService.importFromExcel(this.selectedFile).subscribe({
      next: (result: ImportResultDto) => {
        // Đánh dấu các dòng lỗi trong bảng
        if (result.errors && result.errors.length > 0) {
          const updatedData = [...this.dataSource.data];
          
          result.errors.forEach(error => {
            const rowIndex = error.row - 2;
            if (rowIndex >= 0 && rowIndex < updatedData.length) {
              updatedData[rowIndex].hasError = true;
              updatedData[rowIndex].errorMessage = error.message;
              
              if (error.columnErrors) {
                const columnErrors = Object.values(error.columnErrors).join(', ');
                updatedData[rowIndex].errorMessage = columnErrors;
              }
            }
          });
          
          this.dataSource.data = updatedData;
        }
        
        // Di chuyển TẤT CẢ các cập nhật trạng thái vào setTimeout
        setTimeout(() => {
          this.importResult = result; // Đặt importResult ở đây
          this.currentStep = 2;
          this.isLoading = false;
          
          // Hiển thị thông báo tổng quan
          if (result.successCount > 0) {
            this.showNotification(`Import thành công ${result.successCount}/${result.totalRecords} bản ghi`, 'success');
          } else {
            this.showNotification(`Import thất bại. ${result.errorCount} lỗi`, 'error');
          }
          
          // Gọi detectChanges sau khi mọi thay đổi đã hoàn tất
          this.cdr.detectChanges();
        }, 100);
      },
      error: (error) => {
        console.error('Import error:', error);
        this.showNotification('Lỗi khi import dữ liệu', 'error');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Reset quá trình import và quay lại bước đầu tiên
   */
  reset(): void {
    this.currentStep = 0;
    this.selectedFile = null;
    this.importData = [];
    this.dataSource.data = [];
    this.importResult = null;
    this.resetFileInput();
  }

  /**
   * Hoàn thành quá trình import và đóng dialog
   */
  complete(): void {
    this.donViTinhService.clearCache();
    this.dialogRef.close(true);
  }

  /**
   * Reset input file
   */
  resetFileInput(): void {
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  /**
   * Hiển thị thông báo
   */
  showNotification(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Đóng', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: type === 'success' ? ['success-snackbar'] : ['error-snackbar']
    });
  }

  objectToArray(obj: {[key: string]: string}): string[] {
    return obj ? Object.values(obj) : [];
  }
}