import { Component, AfterViewInit, OnInit, inject, signal, computed } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { DashboardService, DashboardResponse } from '../services/dashboard.service';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements AfterViewInit, OnInit {
  private dashboardService = inject(DashboardService);
  
  userType: string = 'NEGOCIO';
  businessLabel: string = 'Negocio';
  private charts: { [key: string]: Chart } = {};

  // Cambiado a Signal
  dashboardData = signal<DashboardResponse | null>(null);

  // Metricas como computed signals (derivadas de dashboardData) para reactividad
  stats = {
    mainCount: 0,
    mainLabel: 'Items',
    secondaryCount: 0,
    secondaryLabel: 'Vistas Hoy',
    leadsCount: 0,
    revenue: 0,
    subscriptionLevel: 'Gratis',
    subscriptionActive: false
  };

  // Signal computed para productos
  cantidadProductos = computed(() => this.dashboardData()?.cantidadProductos || 0);
  
  // Signal computed para suscripcion
  suscripcion = computed(() => this.dashboardData()?.suscripcion || null);

  constructor() {
    const storedType = localStorage.getItem('userType');
    if (storedType) {
      this.userType = storedType;
      this.setLabelsByUserType();
    }
  }

  ngOnInit() {
    this.loadDashboardData();
  }

  ngAfterViewInit() {
    // Charts will be initialized when data is loaded
  }

  setLabelsByUserType() {
    switch (this.userType) {
      case 'NEGOCIO':
        this.businessLabel = 'Negocio';
        this.stats.mainLabel = 'Productos';
        break;
      case 'SERVICIO':
        this.businessLabel = 'Servicio';
        this.stats.mainLabel = 'Servicios';
        break;
      case 'INMUEBLE':
        this.businessLabel = 'Inmobiliaria';
        this.stats.mainLabel = 'Propiedades';
        break;
    }
  }

  loadDashboardData() {
    this.dashboardService.getDashboardData().subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.updateStats(data);
        console.log('Dashboard data loaded:', data);
        // Delay chart init slightly to ensure view is ready if called immediately
        setTimeout(() => this.initCharts(data.estadisticasPorMes), 0);
      },
      error: (err) => console.error('Error loading dashboard data', err)
    });
  }

  updateStats(data: DashboardResponse) {
    // Actualizamos el objeto stats para que el resto de template siga funcionando
    this.stats.mainCount = data.cantidadProductos;
    this.stats.secondaryCount = data.vistasHoy;
    this.stats.secondaryLabel = 'Vistas Hoy';
    
    if (data.suscripcion) {
      this.stats.subscriptionLevel = data.suscripcion.nivelDescripcion;
      this.stats.subscriptionActive = data.suscripcion.activa;
      this.stats.revenue = data.suscripcion.monto; 
    }
  }

  initCharts(stats: any[]) {
    const ctxWeekly = document.getElementById('weeklyChart') as HTMLCanvasElement;
    if (ctxWeekly) {
      if (this.charts['monthly']) this.charts['monthly'].destroy();

      const labels = stats.map(s => s.nombreMes);
      const dataPoints = stats.map(s => s.totalVistas);

      this.charts['monthly'] = new Chart(ctxWeekly, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Vistas Mensuales',
            data: dataPoints,
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

    const ctxDaily = document.getElementById('dailyChart') as HTMLCanvasElement;
    if (ctxDaily) {
      if (this.charts['daily']) this.charts['daily'].destroy();

      this.charts['daily'] = new Chart(ctxDaily, {
        type: 'line',
        data: {
          labels: ['Lun', 'Mar', 'Mi�', 'Jue', 'Vie', 'S�b', 'Dom'],
          datasets: [{
            label: 'Actividad (Simulada)',
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
