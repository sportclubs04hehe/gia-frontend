import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { DmHangHoaThiTruongService } from '../../danhmuc/dm-service/dm-hanghoathitruong/dm-hanghoathitruong.api';

export function codeExistsHangHoaTTValidator(
  service: DmHangHoaThiTruongService,
  parentId?: string,
  excludeId?: string,
  debounceTime: number = 500
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value || control.value.length === 0) {
      return of(null);
    }

    return timer(debounceTime).pipe(
      switchMap(() => service.checkCodeExists(control.value, parentId, excludeId)),
      map(response => {
        const exists = response.message && response.message.includes('tồn tại');
        return exists ? { codeExists: { value: control.value } } : null;
      }),
      catchError(() => of(null))
    );
  };
}