import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AppConfigService } from './app-config.service';
import { ProductoService } from './producto.service';
import * as XLSX from 'xlsx';

/**
 * Interfaz para mapeo de columnas de Excel
 */
export interface ExcelColumnMapping {
  nombre: string;
  descripcion: string;
  precio: string;
  categoriaID: string;
  codigo?: string;
  stock?: string;
  stockMinimo?: string;
  inventario?: string;
}

/**
 * Interfaz para datos parseados del Excel
 */
export interface ExcelProductData {
  nombre: string;
  descripcion?: string;
  precio: number;
  categoria: string;
  codigo?: string;
  stockMinimo?: number;
  inventario?: boolean;
}

/**
 * Interfaz para resultado de carga masiva
 */
export interface BulkUploadResult {
  successful: number;
  failed: number;
  errors: { row: number; error: string }[];
  productIds: number[];
}

@Injectable({
  providedIn: 'root'
})
export class BulkUploadService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);
  private productoService = inject(ProductoService);

  /**
   * Parsea un archivo Excel y extrae los datos de productos
   * @param file Archivo Excel a procesar
   * @param columnMapping Mapeo de columnas
   * @returns Array de datos de productos parseados
   */
  parseExcelFile(file: File, columnMapping: ExcelColumnMapping): Promise<ExcelProductData[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          const productsData: ExcelProductData[] = jsonData.map((row: any, index: number) => ({
            nombre: row[columnMapping.nombre]?.toString().trim(),
            descripcion: row[columnMapping.descripcion]?.toString().trim(),
            precio: parseFloat(row[columnMapping.precio]) || 0,
            categoria: row[columnMapping.categoriaID] || 1,
            codigo: columnMapping.codigo ? row[columnMapping.codigo]?.toString().trim() : undefined,
            stock: columnMapping.stock ? parseInt(row[columnMapping.stock]) || 0 : 0,
            stockMinimo: columnMapping.stockMinimo ? parseInt(row[columnMapping.stockMinimo]) || 0 : 0,
            inventario: columnMapping.inventario ? row[columnMapping.inventario]?.toString().toLowerCase() === 'si' : false
          }));

          resolve(productsData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Envía el archivo Excel al endpoint de importación
   * @param file Archivo Excel a enviar
   * @returns Observable con resultado de la carga
   */
  uploadProductsBulk(file: File): Observable<BulkUploadResult> {
    const formData = new FormData();
    formData.append('archivo', file);

    return this.http.post<BulkUploadResult>(`${this.config.apiUrl}/Presentaciones/importar-excel`, formData)
      .pipe(
        catchError(error => {
          console.error('Error uploading products bulk:', error);
          return of({
            successful: 0,
            failed: 0,
            errors: [{ row: 0, error: error.message }],
            productIds: []
          });
        })
      );
  }

  /**
   * Carga imágenes de forma masiva basándose en códigos de productos
   * @param files Array de archivos de imagen
   * @param productCodeMap Map de código de producto a ID
   * @returns Observable con resultado de la carga
   */
  uploadImagesBulk(
    files: File[],
    productCodeMap: Map<string, number>
  ): Observable<{ successful: number; failed: number; errors: string[] }> {
    const result = {
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    const uploadObservables = files.map(file => {
      // Extraer el nombre sin extensión como código del producto
      const fileNameWithoutExt = file.name.split('.').slice(0, -1).join('.');
      const productId = productCodeMap.get(fileNameWithoutExt.toUpperCase());

      if (!productId) {
        result.errors.push(
          `No se encontró producto con código ${fileNameWithoutExt}`
        );
        result.failed++;
        return of(null);
      }

      return this.productoService.uploadImagen(file, productId, '', true).pipe(
        (source) => new Observable(observer => {
          source.subscribe({
            next: () => {
              result.successful++;
              observer.next(true);
              observer.complete();
            },
            error: (error) => {
              result.errors.push(
                `Error al subir imagen ${file.name}: ${error?.error?.message || 'Error desconocido'}`
              );
              result.failed++;
              observer.next(null);
              observer.complete();
            }
          });
        })
      );
    });

    if (uploadObservables.length === 0) {
      return of(result);
    }

    return forkJoin(uploadObservables).pipe(
      (source) => new Observable(observer => {
        source.subscribe({
          next: () => observer.next(result),
          error: () => observer.next(result),
          complete: () => observer.complete()
        });
      })
    );
  }


  /**
   * Valida el formato del archivo Excel
   */
  validateExcelFile(file: File): string | null {
    const validExtensions = ['xlsx', 'xls', 'csv'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      return 'Por favor selecciona un archivo Excel válido (.xlsx, .xls o .csv)';
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5 MB
      return 'El archivo no debe exceder 5 MB';
    }

    return null;
  }

  /**
   * Valida el formato de imagen
   */
  validateImageFile(file: File): string | null {
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'avif'];

    if (!validMimeTypes.includes(file.type)) {
      return 'Formato de imagen no válido. Usa JPG, PNG, WebP o AVIF';
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      return 'Extensión de archivo no válida';
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10 MB
      return 'La imagen no debe exceder 10 MB';
    }

    return null;
  }
}
