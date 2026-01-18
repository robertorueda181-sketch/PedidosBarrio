import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ProgressService } from '../../services/progress.service';

@Component({
  selector: 'app-progress-button',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: `
    <div class="fixed bottom-6 right-6 z-50">
      <!-- Panel de progreso -->
      @if (showPanel()) {
        <div class="mb-4 bg-white rounded-lg shadow-2xl border border-gray-200 w-80 md:w-96 animate-slide-up">
          <div class="bg-gradient-to-r from-primary to-blue-500 text-white p-4 rounded-t-lg">
            <div class="flex items-center justify-between mb-2">
              <h3 class="font-bold text-lg">Guía de Configuración</h3>
              <button
                pButton
                icon="pi pi-times"
                [text]="true"
                [rounded]="true"
                class="text-white hover:bg-white/20"
                (click)="togglePanel()">
              </button>
            </div>
            <div class="flex items-center gap-3">
              <div class="flex-1">
                <div class="bg-white/30 rounded-full h-2">
                  <div 
                    class="bg-white rounded-full h-2 transition-all duration-500"
                    [style.width.%]="progressService.progressPercentage()">
                  </div>
                </div>
              </div>
              <span class="font-bold text-xl">{{ progressService.progressPercentage() }}%</span>
            </div>
          </div>

          <div class="p-4 max-h-96 overflow-y-auto">
            @for (step of progressService.steps(); track step.id) {
              <div 
                class="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors mb-2 last:mb-0 border border-transparent hover:border-primary/20"
                [class.opacity-50]="step.completed"
                (click)="navigateToStep(step)">
                <div class="flex-shrink-0">
                  @if (step.completed) {
                    <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <i class="pi pi-check text-green-600 text-lg"></i>
                    </div>
                  } @else {
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-blue-100 flex items-center justify-center">
                      <i class="pi {{ step.icon }} text-primary text-lg"></i>
                    </div>
                  }
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <h4 class="font-semibold text-gray-900 text-sm">{{ step.title }}</h4>
                    @if (step.isPro) {
                      <span class="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        <i class="pi pi-star-fill mr-1"></i>PRO
                      </span>
                    }
                  </div>
                  <p class="text-xs text-gray-600">{{ step.description }}</p>
                </div>
                @if (!step.completed) {
                  <i class="pi pi-chevron-right text-gray-400 mt-2"></i>
                }
              </div>
            }
          </div>

          @if (progressService.isComplete()) {
            <div class="p-4 bg-green-50 border-t border-green-100">
              <div class="flex items-center gap-3">
                <i class="pi pi-check-circle text-green-600 text-2xl"></i>
                <div>
                  <h4 class="font-bold text-green-900">¡Perfil Completo!</h4>
                  <p class="text-sm text-green-700">Tu negocio está listo para recibir pedidos</p>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Botón circular -->
      <button
        pButton
        [rounded]="true"
        class="relative shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 w-14 h-14"
        [class.bg-green-500]="progressService.isComplete()"
        [class.hover:bg-green-600]="progressService.isComplete()"
        (click)="togglePanel()">
        <div class="flex items-center justify-center">
          @if (progressService.isComplete()) {
            <i class="pi pi-check text-2xl"></i>
          } @else {
            <div class="relative">
              <i class="pi pi-list-check text-2xl"></i>
              @if (progressService.pendingStepsCount() > 0) {
                <span class="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {{ progressService.pendingStepsCount() }}
                </span>
              }
            </div>
          }
        </div>
      </button>
    </div>
  `,
  styles: [`
    @keyframes slide-up {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-slide-up {
      animation: slide-up 0.3s ease-out;
    }

    :host ::ng-deep .p-button {
      transition: all 0.3s ease;
    }
  `]
})
export class ProgressButtonComponent {
  progressService = inject(ProgressService);
  private router = inject(Router);
  
  showPanel = signal(false);

  ngOnInit() {
    this.progressService.loadProgress();
  }

  togglePanel() {
    this.showPanel.set(!this.showPanel());
  }

  navigateToStep(step: any) {
    this.showPanel.set(false);
    
    // Si tiene una acción específica, emitir evento o manejar
    if (step.action) {
      // Aquí podrías emitir un evento para que el componente padre maneje la acción
      console.log('Action:', step.action);
    }
    
    // Navegar a la ruta
    this.router.navigate([step.route]);
  }
}
