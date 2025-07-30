import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DmDonvitinh as DmDonvitinhService } from '../../dm-service/dm-donvitinh/dm-donvitinh.api';
import { DmDonViTinhDto, DmDonViTinhCreateDto, DmDonViTinhUpdateDto } from '../../dm-model/dm-donvitinh.model';
import { codeExistsDonViTinhValidator } from '../../../share/dm-validators/codeExistsDonViTinhValidator';
@Component({
  selector: 'app-dm-donvitinh-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './dm-donvitinh-dialog.html',
  styleUrls: ['./dm-donvitinh-dialog.css']
})
export class DmDonvitinhDialogComponent implements OnInit {
  form: FormGroup;
  isEditMode: boolean;
  dialogTitle: string;
  isCheckingCode = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DmDonvitinhDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DmDonViTinhDto | null,
    private donViTinhService: DmDonvitinhService,
    private snackBar: MatSnackBar
  ) {
    this.isEditMode = !!data;
    this.dialogTitle = this.isEditMode ? 'Chỉnh sửa đơn vị tính' : 'Thêm đơn vị tính mới';

    this.form = this.fb.group({
      ma: ['', [Validators.required, Validators.maxLength(20)]],
      ten: ['', [Validators.required, Validators.maxLength(100)]],
      ghiChu: ['', Validators.maxLength(500)],
      ngayHieuLuc: [new Date(), Validators.required],
      ngayHetHieuLuc: [new Date(new Date().setFullYear(new Date().getFullYear() + 10)), Validators.required]
    });
  }

  ngOnInit(): void {
    // Thêm async validator cho trường mã
    const excludeId = this.isEditMode ? this.data?.id : undefined;
    this.form.get('ma')?.setAsyncValidators([
      codeExistsDonViTinhValidator(this.donViTinhService, excludeId)
    ]);

    // Theo dõi trạng thái pending của field mã
    this.form.get('ma')?.statusChanges.subscribe(status => {
      this.isCheckingCode = status === 'PENDING';
    });

    if (this.isEditMode && this.data) {
      this.form.patchValue({
        ma: this.data.ma,
        ten: this.data.ten,
        ghiChu: this.data.ghiChu,
        ngayHieuLuc: new Date(this.data.ngayHieuLuc),
        ngayHetHieuLuc: new Date(this.data.ngayHetHieuLuc)
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid || this.isCheckingCode) {
      this.markFormGroupTouched();
      return;
    }

    if (this.isEditMode) {
      const updateDto: DmDonViTinhUpdateDto = {
        id: this.data!.id,
        ...this.form.value
      };

      this.donViTinhService.update(updateDto.id, updateDto).subscribe({
        next: () => {
          this.showNotification('Cập nhật thành công', 'success');
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Lỗi khi cập nhật:', error);
          this.showNotification('Không thể cập nhật, vui lòng thử lại sau', 'error');
        }
      });
    } else {
      const createDto: DmDonViTinhCreateDto = this.form.value;

      this.donViTinhService.create(createDto).subscribe({
        next: () => {
          this.showNotification('Thêm mới thành công', 'success');
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Lỗi khi thêm mới:', error);
          this.showNotification('Không thể thêm mới, vui lòng thử lại sau', 'error');
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control?.markAsTouched();
    });
  }

  showNotification(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Đóng', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: type === 'success' ? ['success-snackbar'] : ['error-snackbar']
    });
  }

  // Getter để kiểm tra trạng thái form
  get isFormValid(): boolean {
    return this.form.valid && !this.isCheckingCode;
  }
}