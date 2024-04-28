import { Routes } from '@angular/router';

export const myProfileRoutesNames = {
    EMPTY: '',
    ADD_SYNCLIST: 'add-synclist'
};

export const MY_PROFILE_ROUTES: Routes = [
    {
        path: myProfileRoutesNames.EMPTY,
        loadComponent: () => import('./my-profile.component').then((c) => c.MyProfileComponent),
        children: [
            {
                path: myProfileRoutesNames.EMPTY,
                loadComponent: () => import('./my-profile-details/my-profile-details.component').then((mod) => mod.MyProfileDetailsComponent),
            },
            {
                path: myProfileRoutesNames.ADD_SYNCLIST,
                loadComponent: () => import('./add-synclist/add-synclist.component').then((mod) => mod.AddSynclistComponent),
            }
        ],
    }
];