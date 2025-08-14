import { Component, OnInit, Inject, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { DmHangHoaThiTruongService } from '../../dm-service/dm-hanghoathitruong/dm-hanghoathitruong.api';
import { DmDonvitinh } from '../../dm-service/dm-donvitinh/dm-donvitinh.api';
import { 
  Dm_HangHoaThiTruongDto, 
  Dm_HangHoaThiTruongTreeDto,
  DmHangHoaThiTruongCreateDto, 
  DmHangHoaThiTruongUpdateDto 
} from '../../dm-model/dm-hanghoathitruong.model';
import { DmDonViTinhDto } from '../../dm-model/dm-donvitinh.model';
import { PagedRequest } from '../../dm-model/page-result';
import { codeExistsHangHoaTTValidator } from '../../../share/dm-validators/codeExistsHangHoaTTValidator';

export interface DialogData {
  hangHoa?: Dm_HangHoaThiTruongDto;
  mode: 'create' | 'edit';
}

@Component({
  selector: 'app-dm-hanghoathitruong-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
    MatSnackBarModule
  ],
  templateUrl: './dm-hanghoathitruong-dialog.html',
  styleUrl: './dm-hanghoathitruong-dialog.css'
})
export class DmHanghoathitruongDialog implements OnInit, OnDestroy {
  hangHoaForm!: FormGroup;
  isEditMode = false;
  isSubmitting = false;
  isHangHoaMode = false;

