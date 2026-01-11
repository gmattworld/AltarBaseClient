import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './infrastructure/shared/navbar/navbar.component';
import { FooterComponent } from './infrastructure/shared/footer/footer.component';
import { TenantService } from './infrastructure/services/tenant.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'phareztech_client';
  tenantService = inject(TenantService);
}
