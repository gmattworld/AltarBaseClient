import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';
import { JWTInterceptor } from './infrastructure/interceptors/jwt.interceptor';
import { ErrorInterceptor } from './infrastructure/interceptors/error.interceptor';
import { HOST_NAME } from './infrastructure/tokens/host.token';
import { TenantService } from './infrastructure/services/tenant.service';
import { tenantInterceptor } from './infrastructure/interceptors/tenant.interceptor';
import { Observable } from 'rxjs';

function initializeApp(tenantService: TenantService): () => Observable<any> {
  return () => tenantService.initializeTenant();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding(), withInMemoryScrolling({
      scrollPositionRestoration: "top",
      anchorScrolling: "enabled"
    })),
    provideHttpClient(
      withFetch(),
      withInterceptors([tenantInterceptor, JWTInterceptor, ErrorInterceptor])
    ),
    provideAnimations(),
    provideToastr({
      timeOut: 5000,
      positionClass: 'toast-top-right',
      preventDuplicates: false,
      closeButton: true,
      progressBar: true,
    }),
    provideClientHydration(withEventReplay()),
    importProvidersFrom(FormsModule),
    provideAnimationsAsync(),
    {
      provide: HOST_NAME,
      useFactory: () => window.location.hostname
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [TenantService],
      multi: true
    }
  ]
};
