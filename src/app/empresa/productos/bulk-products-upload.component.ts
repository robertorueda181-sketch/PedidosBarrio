import { Component, inject, signal, computed, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { BulkUploadService, ExcelColumnMapping, ExcelProductData, BulkUploadResult } from '../../../shared/services/bulk-upload.service';
import { ProductoService } from '../../../shared/services/producto.service';
import { AppConfigService } from '../../../shared/services/app-config.service';
import { ToastrService } from 'ngx-toastr';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { Categoria } from '../../../shared/models/producto.model';
import { ColumnMapConfig } from '../shared/interfaces/column-map-config.interface';
import { finalize } from 'rxjs/operators';
import { LoaderComponent } from '../../../shared/components/loader/loader';

@Component({
  selector: 'app-bulk-products-upload',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    ProgressBarModule,
    TooltipModule,
    SelectModule,
    LoaderComponent
  ],
  templateUrl: './bulk-products-upload.component.html',
  styleUrl: './bulk-products-upload.component.css'
})
export class BulkProductsUploadComponent {
  private readonly bulkUploadService = inject(BulkUploadService);
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);
  private readonly toastr = inject(ToastrService);

  // Estados
  readonly showExcelDialog = signal(false);
  readonly showImagesDialog = signal(false);
  readonly showPreviewDialog = signal(false);
  readonly loading = signal(false);

  @Output() uploadClosed = new EventEmitter<void>();
  readonly uploading = signal(false);
  readonly uploadProgress = signal(0);
  readonly downloadingTemplate = signal(false);

  // Datos de Excel
  readonly excelFile = signal<File | null>(null);
  readonly excelData = signal<ExcelProductData[]>([]);
  readonly categories = signal<Categoria[]>([]);

  // Mapeo de columnas
  readonly columnMapping = signal<ColumnMapConfig>({
    nombre: 'Nombre',
    descripcion: 'Descripción',
    precio: 'Precio',
    categoriaID: 'Categoría ID',
    codigo: 'Código',
    stock: 'Stock',
    stockMinimo: 'Stock Mínimo',
    inventario: 'Inventario'
  });

  // Datos de imágenes
  readonly imageFiles = signal<File[]>([]);
  readonly uploadResults = signal<BulkUploadResult | null>(null);

  updateColumnMapping(field: keyof ColumnMapConfig, value: string): void {
    this.columnMapping.set({
      ...this.columnMapping(),
      [field]: value
    });
  }

  // Estados del formulario
  readonly selectedCategory = signal<number | null>(null);

  readonly isMobile = signal(
    typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
  );

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        this.isMobile.set(window.matchMedia('(max-width: 768px)').matches);
      });
    }
  }

  // ========== MANEJO DE EXCEL ==========

  /**
   * Abre el diálogo para carga de Excel
   */
  openExcelDialog(): void {
    this.excelFile.set(null);
    this.excelData.set([]);
    this.showExcelDialog.set(true);
  }

  /**
   * Cierra el diálogo de Excel
   */
  closeExcelDialog(): void {
    this.showExcelDialog.set(false);
    this.excelFile.set(null);
    this.excelData.set([]);
    this.uploadClosed.emit();
  }

  /**
   * Maneja la selección de archivo Excel
   */
  onExcelFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    const error = this.bulkUploadService.validateExcelFile(file);
    if (error) {
      this.toastr.error(error);
      return;
    }

    this.excelFile.set(file);
    this.parseExcelFile();
  }

  /**
   * Parsea el archivo Excel
   */
  parseExcelFile(): void {
    const file = this.excelFile();
    if (!file) return;

    this.loading.set(true);
    const mapping: ExcelColumnMapping = this.columnMapping() as any;

    this.bulkUploadService.parseExcelFile(file, mapping).then(
      (data) => {
        this.excelData.set(data);
        this.loading.set(false);
        if (data.length === 0) {
          this.toastr.warning('El archivo no contiene datos');
        } else {
          this.toastr.success(`Se cargaron ${data.length} productos`);
        }
      },
      (error) => {
        this.loading.set(false);
        console.error('Error parsing Excel:', error);
        this.toastr.error('Error al procesar el archivo Excel');
      }
    );
  }

  /**
   * Abre el preview de los datos
   */
  previewData(): void {
    if (this.excelData().length === 0) {
      this.toastr.warning('No hay datos para mostrar');
      return;
    }
    this.showPreviewDialog.set(true);
  }

  /**
   * Descarga plantilla de ejemplo
   */
  downloadTemplate(): void {
    const url = `${this.config.apiUrl}/Presentaciones/descargar-plantilla`;
    this.downloadingTemplate.set(true);

    this.http.get(url, { observe: 'response', responseType: 'blob' })
      .pipe(finalize(() => this.downloadingTemplate.set(false)))
      .subscribe({
        next: (response: HttpResponse<Blob>) => {
          const blob = response.body;
          if (!blob) {
            return;
          }

          const contentDisposition = response.headers.get('content-disposition') ?? '';
          const match = /filename\*?=(?:UTF-8''|")?([^\";\n]+)"?/i.exec(contentDisposition);
          const fileName = match?.[1] ? decodeURIComponent(match[1]) : 'plantilla-presentaciones.xlsx';

          const objectUrl = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = objectUrl;
          anchor.download = fileName;
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();
          URL.revokeObjectURL(objectUrl);
        },
        error: (error) => {
          console.error('Error descargando plantilla:', error);
          this.toastr.error('No se pudo descargar la plantilla');
        }
      });
  }

  /**
   * Carga los productos desde Excel
   */
  uploadExcelProducts(): void {
    const file = this.excelFile();
    if (!file) {
      this.toastr.warning('No hay archivo seleccionado');
      return;
    }

    this.uploading.set(true);
    this.uploadProgress.set(0);

    this.bulkUploadService.uploadProductsBulk(file).subscribe({
      next: (result) => {
        this.uploadResults.set(result);
        this.uploading.set(false);
        this.uploadProgress.set(100);

        if (result.successful > 0) {
          this.toastr.success(
            `Se crearon exitosamente ${result.successful} productos`
          );
        }

        if (result.failed > 0) {
          this.toastr.warning(
            `${result.failed} productos no se pudieron crear`
          );
          // Mostrar errores detallados
          result.errors.forEach(err => {
            this.toastr.error(`Fila ${err.row}: ${err.error}`, 'Error en producto', {
              timeOut: 3000,
              extendedTimeOut: 2000
            });
          });
        }

        setTimeout(() => {
          this.closeExcelDialog();
          if (result.successful > 0) {
            this.showImagesDialog.set(true);
          }
        }, 1500);
      },
      error: (error) => {
        this.uploading.set(false);
        console.error('Error uploading products:', error);
        this.toastr.error('Error al cargar los productos: ' + (error.message || 'Error desconocido'));
      }
    });
  }

  // ========== MANEJO DE IMÁGENES ==========

  /**
   * Abre el diálogo para carga de imágenes
   */
  openImagesDialog(): void {

    this.imageFiles.set([]);
    this.showImagesDialog.set(true);
  }

  /**
   * Cierra el diálogo de imágenes
   */
  closeImagesDialog(): void {
    this.showImagesDialog.set(false);
    this.imageFiles.set([]);
    this.uploadClosed.emit();
  }

  /**
   * Maneja la selección de imágenes
   */
  onImagesSelected(event: any): void {
    const files = event.target.files;
    if (!files) return;

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const error = this.bulkUploadService.validateImageFile(file);
      if (error) {
        this.toastr.error(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    }

    if (validFiles.length > 0) {
      this.imageFiles.update(current => [...current, ...validFiles]);
      this.toastr.success(`Se agregaron ${validFiles.length} imágenes`);
    }
  }

  /**
   * Remueve una imagen de la lista
   */
  removeImage(index: number): void {
    this.imageFiles.update(files => files.filter((_, i) => i !== index));
  }

  /**
   * Carga las imágenes de forma masiva
   */
  uploadImages(): void {
    const files = this.imageFiles();
    if (files.length === 0) {
      this.toastr.warning('No hay imágenes para cargar');
      return;
    }

    this.uploading.set(true);
    this.uploadProgress.set(0);

    this.bulkUploadService.uploadImagesBulk(files).subscribe({
      next: (uploadResult) => {
        this.uploading.set(false);
        this.uploadProgress.set(100);

        if (uploadResult.successful > 0) {
          this.toastr.success(
            `Se cargaron ${uploadResult.successful} imágenes exitosamente`
          );
        }

        if (uploadResult.failed > 0) {
          this.toastr.warning(
            `${uploadResult.failed} imágenes no se pudieron cargar`
          );
          uploadResult.errors.forEach((error: any) => {
            console.warn(error);
          });
        }

        setTimeout(() => {
          this.closeImagesDialog();
          this.resetUpload();
        }, 1500);
      },
      error: (error) => {
        this.uploading.set(false);
        console.error('Error uploading images:', error);
        this.toastr.error('Error al cargar las imágenes');
      }
    });
  }

  /**
   * Resetea el formulario de carga
   */
  resetUpload(): void {
    this.excelFile.set(null);
    this.excelData.set([]);
    this.imageFiles.set([]);
    this.uploadResults.set(null);
    this.uploadProgress.set(0);
  }

  /**
   * Track para ngFor
   */
  trackByIndex(index: number): number {
    return index;
  }
}
