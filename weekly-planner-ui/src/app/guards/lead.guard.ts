import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RoleService } from '../services/role.service';

/// <summary>
/// Blocks non-lead members from accessing /dashboard route.
/// Redirects them to /planning instead.
/// </summary>
export const leadGuard: CanActivateFn = () => {
  const roleService = inject(RoleService);
  const router = inject(Router);

  if (roleService.isLead()) return true;
  router.navigate(['/planning']);
  return false;
};
