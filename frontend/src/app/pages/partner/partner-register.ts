import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { LoginModalService } from '../../services/login-modal.service';
import { User } from '../../models/models';

@Component({
  selector: 'app-partner-register',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './partner-register.html',
})
export class PartnerRegisterComponent implements OnInit {
  public currentUser: User | null = null;

  // Form parameters
  public companyName: string = '';
  public bizEmail: string = '';
  public bizPhone: string = '';
  public bizLicense: string = '';
  public bizCategory: string = 'stay';
  public bizDesc: string = '';
  public agreeTerms: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private loginModalService: LoginModalService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user && user.role === 'provider') {
        this.router.navigate(['/partner-dashboard']);
      }
    });
  }

  public async registerPartner(event: Event) {
    event.preventDefault();
    if (!this.agreeTerms) {
      alert('Bạn phải đồng ý với Điều khoản Hợp tác của GreenSteps!');
      return;
    }

    if (!this.currentUser) {
      alert('Vui lòng đăng nhập trước khi đăng ký làm đối tác!');
      this.loginModalService.open();
      return;
    }

    const userId = this.currentUser.id || this.currentUser._id || '';

    const updateData = {
      role: 'provider',
      company_name: this.companyName,
      companyName: this.companyName,
      email: this.bizEmail || this.currentUser.email,
      phone: this.bizPhone || this.currentUser.phone
    };

    const res = await this.authService.updateProfile(userId, updateData);
    if (res.success) {
      alert('Đăng ký Kênh nhà cung cấp đối tác thành công! Hệ thống đã kích hoạt phân hệ Quản lý dịch vụ.');
      this.router.navigate(['/partner-dashboard']);
    } else {
      alert(res.message || 'Đăng ký đối tác thất bại. Vui lòng thử lại!');
    }
  }
}
