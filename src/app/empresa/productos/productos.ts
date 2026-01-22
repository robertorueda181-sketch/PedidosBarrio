import { Component, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../../shared/services/producto.service';
import { Producto } from '../../../shared/models/producto.model';
import { ConfirmationService } from 'primeng/api';
import { ToastrService } from 'ngx-toastr';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { TabsModule } from 'primeng/tabs';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule  } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ChipModule } from 'primeng/chip';
import { TooltipModule } from 'primeng/tooltip';
import { ImageCropperComponent, ImageCroppedEvent, LoadedImage } from 'ngx-image-cropper';
import { DomSanitizer } from '@angular/platform-browser';
import { AnalyticsService } from '../../../shared/services/analytics.service';
import { TabBasicInfoComponent } from './tabs/tab-basic-info.component';
import { TabPricesComponent } from './tabs/tab-prices.component';
import { TabInventoryComponent } from './tabs/tab-inventory.component';
import { TabModifiersComponent } from './tabs/tab-modifiers.component';

interface Category {
  id: number;
  name: string;
  isFavorite: boolean;
  productCount: number;
  color?: string;
  expanded?: boolean;
}

interface Variant {
  id: string;
  name: string;
  price: number;
}

interface Modifier {
  id: string;
  name: string;
  options: string[];
  required: boolean;
  maxSelections?: number;
}

interface Product {
  id: number;
  name: string;
  description: string;
  categoryId: number;
  categoryName?: string;
  precioActual: number;
  discount?: number;
  image?: string;
  visible: boolean;
  isPrincipal?: boolean;
  variants?: Variant[];
  hasStockControl?: boolean;
  currentStock?: number;
  minStock?: number;
  modifiers?: Modifier[];
}

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ConfirmDialogModule,
    DialogModule,
    TabsModule,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    SelectModule,
    CheckboxModule,
    ButtonModule,
    ToggleSwitchModule,
    ChipModule,
    TooltipModule,
    ImageCropperComponent,
    TabBasicInfoComponent,
    TabPricesComponent,
    TabInventoryComponent,
    TabModifiersComponent
  ],
  providers: [ConfirmationService],
  templateUrl: './productos.html',
  styleUrl: './productos.css',
})
export class ProductosComponent {
  private productoService = inject(ProductoService);
  private toastr = inject(ToastrService);
  private confirmationService = inject(ConfirmationService);
  private analyticsService = inject(AnalyticsService);

  @ViewChild('tabPrices') tabPrices!: TabPricesComponent;

  // Estados de modales
  showCategoryModal = false;
  showProductModal = false;
  showPreview = false;
  showStockInfoDialog = false;
  isValidatingImage = signal(false);
  isLoadingImage = signal(false);
  showImageCropper = signal(false);
  pendingImageData: { base64: string, file: File } | null = null;
  currentImageForCrop = signal<string | null>(null);
  croppedImage: any = '';
  imageChangedEvent: any = '';

  // Categoría seleccionada
  selectedCategoryId: number | null = null;
  searchTerm: string = '';

  // Datos de formularios
  categoryForm = {
    id: null as number | null,
    name: '',
    isFavorite: false,
    color: '#3b82f6'
  };

  productForm = {
    id: null as number | null,
    name: '',
    description: '',
    categoryId: null as number | null,
    price: 0,
    discount: 0 as number | undefined,
    image: '' as string | undefined,
    visible: true,
    isPrincipal: false,
    variants: [] as Variant[],
    hasStockControl: false,
    currentStock: 0,
    minStock: 0,
    modifiers: [] as Modifier[]
  };

  // Formularios temporales para agregar variantes y modificadores
  newVariant = { name: '', price: 0 };
  newModifier = { name: '', options: '', required: false, maxSelections: 1 };
  
  kitchenAreas = ['Cocina principal', 'Barra', 'Parrilla', 'Repostería', 'Bebidas'];

  categories = signal<Category[]>([]);

  products = signal<Product[]>([]);

  ngOnInit() {
    this.loadCategorias();
    this.selectedCategoryId = this.categories()[0]?.id || null;
    this.updateProductCounts();
  }

