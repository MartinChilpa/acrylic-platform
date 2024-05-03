import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { noAuthGuard } from './guards/no-auth.guard';

export const routesNames = {
  HOME: 'home',
  AUTH: 'auth',
  MY_PROFILE: 'my-profile',
  UPLOAD: 'upload',
  SPLITSHEET: 'create-split-sheet',
  EDIT_UPLOAD: 'upload/:trackId',
  TRACKS: 'my-tracks',
  SUPPORT: 'my-support',
  PAGE_NOT_FOUND: 'page-not-found',
  FINANCE: 'my-finances',
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
      },
      {
        path: routesNames.UPLOAD,
        loadComponent: () => import('./components/upload/upload.component').then((c) => c.UploadComponent),
      },
      {
        path: routesNames.SPLITSHEET,
        loadComponent: () => import('./components/create-split-sheet/create-split-sheet.component').then((c) => c.CreateSplitSheetComponent),
      },
      {
        path: routesNames.EDIT_UPLOAD,
        loadComponent: () => import('./components/upload/upload.component').then((c) => c.UploadComponent),
      },
      {
        path: routesNames.TRACKS,
        loadComponent: () => import('./components/my-tracks/my-tracks.component').then((c) => c.MyTracksComponent),
      },
      {
        path: routesNames.SUPPORT,
        loadChildren: () => import('./components/my-support/my-support.routes').then((mod) => mod.MY_SUPPORT_ROUTES)
      },
      {
        path: routesNames.FINANCE,
        loadChildren: () => import('./components/finance/finance.routes').then((mod) => mod.FINANCE_ROUTES),
      },
    ],
  },
  {
    path: routesNames.AUTH,
    canActivate: [noAuthGuard],
    loadChildren: () => import('./components/auth/auth.routes').then((mod) => mod.AUTH_ROUTES)
  },
  { path: '**', redirectTo: routesNames.PAGE_NOT_FOUND },
  {
    path: routesNames.PAGE_NOT_FOUND,
    loadComponent: () => import('./components/shared/page-not-found/page-not-found.component').then((c) => c.PageNotFoundComponent)
  },
];
