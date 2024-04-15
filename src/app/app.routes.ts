import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routesNames = {
  HOME: 'home',
  AUTH: 'auth',
  EMPTY: ''
};

export const routes: Routes = [
  {
    path: routesNames.EMPTY,
    loadComponent: () => import('./components/layout/layout-page/layout-page.component').then((c) => c.LayoutPageComponent),
    canActivate: [authGuard],
    children: [
      {
        path: routesNames.EMPTY,
        redirectTo: routesNames.HOME,
        pathMatch: 'full',
      },
      {
        path: routesNames.HOME,
        loadComponent: () => import('./components/home/home.component').then((c) => c.HomeComponent),
      },
    ],
  },
  {
    path: routesNames.AUTH,
    loadChildren: () => import('./components/auth/auth.routes').then((mod) => mod.AUTH_ROUTES)
  }
];
