import { Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { LoginRequest, LoginResponse } from '../../models/auth.model';
import { TokenStorageService } from '../../services/token-storage.service';
import { ErrorMessageComponent } from '../../components/error-message/error-message.component';
import { SharedInputTextComponent } from '../../components/shared-input-text/shared-input-text.component';

@Component({
    selector: 'app-login-form',
    standalone: true,
    imports: [CommonModule, RouterLink, ErrorMessageComponent, SharedInputTextComponent],
    templateUrl: './login-form.component.html',
    styleUrls: ['./login-form.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginFormComponent {
    private authService = inject(AuthService);
    private tokenService = inject(TokenStorageService);
    private router = inject(Router);

    // State quản lý bằng signals
    username = signal('');
    password = signal('');
    error = signal<string | null>(null);
    isLoading = signal(false);
    showPassword = signal(false);

    // Logic kiểm tra nút bấm
    checkInputRequired = computed(() => this.username().trim() === '' || this.password().trim() === '');

    async handleSubmit() {
        if (this.checkInputRequired()) return;

        this.error.set(null);
        this.isLoading.set(true);

        try {
            const res = await firstValueFrom(this.authService.login({
                username: this.username(),
                password: this.password()
            }));

            if (res.data && res.status?.code === '200') {
                this.tokenService.saveTokens(res.data.accessToken, res.data.refreshToken);
                this.router.navigate(['/general']);
            } else if (res.status?.message) {
                this.error.set(res.status.message);
            } else {
                this.error.set('Sai mật khẩu hoặc tên đăng nhập');
            }
        } catch (err) {
            this.error.set('Lỗi kết nối server');
        } finally {
            this.isLoading.set(false);
        }
    }

    togglePassword() {
        this.showPassword.update((v: boolean) => !v);
    }
}
