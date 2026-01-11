import { Injectable, Inject, signal, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { toObservable } from '@angular/core/rxjs-interop';
import { of, Observable } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';

import { HOST_NAME } from '../tokens/host.token';
import { environment } from '../../../environments/environment';
import { BaseResponse } from '../../core/models/base-response';
import { Tenant } from '../../core/models/tenant';

@Injectable({
    providedIn: 'root'
})
export class TenantService {
    // 1. The State (Signal)
    private _tenant = signal<Tenant | null>(null);
    public tenant = this._tenant.asReadonly();

    // 2. The Stream (Observable) - For components preferring RxJS
    public tenant$ = toObservable(this._tenant);

    constructor(
        @Inject(HOST_NAME) private hostName: string,
        @Inject(PLATFORM_ID) private platformId: Object,
        private http: HttpClient
    ) { }

    initializeTenant(): Observable<Tenant | null> {
        const subdomain = this.getSubdomain();

        if (!subdomain) {
            this._tenant.set(null);
            return of(null);
        }

        // 3. CACHE CHECK: Try to load from Storage first (Browser Only)
        if (isPlatformBrowser(this.platformId)) {
            const cachedData = localStorage.getItem(`tenant-${subdomain}`);
            if (cachedData) {
                try {
                    const parsedTenant = JSON.parse(cachedData);
                    this._tenant.set(parsedTenant);
                    // Return immediately with cached data
                    return of(parsedTenant);
                } catch (e) {
                    console.warn('Corrupted tenant data in storage, clearing...');
                    localStorage.removeItem(`tenant-${subdomain}`);
                }
            }
        }

        // 4. NETWORK: Fetch if no cache found
        return this.http.get<BaseResponse<Tenant>>(`${environment.API_BASE_URL}/v1/apps/tenants/${subdomain}`).pipe(
            map(response => response.data), // Extract data
            tap((data) => {
                this._tenant.set(data);
                this.saveToStorage(subdomain, data);
            }),
            catchError((err) => {
                console.error('Failed to load tenant', err);
                this._tenant.set(null);
                return of(null);
            })
        );
    }

    private saveToStorage(subdomain: string, data: Tenant) {
        // Safety check for SSR
        if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem(`tenant-${subdomain}`, JSON.stringify(data));
        }
    }

    private getSubdomain(): string | null {
        if (!this.hostName) return null;

        // Localhost handling
        if (this.hostName.includes('localhost') || this.hostName.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
            const parts = this.hostName.split('.');
            if (parts[0] !== 'localhost' && parts[0] !== 'www') {
                return parts[0];
            }
            return null;
        }

        // Production Domain handling
        const parts = this.hostName.split('.');
        if (parts.length > 2) {
            const subdomain = parts[0];
            if (subdomain !== 'www') {
                return subdomain;
            }
        }
        return null;
    }
}