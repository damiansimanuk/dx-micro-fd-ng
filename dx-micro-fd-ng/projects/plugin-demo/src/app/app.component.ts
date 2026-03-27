// projects/plugin-demo/src/app/app.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1>Hola desde el Plugin Demo</h1>
    <p>Este es un componente cargado dinámicamente.</p>
  `,
  styles: [
    `
      h1 {
        color: #3f51b5;
      }
    `,
  ],
})
export class AppComponent {
  // Aquí puedes inyectar el AuthService común luego
  constructor() {
    console.log('Plugin Demo cargado correctamente');
  }
}
