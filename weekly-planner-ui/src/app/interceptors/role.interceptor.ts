import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { RoleService } from '../services/role.service';

/// <summary>
/// Attaches X-Member-Id and X-Is-Lead headers to every API request.
/// Backend uses these to enforce role-based access control.
/// </summary>
export const roleInterceptor: HttpInterceptorFn = (req, next) => {
  const roleService = inject(RoleService);
  const member = roleService.getCurrent();

  const modified = req.clone({
    setHeaders: {
      'X-Member-Id': member.id.toString(),
      'X-Is-Lead': member.isLead.toString(),
    },
  });
  return next(modified);
};
