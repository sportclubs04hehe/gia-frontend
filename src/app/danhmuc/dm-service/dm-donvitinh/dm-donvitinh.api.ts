import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DmDonViTinhDto, DmDonViTinhCreateDto, DmDonViTinhUpdateDto } from '../../dm-model/dm-donvitinh.model';

@Injectable({
  providedIn: 'root'
})
export class DmDonvitinh {
  private apiUrl = environment.appUrl;
  private endpoint = `${this.apiUrl}/Dm_DonViTinhs`;

  constructor(private http: HttpClient) { }

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
