import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { BaseResponse, BaseTokenResponse } from '../../core/models/base-response';
import { LocalStorageService } from './local-storage.service';
import { User } from '../../core/models/user';
import { Tenant } from '../../core/models/tenant';
import { MemberProfile } from '../../core/models/member-profile.model';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly apiBaseUrl = environment.API_BASE_URL;
    private readonly storageKey = 'DCFB0D51FB4A4D33BE666F1E0230A0B3';

    private readonly currentUserSubject: BehaviorSubject<BaseTokenResponse | null>;
    public readonly currentUser$: Observable<BaseTokenResponse | null>;

    constructor(
        private readonly http: HttpClient,
        private readonly localStorageService: LocalStorageService,
        private readonly router: Router
    ) {
        const storedAuth = this.localStorageService.getItem(this.storageKey);
        this.currentUserSubject = new BehaviorSubject<BaseTokenResponse | null>(
            storedAuth ? JSON.parse(storedAuth) : null
        );
        this.currentUser$ = this.currentUserSubject.asObservable();

        this.checkAuthState();
    }

    public get currentUserValue(): BaseTokenResponse | null {
        return this.currentUserSubject.value;
    }

    private checkAuthState(): void {
        if (typeof window !== 'undefined') {
            const token = this.localStorageService.getItem(this.storageKey);
            if (!token) {
                this.currentUserSubject.next(null);
            }
        }
    }

    login(email: string, password: string): Observable<BaseTokenResponse> {

        return this.http
            .post<BaseTokenResponse>(`${this.apiBaseUrl}/v1/core/login`, {
                email: email,
                password: password,
                // public_key: environment.TENANT_PUBLIC_KEY
            })
            .pipe(
                map((response) => {
                    if (response.success) {
                        this.updateUserState(response);
                    }
                    return response;
                }),
                catchError((error) => this.handleError(error))
            );
    }

    public updateUserState(response: BaseTokenResponse): void {
        this.localStorageService.clear();
        this.localStorageService.setItem(this.storageKey, JSON.stringify(response));
        this.currentUserSubject.next(response);
    }

    refreshToken(): Observable<BaseTokenResponse> {
        const currentUser = this.currentUserValue;
        if (!currentUser?.refresh_token) {
            return throwError(() => new Error('No refresh token available'));
        }

        return this.http
            .post<BaseTokenResponse>(`${this.apiBaseUrl}/v1/auth/refresh`, {
                refresh_token: currentUser.refresh_token,
            })
            .pipe(
                map((response) => {
                    if (response.success) {
                        this.updateUserState(response);
                    }
                    return response;
                }),
                catchError((error) => this.handleError(error))
            );
    }

    register(
        firstName: string,
        lastName: string,
        email: string,
        password: string
    ): Observable<BaseTokenResponse> {
        return this.http
            .post<BaseTokenResponse>(`${this.apiBaseUrl}/v1/core/register`, {
                first_name: firstName,
                last_name: lastName,
                email: email,
                password: password,
                // public_key: environment.TENANT_PUBLIC_KEY
            })
            .pipe(
                map((response) => {
                    if (response.success) {
                        this.updateUserState(response);
                    }
                    return response;
                })
            );
    }

    initiatePasswordReset(email: string): Observable<BaseTokenResponse> {
        return this.http
            .post<BaseTokenResponse>(`${this.apiBaseUrl}/v1/auth/initiate-password-reset`, {
                email,
            })
            .pipe(catchError((error) => this.handleError(error)));
    }

    verifyPasswordReset(email: string, otp: string): Observable<BaseTokenResponse> {
        return this.http
            .post<BaseTokenResponse>(`${this.apiBaseUrl}/v1/auth/verify-password-reset`, {
                email,
                otp,
            })
            .pipe(
                map((response) => {
                    if (response.success) {
                        this.updateUserState(response);
                    }
                    return response;
                }),
                catchError((error) => this.handleError(error))
            );
    }

    resetPassword(newPassword: string): Observable<BaseTokenResponse> {
        const email = this.currentUserValue?.user.email;
        if (!email) {
            return throwError(() => new Error('No authenticated user found'));
        }

        return this.http
            .post<BaseTokenResponse>(`${this.apiBaseUrl}/v1/auth/reset-password`, {
                new_password: newPassword,
                email,
            })
            .pipe(
                map((response) => {
                    if (response.success) {
                        this.updateUserState(response);
                    }
                    return response;
                }),
                catchError((error) => this.handleError(error))
            );
    }

    changePassword(
        currentPassword: string,
        newPassword: string
    ): Observable<BaseTokenResponse> {
        return this.http
            .post<BaseTokenResponse>(`${this.apiBaseUrl}/v1/auth/change-password`, {
                current_password: currentPassword,
                new_password: newPassword,
            })
            .pipe(catchError((error) => this.handleError(error)));
    }

    verify(code: string): Observable<BaseTokenResponse> {
        return this.http
            .post<BaseTokenResponse>(`${this.apiBaseUrl}/v1/auth/verify`, {
                code: code.toString()
            })
            .pipe(
                map((response) => {
                    if (response.success) {
                        this.updateUserState(response);
                    }
                    return response;
                })
            );
    }

    verifyPreferenceConfig(): Observable<BaseTokenResponse> {
        const email = this.currentUserValue?.user.email;
        if (!email) {
            return throwError(() => new Error('No authenticated user found'));
        }

        return this.http
            .put<BaseTokenResponse>(`${this.apiBaseUrl}/v1/auth/verify_preference_config`, {
                email,
            })
            .pipe(
                map((response) => {
                    if (response.success) {
                        this.updateUserState(response);
                    }
                    return response;
                }),
                catchError((error) => this.handleError(error))
            );
    }

    resendEmailVerificationCode(): Observable<BaseTokenResponse> {
        const publicKey = this.localStorageService.getItem(
            'registration_public_key'
        );
        if (!publicKey) {
            return throwError(() => new Error('No registration public key found'));
        }

        return this.http
            .post<BaseTokenResponse>(`${this.apiBaseUrl}/v1/auth/resend-email-verification`, {
                public_key: publicKey,
            })
            .pipe(catchError((error) => this.handleError(error)));
    }

    getMemberProfile(): Observable<BaseResponse<MemberProfile>> {
        return this.http.get<BaseResponse<MemberProfile>>(`${this.apiBaseUrl}/v1/core/profile`);
    }

    logout(): void {
        this.localStorageService.removeItem(this.storageKey);
        this.localStorageService.removeItem('user');
        this.localStorageService.removeItem('token');
        this.currentUserSubject.next(null);
        this.router.navigate(['/auth/login']);
    }

    isAuthenticated(): boolean {
        return !!this.currentUserValue;
    }

    getCurrentUser(): User | null {
        return this.currentUserValue?.user ?? null;
    }

    getCurrentTenant(): Tenant | null {
        return this.currentUserValue?.tenant ?? null;
    }

    // updateCurrentUser(user: User): void {
    //   const currentUser = this.currentUserValue;
    //   if (currentUser) {
    //     currentUser.user = user;
    //     this.updateUserState(currentUser);
    //   }
    // }

    private handleError(error: any): Observable<never> {
        let errorMessage = 'An error occurred';
        if (error.error instanceof ErrorEvent) {
            // Client-side error
            errorMessage = error.error.message;
        } else {
            // Server-side error
            errorMessage = error.error?.message || error.message || errorMessage;
        }
        return throwError(() => new Error(errorMessage));
    }
}
