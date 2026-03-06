import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AppStateService } from '../services/app-state.service';

export const leadGuard: CanActivateFn = () => {
  const state = inject(AppStateService);
  const router = inject(Router);
  if (state.isLead()) return true;
  router.navigate(['/']);
  return false;
};
