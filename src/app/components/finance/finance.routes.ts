import { Routes } from '@angular/router';

export const financeRoutesNames = {
    EMPTY: '',
    REVENUE: 'my-revenue',
    TRANSACTIONS: 'my-transactions',
    SUBSCRIPTION: 'my-subscription',
    DOCUMENT: 'my-document'
};

export const FINANCE_ROUTES: Routes = [
    {
        path: financeRoutesNames.EMPTY,
        loadComponent: () => import('./finance.component').then((c) => c.FinanceComponent),
        children: [
            {
                path: financeRoutesNames.EMPTY,
                redirectTo: financeRoutesNames.REVENUE,
                pathMatch: 'full',
            },
            {
                path: financeRoutesNames.REVENUE,
                loadComponent: () => import('./revenue/revenue.component').then((c) => c.RevenueComponent),
            },
            {
                path: financeRoutesNames.TRANSACTIONS,
                loadComponent: () => import('./transactions/transactions.component').then((c) => c.TransactionsComponent),
            },
            {
                path: financeRoutesNames.SUBSCRIPTION,
                loadComponent: () => import('./subscription/subscription.component').then((c) => c.SubscriptionComponent),
            },
            {
                path: financeRoutesNames.DOCUMENT,
                loadComponent: () => import('./document/document.component').then((c) => c.DocumentComponent),
            }
        ],
    }
];