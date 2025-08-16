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
  isParent: boolean;
  parentId?: string | null; 
  level?: number;
  isExpanded?: boolean;
  children?: Dm_HangHoaThiTruongDto[];
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
  isParent: boolean;
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
  isParent: boolean;
}
