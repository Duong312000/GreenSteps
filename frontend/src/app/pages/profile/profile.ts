import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { LoginModalService } from '../../services/login-modal.service';
import { User, WalletTransaction } from '../../models/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './profile.html',
  styleUrls: []
})
export class ProfileComponent implements OnInit {
  public currentUser: User | null = null;

  // Wallet info
  public walletRegistered: boolean = false;
  public walletBalance: number = 0;
  public depositAmount: number | null = null;
  public transactions: WalletTransaction[] = [];

  // Edit details form fields
  public isEditing: boolean = false;
  public detFullname: string = '';
  public detPhone: string = '';
  public detEmail: string = '';
  public detDob: string = '';
  public detGender: string = 'Nữ';
  public detAddress: string = '';

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private loginModalService: LoginModalService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.detFullname = user.fullname;
        this.detPhone = user.phone || '';
        this.detEmail = user.email;
        this.detDob = user.dob || '';
        this.detGender = user.gender || 'Nữ';
        this.detAddress = user.address || '';
        
        this.loadWalletAndTransactions();
      } else {
        this.loginModalService.open();
      }
      this.cdr.detectChanges();
    });
  }

  private async loadWalletAndTransactions() {
    if (!this.currentUser) return;
    const userId = this.currentUser.id || this.currentUser._id || '';

    // Load wallet
    const wallet = await this.apiService.getWalletInfo(userId);
    this.walletRegistered = wallet.registered;
    this.walletBalance = wallet.balance;

    // Load transactions
    this.transactions = await this.apiService.getTransactions(userId);
    this.cdr.detectChanges();
  }

  public toggleEditDetails() {
    this.isEditing = !this.isEditing;
  }

  public async saveDetails(event: Event) {
    event.preventDefault();
    if (!this.currentUser) return;
    const userId = this.currentUser.id || this.currentUser._id || '';

    const updateData = {
      fullname: this.detFullname,
      phone: this.detPhone,
      email: this.detEmail,
      dob: this.detDob,
      gender: this.detGender,
      address: this.detAddress
    };

    const res = await this.authService.updateProfile(userId, updateData);
    if (res.success) {
      this.isEditing = false;
      alert("Lưu thông tin thành công!");
    } else {
      alert(res.message || "Cập nhật thất bại!");
    }
    this.cdr.detectChanges();
  }

  public async handleWalletActivation() {
    if (!this.currentUser) return;
    const userId = this.currentUser.id || this.currentUser._id || '';

    const res = await this.apiService.activateWallet(userId);
    if (res.success) {
      alert("Kích hoạt ví thành công! Bạn nhận được quà tặng chào mừng 5.000.000đ.");
      this.loadWalletAndTransactions();
    } else {
      alert("Kích hoạt ví thất bại. Vui lòng thử lại!");
    }
  }

  public async handleDeposit() {
    if (!this.currentUser) return;
    const userId = this.currentUser.id || this.currentUser._id || '';

    if (!this.depositAmount || this.depositAmount < 20000) {
      alert("Vui lòng nhập số tiền nạp tối thiểu là 20.000đ!");
      return;
    }

    const res = await this.apiService.depositMoney(userId, this.depositAmount);
    if (res.success) {
      alert("Nạp tiền thành công!");
      this.depositAmount = null;
      this.loadWalletAndTransactions();
    } else {
      alert("Nạp tiền thất bại. Vui lòng thử lại!");
    }
  }

  public async handleRoleToggle() {
    if (!this.currentUser) return;
    const userId = this.currentUser.id || this.currentUser._id || '';

    const newRole = await this.authService.toggleRole(userId);
    alert(`Đã chuyển đổi vai trò thành công! Vai trò hiện tại: ${newRole === 'provider' ? 'Nhà cung cấp' : 'Khách du lịch'}`);
    
    if (newRole === 'provider') {
      this.router.navigate(['/partner-dashboard']);
    } else {
      this.router.navigate(['/']);
    }
  }

  public handleLogout() {
    this.authService.logout();
    alert("Đã đăng xuất tài khoản!");
    this.router.navigate(['/']);
  }

  public resetProjectState() {
    if (confirm("Bạn có chắc chắn muốn thiết lập lại toàn bộ dữ liệu dự án về trạng thái mặc định không?")) {
      localStorage.clear();
      this.authService.logout();
      window.location.href = "/";
    }
  }

  public getFirstLetter(name: string): string {
    return name ? name.charAt(0).toUpperCase() : 'U';
  }
}
