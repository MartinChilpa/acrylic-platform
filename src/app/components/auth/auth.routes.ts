import { Routes } from '@angular/router';

export const authRoutesNames = {
    EMPTY: '',
    SIGNIN: 'sign-in',
    SIGNUP: 'sign-up',
    FORGOT_PASSWORD: 'forgot-password',
    RESET_PASSWORD: 'reset-password'
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
            },
            {
                path: authRoutesNames.SIGNUP,
                loadComponent: () => import('./sign-up/sign-up.component').then((mod) => mod.SignUpComponent),
            },
            {
                path: authRoutesNames.FORGOT_PASSWORD,
                loadComponent: () => import('./forgot-password/forgot-password.component').then((mod) => mod.ForgotPasswordComponent),
            },
            {
                path: authRoutesNames.RESET_PASSWORD,
                loadComponent: () => import('./reset-password/reset-password.component').then((mod) => mod.ResetPasswordComponent),
            }
        ],
    }
];