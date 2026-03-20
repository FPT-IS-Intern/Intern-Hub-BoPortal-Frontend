import { Component, signal, computed, inject, ChangeDetectionStrategy, AfterViewInit, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';

import { AuthService } from '../../services/api/auth.service';
import { LoginRequest } from '../../models/auth.model';
import { TokenStorageService } from '../../services/common/token-storage.service';
import { ErrorMessageComponent } from '../../components/error-message/error-message.component';
import { SharedInputTextComponent } from '../../components/shared-input-text/shared-input-text.component';
import { ErrorMessageService } from '../../i18n/error-message.service';

@Component({
    selector: 'app-login-form',
    standalone: true,
    imports: [CommonModule, TranslateModule, ErrorMessageComponent, SharedInputTextComponent],
    templateUrl: './login-form.component.html',
    styleUrls: ['./login-form.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginFormComponent implements AfterViewInit {
    private authService = inject(AuthService);
    private tokenService = inject(TokenStorageService);
    private router = inject(Router);
    private errorMessageService = inject(ErrorMessageService);
    private hostEl = inject<ElementRef<HTMLElement>>(ElementRef);

    username = signal('');
    password = signal('');
    error = signal<string | null>(null);
    isLoading = signal(false);

    showPassword = signal(false);

    checkInputRequired = computed(() => this.username().trim() === '' || this.password().trim() === '');

    ngAfterViewInit(): void {
        this.logDisabledState('afterViewInit');
        setTimeout(() => this.logDisabledState('afterViewInit+0'), 0);
        setTimeout(() => this.logDisabledState('afterViewInit+300'), 300);
        setTimeout(() => this.logDisabledState('afterViewInit+1000'), 1000);
    }

    @HostListener('window:pageshow')
    onPageShow(): void {
        this.logDisabledState('pageshow');
        setTimeout(() => this.logDisabledState('pageshow+300'), 300);
    }

    async handleSubmit() {
        if (this.checkInputRequired() || this.isLoading()) return;

        this.error.set(null);
        this.isLoading.set(true);

        try {
            const request: LoginRequest = {
                username: this.username(),
                password: this.password(),
            };
            const res = await firstValueFrom(this.authService.login(request));

            if (res.data && (res.status?.code === '200' || res.status?.code === '0000')) {
                console.log('Login successful. Saving tokens...');
                this.tokenService.saveTokens(res.data.accessToken, res.data.refreshToken);

                if (res.data.user) {
                    this.authService.userProfile.set(res.data.user);
                }

                // Skip /me and general-config calls on login success as requested
                console.log('Login successful. Navigate directly to first sidebar item.');
                this.router.navigate(['/users']);
            } else {
                this.error.set(this.errorMessageService.resolve(res.status?.code));
            }
        } catch (err) {
            console.error('Login request failed before completion:', err);
            this.error.set(this.resolveHttpError(err));
        } finally {
            this.isLoading.set(false);
        }
    }


    togglePassword() {
        this.showPassword.update((v: boolean) => !v);
    }

    private resolveHttpError(err: unknown): string {
        if (err instanceof HttpErrorResponse) {
            const businessCode = (err.error as any)?.status?.code as string | undefined;
            const resolvedCode = businessCode ?? fallbackCodeFromHttpStatus(err.status);
            return this.errorMessageService.resolve(resolvedCode);
        }

        return this.errorMessageService.resolve();
    }

    private logDisabledState(source: string): void {
        const inputs = this.hostEl.nativeElement.querySelectorAll('input');
        const usernameValue = inputs[0]?.value ?? '';
        const passwordValue = inputs[1]?.value ?? '';
        console.log(`[login] ${source}`, {
            usernameSignal: this.username(),
            passwordSignal: this.password() ? '***' : '',
            usernameInput: usernameValue,
            passwordInput: passwordValue ? '***' : '',
            checkInputRequired: this.checkInputRequired(),
        });
    }
}

function fallbackCodeFromHttpStatus(status: number): string | undefined {
    if (!status) {
        return undefined;
    }
    if (status >= 500) {
        return '0500';
    }
    if (status === 404) {
        return '0404';
    }
    if (status === 408) {
        return '0408';
    }
    if (status >= 400) {
        return '0400';
    }
    return undefined;
}
