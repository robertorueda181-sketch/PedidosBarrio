import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService } from '../../../shared/services/analytics.service';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="analytics-container">
      <h1>Estadísticas de Visitas</h1>

      <div *ngIf="loading" class="loading">
        <p>Cargando estadísticas...</p>
      </div>

      <div *ngIf="!loading && stats" class="stats-grid">
        <!-- Total de visitas -->
        <div class="stat-card">
          <div class="stat-icon">👁️</div>
          <div class="stat-content">
            <h3>Total de Visitas</h3>
            <p class="stat-number">{{ stats.totalViews | number }}</p>
          </div>
        </div>

        <!-- Visitantes únicos -->
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <h3>Visitantes Únicos</h3>
            <p class="stat-number">{{ stats.uniqueVisitors | number }}</p>
          </div>
        </div>

        <!-- Tiempo promedio -->
        <div class="stat-card">
          <div class="stat-icon">⏱️</div>
          <div class="stat-content">
            <h3>Tiempo Promedio</h3>
            <p class="stat-number">{{ stats.avgDuration }}s</p>
          </div>
        </div>

        <!-- Dispositivos -->
        <div class="stat-card">
          <div class="stat-icon">📱</div>
          <div class="stat-content">
            <h3>Dispositivos</h3>
            <div class="device-breakdown">
              <p>Desktop: {{ stats.deviceBreakdown?.desktop || 0 }}</p>
              <p>Mobile: {{ stats.deviceBreakdown?.mobile || 0 }}</p>
              <p>Tablet: {{ stats.deviceBreakdown?.tablet || 0 }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Páginas más vistas -->
      <div *ngIf="!loading && stats" class="top-pages">
        <h2>Páginas Más Vistas</h2>
        <div class="page-list">
          <div *ngFor="let page of stats.topPages" class="page-item">
            <span class="page-name">{{ page.page }}</span>
            <span class="page-views">{{ page.views }} vistas</span>
          </div>
        </div>
      </div>

      <!-- Filtros de fecha -->
      <div class="date-filters">
        <button (click)="loadStats(7)" [class.active]="selectedPeriod === 7">
          Últimos 7 días
        </button>
        <button (click)="loadStats(30)" [class.active]="selectedPeriod === 30">
          Últimos 30 días
        </button>
        <button (click)="loadStats(90)" [class.active]="selectedPeriod === 90">
          Últimos 90 días
        </button>
      </div>
    </div>
  `,
  styles: [`
    .analytics-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    h1 {
      font-size: 2rem;
      margin-bottom: 2rem;
      color: #1f2937;
    }

    .loading {
      text-align: center;
      padding: 3rem;
      color: #6b7280;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }

    .stat-icon {
      font-size: 2.5rem;
    }

    .stat-content h3 {
      font-size: 0.875rem;
      color: #6b7280;
      margin: 0 0 0.5rem 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stat-number {
      font-size: 2rem;
      font-weight: bold;
      color: #1f2937;
      margin: 0;
    }

    .device-breakdown {
      font-size: 0.875rem;
      color: #4b5563;
    }

    .device-breakdown p {
      margin: 0.25rem 0;
    }

    .top-pages {
      background: white;
      padding: 1.5rem;
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      margin-bottom: 2rem;
    }

    .top-pages h2 {
      font-size: 1.5rem;
      margin: 0 0 1rem 0;
      color: #1f2937;
    }

    .page-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .page-item {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem;
      background: #f9fafb;
      border-radius: 0.375rem;
    }

    .page-name {
      color: #1f2937;
      font-weight: 500;
    }

    .page-views {
      color: #6b7280;
    }

    .date-filters {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }

    .date-filters button {
      padding: 0.75rem 1.5rem;
      border: 1px solid #d1d5db;
      background: white;
      border-radius: 0.375rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .date-filters button:hover {
      background: #f9fafb;
    }

    .date-filters button.active {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }
  `]
})
export class AnalyticsDashboardComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);
  
  stats: any = null;
  loading = true;
  selectedPeriod = 7;

  ngOnInit() {
    this.loadStats(7);
  }

  loadStats(days: number) {
    this.selectedPeriod = days;
    this.loading = true;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    this.analyticsService.getStats(
      startDate.toISOString(),
      endDate.toISOString()
    ).subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar estadísticas:', error);
        this.loading = false;
      }
    });
  }
}
