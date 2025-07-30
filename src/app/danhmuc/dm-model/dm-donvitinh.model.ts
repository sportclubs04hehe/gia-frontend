import { BaseDto } from "./base.model";

export interface DmDonViTinhDto extends BaseDto {
  ma: string;
  ten: string;
  ghiChu?: string;
  ngayHieuLuc: Date;
  ngayHetHieuLuc: Date;
}

export interface DmDonViTinhCreateDto {
  ma: string;
  ten: string;
  ghiChu?: string;
  ngayHieuLuc: Date;
  ngayHetHieuLuc: Date;
}

export interface DmDonViTinhUpdateDto {
  id: string;
  ma: string;
  ten: string;
  ghiChu?: string;
  ngayHieuLuc: Date;
  ngayHetHieuLuc: Date;
}

export interface DmDonViTinhImportDto {
  ma: string;
  ten: string;
  ghiChu?: string;
}