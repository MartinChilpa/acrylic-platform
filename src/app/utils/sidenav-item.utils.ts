export const sidenavItems = [
  { icon: 'home', label: 'Home', routerLink: '/home' },
  { icon: 'files', label: 'My Split Sheets', routerLink: '/my-split-sheets' },
  { icon: 'music', label: 'My Tracks', routerLink: '/my-tracks' },
  { icon: 'user', label: 'My Profile', routerLink: '/my-profile' },
  {
    icon: 'coin', label: 'My Finances', routerLink: '/my-finances', submenu:
      [
        { label: 'My Revenue', routerLink: '/my-finances/my-revenue' },
        { label: 'My Transactions', routerLink: '/my-finances/my-transactions' },
        { label: 'My Subscription', routerLink: '/my-finances/my-subscription' },
        { label: 'My Documents', routerLink: '/my-finances/my-document' }
      ]
  },
  {
    icon: 'question', label: 'My Support', routerLink: '/my-support',
    submenu: [
      { label: 'FAQ & Help', routerLink: '/my-support/faq' },
      { label: 'Customer Success', routerLink: '/my-support/customer-success' }
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