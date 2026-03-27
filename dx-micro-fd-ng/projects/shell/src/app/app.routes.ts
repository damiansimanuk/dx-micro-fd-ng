import { Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';

export const routes: Routes = [
  {
    path: 'app',
    loadComponent: () => loadRemoteModule('plugin-demo', './App').then((m) => m.App),
  },
  {
    path: 'routes',
    loadChildren: () => loadRemoteModule('plugin-demo', './Routes').then((m) => m.routes),
  },
];
