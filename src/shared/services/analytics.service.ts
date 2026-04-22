import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CookieService } from './cookie.service';
import { AppConfigService } from './app-config.service';

export interface PageView {
  pageUrl: string;
  pageName: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  referrer?: string;
  userAgent?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  duration?: number;
}

export interface SearchQuery {
  query: string;
  timestamp: Date;
  resultsCount?: number;
}

export interface UserActivity {
  pageHistory: Array<{ page: string; timestamp: Date; duration: number }>;
  searches: SearchQuery[];
  lastVisit: Date;
  totalVisits: number;
  preferences: any;
}

export interface AnalyticsStats {
  totalViews: number;
  uniqueVisitors: number;
  topPages: Array<{ page: string; views: number }>;
  deviceBreakdown: { desktop: number; mobile: number; tablet: number };
  avgDuration: number;
  periodStart: string;
  periodEnd: string;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private apiUrl = 'http://localhost:5000/api'; // Cambiar en producción
  private sessionId: string;
  private pageStartTime: Date | null = null;
  private currentPage: string = '';
  private appConfig = inject(AppConfigService);

  constructor(
    private http: HttpClient,
    private cookieService: CookieService
  ) {
    this.sessionId = this.getOrCreateSessionId();
    this.initializeUserActivity();
  }

  /**
   * Inicializa la actividad del usuario desde cookies
   */
  private initializeUserActivity(): void {
    const activity = this.getUserActivity();
    
    // Incrementar contador de visitas
    activity.totalVisits++;
    activity.lastVisit = new Date();
    
    this.saveUserActivity(activity);
  }



  /**
   * Registra un evento personalizado
   */
  trackEvent(eventName: string, eventData?: any): void {
    const event = {
      eventName,
      eventData,
      timestamp: new Date(),
      sessionId: this.sessionId,
      userId: this.getUserId(),
      pageUrl: window.location.href
    };

    this.http.post(`${this.apiUrl}/analytics/event`, event)
      .pipe(catchError(err => {
        console.error('Error al registrar evento:', err);
        return of(null);
      }))
      .subscribe();
  }

  /**
   * Obtiene estadísticas de analytics
   */
  getStats(startDate?: string, endDate?: string): Observable<AnalyticsStats> {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    return this.http.get<AnalyticsStats>(`${this.apiUrl}/analytics/stats`, { params });
  }

  /**
   * Obtiene vistas por página
   */
  getPageViews(pageUrl?: string, days: number = 7): Observable<any> {
    const params: any = { days: days.toString() };
    if (pageUrl) params.pageUrl = pageUrl;

    return this.http.get(`${this.apiUrl}/analytics/pageviews`, { params });
  }

  /**
   * Obtiene o crea un ID de sesión
   */
  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    
    if (!sessionId) {
      sessionId = this.generateUUID();
      sessionStorage.setItem('analytics_session_id', sessionId);
    }

