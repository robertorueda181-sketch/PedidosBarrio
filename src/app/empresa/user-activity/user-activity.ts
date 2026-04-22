import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService } from '../../../shared/services/analytics.service';

@Component({
  selector: 'app-user-activity',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="activity-container">
      <h2>Tu Actividad en el Sitio</h2>

      <!-- Estadísticas generales -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div>
            <div class="stat-label">Total de Visitas</div>
            <div class="stat-value">{{ localStats?.totalVisits || 0 }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📄</div>
          <div>
            <div class="stat-label">Páginas Vistas</div>
            <div class="stat-value">{{ localStats?.pagesVisited || 0 }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🔍</div>
          <div>
            <div class="stat-label">Búsquedas</div>
            <div class="stat-value">{{ localStats?.totalSearches || 0 }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⏱️</div>
          <div>
            <div class="stat-label">Tiempo Promedio</div>
            <div class="stat-value">{{ localStats?.avgDuration || 0 }}s</div>
          </div>
        </div>
      </div>

      <div class="content-sections">
        <!-- Historial de páginas -->
        <div class="section">
          <h3>Historial de Navegación</h3>
          <div class="history-list">
            <div *ngFor="let page of pageHistory" class="history-item">
              <div class="page-info">
                <div class="page-name">{{ page.page }}</div>
                <div class="page-meta">
                  {{ page.timestamp | date:'short' }} • {{ page.duration }}s
                </div>
              </div>
            </div>
            <div *ngIf="pageHistory.length === 0" class="empty-state">
              No hay historial de navegación
            </div>
          </div>
        </div>

        <!-- Historial de búsquedas -->
        <div class="section">
          <h3>Búsquedas Recientes</h3>
          <div class="search-list">
            <div *ngFor="let search of searchHistory" class="search-item">
              <div class="search-icon">🔍</div>
              <div class="search-info">
                <div class="search-query">{{ search.query }}</div>
                <div class="search-meta">
                  {{ search.timestamp | date:'short' }}
                  <span *ngIf="search.resultsCount !== undefined">
                    • {{ search.resultsCount }} resultados
                  </span>
                </div>
              </div>
            </div>
            <div *ngIf="searchHistory.length === 0" class="empty-state">
              No has realizado búsquedas
            </div>
          </div>
        </div>

        <!-- Páginas más visitadas -->
        <div class="section">
          <h3>Páginas Más Visitadas</h3>
          <div class="top-pages-list">
            <div *ngFor="let page of localStats?.topPages" class="top-page-item">
              <div class="page-name">{{ page.page }}</div>
              <div class="page-count">{{ page.count }} visitas</div>
            </div>
            <div *ngIf="!localStats?.topPages || localStats.topPages.length === 0" class="empty-state">
              No hay datos suficientes
            </div>
          </div>
        </div>
      </div>

      <!-- Botón para limpiar historial -->
      <div class="actions">
        <button class="btn-clear" (click)="clearHistory()">
          Limpiar Historial
        </button>
      </div>
    </div>
  `,
  styles: [`
    .activity-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    h2 {
      font-size: 2rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 2rem;
    }

    h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 1rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .stat-icon {
      font-size: 2rem;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: 0.25rem;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
    }

    .content-sections {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
    }

    .section {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .history-list,
    .search-list,
    .top-pages-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-height: 400px;
      overflow-y: auto;
    }

    .history-item,
    .search-item,
    .top-page-item {
      padding: 0.75rem;
      background: #f9fafb;
      border-radius: 8px;
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .page-info,
    .search-info {
      flex: 1;
    }

    .page-name,
    .search-query {
      font-weight: 500;
      color: #111827;
      margin-bottom: 0.25rem;
    }

    .page-meta,
    .search-meta {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .search-icon {
      font-size: 1.25rem;
    }

    .top-page-item {
      justify-content: space-between;
    }

    .page-count {
      font-weight: 600;
      color: #3b82f6;
    }

    .empty-state {
      text-align: center;
      padding: 2rem;
      color: #9ca3af;
      font-size: 0.875rem;
    }

    .actions {
      margin-top: 2rem;
      text-align: center;
    }

    .btn-clear {
      padding: 0.75rem 1.5rem;
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn-clear:hover {
      background: #dc2626;
    }
  `]
})
export class UserActivityComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);

  localStats: any;
  pageHistory: any[] = [];
  searchHistory: any[] = [];

  ngOnInit() {
    this.loadActivity();
  }

  loadActivity() {
    this.localStats = this.analyticsService.getLocalStats();
    this.pageHistory = this.analyticsService.getPageHistory().slice(0, 20);
    this.searchHistory = this.analyticsService.getSearchHistory().slice(0, 20);
  }

  clearHistory() {
    if (confirm('¿Estás seguro de que quieres limpiar todo tu historial?')) {
      this.analyticsService.clearUserActivity();
      this.loadActivity();
    }
  }
}
