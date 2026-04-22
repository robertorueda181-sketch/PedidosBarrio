import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../../shared/services/producto.service';
import { ToastrService } from 'ngx-toastr';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { ColorPickerModule } from 'primeng/colorpicker';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { Categoria } from '../../../shared/models/producto.model';

interface CategoryFormData {
  id: number | null;
  descripcion: string;
  color: string;
}

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ConfirmDialogModule,
    DialogModule,
    InputTextModule,
    ButtonModule,
    MenuModule,
    ColorPickerModule,
    TableModule,
    TooltipModule
  ],
  providers: [ConfirmationService],
  templateUrl: './categorias.component.html',
  styleUrl: './categorias.component.css'
})
export class CategoriasComponent {
  private readonly productoService = inject(ProductoService);
  private readonly toastr = inject(ToastrService);
  private readonly confirmationService = inject(ConfirmationService);

  // Estados
  readonly categories = signal<Categoria[]>([]);
  readonly loading = signal(false);
  readonly showModal = signal(false);
  readonly searchTerm = signal('');
  readonly categoryForm = signal<CategoryFormData>({
    id: null,
    descripcion: '',
    color: '#3b82f6'
  });

  // Estados móviles
  readonly isMobile = signal(
    typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
  );

  updateCategoryForm(field: keyof CategoryFormData, value: any): void {
    this.categoryForm.set({
      ...this.categoryForm(),
      [field]: value
    });
  }

  // Computed
  readonly filteredCategories = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.categories().filter(cat =>
      cat.descripcion.toLowerCase().includes(term)
    );
  });

  readonly mobileMenuItems = signal<MenuItem[]>([]);

  constructor() {
    // Monitorear cambios de tamaño de pantalla
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        this.isMobile.set(window.matchMedia('(max-width: 768px)').matches);
      });
    }

    // Cargar categorías al inicializar
    this.loadCategories();
  }

  /**
   * Carga todas las categorías
   */
  private loadCategories(): void {
    this.loading.set(true);
    this.productoService.getCategorias().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.toastr.error('Error al cargar las categorías');
        this.loading.set(false);
      }
    });
  }

  /**
   * Abre el modal para crear o editar categoría
   */
  openModal(category?: Categoria): void {
    if (category) {
      this.categoryForm.set({
        id: category.categoriaID,
        descripcion: category.descripcion,
        color: category.color || '#3b82f6'
      });
    } else {
      this.categoryForm.set({
        id: null,
        descripcion: '',
        color: '#3b82f6'
      });
    }
    this.showModal.set(true);
  }

  /**
   * Cierra el modal
   */
  closeModal(): void {
    this.showModal.set(false);
    this.categoryForm.set({
      id: null,
      descripcion: '',
      color: '#3b82f6'
    });
  }

  /**
   * Guarda o actualiza una categoría
   */
  saveCategory(): void {
    const form = this.categoryForm();

    if (!form.descripcion.trim()) {
      this.toastr.warning('Por favor ingresa un nombre para la categoría');
      return;
    }

    this.loading.set(true);

    if (form.id) {
      // Actualizar categoría existente
      this.productoService
        .actualizarCategoria(form.id, {
          descripcion: form.descripcion.trim(),
          color: form.color
        })
        .subscribe({
          next: (updatedCategory) => {
            this.categories.update(cats =>
              cats.map(cat =>
                cat.categoriaID === form.id
                  ? { ...cat, descripcion: updatedCategory.descripcion, color: updatedCategory.color }
                  : cat
              )
            );
            this.toastr.success('Categoría actualizada exitosamente');
            this.closeModal();
            this.loading.set(false);
          },
          error: (error) => {
            console.error('Error updating category:', error);
            this.toastr.error('Error al actualizar la categoría');
            this.loading.set(false);
          }
        });
    } else {
      // Crear nueva categoría
      this.productoService
        .crearCategoria({
          descripcion: form.descripcion.trim(),
          color: form.color
        })
        .subscribe({
          next: (newCategory) => {
            this.categories.update(cats => [...cats, newCategory]);
            this.toastr.success('Categoría creada exitosamente');
            this.closeModal();
            this.loading.set(false);
          },
          error: (error) => {
            console.error('Error creating category:', error);
            this.toastr.error('Error al crear la categoría');
            this.loading.set(false);
          }
        });
    }
  }

  /**
   * Elimina una categoría
   */
  deleteCategory(category: Categoria): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de que deseas eliminar la categoría "${category.descripcion}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.loading.set(true);
        this.productoService.eliminarCategoria(category.categoriaID).subscribe({
          next: () => {
            this.categories.update(cats =>
              cats.filter(cat => cat.categoriaID !== category.categoriaID)
            );
            this.toastr.success('Categoría eliminada exitosamente');
            this.loading.set(false);
          },
          error: (error) => {
            console.error('Error deleting category:', error);
            this.toastr.error('Error al eliminar la categoría');
            this.loading.set(false);
          }
        });
      }
    });
  }

  /**
   * Abre el menú móvil
   */
  openMobileMenu(event: any, category: Categoria, menu: any): void {
    this.mobileMenuItems.set([
      {
        label: 'Editar',
        icon: 'pi pi-pencil',
        command: () => this.openModal(category)
      },
      {
        label: 'Eliminar',
        icon: 'pi pi-trash',
        command: () => this.deleteCategory(category)
      }
    ]);
    menu.toggle(event);
  }

  /**
   * Actualiza el término de búsqueda
   */
  updateSearchTerm(term: string): void {
    this.searchTerm.set(term);
  }

  /**
   * Limpia la búsqueda
   */
  clearSearch(): void {
    this.searchTerm.set('');
  }

  /**
   * Track para ngFor
   */
  trackByCategory(index: number, category: Categoria): number {
    return category.categoriaID;
  }
}
