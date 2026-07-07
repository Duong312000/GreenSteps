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
})
export class ProfileComponent implements OnInit {
  public currentUser: User | null = null;

  // Wallet info
  public walletRegistered: boolean = false;
  public walletBalance: number = 0;
  public depositAmount: number | null = null;
  public transactions: WalletTransaction[] = [];

  // QR Modal info
  public isQrModalOpen: boolean = false;
  public qrCodeUrl: string = '';
  public qrAmount: number = 0;
  public qrDescription: string = '';

  // Edit details form fields
  public isEditing: boolean = false;
  public detFullname: string = '';
  public detPhone: string = '';
  public detEmail: string = '';
  public detDob: string = '';
  public detGender: string = 'Nữ';
  public detAddress: string = '';
  public companyName: string = '';
  public isRegisteringProvider: boolean = false;

  // Terminal Approval Modal State
  public terminalApprovalState: 'pending' | 'success' | 'error' = 'pending';
  public terminalApprovalTitle: string = 'Đang Chờ Phê Duyệt';
  public terminalApprovalMsg: string = '';
  public isTerminalModalOpen: boolean = false;

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
        this.companyName = user.companyName || '';
        this.isRegisteringProvider = (user.role === 'provider');
        
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

    this.terminalApprovalState = 'pending';
    this.terminalApprovalTitle = 'Đang Chờ Phê Duyệt';
    this.terminalApprovalMsg = 'Yêu cầu kích hoạt Ví du lịch đang chờ Quản trị viên duyệt trên Terminal máy chủ.';
    this.isTerminalModalOpen = true;
    this.cdr.detectChanges();

    try {
      const res = await this.apiService.activateWallet(userId);
      if (res.success) {
        this.terminalApprovalState = 'success';
        this.terminalApprovalTitle = 'Kích Hoạt Thành Công';
        this.terminalApprovalMsg = 'Ví du lịch của bạn đã được kích hoạt thành công! Bạn nhận được quà tặng 200.000đ.';
        this.loadWalletAndTransactions();
      } else {
        this.terminalApprovalState = 'error';
        this.terminalApprovalTitle = 'Kích Hoạt Thất Bại';
        this.terminalApprovalMsg = res.message || 'Yêu cầu kích hoạt ví bị từ chối hoặc thất bại.';
      }
    } catch (err) {
      this.terminalApprovalState = 'error';
      this.terminalApprovalTitle = 'Kích Hoạt Thất Bại';
      this.terminalApprovalMsg = 'Yêu cầu bị từ chối hoặc có lỗi xảy ra.';
    }
    this.cdr.detectChanges();
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
      // Extract transaction ID from message or default
      const txIdMatch = res.message ? res.message.match(/#GD-\d+/) : null;
      const txId = txIdMatch ? txIdMatch[0].replace('#', '') : 'GD-' + Date.now().toString().slice(-10);

      this.qrAmount = this.depositAmount;
      this.qrDescription = `GS DEP ${txId}`;
      this.qrCodeUrl = `https://img.vietqr.io/image/OCB-0392851304-compact.png?amount=${this.qrAmount}&addInfo=${encodeURIComponent(this.qrDescription)}&accountName=KIEU%20HOANG%20DUONG`;
      this.isQrModalOpen = true;

      this.depositAmount = null;
      this.loadWalletAndTransactions();
    } else {
      alert("Nạp tiền thất bại. Vui lòng thử lại!");
    }
  }

  public closeQrModal() {
    this.isQrModalOpen = false;
    this.loadWalletAndTransactions();
  }



  public handleLogout() {
    this.authService.logout();
    alert("Đã đăng xuất tài khoản!");
    this.router.navigate(['/']);
  }

  public getFirstLetter(name: string): string {
    return name ? name.charAt(0).toUpperCase() : 'U';
  }
}
