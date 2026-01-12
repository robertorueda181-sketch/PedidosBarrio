import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  imports: [RouterModule, CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements AfterViewInit {
  userType: string = 'NEGOCIO';
  businessLabel: string = 'Negocio';

  // Métricas generales (simuladas por tipo)
  stats = {
    mainCount: 0,
    mainLabel: 'Items',
    secondaryCount: 0,
    secondaryLabel: 'Vistas',
    leadsCount: 0,
    revenue: 0
  };

  constructor() {
    const storedType = localStorage.getItem('userType');
    if (storedType) {
      this.userType = storedType;
      this.updateStatsByBusiness();
    }
  }

  updateStatsByBusiness() {
    switch (this.userType) {
      case 'NEGOCIO':
        this.businessLabel = 'Negocio';
        this.stats = {
          mainCount: 45,
          mainLabel: 'Productos',
          secondaryCount: 1250,
          secondaryLabel: 'Pedidos',
          leadsCount: 18,
          revenue: 3450.50
        };
        break;
      case 'SERVICIO':
        this.businessLabel = 'Servicio';
        this.stats = {
          mainCount: 12,
          mainLabel: 'Servicios',
          secondaryCount: 850,
          secondaryLabel: 'Consultas',
          leadsCount: 24,
          revenue: 0 // Servicios suelen ser por presupuesto
        };
        break;
      case 'INMUEBLE':
        this.businessLabel = 'Inmobiliaria';
        this.stats = {
          mainCount: 8,
          mainLabel: 'Propiedades',
          secondaryCount: 3200,
          secondaryLabel: 'Visitas',
          leadsCount: 15,
          revenue: 0
        };
        break;
    }
  }

  ngAfterViewInit() {
    this.initWeeklyChart();
    this.initDailyChart();
  }

  initWeeklyChart() {
    const ctx = document.getElementById('weeklyChart') as HTMLCanvasElement;
    if (ctx) {
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
          datasets: [{
            label: 'Vistas',
            data: [120, 150, 180, 250],
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
  }

  initDailyChart() {
    const ctx = document.getElementById('dailyChart') as HTMLCanvasElement;
    if (ctx) {
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
          datasets: [{
            label: 'Vistas',
            data: [45, 52, 38, 65, 85, 95, 70],
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            borderColor: 'rgb(16, 185, 129)',
            borderWidth: 2,
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
  }
}
