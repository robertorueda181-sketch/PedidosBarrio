import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AppConfigService } from '../../../../shared/services/app-config.service';
import { ProgressStep } from '../interfaces/progress-step.interface';
import { PasoInicialResponse } from '../interfaces/response/paso-inicial-response.interface';

@Injectable({
  providedIn: 'root'
})
export class PasosInicialesService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);

  getPasosIniciales(): Observable<ProgressStep[]> {
    const apiUrl = this.config.apiUrl;
    if (!apiUrl) {
      throw new Error('API URL no está configurada');
    }
    return this.http.get<PasoInicialResponse>(`${apiUrl}/PasosIniciales`).pipe(
      map(response => {
        const pasos = response.data;
        if (!Array.isArray(pasos)) {
          console.warn('La respuesta del API no es un array:', pasos);
          return [];
        }
        return pasos
          .sort((a, b) => a.orden - b.orden)
          .map(paso => this.mapToProgressStep(paso));
      })
    );
  }

  private mapToProgressStep(paso: {
    pasoID: number;
    empresaID: string;
    titulo: string;
    descripcion: string;
    icono: string;
    ruta: string;
    obligatorio: boolean;
    completado: boolean;
    orden: number;
    fechaCreacion: string;
    fechaCompletado: string | null;
  }): ProgressStep {
    return {
      id: paso.pasoID,
      title: paso.titulo,
      description: paso.descripcion,
      completed: paso.completado,
      route: paso.ruta,
      icon: paso.icono || 'pi-circle',
      isPro: !paso.obligatorio,
    };
  }
}
