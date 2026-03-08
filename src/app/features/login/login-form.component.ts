import { Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { LoginRequest, LoginResponse } from '../../models/auth.model';
import { TokenStorageService } from '../../services/token-storage.service';
import { ErrorMessageComponent } from '../../components/error-message/error-message.component';
import { InputTextComponent } from "@goat-bravos/intern-hub-layout";

@Component({
    selector: 'app-login-form',
    standalone: true,
    imports: [CommonModule, RouterLink, ErrorMessageComponent, InputTextComponent],
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

            if (res.status) {
                this.error.set(res.status.message || 'Sai mật khẩu hoặc tên đăng nhập');
            } else if (res.data) {
                this.tokenService.saveTokens(res.data.accessToken, res.data.refreshToken);
                this.router.navigate(['/general']);
            } else {
                this.error.set('Không nhận được thông tin xác thực');
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
