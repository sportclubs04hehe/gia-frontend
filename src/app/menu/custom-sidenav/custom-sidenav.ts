import { Component, computed, Input, Output, EventEmitter, signal, OnInit, inject } from '@angular/core';
import { MenuItem } from './MenuItem';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-custom-sidenav',
  imports: [
    RouterModule,
    CommonModule,
    MatListModule,
    MatIconModule,
    MatExpansionModule,
    MatTooltipModule,
  ],
  templateUrl: './custom-sidenav.html',
  styleUrl: './custom-sidenav.css'
})
export class CustomSidenav implements OnInit {
  private router = inject(Router);

  sideNavCollapsed = signal(false);
  @Input() set collapsed(value: boolean) {
    this.sideNavCollapsed.set(value);
    // Khi menu collapsed, đóng tất cả expansion panels
    if (value) {
      this.closeAllPanels();
    }
  }

  // Output để thông báo cho component cha mở menu
  @Output() menuToggleRequested = new EventEmitter<boolean>();

  // Track expansion panel states
  expandedPanels = signal<Set<string>>(new Set());

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

  ngOnInit() {
    // Listen to router navigation events để maintain expanded state
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.updateExpandedStateBasedOnRoute(event.url);
    });

    // Set initial expanded state based on current route
    this.updateExpandedStateBasedOnRoute(this.router.url);
  }

  // Method để cập nhật expanded state dựa trên current route
  private updateExpandedStateBasedOnRoute(url: string) {
    if (this.sideNavCollapsed()) return; // Không update khi collapsed

    // Kiểm tra nếu current route thuộc về một parent menu item
    this.menuItems().forEach(item => {
      if (item.children && item.children.length > 0) {
        const hasActiveChild = item.children.some(child =>
          url.includes(child.route || '')
        );

        if (hasActiveChild) {
          const currentExpanded = this.expandedPanels();
          const newExpanded = new Set(currentExpanded);
          newExpanded.add(item.label);
          this.expandedPanels.set(newExpanded);
        }
      }
    });
  }

  // Method to handle menu item click when collapsed
  onMenuItemClick(item: MenuItem, event: Event) {
    if (this.sideNavCollapsed() && item.children && item.children.length > 0) {
      event.preventDefault();
      event.stopPropagation();

      // Thông báo cho component cha mở menu
      this.menuToggleRequested.emit(false);

      // Delay để đảm bảo DOM được update
      setTimeout(() => {
        const currentExpanded = this.expandedPanels();
        const newExpanded = new Set(currentExpanded);
        newExpanded.add(item.label);
        this.expandedPanels.set(newExpanded);
      }, 150);
    }
  }

  // Method to toggle expansion panel
  togglePanel(itemLabel: string) {
    const currentExpanded = this.expandedPanels();
    const newExpanded = new Set(currentExpanded);

    if (newExpanded.has(itemLabel)) {
      newExpanded.delete(itemLabel);
    } else {
      newExpanded.add(itemLabel);
    }

    this.expandedPanels.set(newExpanded);
  }

  // Method to check if panel is expanded
  isPanelExpanded(itemLabel: string): boolean {
    return this.expandedPanels().has(itemLabel);
  }

  // Method để check xem có menu con nào đang active không
  hasActiveChild(item: MenuItem): boolean {
    if (!item.children) return false;
    const currentUrl = this.router.url;
    return item.children.some(child =>
      currentUrl.includes(child.route || '')
    );
  }

  // Method to handle expansion panel change
  onPanelExpandedChange(itemLabel: string, expanded: boolean) {
    const currentExpanded = this.expandedPanels();
    const newExpanded = new Set(currentExpanded);

    if (expanded) {
      newExpanded.add(itemLabel);
    } else {
      // Chỉ cho phép đóng panel nếu không có menu con nào active
      const item = this.menuItems().find(i => i.label === itemLabel);
      if (item && !this.hasActiveChild(item)) {
        newExpanded.delete(itemLabel);
      }
    }

    this.expandedPanels.set(newExpanded);
  }

  // Method to handle submenu click
  onSubmenuClick(parentLabel: string) {
    // Đảm bảo parent panel vẫn mở khi click vào submenu
    const currentExpanded = this.expandedPanels();
    const newExpanded = new Set(currentExpanded);
    newExpanded.add(parentLabel);
    this.expandedPanels.set(newExpanded);
  }

  // Method to close all panels
  private closeAllPanels() {
    this.expandedPanels.set(new Set());
  }
}
