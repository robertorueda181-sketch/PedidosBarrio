import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../shared/services/app-config.service';

export interface DashboardResponse {
  cantidadProductos: number;
  vistasHoy: number;
  suscripcion: {
    suscripcionID: number;
    nivelSuscripcion: number;
    monto: number;
    fechaInicio: string;
    fechaFin: string;
    activa: boolean;
    nivelDescripcion: string;
  };
  estadisticasPorMes: {
    mes: string;
    nombreMes: string;
    año: number;
    totalVistas: number;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);

  getDashboardData(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`${this.config.apiUrl}/Dashboard`);
  }
}
