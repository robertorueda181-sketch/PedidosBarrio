import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';

export interface TipoValor {
    id: number;
    descripcion: string;
    valor: string;
}

@Injectable({
    providedIn: 'root'
})
export class TipoService {
    private http = inject(HttpClient);
    private config = inject(AppConfigService);

    getTiposValores(): Observable<TipoValor[]> {
        return this.http.get<TipoValor[]>(`${this.config.apiUrl}/Tipos/valores`);
    }
}
