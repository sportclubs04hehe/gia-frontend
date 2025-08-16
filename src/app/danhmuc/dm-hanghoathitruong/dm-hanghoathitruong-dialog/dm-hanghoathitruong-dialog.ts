import { Component, OnInit, Inject, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';

import { DmHangHoaThiTruongService } from '../../dm-service/dm-hanghoathitruong/dm-hanghoathitruong.api';
import { DmDonvitinh } from '../../dm-service/dm-donvitinh/dm-donvitinh.api';
import { 
  Dm_HangHoaThiTruongDto, 
  DmHangHoaThiTruongCreateDto, 
  DmHangHoaThiTruongUpdateDto 
} from '../../dm-model/dm-hanghoathitruong.model';
import { DmDonViTinhDto } from '../../dm-model/dm-donvitinh.model';
import { PagedRequest } from '../../dm-model/page-result';
import { codeExistsHangHoaTTValidator } from '../../../share/dm-validators/codeExistsHangHoaTTValidator';
import { PopupTableColumn } from '../../../share/components/dialogs/popup-table-dialog/popup-table-dialog';
import { PopupTableService } from '../../../share/services/popup-table.service';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';

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
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatSelectModule,
    MatTableModule,        
    MatPaginatorModule,   
    MatSortModule,  
  ],
  templateUrl: './dm-hanghoathitruong-dialog.html',
  styleUrl: './dm-hanghoathitruong-dialog.css'
})
export class DmHanghoathitruongDialog implements OnInit, OnDestroy {
  hangHoaForm!: FormGroup;
  isEditMode = false;
  isSubmitting = false;
  isHangHoaMode = false;

