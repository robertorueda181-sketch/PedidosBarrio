import { Injectable, signal, computed, inject } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { PasosInicialesService } from './pasos-iniciales.service';
import { ProgressStep } from '../interfaces/progress-step.interface';

@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  private pasosInicialesService = inject(PasosInicialesService);

  // Signal para almacenar los pasos desde el backend
  private stepsData = signal<ProgressStep[]>([]);
  private isLoading = signal(false);
  private error = signal<string | null>(null);

  // Computar progreso desde los datos del backend
  steps = computed<ProgressStep[]>(() => this.stepsData());

  progressPercentage = computed(() => {
    const allSteps = this.steps();
    if (allSteps.length === 0) return 0;
    const completedSteps = allSteps.filter(s => s.completed).length;
    return Math.round((completedSteps / allSteps.length) * 100);
  });

  pendingStepsCount = computed(() => {
    return this.steps().filter(s => !s.completed).length;
  });

  isComplete = computed(() => {
    return this.progressPercentage() === 100;
  });

  get loading() {
    return this.isLoading.asReadonly();
  }

  get errorMessage() {
    return this.error.asReadonly();
  }

  // Cargar progreso desde el backend
  async loadProgress() {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const pasos = await lastValueFrom(this.pasosInicialesService.getPasosIniciales());
      this.stepsData.set(pasos);
    } catch (err: any) {
      console.error('Error loading pasos iniciales:', err);
      const errorMessage = err?.error?.message || err?.message || 'Error al cargar los pasos iniciales';
      this.error.set(errorMessage);
      // En caso de error, mantener lista vacía o datos por defecto
      this.stepsData.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }
}
