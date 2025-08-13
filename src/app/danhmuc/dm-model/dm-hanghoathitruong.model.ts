import { BaseDto } from "./base.model";

export interface Dm_HangHoaThiTruongDto extends BaseDto {
  ma: string;
  ten: string;
  ghiChu?: string | null;
  dacTinh?: string | null;
  donViTinhId?: string | null;
  donViTinhTen?: string | null;
  ngayHieuLuc: Date;
  ngayHetHieuLuc: Date;
  children?: Dm_HangHoaThiTruongDto[];
  level?: number;
  isExpanded?: boolean;
  hasChildren: boolean;
}

export interface DmHangHoaThiTruongCreateDto {
  ma: string;
  ten: string;
  ghiChu?: string | null;
  dacTinh?: string | null;
  donViTinhId?: string | null;
  ngayHieuLuc: Date;
  ngayHetHieuLuc: Date;
  parentId?: string | null;
}

export interface DmHangHoaThiTruongUpdateDto {
  id: string;
  ma: string;
  ten: string;
  ghiChu?: string | null;
  dacTinh?: string | null;
  donViTinhId?: string | null;
  ngayHieuLuc: Date;
  ngayHetHieuLuc: Date;
  parentId?: string | null;
}

export interface HangHoaThiTruongImportDto {
  ma: string;
  ten: string;
  parentCode?: string | null;
  donViTinh?: string | null;
  ghiChu?: string | null;
  dacTinh?: string | null;
  ngayHieuLuc?: Date | null;
  ngayHetHieuLuc?: Date | null;
  rowIndex: number;
}

export interface Dm_HangHoaThiTruongTreeDto {
  id: string;
  ma: string;
  ten: string;
  ghiChu?: string | null;
  ngayHieuLuc: Date;
  ngayHetHieuLuc: Date;
  hasChildren: boolean;
  createdDate?: Date | null;
  modifiedDate?: Date | null;
  createdBy?: string | null;
  modifiedBy?: string | null;
  children: Dm_HangHoaThiTruongTreeDto[];
}

export interface Dm_HangHoaThiTruongFlatDto {
  id: string;
  ma: string;
  ten: string;
  ghiChu?: string | null;
  dacTinh?: string | null;
  donViTinhId?: string | null;
  donViTinhTen?: string | null;
  depth: number;
  ngayHieuLuc: Date;
  ngayHetHieuLuc: Date;
}