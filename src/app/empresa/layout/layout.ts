import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';
import { RegisterService } from '../../../shared/services/register.service';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AppConfigService } from '../../../shared/services/app-config.service';

@Component({
  selector: 'app-layout',
  imports: [RouterModule, CommonModule],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);
  private config = inject(AppConfigService);
  private readonly MENU_CACHE_KEY = 'empresa_menu_items';

  isSidebarCollapsed = signal(false);
  isMobileMenuOpen = signal(false);
  menuItems = signal<any[]>([]);
  loadingItems = signal(true);

  ngOnInit() {
    this.loadMenus();
  }

  loadMenus() {
    const cachedMenus = sessionStorage.getItem(this.MENU_CACHE_KEY);

    if (cachedMenus) {
      try {
        const mapped = JSON.parse(cachedMenus);
        this.menuItems.set(mapped);
        this.loadingItems.set(false);
        console.log('Menus loaded from cache');
        return;
      } catch (e) {
        console.error('Error parsing cached menus', e);
        sessionStorage.removeItem(this.MENU_CACHE_KEY);
      }
    }

    this.loadingItems.set(true);
    const url = `${this.config.apiUrl}/configuracion/menus`;
    this.http.get<any[]>(url).subscribe({
      next: (data) => {
        this.loadingItems.set(false);
        console.log('Menus loaded from backend:', data);
        if (!Array.isArray(data)) return;

        const mapped = data.map(item => ({
          id: item.menuID,
          nombre: item.nombre,
          icono: item.icon,
          url: `/empresa/${(item.codigo || '').toLowerCase()}`
        }));

        this.menuItems.set(mapped);
        sessionStorage.setItem(this.MENU_CACHE_KEY, JSON.stringify(mapped));
        console.log('Menus mapped and cached:', mapped);
      },
      error: (err) => {
        console.error('Error loading menus:', err);
        this.loadingItems.set(false);
      }
    });
  }

  toggleSidebar() {
    this.isSidebarCollapsed.update(v => !v);
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(v => !v);
  }

  logout() {
    sessionStorage.removeItem(this.MENU_CACHE_KEY);
    this.authService.signOut();
  }
}
