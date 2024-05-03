export const sidenavItems = [
    { icon: 'home', label: 'Home', routerLink: '/home' },
    { icon: 'files', label: 'My Split Sheets' },
    { icon: 'music', label: 'My Tracks', routerLink: '/my-tracks' },
    { icon: 'user', label: 'My Profile', routerLink: '/my-profile' },
    { icon: 'coin', label: 'My Finances' },
    { icon: 'question', label: 'My Support', routerLink: '',
      submenu: [
        { label: 'FAQ & Help', routerLink: '/my-support/faq' },
        { label: 'Customer Success', routerLink: '/my-support/customer-success' }
      ],
      showSubMenu: false
    },
];