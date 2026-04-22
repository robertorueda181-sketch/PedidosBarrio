import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BulkUploadService, ExcelColumnMapping, ExcelProductData, BulkUploadResult } from '../../../shared/services/bulk-upload.service';
import { ProductoService } from '../../../shared/services/producto.service';
import { ToastrService } from 'ngx-toastr';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { Categoria } from '../../../shared/models/producto.model';

interface ColumnMapConfig {
  nombre: string;
  descripcion: string;
  precio: string;
  categoriaID: string;
  codigo: string;
  stock: string;
  stockMinimo: string;
  inventario: string;
}

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
    SelectModule
  ],
  templateUrl: './bulk-products-upload.component.html',
  styleUrl: './bulk-products-upload.component.css'
})
export class BulkProductsUploadComponent {
  private readonly bulkUploadService = inject(BulkUploadService);
  private readonly productoService = inject(ProductoService);
  private readonly toastr = inject(ToastrService);

  // Estados
  readonly showExcelDialog = signal(false);
  readonly showImagesDialog = signal(false);
  readonly showPreviewDialog = signal(false);
  readonly loading = signal(false);
  readonly uploading = signal(false);
  readonly uploadProgress = signal(0);

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
    this.loadCategories();
  }

  /**
   * Cierra el diálogo de Excel
   */
  closeExcelDialog(): void {
    this.showExcelDialog.set(false);
    this.excelFile.set(null);
    this.excelData.set([]);
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
    this.bulkUploadService.downloadExcelTemplate();
    this.toastr.info('Descargando plantilla...');
  }

  /**
   * Carga los productos desde Excel
   */
  uploadExcelProducts(): void {
    const data = this.excelData();
    if (data.length === 0) {
      this.toastr.warning('No hay productos para cargar');
      return;
    }

    this.uploading.set(true);
    this.uploadProgress.set(0);

    this.bulkUploadService.uploadProductsBulk(data).subscribe({
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
        }

        // Simular progreso
        setTimeout(() => {
          this.closeExcelDialog();
          this.showImagesDialog.set(true);
        }, 1500);
      },
      error: (error) => {
        this.uploading.set(false);
        console.error('Error uploading products:', error);
        this.toastr.error('Error al cargar los productos');
      }
    });
  }

  // ========== MANEJO DE IMÁGENES ==========

  /**
   * Abre el diálogo para carga de imágenes
   */
  openImagesDialog(): void {
    if (this.uploadResults() === null) {
      this.toastr.warning(
        'Primero debes cargar productos desde Excel'
      );
      return;
    }
    this.imageFiles.set([]);
    this.showImagesDialog.set(true);
  }

  /**
   * Cierra el diálogo de imágenes
   */
  closeImagesDialog(): void {
    this.showImagesDialog.set(false);
    this.imageFiles.set([]);
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

    const result = this.uploadResults();
    if (!result || result.productIds.length === 0) {
      this.toastr.error('No hay productos cargados');
      return;
    }

    // Crear map de códigos a IDs (usando los IDs de productos creados)
    const productCodeMap = new Map<string, number>();
    result.productIds.forEach((id, index) => {
      const codigo = this.excelData()[index]?.codigo;
      if (codigo) {
        productCodeMap.set(codigo.toUpperCase(), id);
      }
    });

    this.uploading.set(true);
    this.uploadProgress.set(0);

    this.bulkUploadService.uploadImagesBulk(files, productCodeMap).subscribe({
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
          uploadResult.errors.forEach(error => {
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
   * Carga categorías
   */
  private loadCategories(): void {
    this.productoService.getCategorias().subscribe({
      next: (categories) => {
        this.categories.set(categories);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.toastr.error('Error al cargar las categorías');
      }
    });
  }

  /**
   * Track para ngFor
   */
  trackByIndex(index: number): number {
    return index;
  }
}
