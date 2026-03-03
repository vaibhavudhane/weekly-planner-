import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './components/navbar/navbar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navbar],
  template: `
    <app-navbar />
    <main class="main-content">
      <router-outlet />
    </main>
  `,
  styles: [
    `
      .main-content {
        padding: 20px;
        max-width: 1200px;
        margin: 0 auto;
      }
    `,
  ],
})
export class App {
  title = 'weekly-planner-ui';
}
