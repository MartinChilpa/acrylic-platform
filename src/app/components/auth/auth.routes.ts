import { Routes } from '@angular/router';

export const authRoutesNames = {
    EMPTY: '',
    SIGNIN: 'sign-in',
    SIGNUP: 'sign-up'
};

export const AUTH_ROUTES: Routes = [
    {
        path: authRoutesNames.EMPTY,
        loadComponent: () => import('./auth.component').then((c) => c.AuthComponent),
        children: [
            {
                path: authRoutesNames.EMPTY,
                redirectTo: authRoutesNames.SIGNIN,
                pathMatch: 'full',
            },
            {
                path: authRoutesNames.SIGNIN,
                loadComponent: () => import('./sign-in/sign-in.component').then((mod) => mod.SignInComponent),
            }, {
                path: authRoutesNames.SIGNUP,
                loadComponent: () => import('./sign-up/sign-up.component').then((mod) => mod.SignUpComponent),
            }
        ],
    }
];