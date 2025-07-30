import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment.development';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DmDonViTinhDto, DmDonViTinhCreateDto, DmDonViTinhUpdateDto } from '../../dm-model/dm-donvitinh.model';
import { PagedRequest, PagedResult } from '../../dm-model/page-result';
import { ImportResultDto } from '../../dm-model/import-model';

@Injectable({
  providedIn: 'root'
})
export class DmDonvitinh {
  private apiUrl = environment.appUrl;
  private endpoint = `${this.apiUrl}/Dm_DonViTinhs`;

  constructor(private http: HttpClient) { }

  // Lấy danh sách đơn vị tính với phân trang
  getPaged(request: PagedRequest): Observable<PagedResult<DmDonViTinhDto>> {
    let params = new HttpParams()
      .set('pageNumber', request.pageNumber.toString())
      .set('pageSize', request.pageSize.toString())
      .set('sortDescending', request.sortDescending.toString());

    if (request.searchTerm) {
      params = params.set('searchTerm', request.searchTerm);
    }

    if (request.sortBy) {
      params = params.set('sortBy', request.sortBy);
    }

    return this.http.get<PagedResult<DmDonViTinhDto>>(`${this.endpoint}/paged`, { params });
  }

  // Lấy tất cả đơn vị tính
  getAll(): Observable<DmDonViTinhDto[]> {
    return this.http.get<DmDonViTinhDto[]>(this.endpoint);
  }

  // Lấy đơn vị tính theo ID
  getById(id: string): Observable<DmDonViTinhDto> {
    return this.http.get<DmDonViTinhDto>(`${this.endpoint}/${id}`);
  }

  // Kiểm tra mã có tồn tại không
  checkCodeExists(ma: string, excludeId?: string): Observable<{ exists: boolean }> {
    let params = new HttpParams();
    if (excludeId) {
      params = params.set('excludeId', excludeId);
    }
    return this.http.get<{ exists: boolean }>(`${this.endpoint}/check-code/${ma}`, { params });
  }

  // Tạo mới đơn vị tính
  create(createDto: DmDonViTinhCreateDto): Observable<DmDonViTinhDto> {
    return this.http.post<DmDonViTinhDto>(this.endpoint, createDto);
  }

  // Cập nhật đơn vị tính
  update(id: string, updateDto: DmDonViTinhUpdateDto): Observable<any> {
    return this.http.put(`${this.endpoint}/${id}`, updateDto);
  }

  // Xóa đơn vị tính
  delete(id: string): Observable<any> {
    return this.http.delete(`${this.endpoint}/${id}`);
  }

  // Import đơn vị tính từ file Excel
  importFromExcel(file: File): Observable<ImportResultDto> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<ImportResultDto>(`${this.endpoint}/import`, formData)
      .pipe(
        catchError(error => {
          // Handle case where the server returns errors with status 400
          if (error.status === 400 && error.error) {
            return of(error.error);
          }
          return throwError(() => error);
        })
      );
  }

  // Tạo file mẫu Excel
  getExcelTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/assets/templates/dm-donvitinh-template.xlsx`, {
      responseType: 'blob'
    });
  }
}
