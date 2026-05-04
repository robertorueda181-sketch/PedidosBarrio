import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { DialogModule } from 'primeng/dialog';
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { ImageCropperComponent, ImageCroppedEvent, LoadedImage } from 'ngx-image-cropper';
import { ImagenesService } from '../../../../shared/services/imagenes.service';

@Component({
  selector: 'app-image-picker-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule, TabsModule, ButtonModule, ImageCropperComponent],
  templateUrl: './image-picker-dialog.component.html',
  styleUrls: ['./image-picker-dialog.component.css']
})
export class ImagePickerDialogComponent {
  private readonly imagenesService = inject(ImagenesService);
  private readonly toastr = inject(ToastrService);

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Output() imageSelected = new EventEmitter<string>();

  activeImageTab = signal<'upload' | 'catalog'>('upload');
  catalogImages = signal<string[]>([]);

  imageFile = signal<File | null>(null);
  uploadingImage = signal(false);
  croppedImageBlob = signal<Blob | null>(null);
  croppedImagePreview = signal('');
  private tempPreviewUrl: string | null = null;

  closeDialog(): void {
    this.clearTempPreviewUrl();
    this.visibleChange.emit(false);
    this.imageFile.set(null);
    this.uploadingImage.set(false);
    this.croppedImageBlob.set(null);
    this.croppedImagePreview.set('');
    this.activeImageTab.set('upload');
  }

  previewSrc(): string {
    return this.croppedImagePreview() || this.tempPreviewUrl || '';
  }

  handleFileInModal(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.toastr.warning('Selecciona un archivo de imagen válido');
      input.value = '';
      return;
    }

    this.clearTempPreviewUrl();
    this.imageFile.set(file);
    this.croppedImageBlob.set(null);
    this.croppedImagePreview.set('');
    this.tempPreviewUrl = URL.createObjectURL(file);
    input.value = '';
  }

  imageCropped(event: ImageCroppedEvent): void {
    this.croppedImageBlob.set(event.blob ?? null);
    this.croppedImagePreview.set(event.base64 ?? '');
  }

  imageLoaded(_image: LoadedImage): void { }
  cropperReady(): void { }
  loadImageFailed(): void {
    this.toastr.error('No se pudo cargar la imagen seleccionada');
  }

  applyImage(): void {
    const originalFile = this.imageFile();
    const croppedBlob = this.croppedImageBlob();
    const file = croppedBlob
      ? new File([croppedBlob], `imagen_${Date.now()}.png`, { type: croppedBlob.type || 'image/png' })
      : originalFile;

    if (!file) return;

    this.uploadingImage.set(true);

    this.imagenesService.optimizeImage(file, 'Producto').subscribe({
      next: (imageUrl) => {
        this.imageSelected.emit(imageUrl);
        this.closeDialog();
        this.toastr.success('Imagen cargada correctamente');
      },
      error: (err) => {
        console.error('Upload failed:', err);
        this.toastr.error('Error al cargar la imagen. Intenta de nuevo.');
        this.uploadingImage.set(false);
      }
    });
  }

  selectFromCatalog(imageUrl: string): void {
    this.imageSelected.emit(imageUrl);
    this.closeDialog();
    this.toastr.success('Imagen seleccionada del catálogo');
  }

  private clearTempPreviewUrl(): void {
    if (!this.tempPreviewUrl) {
      return;
    }
    URL.revokeObjectURL(this.tempPreviewUrl);
    this.tempPreviewUrl = null;
  }
}
