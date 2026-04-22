import { CanDeactivateFn } from '@angular/router';

export interface HasUnsavedChanges {
  hasUnsavedChanges: () => boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) => {
  if (!component?.hasUnsavedChanges || !component.hasUnsavedChanges()) {
    return true;
  }

  return window.confirm('Tienes cambios sin guardar. Si continúas, podrías perderlos. ¿Deseas salir?');
};
