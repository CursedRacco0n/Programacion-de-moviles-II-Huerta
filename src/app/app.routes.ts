import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then((m) => m.LoginPageModule),
  },
  {
    path: 'tabs',
    canActivate: [() => import('./services/auth.guard').then((m) => m.authGuard)],
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
