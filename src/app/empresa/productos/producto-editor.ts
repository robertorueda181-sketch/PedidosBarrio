import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ImageCropperComponent, ImageCroppedEvent, LoadedImage } from 'ngx-image-cropper';
import { ImagenesService } from '../../../shared/services/imagenes.service';
import { TabVariantsManagerComponent, VariantFormValue, VariantOptionPayload } from './tabs/tab-variants-manager.component';
import { ProductoDetalle } from '../../../shared/models/producto.model';
import { ProductoService } from '../../../shared/services/producto.service';
import { EditorVariant } from '../shared/interfaces/productos/editor-variant.interface';
@Component({
  selector: 'app-producto-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TabsModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    InputNumberModule,
    ToggleSwitchModule,
    ButtonModule,
    CardModule,
    ChipModule,
    DialogModule,
    ImageCropperComponent,
    TabVariantsManagerComponent
  ],

  templateUrl: './producto-editor.html',
  styleUrl: './producto-editor.css'
})
export class ProductoEditorComponent {
  private readonly productoService = inject(ProductoService);
  private readonly imagenesService = inject(ImagenesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);

  isEditMode = false;
  productId: number | null = null;
  loading = signal(false);

  categories = signal<any[]>([]);
  activeTab = signal<'producto' | 'variantes'>('producto');

  form = {
    name: '',
    description: '',
    categoryId: null as number | null,
    image: '',
    basePrice: 0,
    priceVaries: false,
    variantTitle: 'Tamaño',
    variants: [] as EditorVariant[],
    visible: true
  };

  newVariantLabel = '';
  selectedVariantId: string | null = null;
  variantOptions = signal<VariantOptionPayload[]>([]);
  previewSelections = signal<string[]>([]);
  previewPrimaryOptionIndex = signal(0);

  // Image modal state
  showImageDialog = signal(false);
  imageFile = signal<File | null>(null);
  uploadingImage = signal(false);
  croppedImageBlob = signal<Blob | null>(null);
  croppedImagePreview = signal('');
  private tempPreviewUrl: string | null = null;



  ngOnInit(): void {
    console.log(this.productoService);
    this.loadCategorias();
    this.resolveModeAndData();
  }

  private resolveModeAndData(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!idParam;
    this.productId = idParam ? Number(idParam) : null;

    if (this.productId) {
      this.loadProduct(this.productId);
    } else if (this.form.variants.length === 0) {
      this.form.variants = [
        { id: crypto.randomUUID(), label: 'Opción 1', price: this.form.basePrice }
      ];
      this.selectedVariantId = this.form.variants[0].id;
    }
  }

  private loadCategorias(): void {
    this.productoService.getCategoriasConProductos().subscribe({
      next: (response) => {
        this.categories.set(response.categorias || []);
      },
      error: () => {
        this.toastr.error('No se pudieron cargar las categorías');
      }
    });
  }

  private loadProduct(productId: number): void {
    this.loading.set(true);
    this.productoService.getProductoDetalle(productId).subscribe({
      next: (detalle: ProductoDetalle) => {
        const variantes = (detalle.precios || [])
          .filter((p) => !p.esPrincipal)
          .map((p) => ({
            id: String(p.idPrecio),
            label: p.descripcion || 'Variante',
            price: p.precioValor ?? detalle.precioActual ?? 0
          }));

        this.form = {
          name: detalle.nombre || '',
          description: detalle.descripcion || '',
          categoryId: detalle.categoriaID ?? null,
          image: detalle.imagenPrincipal || '',
          basePrice: detalle.precioActual || 0,
          priceVaries: variantes.length > 0,
          variantTitle: 'Variantes',
          variants: variantes.length > 0 ? variantes : [{ id: crypto.randomUUID(), label: 'Opción 1', price: detalle.precioActual || 0 }],
          visible: detalle.visible ?? true
        };

        this.selectedVariantId = this.form.variants[0]?.id ?? null;
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toastr.error('No se pudo cargar el producto');
      }
    });
  }

  onBasePriceChange(): void {
    if (!this.form.priceVaries) {
      this.form.variants = this.form.variants.map((variant) => ({
        ...variant,
        price: this.form.basePrice
      }));
    }
  }

  onTogglePriceVaries(): void {
    if (!this.form.priceVaries) {
      this.onBasePriceChange();
    }
  }

  onVariantsManaged(variants: VariantFormValue[]): void {
    this.form.variants = variants.map((variant) => ({
      id: variant.key,
      label: variant.name,
      price: Number(variant.price ?? this.form.basePrice),
    }));

    this.form.priceVaries = this.form.variants.length > 0;
    this.selectedVariantId = this.form.variants[0]?.id ?? null;
    this.previewSelections.set([]);
  }