  donViTinhList: DmDonViTinhDto[] = [];
  selectedParentItem: Dm_HangHoaThiTruongDto | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DmHanghoathitruongDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private hangHoaService: DmHangHoaThiTruongService,
    private donViTinhService: DmDonvitinh,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private popupTableService: PopupTableService
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
          undefined,
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
  }

  private fillFormData(): void {
    const hangHoa = this.data.hangHoa!;
    
    // Kiểm tra xem có phải là hàng hóa/tài sản không
    const isHangHoa = !!(hangHoa.donViTinhId || hangHoa.dacTinh);
    this.isHangHoaMode = isHangHoa;

    // Load thông tin parent item để hiển thị
    if (hangHoa.parentId) {
      this.loadParentItemById(hangHoa.parentId);
    }

    this.hangHoaForm.patchValue({
      parentId: this.getParentDisplayText(hangHoa.parentId || undefined),
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

  private loadParentItemById(parentId: string): void {
    this.hangHoaService.getAllParentItems().subscribe({
      next: (items) => {
        this.selectedParentItem = items.find(item => item.id === parentId) || null;
        if (this.selectedParentItem) {
          this.hangHoaForm.patchValue({
            parentId: `${this.selectedParentItem.ma} - ${this.selectedParentItem.ten}`
          });
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading parent item:', error);
      }
    });
  }

  private getParentDisplayText(parentId?: string): string {
    if (!parentId) return '';
    if (this.selectedParentItem && this.selectedParentItem.id === parentId) {
      return `${this.selectedParentItem.ma} - ${this.selectedParentItem.ten}`;
    }
    return '';
  }

  private updateValidationRules(): void {
    const donViTinhIdControl = this.hangHoaForm.get('donViTinhId');

    if (this.isHangHoaMode) {
      // Khi bật toggle, donViTinhId trở thành bắt buộc
      donViTinhIdControl?.setValidators([Validators.required]);
    } else {
      // Khi tắt toggle, chỉ giữ validation cơ bản
      donViTinhIdControl?.setValidators([]);
    }

    donViTinhIdControl?.updateValueAndValidity();
  }

  private loadData(): void {
    this.donViTinhService.getPaged({
      pageNumber: 1,
      pageSize: 1000,
      sortBy: 'Ma',
      sortDescending: false
    } as PagedRequest).subscribe({
      next: (donViTinhResult) => {
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
      parentId: this.selectedParentItem?.id || null,
      isParent: !formValue.isHangHoa
    };

    this.hangHoaService.create(createDto).subscribe({
      next: (result) => {
        this.showNotification('Thêm mới hàng hóa thành công', 'success');
        // 🔥 FIX: Delay dialog close để tránh lỗi NG0100
        setTimeout(() => {
          this.dialogRef.close(result);
        }, 0);
      },
      error: (error) => {
        console.error('Create error:', error);
        this.showNotification('Lỗi khi thêm mới hàng hóa', 'error');
        this.isSubmitting = false;
        this.cdr.markForCheck();
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
      parentId: this.selectedParentItem?.id || null,
      isParent: !formValue.isHangHoa
    };

    this.hangHoaService.update(this.data.hangHoa!.id, updateDto).subscribe({
      next: (result) => {
        this.showNotification('Cập nhật hàng hóa thành công', 'success');
        // 🔥 FIX: Delay dialog close để tránh lỗi NG0100
        setTimeout(() => {
          this.dialogRef.close(result);
        }, 0);
      },
      error: (error) => {
        console.error('Update error:', error);
        this.showNotification('Lỗi khi cập nhật hàng hóa', 'error');
        this.isSubmitting = false;
        this.cdr.markForCheck();
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

  openParentItemPopup(): void {
    const columns: PopupTableColumn[] = [
      { key: 'displayText', label: 'Mã - Tên (Phân cấp)', width: '100%' }
    ];

    const popupConfig = {
      title: 'Chọn hàng hóa cha',
      columns: columns,
      searchPlaceholder: 'Tìm kiếm theo mã hoặc tên...',
      enablePagination: false,
      pageSize: 10,
      pageSizeOptions: [5, 10, 20, 50],
      loadData: (searchTerm: string, page: number, pageSize: number) => {
        console.log('Loading parent items...');
        return this.hangHoaService.getAllParentItems().pipe(
          map(items => {
            const flattenedItems = this.flattenTreeItems(items).map(item => ({
              ...item,
              displayText: this.getHierarchicalDisplayText(item)
            }));
            
            let filteredItems = flattenedItems;
            if (searchTerm && searchTerm.trim()) {
              const search = searchTerm.toLowerCase().trim();
              filteredItems = flattenedItems.filter(item => 
                item.ma.toLowerCase().includes(search) || 
                item.ten.toLowerCase().includes(search)
              );
            }

            return {
              items: filteredItems,
              totalCount: filteredItems.length
            };
          })
        );
      },
      trackByFn: (index: number, item: any) => item.id
    };

    this.popupTableService.openPopup(popupConfig, {
      width: '800px',
      height: '600px'
    }).subscribe(result => {
      if (result) {
        this.selectedParentItem = result.selectedItem;
        this.hangHoaForm.patchValue({
          parentId: `${result.selectedItem.ma} - ${result.selectedItem.ten}`
        });
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Get hierarchical display text with indentation
   */
  private getHierarchicalDisplayText(item: Dm_HangHoaThiTruongDto & { level: number }): string {
    const indentation = '  '.repeat(item.level); // 2 spaces per level
    const prefix = item.level > 0 ? '└─ ' : '';
    return `${indentation}${prefix}${item.ma} - ${item.ten}`;
  }

  /**
   * Flatten tree structure to get all items including children with level information
   */
  private flattenTreeItems(treeItems: Dm_HangHoaThiTruongDto[]): (Dm_HangHoaThiTruongDto & { level: number })[] {
    const result: (Dm_HangHoaThiTruongDto & { level: number })[] = [];
    
    const flatten = (items: Dm_HangHoaThiTruongDto[], level: number = 0) => {
      items.forEach(item => {
        const flatItem: Dm_HangHoaThiTruongDto & { level: number } = {
          ...item,
          children: [], // Remove children to avoid circular reference
          level: level // Add level information
        };
        result.push(flatItem);
        
        if (item.children && item.children.length > 0) {
          flatten(item.children, level + 1);
        }
      });
    };
    
    flatten(treeItems);
    return result;
  }
}