import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { DmHangHoaThiTruongDto } from '../../dm-model/dm-hanghoathitruong.model';
import { PagedRequest, PagedResult } from '../../dm-model/page-result';

@Injectable({
  providedIn: 'root'
})
export class DmHangHoaThiTruongService {

  // Fake data cho demo
  private fakeData: DmHangHoaThiTruongDto[] = [
    // Nhóm Thực phẩm
    {
      id: '1',
      macha: undefined,
      maHangHoa: 'TP001',
      tenHangHoa: 'Thực phẩm ',
      nhomHangHoa: 'Nhóm chính',
      xuatXu: 'Việt Nam',
      giaThiTruong: 0,
      giaTruocDo: 0,
      ghiChu: 'Nhóm thực phẩm chính',
      createdDate: new Date('2024-01-01')
    },
    {
      id: '2',
      macha: '1',
      maHangHoa: 'TP001.001',
      tenHangHoa: 'Gạo',
      nhomHangHoa: 'Thực phẩm',
      xuatXu: 'Việt Nam',
      giaThiTruong: 25000,
      giaTruocDo: 24000,
      ghiChu: 'Gạo tẻ',
      createdDate: new Date('2024-01-02')
    },
    {
      id: '3',
      macha: '2',
      maHangHoa: 'TP001.001.01',
      tenHangHoa: 'Gạo ST25',
      nhomHangHoa: 'Gạo',
      xuatXu: 'An Giang',
      giaThiTruong: 35000,
      giaTruocDo: 34000,
      ghiChu: 'Gạo thơm cao cấp',
      createdDate: new Date('2024-01-03')
    },
    {
      id: '4',
      macha: '2',
      maHangHoa: 'TP001.001.02',
      tenHangHoa: 'Gạo Jasmine',
      nhomHangHoa: 'Gạo',
      xuatXu: 'Đồng Tháp',
      giaThiTruong: 30000,
      giaTruocDo: 29000,
      ghiChu: 'Gạo thơm Jasmine',
      createdDate: new Date('2024-01-04')
    },
    {
      id: '5',
      macha: '1',
      maHangHoa: 'TP001.002',
      tenHangHoa: 'Thịt',
      nhomHangHoa: 'Thực phẩm',
      xuatXu: 'Việt Nam',
      giaThiTruong: 150000,
      giaTruocDo: 145000,
      ghiChu: 'Thịt tươi',
      createdDate: new Date('2024-01-05')
    },
    {
      id: '6',
      macha: '5',
      maHangHoa: 'TP001.002.01',
      tenHangHoa: 'Thịt heo',
      nhomHangHoa: 'Thịt',
      xuatXu: 'Việt Nam',
      giaThiTruong: 140000,
      giaTruocDo: 135000,
      ghiChu: 'Thịt heo tươi',
      createdDate: new Date('2024-01-06')
    },
    {
      id: '7',
      macha: '5',
      maHangHoa: 'TP001.002.02',
      tenHangHoa: 'Thịt bò',
      nhomHangHoa: 'Thịt',
      xuatXu: 'Việt Nam',
      giaThiTruong: 280000,
      giaTruocDo: 275000,
      ghiChu: 'Thịt bò tươi',
      createdDate: new Date('2024-01-07')
    },

    // Nhóm Đồ uống
    {
      id: '8',
      macha: undefined,
      maHangHoa: 'DU001',
      tenHangHoa: 'Đồ uống',
      nhomHangHoa: 'Nhóm chính',
      xuatXu: 'Việt Nam',
      giaThiTruong: 0,
      giaTruocDo: 0,
      ghiChu: 'Nhóm đồ uống',
      createdDate: new Date('2024-01-08')
    },
    {
      id: '9',
      macha: '8',
      maHangHoa: 'DU001.001',
      tenHangHoa: 'Nước ngọt',
      nhomHangHoa: 'Đồ uống',
      xuatXu: 'Việt Nam',
      giaThiTruong: 15000,
      giaTruocDo: 14000,
      ghiChu: 'Nước ngọt có ga',
      createdDate: new Date('2024-01-09')
    },
    {
      id: '10',
      macha: '9',
      maHangHoa: 'DU001.001.01',
      tenHangHoa: 'Coca Cola',
      nhomHangHoa: 'Nước ngọt',
      xuatXu: 'Việt Nam',
      giaThiTruong: 12000,
      giaTruocDo: 11500,
      ghiChu: 'Coca Cola 330ml',
      createdDate: new Date('2024-01-10')
    },
    {
      id: '11',
      macha: '9',
      maHangHoa: 'DU001.001.02',
      tenHangHoa: 'Pepsi',
      nhomHangHoa: 'Nước ngọt',
      xuatXu: 'Việt Nam',
      giaThiTruong: 11000,
      giaTruocDo: 10500,
      ghiChu: 'Pepsi 330ml',
      createdDate: new Date('2024-01-11')
    },

    // Nhóm Rau củ
    {
      id: '12',
      macha: undefined,
      maHangHoa: 'RC001',
      tenHangHoa: 'Rau củ quả',
      nhomHangHoa: 'Nhóm chính',
      xuatXu: 'Việt Nam',
      giaThiTruong: 0,
      giaTruocDo: 0,
      ghiChu: 'Nhóm rau củ quả tươi',
      createdDate: new Date('2024-01-12')
    },
    {
      id: '13',
      macha: '12',
      maHangHoa: 'RC001.001',
      tenHangHoa: 'Rau xanh',
      nhomHangHoa: 'Rau củ quả',
      xuatXu: 'Đà Lạt',
      giaThiTruong: 25000,
      giaTruocDo: 23000,
      ghiChu: 'Rau xanh tươi',
      createdDate: new Date('2024-01-13')
    },
    {
      id: '14',
      macha: '13',
      maHangHoa: 'RC001.001.01',
      tenHangHoa: 'Cải thảo',
      nhomHangHoa: 'Rau xanh',
      xuatXu: 'Đà Lạt',
      giaThiTruong: 20000,
      giaTruocDo: 18000,
      ghiChu: 'Cải thảo Đà Lạt',
      createdDate: new Date('2024-01-14')
    },
    {
      id: '15',
      macha: '13',
      maHangHoa: 'RC001.001.02',
      tenHangHoa: 'Xà lách',
      nhomHangHoa: 'Rau xanh',
      xuatXu: 'Đà Lạt',
      giaThiTruong: 30000,
      giaTruocDo: 28000,
      ghiChu: 'Xà lách tươi',
      createdDate: new Date('2024-01-15')
    }
  ];

