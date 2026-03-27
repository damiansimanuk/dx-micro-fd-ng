import { Routes } from '@angular/router';
import { DemoEchart } from './demo.echart';
import { AppComponent } from './app.component';

export const routes: Routes = [
  {
    path: 'demo',
    component: AppComponent,
  },
  {
    path: 'echarts',
    component: DemoEchart,
  },
];
