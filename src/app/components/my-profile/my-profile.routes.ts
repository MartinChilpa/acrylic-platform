import { Routes } from '@angular/router';

export const myProfileRoutesNames = {
    EMPTY: '',
    ADD_SYNCLIST: 'add-synclist',
    EDIT_SYNCLIST: 'edit-synclist/:synclistId',
    EDIT_PROFILE: 'edit-profile',
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
                loadComponent: () => import('./manage-synclist/manage-synclist.component').then((mod) => mod.ManageSynclistComponent),
            },
            {
                path: myProfileRoutesNames.EDIT_SYNCLIST,
                loadComponent: () => import('./manage-synclist/manage-synclist.component').then((mod) => mod.ManageSynclistComponent),
            },
            {
                path: myProfileRoutesNames.EDIT_PROFILE,
                loadComponent: () => import('./edit-profile/edit-profile.component').then((mod) => mod.EditProfileComponent),
            },
        ],
    }
];