  onVariantOptionsManaged(options: VariantOptionPayload[]): void {
    this.variantOptions.set(options.filter((option) => option.values.length > 0));
    const maxIndex = this.variantOptions().length - 1;
    if (this.previewPrimaryOptionIndex() > maxIndex) {
      this.previewPrimaryOptionIndex.set(0);
    }
    this.previewSelections.set([]);
  }

  onPreviewGroupByChange(index: number): void {
    this.previewPrimaryOptionIndex.set(index);
    this.previewSelections.set([]);
  }

  addVariant(): void {
    if (!this.newVariantLabel.trim()) {
      this.toastr.warning('Ingresa un nombre para la variante');
      return;
    }

    const newVariant = {
      id: crypto.randomUUID(),
      label: this.newVariantLabel.trim(),
      price: this.form.priceVaries ? 0 : this.form.basePrice
    };

    this.form.variants.push(newVariant);
    this.selectedVariantId = newVariant.id;
    this.newVariantLabel = '';
  }

  removeVariant(id: string): void {
    if (this.form.variants.length <= 1) {
      this.toastr.warning('Debe existir al menos una variante');
      return;
    }
    this.form.variants = this.form.variants.filter((v) => v.id !== id);

    if (this.selectedVariantId === id) {
      this.selectedVariantId = this.form.variants[0]?.id ?? null;
    }
  }

  save(): void {
    if (!this.form.name.trim()) {
      this.toastr.warning('El nombre del producto es obligatorio');
      return;
    }
    if (!this.form.categoryId) {
      this.toastr.warning('Selecciona una categoría');
      return;
    }
    if (this.form.variants.length > 0) {
      const hasInvalidPrice = this.form.variants.some((variant) => Number(variant.price ?? 0) <= 0);
      if (hasInvalidPrice) {
        this.toastr.warning('Completa el precio de todas las variantes generadas');
        this.activeTab.set('variantes');
        return;
      }
    }

    const precios = [
      {
        precioValor: this.form.basePrice,
        descripcion: 'Precio base',
        cantidadMinima: 1,
        modalidad: 'Unidad',
        esPrincipal: true
      },
      ...this.form.variants.map((variant) => ({
        precioValor: variant.price,
        descripcion: variant.label,
        cantidadMinima: 1,
        modalidad: 'Variante',
        esPrincipal: false
      }))
    ];

    const payload = {
      categoriaID: this.form.categoryId,
      nombre: this.form.name,
      descripcion: this.form.description,
      imagenPrincipal: this.form.image || undefined,
      stock: 0,
      stockMinimo: 0,
      inventario: false,
      precios,
      visible: this.form.visible
    };

    if (this.productId) {
      this.productoService.actualizarProducto(this.productId, payload).subscribe({
        next: () => {
          this.toastr.success('Producto actualizado');
          this.router.navigate(['/empresa/productos']);
        },
        error: () => this.toastr.error('No se pudo actualizar el producto')
      });
      return;
    }

    this.productoService.crearProducto(payload).subscribe({
      next: () => {
        this.toastr.success('Producto creado');
        this.router.navigate(['/empresa/productos']);
      },
      error: () => this.toastr.error('No se pudo crear el producto')
    });
  }

  cancel(): void {
    this.router.navigate(['/empresa/productos']);
  }

  selectVariant(id: string): void {
    this.selectedVariantId = id;
  }

  get selectedPreviewVariant(): EditorVariant | null {
    if (!this.form.variants.length) {
      return null;
    }

    return this.form.variants.find((v) => v.id === this.selectedVariantId) ?? this.form.variants[0];
  }

  previewPrice(variant: EditorVariant): number {
    return this.form.priceVaries ? variant.price : this.form.basePrice;
  }

  get previewDisplayedPrice(): number {
    if (!this.form.variants.length) {
      return this.form.basePrice;
    }

    const options = this.variantOptions();
    if (!options.length) {
      return this.selectedPreviewVariant?.price ?? this.form.basePrice;
    }

    const selections = this.previewSelections();
    const order = this.previewOrderOptionIndexes;
    const selectedIndexes = order.filter((index) => !!selections[index]);

    if (!selectedIndexes.length) {
      return this.form.basePrice;
    }

    const matched = this.form.variants.find((variant) => {
      const parts = variant.label.split(' / ').map((part) => part.trim());
      return selectedIndexes.every((idx) => parts[idx] === selections[idx]);
    });

    return matched?.price ?? this.form.basePrice;
  }

  get hasActiveVariants(): boolean {
    if (!this.form.priceVaries) return false;
    if (this.variantOptions().length > 0) return true;
    if (this.form.variants.length > 1) return true;
    if (this.form.variants.length === 1) {
      const label = this.form.variants[0].label.trim().toLowerCase();
      if (label === 'opción 1' || label === 'opcion 1' || label === 'variante' || label === '') {
        return false;
      }
      return true;
    }
    return false;
  }