    return sessionId;
  }

  /**
   * Obtiene el ID de usuario si está autenticado
   */
  private getUserId(): string | undefined {
    // Ajustar según tu sistema de autenticación
    return localStorage.getItem('userId') || undefined;
  }

  /**
   * Detecta el tipo de dispositivo
   */
  private getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    const ua = navigator.userAgent;
    
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    
    return 'desktop';
  }

  /**
   * Genera un UUID v4
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Registra una búsqueda
   */
  trackSearch(query: string, resultsCount?: number): void {
    const search: SearchQuery = {
      query,
      timestamp: new Date(),
      resultsCount
    };

    // Guardar en cookies
    const activity = this.getUserActivity();
    activity.searches.unshift(search);
    
    // Mantener solo las últimas 50 búsquedas
    activity.searches = activity.searches.slice(0, 50);
    
    this.saveUserActivity(activity);

    // Registrar como evento
    this.trackEvent('search', { query, resultsCount });
  }

  /**
   * Obtiene el historial de páginas visitadas
   */
  getPageHistory(): Array<{ page: string; timestamp: Date; duration: number }> {
    const activity = this.getUserActivity();
    return activity.pageHistory;
  }

  /**
   * Obtiene el historial de búsquedas
   */
  getSearchHistory(): SearchQuery[] {
    const activity = this.getUserActivity();
    return activity.searches;
  }

  /**
   * Obtiene la actividad completa del usuario
   */
  getUserActivity(): UserActivity {
    const cookieData = this.cookieService.getObject<UserActivity>('user_activity');
    
    if (cookieData) {
      // Convertir strings de fecha a objetos Date
      cookieData.lastVisit = new Date(cookieData.lastVisit);
      cookieData.pageHistory = cookieData.pageHistory.map(p => ({
        ...p,
        timestamp: new Date(p.timestamp)
      }));
      cookieData.searches = cookieData.searches.map(s => ({
        ...s,
        timestamp: new Date(s.timestamp)
      }));
      return cookieData;
    }

    return {
      pageHistory: [],
      searches: [],
      lastVisit: new Date(),
      totalVisits: 0,
      preferences: {}
    };
  }

  /**
   * Guarda la actividad del usuario en cookies
   */
  private saveUserActivity(activity: UserActivity): void {
    // Guardar por 365 días
    this.cookieService.setObject('user_activity', activity, { 
      expires: 365,
      sameSite: 'Lax'
    });
  }

  /**
   * Agrega una página al historial
   */
  private addToPageHistory(pageName: string, pageUrl: string): void {
    const activity = this.getUserActivity();
    
    activity.pageHistory.unshift({
      page: pageName,
      timestamp: new Date(),
      duration: 0
    });

    // Mantener solo las últimas 100 páginas
    activity.pageHistory = activity.pageHistory.slice(0, 100);
    
    this.saveUserActivity(activity);
  }

  /**
   * Guarda la duración de una página
   */
  private savePageDuration(pageUrl: string, duration: number): void {
    const activity = this.getUserActivity();
    
    // Buscar la última entrada de esta página y actualizar duración
    const lastEntry = activity.pageHistory.find(p => 
      p.timestamp === activity.pageHistory[0]?.timestamp
    );
    
    if (lastEntry) {
      lastEntry.duration = duration;
      this.saveUserActivity(activity);
    }
  }

  /**
   * Limpia el historial del usuario
   */
  clearUserActivity(): void {
    this.cookieService.delete('user_activity');
  }

  /**
   * Obtiene estadísticas locales del usuario
   */

  /**
   * Tracks a company view by sending the company code and current URL to the backend.
   * Endpoint: api/PageViews/track
   */
  trackCompanyView(codigoEmpresa: string): void {
    const endpoint = `${this.appConfig.apiUrl}/PageViews/track`;
    const payload = {
      codigoEmpresa: codigoEmpresa,
      url: window.location.href
    };
    
    this.http.post(endpoint, payload).subscribe({
      next: () => console.log('View tracked successfully'),
      error: (err) => console.error('Error tracking company view', err)
    });
  }

  getLocalStats(): any {
    const activity = this.getUserActivity();
    
    // Calcular páginas más visitadas
    const pageCount: { [key: string]: number } = {};
    activity.pageHistory.forEach(p => {
      pageCount[p.page] = (pageCount[p.page] || 0) + 1;
    });

    const topPages = Object.entries(pageCount)
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calcular tiempo promedio por página
    const avgDuration = activity.pageHistory.length > 0
      ? activity.pageHistory.reduce((sum, p) => sum + p.duration, 0) / activity.pageHistory.length
      : 0;

    return {
      totalVisits: activity.totalVisits,
      lastVisit: activity.lastVisit,
      pagesVisited: activity.pageHistory.length,
      totalSearches: activity.searches.length,
      topPages,
      avgDuration: Math.round(avgDuration)
    };
  }
}
