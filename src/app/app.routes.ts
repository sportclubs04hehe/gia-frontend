import { Routes } from '@angular/router';
import { Dashboard } from './menu/dashboard/dashboard';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
    },
    {
        path: 'dashboard',
        component: Dashboard
    },
    {
        path: 'danhmuc',
        children: [
            {
                path: 'dm-hang-hoa-thi-truong',
                loadComponent: () => import('./danhmuc/dm-hanghoathitruong/dm-hanghoathitruong')
                .then(m => m.DmHanghoathitruong)
            },
             {
                path: 'dm-don-vi-tinh',
                loadComponent: () => import('./danhmuc/dm-donvitinh/dm-donvitinh')
                .then(m => m.DmDonvitinh)
            },
             {
                path: 'dm-nguon-thong-tin',
                loadComponent: () => import('./danhmuc/dm-nguonthongtin/dm-nguonthongtin')
                .then(m => m.DmNguonthongtin)
            },
             {
                path: 'dm-loai-mat-hang',
                loadComponent: () => import('./danhmuc/dm-loaimathang/dm-loaimathang')
                .then(m => m.DmLoaimathang)
            },
        ]
    }
];
