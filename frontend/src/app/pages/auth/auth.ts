import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './auth.html',
  styleUrls: []
})
export class AuthComponent {
  public activeTab: 'login' | 'register' = 'login';

  // Login parameters
  public loginUsername = '';
  public loginPassword = '';

  // Register parameters
  public regFullname = '';
  public regEmail = '';
  public regPhone = '';
  public regPassword = '';
  public agreeTerms = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  public switchTab(tab: 'login' | 'register') {
    this.activeTab = tab;
  }

  public alertForgotPassword() {
    alert('Hệ thống đã gửi liên kết đặt lại mật khẩu đến email của bạn. Vui lòng kiểm tra hòm thư.');
  }

  public async onLoginSubmit(event: Event) {
    event.preventDefault();
    if (!this.loginUsername || !this.loginPassword) return;

    const res = await this.authService.login(this.loginUsername, this.loginPassword);
    if (res.success && res.user) {
      alert(`Chào mừng trở lại, ${res.user.fullname}!`);
      this.router.navigate(['/profile']);
    } else {
      alert(res.message || 'Đăng nhập thất bại!');
    }
  }

  public async onRegisterSubmit(event: Event) {
    event.preventDefault();
    if (!this.agreeTerms) {
      alert('Bạn phải đồng ý với Điều khoản sử dụng của GreenSteps!');
      return;
    }

    const username = this.regEmail.split('@')[0]; // auto-generate username from email
    const regData = {
      username: username,
      password: this.regPassword,
      fullname: this.regFullname,
      email: this.regEmail,
      phone: this.regPhone,
      role: 'traveler' // default role
    };

    const res = await this.authService.register(regData);
    if (res.success && res.user) {
      alert('Đăng ký tài khoản thành công!');
      this.router.navigate(['/profile']);
    } else {
      alert(res.message || 'Đăng ký thất bại!');
    }
  }

  public alertGoogle() {
    alert('Hệ thống đang tích hợp Google OAuth. Vui lòng sử dụng tài khoản traveler/partner demo!');
  }
}
