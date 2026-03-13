import { Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../models/auth.model';
import { TokenStorageService } from '../../services/token-storage.service';
import { ErrorMessageComponent } from '../../components/error-message/error-message.component';
import { SharedInputTextComponent } from '../../components/shared-input-text/shared-input-text.component';
import { resolveApiErrorMessage, resolveBusinessMessage } from '../../core/errors/api-error-message.util';

@Component({
    selector: 'app-login-form',
    standalone: true,
    imports: [CommonModule, ErrorMessageComponent, SharedInputTextComponent],
    templateUrl: './login-form.component.html',
    styleUrls: ['./login-form.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginFormComponent {
    private authService = inject(AuthService);
    private tokenService = inject(TokenStorageService);
    private router = inject(Router);

    username = signal('');
    password = signal('');
    error = signal<string | null>(null);
    isLoading = signal(false);
    showPassword = signal(false);

    checkInputRequired = computed(() => this.username().trim() === '' || this.password().trim() === '');

    async handleSubmit() {
        if (this.checkInputRequired()) {
            this.error.set('Vui lòng nhập Tên đăng nhập và Mật khẩu.');
            return;
        }

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
                this.router.navigate(['/general']);
            } else {
                this.error.set(resolveBusinessMessage(res.status?.code, res.status?.message));
            }
        } catch (err) {
            this.error.set(resolveApiErrorMessage(err));
        } finally {
            this.isLoading.set(false);
        }
    }

    togglePassword() {
        this.showPassword.update((v: boolean) => !v);
    }
}