  selectPreviewValue(optionIndex: number, value: string): void {
    const next = [...this.previewSelections()];
    next[optionIndex] = value;
    const order = this.previewOrderOptionIndexes;
    const changedOrderIndex = order.indexOf(optionIndex);
    for (let index = changedOrderIndex + 1; index < order.length; index += 1) {
      next[order[index]] = '';
    }
    this.previewSelections.set(next);
  }

  get selectedPreviewFromOptions(): EditorVariant | null {
    const options = this.variantOptions();
    if (!options.length) {
      return this.selectedPreviewVariant;
    }

    const selections = this.previewSelections();
    const allSelected = options.every((_, index) => !!selections[index]?.trim());
    if (!allSelected) {
      return null;
    }

    const key = options.map((_, index) => selections[index]).join(' / ');
    return this.form.variants.find((variant) => variant.label === key) ?? null;
  }

  get previewPrimaryOptionName(): string {
    const options = this.variantOptions();
    const index = this.previewPrimaryOptionIndex();
    return options[index]?.name || options[0]?.name || 'la variante principal';
  }

  get previewOrderOptionIndexes(): number[] {
    const options = this.variantOptions();
    const primary = this.previewPrimaryOptionIndex();
    if (!options.length) {
      return [];
    }
    const safePrimary = primary >= 0 && primary < options.length ? primary : 0;
    const others = options
      .map((_, index) => index)
      .filter((index) => index !== safePrimary);
    return [safePrimary, ...others];
  }

  isPreviewOptionUnlocked(optionIndex: number): boolean {
    const order = this.previewOrderOptionIndexes;
    const orderPos = order.indexOf(optionIndex);
    if (orderPos <= 0) {
      return true;
    }
    const selections = this.previewSelections();
    for (let index = 0; index < orderPos; index += 1) {
      if (!selections[order[index]]) {
        return false;
      }
    }
    return true;
  }

  getAvailableValues(optionIndex: number): string[] {
    const options = this.variantOptions();
    const currentOption = options[optionIndex];
    if (!currentOption) {
      return [];
    }

    if (!this.isPreviewOptionUnlocked(optionIndex)) {
      return [];
    }

    const order = this.previewOrderOptionIndexes;
    const orderPos = order.indexOf(optionIndex);
    if (orderPos === 0) {
      return currentOption.values;
    }

    const selections = this.previewSelections();
    const valueSet = new Set<string>();
    this.form.variants.forEach((variant) => {
      const parts = variant.label.split(' / ').map((part) => part.trim());
      const matches = order.slice(0, orderPos).every((idx) => parts[idx] === selections[idx]);
      if (matches && parts[optionIndex]) {
        valueSet.add(parts[optionIndex]);
      }
    });
    return [...valueSet];
  }

  // Image modal methods
  openImageDialog(): void {
    this.imageFile.set(null);
    this.croppedImageBlob.set(null);
    this.croppedImagePreview.set('');
    this.clearTempPreviewUrl();
    this.showImageDialog.set(true);
  }


  closeImageDialog(): void {
    this.clearTempPreviewUrl();
    this.showImageDialog.set(false);
    this.imageFile.set(null);
    this.uploadingImage.set(false);
    this.croppedImageBlob.set(null);
    this.croppedImagePreview.set('');
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

  imageLoaded(_image: LoadedImage): void {
    // Hook para futuros estados visuales de carga.
  }

  cropperReady(): void {
    // Hook para futuros estados de inicializacion del cropper.
  }

  loadImageFailed(): void {
    this.toastr.error('No se pudo cargar la imagen seleccionada');
  }




  applyImage(): void {
    const originalFile = this.imageFile();
    const croppedBlob = this.croppedImageBlob();
    const file = croppedBlob
      ? new File([croppedBlob], `producto_${Date.now()}.png`, { type: croppedBlob.type || 'image/png' })
      : originalFile;

    if (!file) return;

    this.uploadingImage.set(true);

    this.imagenesService.optimizeImage(file, 'Producto').subscribe({
      next: (imageUrl) => {
        this.form.image = imageUrl;
        this.closeImageDialog();
        this.toastr.success('Imagen cargada correctamente');
      },
      error: (err) => {
        console.error('Upload failed:', err);
        this.toastr.error('Error al cargar la imagen. Intenta de nuevo.');
        this.uploadingImage.set(false);
      }
    });
  }


  clearImage(): void {
    this.form.image = '';
  }

  private clearTempPreviewUrl(): void {
    if (!this.tempPreviewUrl) {
      return;
    }
    URL.revokeObjectURL(this.tempPreviewUrl);
    this.tempPreviewUrl = null;
  }

}
