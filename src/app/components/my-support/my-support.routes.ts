import { Routes } from '@angular/router';

export const mySupportRoutesNames = {
    EMPTY: '',
    FAQ: 'faq',
    CUSTOMER_SUCCESS: 'customer-success',
};

export const MY_SUPPORT_ROUTES: Routes = [
    {
        path: mySupportRoutesNames.EMPTY,
        loadComponent: () => import('./my-support.component').then((c) => c.MySupportComponent),
        children: [
            {
                path: mySupportRoutesNames.FAQ,
                loadComponent: () => import('./faq/faq.component').then((mod) => mod.FaqComponent),
            },
            {
                path: mySupportRoutesNames.CUSTOMER_SUCCESS,
                loadComponent: () => import('./customer-success/customer-success.component').then((mod) => mod.CustomerSuccessComponent),
            }
        ],
    }
];