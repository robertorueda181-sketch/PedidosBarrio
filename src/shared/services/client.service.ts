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

export interface ClientAddressRequest {
  nombre: string;
  direccionTexto: string;
  referencia: string;
  latitud: number;
  longitud: number;
  departamento: string;
  provincia: string;
  distrito: string;
  codigoPostal: string;
  esPrincipal: boolean;
}

export interface ClientAddress extends ClientAddressRequest {
  id: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private http = inject(HttpClient);
  private appConfig = inject(AppConfigService);

  private get apiUrl() {
    return this.appConfig.apiUrl + '/Clientes'; // Updated base URL to match convention
  }

  getProfile(): Observable<ClientProfile> {
      // Assuming profile endpoint is also under /Clientes
    return this.http.get<ClientProfile>(`${this.apiUrl}/Perfil`);
  }

  updateProfile(data: Partial<ClientProfile>): Observable<any> {
    return this.http.put(`${this.apiUrl}/Perfil`, data);
  }

  getAddresses(): Observable<ClientAddress[]> {
    return this.http.get<ClientAddress[]>(`${this.apiUrl}/Direcciones`);
  }

  addAddress(address: ClientAddressRequest): Observable<ClientAddress> {
    return this.http.post<ClientAddress>(`${this.apiUrl}/Direcciones`, address);
  }

  updateAddress(id: string, address: Partial<ClientAddressRequest>): Observable<any> {
    return this.http.put(`${this.apiUrl}/Direcciones/${id}`, address);
  }

  deleteAddress(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/Direcciones/${id}`);
  }
}
