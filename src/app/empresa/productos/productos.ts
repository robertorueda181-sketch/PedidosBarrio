import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService, Producto } from '../../../shared/services/producto.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

interface Category {
  id: number;
  name: string;
  isFavorite: boolean;
  productCount: number;
  color?: string;
  expanded?: boolean;
}

interface Product {
  id: number;
  name: string;
  description: string;
  categoryId: number;
  categoryName?: string;
  price: number;
  discount?: number;
  image?: string;
  active: boolean;
}

@Component({
  selector: 'app-productos',
  imports: [CommonModule, FormsModule, ToastModule, ConfirmDialogModule],
  providers: [MessageService, ConfirmationService],
  templateUrl: './productos.html',
  styleUrl: './productos.css',
})
export class ProductosComponent {
  private productoService = inject(ProductoService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // Estados de modales
  showCategoryModal = false;
  showProductModal = false;
  showPreview = false;

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
    active: true
  };

  categories: Category[] = [
    { id: 1, name: 'Destacados', isFavorite: true, productCount: 0, color: '#fbbf24', expanded: true },
    { id: 2, name: 'Platos', isFavorite: false, productCount: 2, color: '#ef4444', expanded: false },
    { id: 3, name: 'Postres', isFavorite: false, productCount: 2, color: '#8b5cf6', expanded: false },
    { id: 4, name: 'Bebidas', isFavorite: false, productCount: 2, color: '#06b6d4', expanded: false },
  ];

  products: Product[] = [
    {
      id: 1,
      name: 'Hamburguesa',
      description: 'Hamburguesa con cebolla, tomate y lechuga',
      categoryId: 2,
      categoryName: 'Platos',
      price: 30.00,
      discount: 16,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
      active: true
    },
    {
      id: 2,
      name: 'Pizza Margarita',
      description: 'Tomate, mozzarella y albahaca',
      categoryId: 2,
      categoryName: 'Platos',
      price: 10.00,
      image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
      active: true
    },
    {
      id: 3,
      name: 'Torta de chocolate',
      description: 'Especial de la casa',
      categoryId: 3,
      categoryName: 'Postres',
      price: 15.00,
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400',
      active: true
    }
  ];

  ngOnInit() {
    this.loadCategorias();
    this.selectedCategoryId = this.categories[0]?.id || null;
    this.updateProductCounts();
  }