  parentItems: Dm_HangHoaThiTruongTreeDto[] = [];
  donViTinhList: DmDonViTinhDto[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DmHanghoathitruongDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private hangHoaService: DmHangHoaThiTruongService,
    private donViTinhService: DmDonvitinh,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isEditMode = this.data.mode === 'edit';
    this.initializeForm();
    this.loadData();
    this.setupDateValidation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    const now = new Date();
    const tenYearsLater = new Date();
    tenYearsLater.setFullYear(now.getFullYear() + 10);

    this.hangHoaForm = this.fb.group({
      parentId: [''],
      ma: ['', 
        [Validators.required, Validators.maxLength(50)], 
        [codeExistsHangHoaTTValidator(
          this.hangHoaService,
          undefined, // parentId sẽ được cập nhật động
          this.isEditMode ? this.data.hangHoa?.id : undefined
        )]
      ],
      ten: ['', [Validators.required, Validators.maxLength(255)]],
      ngayHieuLuc: [now, [Validators.required]],
      ngayHetHieuLuc: [tenYearsLater, [Validators.required]],
      ghiChu: ['', [Validators.maxLength(500)]],
      isHangHoa: [false],
      donViTinhId: [''],
      dacTinh: ['', [Validators.maxLength(255)]]
    });

    // Nếu là edit mode, fill dữ liệu
    if (this.isEditMode && this.data.hangHoa) {
      this.fillFormData();
    }

    // Theo dõi thay đổi toggle
    this.hangHoaForm.get('isHangHoa')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(isHangHoa => {
        this.isHangHoaMode = isHangHoa;
        this.updateValidationRules();
      });

    // Theo dõi thay đổi parentId để cập nhật validator
    this.hangHoaForm.get('parentId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(parentId => {
        this.updateCodeValidator(parentId);
      });
  }

  private updateCodeValidator(parentId?: string): void {
    const maControl = this.hangHoaForm.get('ma');
    if (maControl) {
      // Cập nhật async validator với parentId mới
      maControl.setAsyncValidators([
        codeExistsHangHoaTTValidator(
          this.hangHoaService,
          parentId || undefined,
          this.isEditMode ? this.data.hangHoa?.id : undefined
        )
      ]);
      maControl.updateValueAndValidity();
    }
  }

  private fillFormData(): void {
    const hangHoa = this.data.hangHoa!;
    
    // Kiểm tra xem có phải là hàng hóa/tài sản không
    const isHangHoa = !!(hangHoa.donViTinhId || hangHoa.dacTinh);
    this.isHangHoaMode = isHangHoa;

    this.hangHoaForm.patchValue({
      parentId: hangHoa.parentId || '',
      ma: hangHoa.ma,
      ten: hangHoa.ten,
      ngayHieuLuc: new Date(hangHoa.ngayHieuLuc),
      ngayHetHieuLuc: new Date(hangHoa.ngayHetHieuLuc),
      ghiChu: hangHoa.ghiChu || '',
      isHangHoa: isHangHoa,
      donViTinhId: hangHoa.donViTinhId || '',
      dacTinh: hangHoa.dacTinh || ''
    });

    this.updateValidationRules();
  }

  private updateValidationRules(): void {
    const parentIdControl = this.hangHoaForm.get('parentId');
    const donViTinhIdControl = this.hangHoaForm.get('donViTinhId');

    if (this.isHangHoaMode) {
      // Khi bật toggle, parentId và donViTinhId trở thành bắt buộc
      parentIdControl?.setValidators([Validators.required]);
      donViTinhIdControl?.setValidators([Validators.required]);
    } else {
      // Khi tắt toggle, chỉ giữ validation cơ bản
      parentIdControl?.setValidators([]);
      donViTinhIdControl?.setValidators([]);
    }

    parentIdControl?.updateValueAndValidity();
    donViTinhIdControl?.updateValueAndValidity();
  }

  private loadData(): void {
    const requests = [
      this.hangHoaService.getAllParentItems(),
      this.donViTinhService.getPaged({
        pageNumber: 1,
        pageSize: 1000,
        sortBy: 'Ma',
        sortDescending: false
      } as PagedRequest)
    ];

    forkJoin(requests).subscribe({
      next: ([parentItems, donViTinhResult]) => {
        this.parentItems = parentItems as Dm_HangHoaThiTruongTreeDto[];
        this.donViTinhList = (donViTinhResult as any).items || [];
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.showNotification('Lỗi khi tải dữ liệu', 'error');
      }
    });
  }

  private setupDateValidation(): void {
    const ngayHieuLucControl = this.hangHoaForm.get('ngayHieuLuc');
    const ngayHetHieuLucControl = this.hangHoaForm.get('ngayHetHieuLuc');

    // Validate date range
    const validateDateRange = () => {
      const startDate = ngayHieuLucControl?.value;
      const endDate = ngayHetHieuLucControl?.value;

      if (startDate && endDate && startDate > endDate) {
        ngayHieuLucControl?.setErrors({ ...ngayHieuLucControl.errors, invalidDateRange: true });
        ngayHetHieuLucControl?.setErrors({ ...ngayHetHieuLucControl.errors, invalidDateRange: true });
      } else {
        // Clear date range errors
        if (ngayHieuLucControl?.errors) {
          delete ngayHieuLucControl.errors['invalidDateRange'];
          ngayHieuLucControl.setErrors(Object.keys(ngayHieuLucControl.errors).length ? ngayHieuLucControl.errors : null);
        }
        if (ngayHetHieuLucControl?.errors) {
          delete ngayHetHieuLucControl.errors['invalidDateRange'];
          ngayHetHieuLucControl.setErrors(Object.keys(ngayHetHieuLucControl.errors).length ? ngayHetHieuLucControl.errors : null);
        }
      }
    };

    ngayHieuLucControl?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(validateDateRange);
    ngayHetHieuLucControl?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(validateDateRange);
  }

  onToggleHangHoa(event: any): void {
    this.isHangHoaMode = event.checked;
    this.updateValidationRules();
    
    if (!this.isHangHoaMode) {
      // Clear values when toggle is off
      this.hangHoaForm.patchValue({
        donViTinhId: '',
        dacTinh: ''
      });
    }
  }

  onSubmit(): void {
    if (this.hangHoaForm.invalid || this.isSubmitting) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;
    const formValue = this.hangHoaForm.value;

    if (this.isEditMode) {
      this.updateHangHoa(formValue);
    } else {
      this.createHangHoa(formValue);
    }
  }

  private createHangHoa(formValue: any): void {
    const createDto: DmHangHoaThiTruongCreateDto = {
      ma: formValue.ma.trim(),
      ten: formValue.ten.trim(),
      ghiChu: formValue.ghiChu?.trim() || null,
      dacTinh: formValue.isHangHoa ? (formValue.dacTinh?.trim() || null) : null,
      donViTinhId: formValue.isHangHoa ? formValue.donViTinhId || null : null,
      ngayHieuLuc: formValue.ngayHieuLuc,
      ngayHetHieuLuc: formValue.ngayHetHieuLuc,
      parentId: formValue.parentId || null
    };

    this.hangHoaService.create(createDto).subscribe({
      next: (result) => {
        this.showNotification('Thêm mới hàng hóa thành công', 'success');
        this.dialogRef.close(result);
      },
      error: (error) => {
        console.error('Create error:', error);
        this.showNotification('Lỗi khi thêm mới hàng hóa', 'error');
        this.isSubmitting = false;
      }
    });
  }

  private updateHangHoa(formValue: any): void {
    const updateDto: DmHangHoaThiTruongUpdateDto = {
      id: this.data.hangHoa!.id,
      ma: formValue.ma.trim(),
      ten: formValue.ten.trim(),
      ghiChu: formValue.ghiChu?.trim() || null,
      dacTinh: formValue.isHangHoa ? (formValue.dacTinh?.trim() || null) : null,
      donViTinhId: formValue.isHangHoa ? formValue.donViTinhId || null : null,
      ngayHieuLuc: formValue.ngayHieuLuc,
      ngayHetHieuLuc: formValue.ngayHetHieuLuc,
      parentId: formValue.parentId || null
    };

    this.hangHoaService.update(this.data.hangHoa!.id, updateDto).subscribe({
      next: (result) => {
        this.showNotification('Cập nhật hàng hóa thành công', 'success');
        this.dialogRef.close(result);
      },
      error: (error) => {
        console.error('Update error:', error);
        this.showNotification('Lỗi khi cập nhật hàng hóa', 'error');
        this.isSubmitting = false;
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.hangHoaForm.controls).forEach(key => {
      const control = this.hangHoaForm.get(key);
      control?.markAsTouched();
    });
  }

  private showNotification(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Đóng', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: type === 'success' ? ['success-snackbar'] : ['error-snackbar']
    });
  }
  
  onCancel(): void {
    this.dialogRef.close();
  }
}