import { Routes } from '@angular/router';
import { leadGuard } from './guards/lead.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'backlog', pathMatch: 'full' },
  {
    path: 'backlog',
    loadComponent: () => import('./pages/backlog/backlog').then((m) => m.Backlog),
  },
  {
    path: 'planning',
    loadComponent: () => import('./pages/planning/planning').then((m) => m.Planning),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/lead-dashboard/lead-dashboard').then((m) => m.LeadDashboard),
    canActivate: [leadGuard],
  },
  {
    path: 'weeks',
    loadComponent: () => import('./pages/week-manager/week-manager').then((m) => m.WeekManager),
    canActivate: [leadGuard],
  },
];