  loadCategorias() {
    this.productoService.getCategorias().subscribe({
      next: (categorias) => {
        console.log('Categorías cargadas desde el servicio:', categorias);
        this.categories = categorias.map(cat => ({
          id: cat.categoriaID,
          name: cat.descripcion,
          isFavorite: false,
          productCount: 0,
          color: cat.color || '#3b82f6',
          expanded: false
        }));
        
        if (this.categories.length > 0) {
          this.categories[0].expanded = true;
          this.selectedCategoryId = this.categories[0].id;
        }
        
        this.updateProductCounts();
        
        this.messageService.add({
          severity: 'success',
          summary: 'Categorías cargadas',
          detail: `${this.categories.length} categorías cargadas correctamente`,
          life: 3000
        });
      },
      error: (error) => {
        console.error('Error al cargar categorías:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las categorías. Usando datos de ejemplo.',
          life: 5000
        });
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
      this.messageService.add({
        severity: 'warn',
        summary: 'Campo requerido',
        detail: 'Por favor ingresa un nombre para la categoría',
        life: 3000
      });
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
          const index = this.categories.findIndex(c => c.id === this.categoryForm.id);
          if (index !== -1) {
            this.categories[index] = {
              ...this.categories[index],
              name: this.categoryForm.name,
              isFavorite: this.categoryForm.isFavorite,
              color: this.categoryForm.color
            };
          }
          this.messageService.add({
            severity: 'success',
            summary: 'Categoría actualizada',
            detail: 'La categoría se ha actualizado correctamente',
            life: 3000
          });
          this.closeCategoryModal();
        },
        error: (error) => {
          console.error('Error al actualizar categoría:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo actualizar la categoría',
            life: 5000
          });
        }
      });
    } else {
      // Crear nueva categoría
      this.productoService.crearCategoria(categoriaData).subscribe({
        next: (response) => {
          this.categories.push({
            id: response.categoriaID,
            name: response.descripcion,
            isFavorite: false,
            productCount: 0,
            color: response.color || this.categoryForm.color,
            expanded: false
          });
          this.messageService.add({
            severity: 'success',
            summary: 'Categoría creada',
            detail: 'La categoría se ha creado correctamente',
            life: 3000
          });
          this.closeCategoryModal();
        },
        error: (error) => {
          console.error('Error al crear categoría:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo crear la categoría',
            life: 5000
          });
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
            this.categories = this.categories.filter(c => c.id !== categoryId);
            if (this.selectedCategoryId === categoryId) {
              this.selectedCategoryId = this.categories[0]?.id || null;
            }
            this.updateProductCounts();
            this.messageService.add({
              severity: 'success',
              summary: 'Categoría eliminada',
              detail: 'La categoría se ha eliminado correctamente',
              life: 3000
            });
          },
          error: (error) => {
            console.error('Error al eliminar categoría:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar la categoría',
              life: 5000
            });
          }
        });
      }
    });
  }

  toggleFavorite(categoryId: number) {
    const category = this.categories.find(c => c.id === categoryId);
    if (category) {
      category.isFavorite = !category.isFavorite;
    }
  }

  closeCategoryModal() {
    this.showCategoryModal = false;
  }

  // === GESTIÓN DE PRODUCTOS ===
  openProductModal(product?: Product) {
    if (product) {
      this.productForm = {
        id: product.id,
        name: product.name,
        description: product.description,
        categoryId: product.categoryId,
        price: product.price,
        discount: product.discount,
        image: product.image,
        active: product.active
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
        active: true
      };
    }
    this.showProductModal = true;
  }

  saveProductForm() {
    if (!this.productForm.name.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campo requerido',
        detail: 'Por favor ingresa un nombre para el producto',
        life: 3000
      });
      return;
    }

    if (!this.productForm.categoryId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campo requerido',
        detail: 'Por favor selecciona una categoría',
        life: 3000
      });
      return;
    }

    const category = this.categories.find(c => c.id === this.productForm.categoryId);

    if (this.productForm.id) {
      // Editar producto existente
      const index = this.products.findIndex(p => p.id === this.productForm.id);
      if (index !== -1 && this.productForm.categoryId) {
        this.products[index] = {
          id: this.productForm.id,
          name: this.productForm.name,
          description: this.productForm.description,
          categoryId: this.productForm.categoryId,
          categoryName: category?.name,
          price: this.productForm.price,
          discount: this.productForm.discount || 0,
          image: this.productForm.image,
          active: this.productForm.active
        };
        this.messageService.add({
          severity: 'success',
          summary: 'Producto actualizado',
          detail: 'El producto se ha actualizado correctamente',
          life: 3000
        });
      }
    } else {
      // Crear nuevo producto
      if (this.productForm.categoryId) {
        const newId = Math.max(...this.products.map(p => p.id), 0) + 1;
        this.products.push({
          id: newId,
          name: this.productForm.name,
          description: this.productForm.description,
          categoryId: this.productForm.categoryId,
          categoryName: category?.name,
          price: this.productForm.price,
          discount: this.productForm.discount || 0,
          image: this.productForm.image,
          active: this.productForm.active
        });
        this.messageService.add({
          severity: 'success',
          summary: 'Producto creado',
          detail: 'El producto se ha creado correctamente',
          life: 3000
        });
      }
    }

    this.updateProductCounts();
    this.closeProductModal();
  }

  deleteProduct(productId: number) {
    this.confirmationService.confirm({
      message: '¿Estás seguro de eliminar este producto?',
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.products = this.products.filter(p => p.id !== productId);
        this.updateProductCounts();
        this.messageService.add({
          severity: 'success',
          summary: 'Producto eliminado',
          detail: 'El producto se ha eliminado correctamente',
          life: 3000
        });
      }
    });
  }

  closeProductModal() {
    this.showProductModal = false;
  }

  // === UTILIDADES ===
  get filteredProducts(): Product[] {
    if (!this.selectedCategoryId) return this.products;
    return this.products.filter(p => p.categoryId === this.selectedCategoryId);
  }

  getSelectedCategoryName(): string {
    return this.categories.find(c => c.id === this.selectedCategoryId)?.name || 'Productos';
  }

  getProductsByCategory(categoryId: number): Product[] {
    let filtered = this.products.filter(p => p.categoryId === categoryId);
    
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
      return this.categories;
    }
    
    return this.categories.filter(category => 
      this.getProductsByCategory(category.id).length > 0
    );
  }

  toggleCategory(categoryId: number) {
    const category = this.categories.find(c => c.id === categoryId);
    if (category) {
      category.expanded = !category.expanded;
    }
  }

  updateProductCounts() {
    this.categories.forEach(category => {
      category.productCount = this.products.filter(p => p.categoryId === category.id).length;
    });
  }

  togglePreview() {
    this.showPreview = !this.showPreview;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Aquí normalmente subirías la imagen a un servidor
      // Por ahora, creamos una URL temporal
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.productForm.image = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }
}