  loadCategorias() {
    this.productoService.getCategoriasConProductos().subscribe({
      next: (response) => {
        console.log('Datos cargados desde el servicio:', response);
        
        // Cargar categorías
        this.categories.set(response.categorias.map(cat => ({
          id: cat.categoriaID,
          name: cat.descripcion,
          isFavorite: false,
          productCount: 0,
          color: cat.color || '#3b82f6',
          expanded: false
        })));
        
        // Cargar productos
        this.products.set(response.productos.map(prod => ({
          id: prod.productoID,
          name: prod.nombre,
          description: prod.descripcion,
          categoryId: prod.categoriaID || 0,
          precioActual: prod.precioActual,
          image: prod.urlImagen,
          visible: prod.visible
        })));
        
        if (this.categories().length > 0) {
          this.categories.update(cats => {
            cats[0].expanded = true;
            return [...cats];
          });
          this.selectedCategoryId = this.categories()[0].id;
        }
        
        this.updateProductCounts();
      },
      error: (error) => {
        console.error('Error al cargar categorías y productos:', error);
        this.toastr.error('No se pudieron cargar las categorías y productos. Usando datos de ejemplo.', 'Error');
      }
    });
  }

  // === GESTIÓN DE CATEGORÍAS ===
  selectCategory(categoryId: number) {
    this.selectedCategoryId = categoryId;
  }

  openCategoryModal(category?: Category) {
    if (category) {
      this.categoryForm = { 
        id: category.id,
        name: category.name,
        isFavorite: category.isFavorite,
        color: category.color || '#3b82f6'
      };
    } else {
      this.categoryForm = {
        id: null,
        name: '',
        isFavorite: false,
        color: '#3b82f6'
      };
    }
    this.showCategoryModal = true;
  }

  saveCategoryForm() {
    if (!this.categoryForm.name.trim()) {
      this.toastr.warning('Por favor ingresa un nombre para la categoría', 'Campo requerido');
      return;
    }

    const categoriaData = {
      descripcion: this.categoryForm.name,
      color: this.categoryForm.color
    };

    if (this.categoryForm.id) {
      // Actualizar categoría existente
      this.productoService.actualizarCategoria(this.categoryForm.id, categoriaData).subscribe({
        next: (response) => {
          this.categories.update(cats => {
            const index = cats.findIndex(c => c.id === this.categoryForm.id);
            if (index !== -1) {
              cats[index] = {
                ...cats[index],
                name: this.categoryForm.name,
                isFavorite: this.categoryForm.isFavorite,
                color: this.categoryForm.color
              };
            }
            return [...cats];
          });
          this.toastr.success('La categoría se ha actualizado correctamente', 'Categoría actualizada');
          this.closeCategoryModal();
        },
        error: (error) => {
          console.error('Error al actualizar categoría:', error);
          this.toastr.error('No se pudo actualizar la categoría', 'Error');
        }
      });
    } else {
      // Crear nueva categoría
      this.productoService.crearCategoria(categoriaData).subscribe({
        next: (response) => {
          this.categories.update(cats => [...cats, {
            id: response.categoriaID,
            name: response.descripcion,
            isFavorite: false,
            productCount: 0,
            color: response.color || this.categoryForm.color,
            expanded: false
          }]);
          this.toastr.success('La categoría se ha creado correctamente', 'Categoría creada');
          this.closeCategoryModal();
        },
        error: (error) => {
          console.error('Error al crear categoría:', error);
          this.toastr.error('No se pudo crear la categoría', 'Error');
        }
      });
    }
  }

