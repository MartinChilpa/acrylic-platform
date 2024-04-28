import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routesNames = {
  HOME: 'home',
  AUTH: 'auth',
  MY_PROFILE: 'my-profile',
  PAGE_NOT_FOUND: 'page-not-found',
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
      {
        path: routesNames.MY_PROFILE,
        loadChildren: () => import('./components/my-profile/my-profile.routes').then((mod) => mod.MY_PROFILE_ROUTES)
      }
    ],
  },
  {
    path: routesNames.AUTH,
    loadChildren: () => import('./components/auth/auth.routes').then((mod) => mod.AUTH_ROUTES)
  },
  { path: '**', redirectTo: routesNames.PAGE_NOT_FOUND },
  {
    path: routesNames.PAGE_NOT_FOUND,
    loadComponent: () => import('./components/shared/page-not-found/page-not-found.component').then((c) => c.PageNotFoundComponent)
  },
];
