// CORRECTED src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/layout/header/header.component';
import { FooterComponent } from './components/layout/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  template: `
    <app-header></app-header>
    <router-outlet></router-outlet>
    <app-footer></app-footer>
  `,
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'Elek Design';

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) {
        const hash =
          typeof window !== 'undefined' ? (window as any).location?.hash : '';
        if (hash) {
          // allow router to scroll first
          setTimeout(() => {
            try {
              window.scrollBy({
                top: -80,
                behavior: 'instant' as ScrollBehavior,
              });
            } catch {
              window.scrollBy(0, -80);
            }
          }, 0);
        }
      }
    });
  }
}
