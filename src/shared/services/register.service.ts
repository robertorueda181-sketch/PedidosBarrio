import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RegisterRequest, SocialUserRequest } from '../interfaces/register.interface';
import { AppConfigService } from './app-config.service';

@Injectable({
    providedIn: 'root'
})
export class RegisterService {
    private http = inject(HttpClient);
    private appConfigService = inject(AppConfigService);

    get apiUrl() {
        return this.appConfigService.apiUrl + '/register';
    }

    registerBusiness(data: RegisterRequest): Observable<any> {
        return this.http.post(`${this.appConfigService.apiUrl}/Auth/Register/business`, data);
    }

    registerSocialUser(data: RegisterRequest): Observable<any> {
        return this.http.post(`${this.appConfigService.apiUrl}/Auth/Register/social`, data);
    }

    getCategories(tipo: string, param: string = ''): Observable<any[]> {
        return this.http.get<any[]>(`${this.appConfigService.apiUrl}/Tipos?tipo=${tipo}&param=${param}`);
    }

    reverseGeocode(lat: number, lng: number): Observable<any> {
        return this.http.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
    }
}
