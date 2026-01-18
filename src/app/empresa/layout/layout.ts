import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';
import { RegisterService } from '../../../shared/services/register.service';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AppConfigService } from '../../../shared/services/app-config.service';
import { ProgressButtonComponent } from '../components/progress-button/progress-button.component';

@Component({
  selector: 'app-layout',
  imports: [RouterModule, CommonModule, ProgressButtonComponent],
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
  expandedMenus = signal<Set<string>>(new Set());

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
        console.log('Menus combined and cached:', data);
        const mapped = data.map(item => ({
          id: item.codigo || item.menuID.toString(),
          nombre: item.nombre,
          icono: item.icon,
          url: item.codigo ? `/empresa/${item.codigo.toLowerCase()}` : null,
          padre: item.padre
        }));

        this.menuItems.set(mapped);
        sessionStorage.setItem(this.MENU_CACHE_KEY, JSON.stringify(mapped));
        console.log('Menus loaded and cached:', mapped);
      },
      error: (err) => {
        console.error('Error loading menus:', err);
        this.loadingItems.set(false);
      }
    });
  }

  toggleSubmenu(menuId: string, event: Event) {
    event.stopPropagation();
    const current = new Set(this.expandedMenus());
    if (current.has(menuId)) {
      current.delete(menuId);
    } else {
      current.add(menuId);
    }
    this.expandedMenus.set(current);
  }

  isExpanded(menuId: string): boolean {
    return this.expandedMenus().has(menuId);
  }

  getMenuChildren(padre: string) {
    return this.menuItems().filter(item => item.padre === padre);
  }

  getRootMenus() {
    return this.menuItems().filter(item => !item.padre);
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
