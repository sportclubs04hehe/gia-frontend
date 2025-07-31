import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment.development';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap} from 'rxjs/operators';
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

  // Cache structure to store paginated results
  private cache: { [key: string]: { data: PagedResult<DmDonViTinhDto>, timestamp: number } } = {};
  private cacheLifetime = 5 * 60 * 1000; // 5 minutes cache lifetime
  private cacheRefreshSubject = new BehaviorSubject<boolean>(true);
  
  // Additional properties for search caching
  private searchCache: { [term: string]: { data: DmDonViTinhDto[], timestamp: number } } = {};
  private maxSearchCacheEntries = 15; // Limit search cache size to prevent memory issues

  // Generate a cache key from request parameters
  private createCacheKey(request: PagedRequest): string {
    return `page=${request.pageNumber}_size=${request.pageSize}_sort=${request.sortBy || ''}_desc=${request.sortDescending || false}`;
  }

  // Check if cache is valid
  private isCacheValid(cacheKey: string): boolean {
    if (!this.cache[cacheKey]) return false;
    const now = new Date().getTime();
    return now - this.cache[cacheKey].timestamp < this.cacheLifetime;
  }

  // Lấy danh sách đơn vị tính với phân trang
  getPaged(request: PagedRequest): Observable<PagedResult<DmDonViTinhDto>> {
    const cacheKey = this.createCacheKey(request);
    
    // If we have valid cached data and no search term, return it
    if (!request.searchTerm && this.isCacheValid(cacheKey)) {
      console.log('Returning cached data for', cacheKey);
      return of(this.cache[cacheKey].data);
    }

    // Otherwise make the API call
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

    return this.http.get<PagedResult<DmDonViTinhDto>>(`${this.endpoint}/paged`, { params })
      .pipe(
        tap(result => {
          // Don't cache search results
          if (!request.searchTerm) {
            this.cache[cacheKey] = {
              data: result,
              timestamp: new Date().getTime()
            };
          }
        })
      );
  }

  // Add this new method for direct searching
  search(searchTerm: string): Observable<DmDonViTinhDto[]> {
    if (!searchTerm || !searchTerm.trim()) {
      return of([]);
    }

    const normalizedTerm = searchTerm.toLowerCase().trim();
    
    // Check cache first
    if (this.isSearchCacheValid(normalizedTerm)) {
      console.log('Returning cached search results for:', normalizedTerm);
      return of(this.searchCache[normalizedTerm].data);
    }

    // Otherwise make API call
    return this.http.get<DmDonViTinhDto[]>(`${this.endpoint}/search`, {
      params: new HttpParams().set('searchTerm', searchTerm)
    }).pipe(
      tap(results => {
        this.storeSearchInCache(normalizedTerm, results);
      }),
      catchError(error => {
        console.error('Search error:', error);
        return of([]);
      })
    );
  }

  private isSearchCacheValid(term: string): boolean {
    if (!this.searchCache[term]) return false;
    const now = new Date().getTime();
    return now - this.searchCache[term].timestamp < this.cacheLifetime;
  }

  private storeSearchInCache(term: string, data: DmDonViTinhDto[]): void {
    // Manage cache size - if exceeds max entries, remove oldest entry
    const cacheKeys = Object.keys(this.searchCache);
    if (cacheKeys.length >= this.maxSearchCacheEntries) {
      let oldestKey = cacheKeys[0];
      let oldestTime = this.searchCache[oldestKey].timestamp;
      
      // Find oldest entry
      for (const key of cacheKeys) {
        if (this.searchCache[key].timestamp < oldestTime) {
          oldestKey = key;
          oldestTime = this.searchCache[key].timestamp;
        }
      }
      
      // Remove oldest entry
      delete this.searchCache[oldestKey];
    }
    
    // Store new data
    this.searchCache[term] = {
      data: data,
      timestamp: new Date().getTime()
    };
  }

  // Clear cache on data modifications
  clearCache(): void {
    console.log('Clearing all caches');
    this.cache = {};
    this.searchCache = {};
    this.cacheRefreshSubject.next(true);
  }

  // Override methods that modify data to clear cache
  create(createDto: DmDonViTinhCreateDto): Observable<DmDonViTinhDto> {
    return this.http.post<DmDonViTinhDto>(this.endpoint, createDto)
      .pipe(
        tap(() => this.clearCache())
      );
  }

  // Cập nhật đơn vị tính
  update(id: string, updateDto: DmDonViTinhUpdateDto): Observable<any> {
    return this.http.put(`${this.endpoint}/${id}`, updateDto)
      .pipe(
        tap(() => this.clearCache())
      );
  }

  // Xóa đơn vị tính
  delete(id: string): Observable<any> {
    return this.http.delete(`${this.endpoint}/${id}`)
      .pipe(
        tap(() => this.clearCache())
      );
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
}
