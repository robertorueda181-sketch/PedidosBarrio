import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';

export interface PaginaDto {
  contenido: string;
  descripcion: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaginasService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);

  getPagina(): Observable<PaginaDto> {
    return this.http.get<PaginaDto>(`${this.config.apiUrl}/Paginas/codigo`);
  }

  getPaginaPorCodigo(codigo: string): Observable<PaginaDto> {
    return this.http.get<PaginaDto>(`${this.config.apiUrl}/Paginas/${encodeURIComponent(codigo)}`);
  }

  savePagina(pagina: PaginaDto): Observable<any> {
    return this.http.post(`${this.config.apiUrl}/Paginas`, pagina);
  }
}
