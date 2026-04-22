import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { ProductoService } from './producto.service';

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
  categoriaID: number;
  codigo?: string;
  stock?: number;
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
          // Usamos SheetJS (xlsx) que debe estar instalado
          const workbook = (window as any).XLSX?.read(e.target.result, { type: 'array' });
          if (!workbook) {
            reject(new Error('Por favor instala la librería XLSX o asegúrate que está cargada'));
            return;
          }

          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = (window as any).XLSX.utils.sheet_to_json(worksheet);

          const productsData: ExcelProductData[] = jsonData.map((row: any, index: number) => ({
            nombre: row[columnMapping.nombre]?.toString().trim(),
            descripcion: row[columnMapping.descripcion]?.toString().trim(),
            precio: parseFloat(row[columnMapping.precio]) || 0,
            categoriaID: parseInt(row[columnMapping.categoriaID]) || 1,
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
   * Carga múltiples productos de forma masiva
   * @param products Array de productos a crear
   * @returns Observable con resultado de la carga
   */
  uploadProductsBulk(products: ExcelProductData[]): Observable<BulkUploadResult> {
    const result: BulkUploadResult = {
      successful: 0,
      failed: 0,
      errors: [],
      productIds: []
    };

    // Validar datos básicos
    const validProducts = products.filter((product, index) => {
      if (!product.nombre || product.nombre.length === 0) {
        result.errors.push({ row: index + 2, error: 'El nombre es obligatorio' });
        result.failed++;
        return false;
      }
      if (product.precio < 0) {
        result.errors.push({ row: index + 2, error: 'El precio no puede ser negativo' });
        result.failed++;
        return false;
      }
      return true;
    });

    if (validProducts.length === 0) {
      return of(result);
    }

    // Crear observables para cada producto
    const uploadObservables = validProducts.map((product, originalIndex) =>
      this.productoService.crearProducto({
        categoriaID: product.categoriaID,
        nombre: product.nombre,
        descripcion: product.descripcion || '',
        stock: product.stock || 0,
        stockMinimo: product.stockMinimo || 0,
        inventario: product.inventario || false,
        precios: [
          {
            precioValor: product.precio,
            descripcion: 'Precio estándar',
            cantidadMinima: 1,
            modalidad: 'Unitario',
            esPrincipal: true
          }
        ]
      }).pipe(
        // Capturar el ID del producto creado
        (source) => new Observable(observer => {
          source.subscribe({
            next: (product: any) => {
              result.successful++;
              result.productIds.push(product.productoID || product.id);
              observer.next(product);
              observer.complete();
            },
            error: (error) => {
              result.errors.push({
                row: originalIndex + 2,
                error: error?.error?.message || 'Error al crear el producto'
              });
              result.failed++;
              observer.next(null);
              observer.complete();
            }
          });
        })
      )
    );

    // Ejecutar todas las cargas en paralelo
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
   * Descarga una plantilla Excel de ejemplo
   */
  downloadExcelTemplate(): void {
    const template = [
      {
        'Nombre': 'Ceviche de Camarón',
        'Descripción': 'Ceviche fresco de camarón con limón y ají',
        'Precio': 25.00,
        'Categoría ID': 1,
        'Código': 'CEV-CAM-001',
        'Stock': 10,
        'Stock Mínimo': 2,
        'Inventario': 'Sí'
      },
      {
        'Nombre': 'Lomo Saltado',
        'Descripción': 'Lomo de res salteado con papas',
        'Precio': 35.00,
        'Categoría ID': 1,
        'Código': 'LOM-SAL-002',
        'Stock': 15,
        'Stock Mínimo': 3,
        'Inventario': 'Sí'
      }
    ];

    try {
      // Usar SheetJS para crear el Excel
      const ws = (window as any).XLSX?.utils.json_to_sheet(template);
      const wb = (window as any).XLSX?.utils.book_new();
      (window as any).XLSX?.utils.book_append_sheet(wb, ws, 'Productos');

      // Descargar
      (window as any).XLSX?.writeFile(wb, 'plantilla-productos.xlsx');
    } catch (error) {
      console.error('Error al descargar plantilla:', error);
      alert('Por favor instala la librería XLSX o asegúrate que está cargada');
    }
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
