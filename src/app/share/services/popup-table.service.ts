import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Observable } from 'rxjs';

import { PopupTableDialog, PopupTableData, PopupTableResult } from '../components/dialogs/popup-table-dialog/popup-table-dialog';

@Injectable({
  providedIn: 'root'
})
export class PopupTableService {
  constructor(private dialog: MatDialog) {}

  openPopup<T>(config: PopupTableData<T>, dialogConfig?: MatDialogConfig): Observable<PopupTableResult<T> | undefined> {
    const defaultDialogConfig: MatDialogConfig = {
      width: '800px',
      maxWidth: '90vw',
      height: '600px',
      maxHeight: '90vh',
      disableClose: false,
      autoFocus: true,
      restoreFocus: true,
      ...dialogConfig
    };

    const dialogRef = this.dialog.open(PopupTableDialog<T>, {
      ...defaultDialogConfig,
      data: config
    });

    return dialogRef.afterClosed();
  }
}