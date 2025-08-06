import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment.development';
import { PagedResult, PagedRequest } from '../../dm-model/page-result';
import { ValidationResult } from '../../dm-model/validation-result.model';
import { ImportResultDto } from '../../dm-model/import-model';
import { Dm_HangHoaThiTruongDto, DmHangHoaThiTruongCreateDto, DmHangHoaThiTruongUpdateDto } from '../../dm-model/dm-hanghoathitruong.model';

@Injectable({
  providedIn: 'root'
})
export class DmHangHoaThiTruongService {
  private apiUrl = environment.appUrl;
  private endpoint = `${this.apiUrl}/Dm_HangHoaThiTruongs`;

  constructor(private http: HttpClient) { }

  /**
   * Lấy danh sách hàng hóa cấp cao nhất (không có parent)
   */
  getTopLevelItems(): Observable<Dm_HangHoaThiTruongDto[]> {
    return this.http.get<Dm_HangHoaThiTruongDto[]>(`${this.endpoint}/top-level`);
  }

  /**
   * Lấy danh sách hàng hóa con của một hàng hóa cha với phân trang
   */
  getChildren(
    parentId: string,
    request: PagedRequest,
    searchTerm?: string
  ): Observable<PagedResult<Dm_HangHoaThiTruongDto>> {
    let params = new HttpParams()
      .set('pageNumber', request.pageNumber.toString())
      .set('pageSize', request.pageSize.toString())
      .set('sortBy', request.sortBy || 'CreatedDate')
      .set('sortDescending', request.sortDescending.toString());

    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
    }

    return this.http.get<PagedResult<Dm_HangHoaThiTruongDto>>(
      `${this.endpoint}/children/${parentId}`,
      { params }
    );
  }

  /**
   * Lấy thông tin hàng hóa theo ID
   */
  getById(id: string): Observable<Dm_HangHoaThiTruongDto> {
    return this.http.get<Dm_HangHoaThiTruongDto>(`${this.endpoint}/${id}`);
  }

  /**
   * Thêm mới hàng hóa thị trường
   */
  create(createDto: DmHangHoaThiTruongCreateDto): Observable<Dm_HangHoaThiTruongDto> {
    return this.http.post<Dm_HangHoaThiTruongDto>(this.endpoint, createDto);
  }

  /**
   * Cập nhật thông tin hàng hóa thị trường
   */
  update(id: string, updateDto: DmHangHoaThiTruongUpdateDto): Observable<Dm_HangHoaThiTruongDto> {
    return this.http.put<Dm_HangHoaThiTruongDto>(`${this.endpoint}/${id}`, updateDto);
  }

  /**
   * Xóa một hàng hóa thị trường
   */
  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.endpoint}/${id}`);
  }

  /**
   * Xóa nhiều hàng hóa thị trường
   */
  deleteMany(ids: string[]): Observable<any> {
    return this.http.delete<any>(`${this.endpoint}/batch`, {
      body: ids
    });
  }

  /**
   * Kiểm tra dữ liệu Excel trước khi import
   */
  validateExcel(file: File): Observable<ValidationResult> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ValidationResult>(`${this.endpoint}/validate-excel`, formData);
  }

  /**
   * Import dữ liệu từ file Excel
   */
  importExcel(file: File): Observable<ImportResultDto> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ImportResultDto>(`${this.endpoint}/import-excel`, formData);
  }

  /**
   * Chuyển đổi cây thành danh sách phẳng để hiển thị
   */
  flattenTreeForDisplay(treeData: Dm_HangHoaThiTruongDto[]): Dm_HangHoaThiTruongDto[] {
    // Chỉ log một lần khi method được gọi
    console.log('🔄 flattenTreeForDisplay: Processing', treeData.length, 'root nodes');
    
    const result: Dm_HangHoaThiTruongDto[] = [];

    const flatten = (nodes: Dm_HangHoaThiTruongDto[], currentLevel: number = 0) => {
      nodes.forEach(node => {
        result.push(node);
        
        if (node.isExpanded && node.children && node.children.length > 0) {
          flatten(node.children, currentLevel + 1);
        }
      });
    };

    flatten(treeData);
    
    console.log('✅ flattenTreeForDisplay: Result =', result.length, 'rows');
    
    return result;
  }
}