  deleteCategory(categoryId: number) {
    this.confirmationService.confirm({
      message: '¿Estás seguro de eliminar esta categoría? Los productos asociados no se eliminarán.',
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.productoService.eliminarCategoria(categoryId).subscribe({
          next: () => {
            this.categories.update(cats => cats.filter(c => c.id !== categoryId));
            if (this.selectedCategoryId === categoryId) {
              this.selectedCategoryId = this.categories()[0]?.id || null;
            }
            this.updateProductCounts();
            this.toastr.success('La categoría se ha eliminado correctamente', 'Categoría eliminada');
          },
          error: (error) => {
            console.error('Error al eliminar categoría:', error);
            this.toastr.error('No se pudo eliminar la categoría', 'Error');
          }
        });
      }
    });
  }

  toggleFavorite(categoryId: number) {
    this.categories.update(cats => {
      const category = cats.find(c => c.id === categoryId);
      if (category) {
        category.isFavorite = !category.isFavorite;
      }
      return [...cats];
    });
  }

  closeCategoryModal() {
    this.showCategoryModal = false;
  }

  // === GESTIÓN DE PRODUCTOS ===
  openProductModal(product?: Product) {
    // Registrar evento de abrir modal
    this.analyticsService.trackEvent(
      product ? 'Editar Producto' : 'Crear Producto',
      { categoryId: this.selectedCategoryId }
    );

    if (product) {
      this.productForm = {
        id: product.id,
        name: product.name,
        description: product.description,
        categoryId: product.categoryId,
        price: product.precioActual,
        discount: product.discount,
        image: product.image,
        visible: product.visible,
        isPrincipal: product.isPrincipal || false,
        variants: product.variants ? [...product.variants] : [],
        hasStockControl: product.hasStockControl || false,
        currentStock: product.currentStock || 0,
        minStock: product.minStock || 0,
        modifiers: product.modifiers ? [...product.modifiers] : []
      };
    } else {
      this.productForm = {
        id: null,
        name: '',
        description: '',
        categoryId: this.selectedCategoryId,
        price: 0,
        discount: 0,
        image: '',
        visible: true,
        isPrincipal: false,
        variants: [],
        hasStockControl: false,
        currentStock: 0,
        minStock: 0,
        modifiers: []
      };
    }
    this.newVariant = { name: '', price: 0 };
    this.newModifier = { name: '', options: '', required: false, maxSelections: 1 };
    this.showProductModal = true;
  }

  saveProductForm() {
    if (!this.productForm.name.trim()) {
      this.toastr.warning('Por favor ingresa un nombre para el producto', 'Campo requerido');
      return;
    }

    if (!this.productForm.categoryId) {
      this.toastr.warning('Por favor selecciona una categoría', 'Campo requerido');
      return;
    }

    // Validar precio usando el componente hijo
    if (this.tabPrices && !this.tabPrices.validatePrice()) {
      return;
    }

    // Preparar los precios según el formato de la API
    const precios = [{
      precio: this.productForm.price,
      descripcion: this.productForm.variants.length > 0 ? 'Precio base' : 'Precio único',
      cantidadMinima: 1,
      modalidad: 'Unidad',
      esPrincipal: true
    }];

    // Agregar variantes como precios adicionales
    this.productForm.variants.forEach(variant => {
      precios.push({
        precio: variant.price,
        descripcion: variant.name,
        cantidadMinima: 1,
        modalidad: 'Variante',
        esPrincipal: false
      });
    });

    const productoData = {
      categoriaID: this.productForm.categoryId as number,
      nombre: this.productForm.name,
      descripcion: this.productForm.description,
      stock: this.productForm.currentStock || 0,
      stockMinimo: this.productForm.minStock || 0,
      inventario: this.productForm.hasStockControl || false,
      precios: precios,
      imagenUrl: this.productForm.image || '',
      imagenDescripcion: this.productForm.name
    };

    if (this.productForm.id) {
      // Editar producto existente
      this.productoService.actualizarProducto(this.productForm.id, productoData).subscribe({
        next: (response) => {
          this.products.update(prods => {
            const index = prods.findIndex(p => p.id === this.productForm.id);
            if (index !== -1) {
              const category = this.categories().find(c => c.id === this.productForm.categoryId);
              prods[index] = {
                id: response.productoID,
                name: response.nombre,
                description: response.descripcion,
                categoryId: response.categoriaID || 0,
                categoryName: category?.name,
                precioActual: response.precioActual,
                image: response.urlImagen,
                visible: response.visible
              };
            }
            return [...prods];
          });
          this.toastr.success('El producto se ha actualizado correctamente', 'Producto actualizado');
          this.updateProductCounts();
          this.closeProductModal();
        },
        error: (error) => {
          console.error('Error al actualizar producto:', error);
          this.toastr.error('No se pudo actualizar el producto', 'Error');
        }
      });
    } else {
      // Crear nuevo producto
      this.productoService.crearProducto(productoData).subscribe({
        next: (response) => {
          const category = this.categories().find(c => c.id === this.productForm.categoryId);
          this.products.update(prods => [...prods, {
            id: response.productoID,
            name: response.nombre,
            description: response.descripcion,
            categoryId: response.categoriaID || 0,
            categoryName: category?.name,
            precioActual: response.precioActual,
            image: response.urlImagen,
            visible: response.visible
          }]);
          this.toastr.success('El producto se ha creado correctamente', 'Producto creado');
          this.updateProductCounts();
          this.closeProductModal();
        },
        error: (error) => {
          console.error('Error al crear producto:', error);
          this.toastr.error('No se pudo crear el producto', 'Error');
        }
      });
    }
  }

  toggleProductVisibility(productId: number) {
    this.products.update(prods => {
      const product = prods.find(p => p.id === productId);
      if (product) {
        product.visible = !product.visible;
        this.toastr.success(
          product.visible ? 'Producto visible para los clientes' : 'Producto oculto para los clientes',
          product.visible ? 'Producto activado' : 'Producto desactivado'
        );
      }
      return [...prods];
    });
  }

  deleteProduct(productId: number) {
    this.confirmationService.confirm({
      message: '¿Estás seguro de eliminar este producto?',
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.productoService.eliminarProducto(productId).subscribe({
          next: () => {
            this.products.update(prods => prods.filter(p => p.id !== productId));
            this.updateProductCounts();
            this.toastr.success('El producto se ha eliminado correctamente', 'Producto eliminado');
          },
          error: (error) => {
            console.error('Error al eliminar producto:', error);
            this.toastr.error('No se pudo eliminar el producto', 'Error');
          }
        });
      }
    });
  }

  closeProductModal() {
    this.showProductModal = false;
  }

  showValidationError(errorMessage: string) {
    this.toastr.warning(errorMessage, 'Campo requerido');
  }

  // === UTILIDADES ===
  get filteredProducts(): Product[] {
    if (!this.selectedCategoryId) return this.products();
    return this.products().filter(p => p.categoryId === this.selectedCategoryId);
  }

  getSelectedCategoryName(): string {
    return this.categories().find(c => c.id === this.selectedCategoryId)?.name || 'Productos';
  }

  getProductsByCategory(categoryId: number): Product[] {
    let filtered = this.products().filter(p => p.categoryId === categoryId);
    
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(search) ||
        (p.description && p.description.toLowerCase().includes(search))
      );
    }
    
    return filtered;
  }

  get filteredCategories(): Category[] {
    if (!this.searchTerm.trim()) {
      return this.categories();
    }
    
    return this.categories().filter(category => 
      this.getProductsByCategory(category.id).length > 0
    );
  }

  toggleCategory(categoryId: number) {
    this.categories.update(cats => {
      const category = cats.find(c => c.id === categoryId);
      if (category) {
        category.expanded = !category.expanded;
      }
      return [...cats];
    });
  }

  updateProductCounts() {
    this.categories.update(cats => {
      cats.forEach(category => {
        category.productCount = this.products().filter(p => p.categoryId === category.id).length;
      });
      return [...cats];
    });
  }

  togglePreview() {
    this.showPreview = !this.showPreview;
  }

  onFileSelected(event: Event, productoId: number) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      // Solo preparar la imagen para el cropper, no subir todavía
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.currentImageForCrop.set(e.target.result);
        this.croppedImage = '';
        this.showImageCropper.set(true);
      };
      reader.readAsDataURL(file);
    }
  }

  // === GESTIÓN DE IMAGEN ===
  openImageModal() {
    // Si ya tiene imagen, cargarla en el cropper
    if (this.productForm.image) {
      this.currentImageForCrop.set(this.productForm.image);
      this.croppedImage = '';
    } else {
      this.currentImageForCrop.set(null);
    }
    this.showImageCropper.set(true);
  }

  openImageCropper() {
    if (this.productForm.image) {
      this.currentImageForCrop.set(this.productForm.image);
      this.croppedImage = '';
      this.showImageCropper.set(true);
    }
  }

  closeImageCropper() {
    this.showImageCropper.set(false);
    this.currentImageForCrop.set(null);
    this.imageChangedEvent = '';
    this.croppedImage = '';
    this.pendingImageData = null;
    this.isLoadingImage.set(false);
  }

  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = event.blob;
  }

  imageLoaded(image: LoadedImage) {
    // Imagen cargada correctamente
  }

  cropperReady() {
    // Cropper listo
  }

  loadImageFailed() {
    this.toastr.error('No se pudo cargar la imagen', 'Error');
  }

  saveCroppedImage() {
    if (this.croppedImage) {
      // Convertir blob a File
      const croppedBlob = this.croppedImage as Blob;
      const productoId = this.productForm.id;
      if (!productoId) {
        this.toastr.error('No se encontró el ID del producto para subir la imagen', 'Error');
        this.closeImageCropper();
        return;
      }
      const croppedFile = new File([croppedBlob], 'producto_' + productoId + '_cropped.png', { type: croppedBlob.type || 'image/png' });
      this.productoService.uploadImagen(croppedFile, productoId, '', true).subscribe({
        next: (res) => {
          console.log('Imagen subida correctamente:', res);
          this.toastr.success('La imagen recortada ha sido subida correctamente', 'Imagen guardada');
          // Usar urlCompleta si está disponible, si no urlImagen
          if (res && (res.urlCompleta || res.urlImagen)) {
            this.productForm.image = res.urlCompleta || res.urlImagen;
          }
          this.closeImageCropper();
        },
        error: () => {
          this.toastr.error('Error al subir la imagen recortada', 'Error');
          this.closeImageCropper();
        }
      });
    } else {
      this.closeImageCropper();
    }
  }

  addVariant() {
    if (!this.newVariant.name.trim()) {
      this.toastr.warning('Ingresa un nombre para la variante', 'Campo requerido');
      return;
    }

    const variant: Variant = {
      id: Date.now().toString(),
      name: this.newVariant.name,
      price: this.newVariant.price
    };

    this.productForm.variants.push(variant);
    this.newVariant = { name: '', price: 0 };
    
    this.toastr.success(`${variant.name} agregado correctamente`, 'Variante agregada');
  }

  removeVariant(id: string) {
    this.productForm.variants = this.productForm.variants.filter(v => v.id !== id);
  }

  // === GESTIÓN DE MODIFICADORES ===
  addModifier(modifier?: any) {
    // Si se recibe el modificador completo desde el componente hijo
    if (modifier) {
      this.productForm.modifiers.push(modifier);
      this.toastr.success(`${modifier.name} con ${modifier.options.length} opciones`, 'Modificador agregado');
      return;
    }

    // Lógica antigua por si se llama sin parámetro
    if (!this.newModifier.name.trim()) {
      this.toastr.warning('Ingresa un nombre para el modificador', 'Campo requerido');
      return;
    }

    const options = this.newModifier.options
      .split(',')
      .map(opt => opt.trim())
      .filter(opt => opt.length > 0);

    if (options.length === 0) {
      this.toastr.warning('Ingresa al menos una opción (separadas por comas)', 'Opciones requeridas');
      return;
    }

    const newModifier: Modifier = {
      id: Date.now().toString(),
      name: this.newModifier.name,
      options: options,
      required: this.newModifier.required,
      maxSelections: this.newModifier.maxSelections
    };

    this.productForm.modifiers.push(newModifier);
    this.newModifier = { name: '', options: '', required: false, maxSelections: 1 };
    
    this.toastr.success(`${newModifier.name} con ${newModifier.options.length} opciones`, 'Modificador agregado');
  }

  removeModifier(id: string) {
    this.productForm.modifiers = this.productForm.modifiers.filter(m => m.id !== id);
  }

  // === COPIAR IMAGEN ===
  copyImageToOtherProducts() {
    if (!this.productForm.image) {
      this.toastr.warning('Primero sube una imagen para copiarla', 'Sin imagen');
      return;
    }

    this.confirmationService.confirm({
      message: '¿Deseas usar esta imagen para todos los productos de esta categoría?',
      header: 'Copiar imagen',
      icon: 'pi pi-copy',
      acceptLabel: 'Sí, copiar',
      rejectLabel: 'Cancelar',
      accept: () => {
        const categoryId = this.productForm.categoryId;
        if (!categoryId) return;

        let count = 0;
        this.products.update(prods => {
          prods.forEach(product => {
            if (product.categoryId === categoryId && product.id !== this.productForm.id) {
              product.image = this.productForm.image;
              count++;
            }
          });
          return [...prods];
        });

        this.toastr.success(`Imagen aplicada a ${count} productos`, 'Imagen copiada');
      }
    });
  }
}
