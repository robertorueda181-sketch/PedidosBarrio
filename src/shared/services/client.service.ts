import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';

export interface ClientProfile {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  fotoUrl?: string; // Optional
}

export interface ClientAddress {
  id: string;
  nombre: string; // "Casa", "Trabajo"
  direccion: string;
  latitud: number;
  longitud: number;
  departamentoId: string;
  provinciaId: string;
  distritoId: string;
  referencia?: string;
  esPrincipal: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private http = inject(HttpClient);
  private appConfig = inject(AppConfigService);

  private get apiUrl() {
    return this.appConfig.apiUrl + '/Client'; // Adjust base URL as needed
  }

  getProfile(): Observable<ClientProfile> {
    return this.http.get<ClientProfile>(`${this.apiUrl}/profile`);
  }

  updateProfile(data: Partial<ClientProfile>): Observable<any> {
    return this.http.put(`${this.apiUrl}/profile`, data);
  }

  getAddresses(): Observable<ClientAddress[]> {
    return this.http.get<ClientAddress[]>(`${this.apiUrl}/addresses`);
  }

  addAddress(address: Omit<ClientAddress, 'id'>): Observable<ClientAddress> {
    return this.http.post<ClientAddress>(`${this.apiUrl}/addresses`, address);
  }

  updateAddress(id: string, address: Partial<ClientAddress>): Observable<any> {
    return this.http.put(`${this.apiUrl}/addresses/${id}`, address);
  }

  deleteAddress(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/addresses/${id}`);
  }
}
