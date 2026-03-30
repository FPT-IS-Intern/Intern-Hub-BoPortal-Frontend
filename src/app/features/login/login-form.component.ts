import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

import { AuthService } from '@/services/api/auth.service';
import { LoginRequest } from '@/models/auth.model';
import { TokenStorageService } from '@/services/common/token-storage.service';
import { ErrorMessageComponent } from '@/components/error-message/error-message.component';
import { SharedInputTextComponent } from '@/components/shared-input-text/shared-input-text.component';
import { ErrorMessageService } from '@/i18n/error-message.service';

@Component({
    selector: 'app-login-form',
    standalone: true,
    imports: [CommonModule, TranslateModule, ErrorMessageComponent, SharedInputTextComponent],
    templateUrl: './login-form.component.html',
    styleUrls: ['./login-form.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginFormComponent {
    private readonly authService = inject(AuthService);
    private readonly tokenService = inject(TokenStorageService);
    private readonly router = inject(Router);
    private readonly errorMessageService = inject(ErrorMessageService);

    username = signal('');
    password = signal('');
    error = signal<string | null>(null);
    isLoading = signal(false);
    showPassword = signal(false);

    checkInputRequired = computed(() => this.username().trim() === '' || this.password().trim() === '');

    async handleSubmit(): Promise<void> {
        if (this.checkInputRequired()) return;

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
                console.log('Login successful. Navigate directly to main layout.');
                this.router.navigate(['/main']);
            } else {
                this.error.set(this.errorMessageService.resolve(res.status?.code));
            }
        } catch (err) {
            this.error.set(this.resolveHttpError(err));
        } finally {
            this.isLoading.set(false);
        }
    }

    togglePassword(): void {
        this.showPassword.update((v: boolean) => !v);
    }

    private resolveHttpError(err: unknown): string {
        if (err instanceof HttpErrorResponse) {
            const errorPayload = err.error as { status?: { code?: string } } | null;
            const businessCode = errorPayload?.status?.code;
            const resolvedCode = businessCode ?? fallbackCodeFromHttpStatus(err.status);
            return this.errorMessageService.resolve(resolvedCode);
        }

        return this.errorMessageService.resolve();
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
