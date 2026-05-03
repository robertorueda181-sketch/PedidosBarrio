import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../../shared/services/app-config.service';
import { DashboardResponse } from '../interfaces/response/dashboard-response.interface';

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
