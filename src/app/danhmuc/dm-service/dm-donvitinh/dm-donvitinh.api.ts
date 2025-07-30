import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment.development';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DmDonViTinhDto, DmDonViTinhCreateDto, DmDonViTinhUpdateDto } from '../../dm-model/dm-donvitinh.model';
import { PagedRequest, PagedResult } from '../../dm-model/page-result';

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
}
