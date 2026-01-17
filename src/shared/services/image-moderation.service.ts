import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ImageModerationRequest {
  imageUrl: string;
  base64Image: string;
  toleranceLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ImageModerationResponse {
  isAppropriate: boolean;
  isApproved?: boolean; // Mantener por compatibilidad
  confidenceScore?: number;
  violationReasons?: string[];
  message?: string;
  severity?: string;
  details?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ImageModerationService {
  private apiUrl = 'https://localhost:7045/api/ImageModeration';

  constructor(private http: HttpClient) {}

  /**
   * Valida una imagen usando el endpoint de moderación
   */
  validateImage(base64Image: string, toleranceLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM'): Observable<ImageModerationResponse> {
    const request: ImageModerationRequest = {
      imageUrl: '',
      base64Image: base64Image,
      toleranceLevel: toleranceLevel
    };

    return this.http.post<ImageModerationResponse>(`${this.apiUrl}/validate`, request);
  }
}
