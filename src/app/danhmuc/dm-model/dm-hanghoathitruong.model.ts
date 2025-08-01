export interface DmHangHoaThiTruongDto {
  id: string;
  macha?: string;
  maHangHoa: string;
  tenHangHoa: string;
  nhomHangHoa: string;
  xuatXu: string;
  giaThiTruong: number;
  giaTruocDo: number;
  ghiChu?: string;
  createdDate?: Date;
  updatedDate?: Date;
  
  // Thuộc tính cho cấu trúc cha-con
  children?: DmHangHoaThiTruongDto[];
  level?: number;
  isExpanded?: boolean;
  hasChildren?: boolean;
  parentId?: string;
}

export interface HangHoaThiTruongNode extends DmHangHoaThiTruongDto {
  children: HangHoaThiTruongNode[];
  level: number;
  isExpanded: boolean;
  hasChildren: boolean;
}
