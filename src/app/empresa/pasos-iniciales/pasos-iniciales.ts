import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProgressService } from '../services/progress.service';
import { ProgressStep } from '../services/progress-step.interface';

@Component({
  selector: 'app-pasos-iniciales',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './pasos-iniciales.html',
  styleUrl: './pasos-iniciales.css'
})
export class PasosIniciales implements OnInit {
  progressService = inject(ProgressService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private navigating = signal(false);

  nextPendingStep = computed<ProgressStep | null>(() => {
    return this.progressService.steps().find(s => !s.completed) ?? null;
  });

  async ngOnInit() {
    await this.progressService.loadProgress();

    this.route.queryParamMap.subscribe(params => {
      const auto = params.get('auto');
      const shouldAutoRedirect = auto === '1' || auto === 'true';
      if (shouldAutoRedirect) this.redirectToNextPending();
    });
  }

  goToStep(step: ProgressStep) {
    this.router.navigate([step.route]);
  }

  redirectToNextPending() {
    if (this.navigating()) return;
    this.navigating.set(true);

    const next = this.nextPendingStep();
    if (next?.route) {
      this.router.navigate([next.route]).finally(() => this.navigating.set(false));
      return;
    }

    this.router.navigate(['/empresa/inicio']).finally(() => this.navigating.set(false));
  }
}

