export const sidenavItems = [
  { icon: 'home', label: 'Home', routerLink: '/artist/home' },
  { icon: 'files', label: 'My Split Sheets', routerLink: '/artist/my-split-sheets' },
  { icon: 'music', label: 'My Tracks', routerLink: '/artist/my-tracks' },
  { icon: 'user', label: 'My Profile', routerLink: '/artist/my-profile' },
  {
    icon: 'coin', label: 'My Finances', routerLink: '/my-finances', submenu:
      [
        { label: 'My Revenue', routerLink: '/artist/my-finances/my-revenue' },
        { label: 'My Transactions', routerLink: '/artist/my-finances/my-transactions' },
        { label: 'My Subscription', routerLink: '/artist/my-finances/my-subscription' },
        { label: 'My Documents', routerLink: '/artist/my-finances/my-document' }
      ]
  },
  {
    icon: 'question', label: 'My Support', routerLink: '/my-support',
    submenu: [
      { label: 'FAQ & Help', routerLink: '/artist/my-support/faq' },
      { label: 'Customer Success', routerLink: '/artist/my-support/customer-success' }
    ],
    showSubMenu: false
  },
];

export const publicSidenavItems = [
  {
    icon: 'question', label: 'My Support', routerLink: '/my-support',
    submenu: [
      { label: 'FAQ & Help', routerLink: '/my-support/faq' },
      { label: 'Customer Success', routerLink: '/my-support/customer-success' }
    ],
    showSubMenu: false
  },
]