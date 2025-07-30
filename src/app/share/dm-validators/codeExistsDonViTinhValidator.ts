import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { DmDonvitinh } from '../../danhmuc/dm-service/dm-donvitinh/dm-donvitinh.api';

export function codeExistsDonViTinhValidator(
  service: DmDonvitinh,
  excludeId?: string,
  debounceTime: number = 500
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value || control.value.length === 0) {
      return of(null);
    }

    return timer(debounceTime).pipe(
      switchMap(() => service.checkCodeExists(control.value, excludeId)),
      map(response => {
        return response.exists ? { codeExists: { value: control.value } } : null;
      }),
      catchError(() => of(null))
    );
  };
}