  constructor() { }

  getPaged(request: PagedRequest): Observable<PagedResult<DmHangHoaThiTruongDto>> {
    return new Observable(observer => {
      setTimeout(() => {
        let filteredData = [...this.fakeData];

        // Lọc theo search term
        if (request.searchTerm) {
          filteredData = filteredData.filter(item =>
            item.maHangHoa.toLowerCase().includes(request.searchTerm!.toLowerCase()) ||
            item.tenHangHoa.toLowerCase().includes(request.searchTerm!.toLowerCase()) ||
            item.nhomHangHoa.toLowerCase().includes(request.searchTerm!.toLowerCase()) ||
            item.xuatXu.toLowerCase().includes(request.searchTerm!.toLowerCase()) ||
            (item.ghiChu && item.ghiChu.toLowerCase().includes(request.searchTerm!.toLowerCase()))
          );
        }

        // Sắp xếp
        if (request.sortBy) {
          filteredData.sort((a, b) => {
            let aValue: any, bValue: any;

            switch (request.sortBy) {
              case 'MaHangHoa':
                aValue = a.maHangHoa;
                bValue = b.maHangHoa;
                break;
              case 'TenHangHoa':
                aValue = a.tenHangHoa;
                bValue = b.tenHangHoa;
                break;
              case 'NhomHangHoa':
                aValue = a.nhomHangHoa;
                bValue = b.nhomHangHoa;
                break;
              case 'XuatXu':
                aValue = a.xuatXu;
                bValue = b.xuatXu;
                break;
              case 'GiaThiTruong':
                aValue = a.giaThiTruong;
                bValue = b.giaThiTruong;
                break;
              default:
                aValue = a.createdDate;
                bValue = b.createdDate;
            }

            if (aValue < bValue) return request.sortDescending ? 1 : -1;
            if (aValue > bValue) return request.sortDescending ? -1 : 1;
            return 0;
          });
        }

        // Phân trang
        const startIndex = (request.pageNumber - 1) * request.pageSize;
        const endIndex = startIndex + request.pageSize;
        const pagedData = filteredData.slice(startIndex, endIndex);

        const result: PagedResult<DmHangHoaThiTruongDto> = {
          items: pagedData,
          totalCount: filteredData.length,
          pageNumber: request.pageNumber,
          pageSize: request.pageSize,
          totalPages: Math.ceil(filteredData.length / request.pageSize),
          hasPreviousPage: request.pageNumber > 1,
          hasNextPage: request.pageNumber < Math.ceil(filteredData.length / request.pageSize)
        };

        observer.next(result);
        observer.complete();
      }, 500); // Giả lập delay API
    });
  }

