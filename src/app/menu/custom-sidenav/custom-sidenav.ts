import { Component, computed, Input, signal } from '@angular/core';
import { MenuItem } from './MenuItem';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-custom-sidenav',
  imports: [
    RouterModule,
    CommonModule,
    MatListModule,
    MatIconModule,
    MatExpansionModule,
  ],
  templateUrl: './custom-sidenav.html',
  styleUrl: './custom-sidenav.css'
})
export class CustomSidenav {
  sideNavCollapsed = signal(false);
  @Input() set collapsed(value: boolean) { 
    this.sideNavCollapsed.set(value);
}

  menuItems = signal<MenuItem[]>([
      { icon: 'dashboard', label: 'Dashboard', route: 'dashboard' },
      { 
        icon: 'inventory', 
        label: 'Danh mục', 
        children: [
          { icon: 'video_library', label: 'Hàng hóa thị trường', route: 'danhmuc/dm-hang-hoa-thi-truong' },
          { icon: 'analytics', label: 'Đơn vị tính', route: 'danhmuc/dm-don-vi-tinh' },
          { icon: 'info', label: 'Nguồn thông tin', route: 'danhmuc/dm-nguon-thong-tin' },
          { icon: 'category', label: 'Loại mặt hàng', route: 'danhmuc/dm-loai-mat-hang' }
        ]
      }
  ]);

  profilePicSize = computed(() => this.sideNavCollapsed() ? '32' : '60');
}
