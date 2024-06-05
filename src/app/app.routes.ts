import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { noAuthGuard } from './guards/no-auth.guard';

export const routesNames = {
  HOME: 'home',
  AUTH: 'auth',
  MY_PROFILE: 'my-profile',
  UPLOAD: 'upload',
  CREATE_SPLITSHEET: 'create-split-sheet',
  SPLITSHEET_REVIEW: 'my-split-sheets/review/:splitSheetId',
  EDIT_UPLOAD: 'upload/:trackId',
  TRACKS: 'my-tracks',
  SUPPORT: 'my-support',
  PAGE_NOT_FOUND: 'page-not-found',
  FINANCE: 'my-finances',
  MY_SPLIT_SHEETS: 'my-split-sheets',
  ARTIST_PROFILE: 'artist/:slug',
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
        path: routesNames.CREATE_SPLITSHEET,
        loadComponent: () => import('./components/my-split-sheets/manage-split-sheet/manage-split-sheet.component').then((c) => c.ManageSplitSheetComponent),
      },
      {
        path: routesNames.SPLITSHEET_REVIEW,
        loadComponent: () => import('./components/my-split-sheets/preview-split-sheet/preview-split-sheet.component').then((c) => c.PreviewSplitSheetComponent),
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
        loadChildren: () => import('./components/my-support/my-support.routes').then((mod) => mod.MY_SUPPORT_ROUTES),
        data: {
          public: true
        }
      },
      {
        path: routesNames.FINANCE,
        loadChildren: () => import('./components/finance/finance.routes').then((mod) => mod.FINANCE_ROUTES),
      },
      {
        path: routesNames.MY_SPLIT_SHEETS,
        loadComponent: () => import('./components/my-split-sheets/my-split-sheets.component').then((c) => c.MySplitSheetsComponent)
      },
      {
        path: routesNames.ARTIST_PROFILE,
        loadComponent: () => import('./components/my-profile/artist-profile/artist-profile.component').then((mod) => mod.ArtistProfileComponent),
        data: {
          public: true
        }
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