  getAll(): Observable<DmHangHoaThiTruongDto[]> {
    return of([...this.fakeData]).pipe(delay(300));
  }

  search(searchTerm: string): Observable<DmHangHoaThiTruongDto[]> {
    const filteredData = this.fakeData.filter(item =>
      item.maHangHoa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tenHangHoa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nhomHangHoa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.xuatXu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.ghiChu && item.ghiChu.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return of(filteredData).pipe(delay(300));
  }

  getById(id: string): Observable<DmHangHoaThiTruongDto | null> {
    const item = this.fakeData.find(x => x.id === id);
    return of(item || null).pipe(delay(200));
  }

  create(item: DmHangHoaThiTruongDto): Observable<DmHangHoaThiTruongDto> {
    const newItem = {
      ...item,
      id: (this.fakeData.length + 1).toString(),
      createdDate: new Date()
    };
    this.fakeData.push(newItem);
    return of(newItem).pipe(delay(500));
  }

  update(item: DmHangHoaThiTruongDto): Observable<DmHangHoaThiTruongDto> {
    const index = this.fakeData.findIndex(x => x.id === item.id);
    if (index !== -1) {
      this.fakeData[index] = { ...item, updatedDate: new Date() };
      return of(this.fakeData[index]).pipe(delay(500));
    }
    throw new Error('Item not found');
  }

  delete(id: string): Observable<boolean> {
    const index = this.fakeData.findIndex(x => x.id === id);
    if (index !== -1) {
      this.fakeData.splice(index, 1);
      return of(true).pipe(delay(300));
    }
    return of(false).pipe(delay(300));
  }

  // Phương thức hỗ trợ cấu trúc cha-con
  buildTreeStructure(flatData: DmHangHoaThiTruongDto[]): DmHangHoaThiTruongDto[] {
    const map = new Map<string, DmHangHoaThiTruongDto>();
    const result: DmHangHoaThiTruongDto[] = [];

    // Tạo map và khởi tạo children array
    flatData.forEach(item => {
      map.set(item.id, { ...item, children: [], level: 0, isExpanded: true, hasChildren: false });
    });

    // Xây dựng cây
    flatData.forEach(item => {
      const node = map.get(item.id)!;

      if (item.macha) {
        const parent = map.get(item.macha);
        if (parent) {
          parent.children!.push(node);
          parent.hasChildren = true;
          node.level = (parent.level || 0) + 1;
        } else {
          result.push(node); // Nếu không tìm thấy cha, đặt ở root
        }
      } else {
        result.push(node); // Node gốc
      }
    });

    return result;
  }

  flattenTreeForDisplay(treeData: DmHangHoaThiTruongDto[]): DmHangHoaThiTruongDto[] {
    const result: DmHangHoaThiTruongDto[] = [];

    const flatten = (nodes: DmHangHoaThiTruongDto[], level: number = 0) => {
      nodes.forEach(node => {
        node.level = level;
        result.push(node);

        if (node.isExpanded && node.children && node.children.length > 0) {
          flatten(node.children, level + 1);
        }
      });
    };

    flatten(treeData);
    return result;
  }
}
