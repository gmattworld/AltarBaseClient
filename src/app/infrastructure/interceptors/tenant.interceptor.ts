import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { switchMap, take } from 'rxjs/operators';
import { EMPTY } from 'rxjs'; // Used to cancel the request
import { TenantService } from '../services/tenant.service';

export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
    const tenantService = inject(TenantService);
    const document = inject(DOCUMENT);

    // 1. CRITICAL: Bypass the request that loads the tenant
    // If we don't do this, the app will wait for the tenant to load,
    // but the request to load the tenant will be blocked by this interceptor,
    // creating a deadlock.
    if (req.url.includes('/apps/tenants/')) {
        return next(req);
    }

    // 2. Subscribe to the Observable stream
    return tenantService.tenant$.pipe(
        // We only need the current value, we don't want to listen forever
        take(1),
        switchMap(tenant => {
            if (tenant) {
                // HAPPY PATH: Tenant found, clone and attach header
                const cloned = req.clone({
                    setHeaders: {
                        'X-Tenant-ID': tenant.id,
                        Authorization: `Bearer ${tenant.tenantKey}`
                    }
                });
                return next(cloned);
            } else {
                // SAD PATH: No tenant found

                // Only redirect if we are in the browser
                if (document.defaultView) {
                    console.warn('Redirecting: No tenant context found for request', req.url);
                    document.defaultView.location.href = 'https://altarbaseos.com';
                }

                // Return EMPTY to cancel the HTTP request immediately
                // This prevents 401/404 errors from appearing in the console
                return EMPTY;
            }
        })
    );
};