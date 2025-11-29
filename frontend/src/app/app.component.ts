import { Component, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/layout/header/header.component';
import { FooterComponent } from './components/layout/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  template: `
    <div class="app-shell">
      @if (!isAdmin) {
        <app-header></app-header>
      }
      <main class="app-content">
        <router-outlet></router-outlet>
      </main>
      @if (!isAdmin) {
        <app-footer></app-footer>
      }
    </div>
  `,
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  private router = inject(Router);

  title = 'Elek Design';
  isAdmin = false;

  ngOnInit(): void {
    const setIsAdmin = () =>
      (this.isAdmin = this.router.url.startsWith('/admin'));

    setIsAdmin();

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        setIsAdmin();
      }
    });
  }
}
