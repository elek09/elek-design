import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { HeaderConfig } from '../../../models/header.model';
import { HeaderService } from '../../../services/header.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  isMenuOpen = false;
  headerConfig$!: Observable<HeaderConfig>;

  constructor(private headerService: HeaderService) {
    this.headerConfig$ = this.headerService.getHeaderConfig();
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
}