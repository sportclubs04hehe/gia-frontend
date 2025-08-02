import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { CustomSidenav } from './menu/custom-sidenav/custom-sidenav';

@Component({
  selector: 'app-root',
  imports: [
    CustomSidenav,
    RouterOutlet,
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  collapsed = signal(false);

  sidenavWidth = computed(() => this.collapsed() ? '65px' : '250px');

  // Method to handle menu toggle request from sidenav
  onMenuToggleRequested(shouldCollapse: boolean) {
    this.collapsed.set(shouldCollapse);
  }
}
