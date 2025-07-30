export interface ImportErrorDto {
  row: number;
  message: string;
  columnErrors: { [key: string]: string };
}

export interface ImportResultDto {
  totalRecords: number;
  successCount: number;
  errorCount: number;
  errors: ImportErrorDto[];
}