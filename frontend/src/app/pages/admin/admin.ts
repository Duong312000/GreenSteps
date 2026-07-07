import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin.html',
})
export class AdminComponent implements OnInit {
  public activeTab: 'providers' | 'deposits' | 'withdrawals' = 'providers';
  public pendingProviders: any[] = [];
  public pendingDeposits: any[] = [];
  public pendingWithdrawals: any[] = [];

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      alert('Bạn không có quyền truy cập trang này!');
      this.router.navigate(['/home']);
      return;
    }

    await this.loadAllData();
  }

  public setActiveTab(tab: 'providers' | 'deposits' | 'withdrawals') {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }

  private async loadAllData() {
    await Promise.all([
      this.loadProviders(),
      this.loadDeposits(),
      this.loadWithdrawals()
    ]);
  }

  public async loadProviders() {
    this.pendingProviders = await this.apiService.getPendingProviders();
    this.cdr.detectChanges();
  }

  public async loadDeposits() {
    this.pendingDeposits = await this.apiService.getPendingDeposits();
    this.cdr.detectChanges();
  }

  public async loadWithdrawals() {
    this.pendingWithdrawals = await this.apiService.getPendingWithdrawals();
    this.cdr.detectChanges();
  }

  // Approvals & Rejections
  public async approveProvider(targetUserId: string) {
    if (!targetUserId) return;
    if (confirm('Bạn có chắc chắn muốn phê duyệt đối tác này và kích hoạt các quyền B2B của họ?')) {
      const success = await this.apiService.approveProvider(targetUserId);
      if (success) {
        alert('Phê duyệt đối tác thành công!');
        await this.loadProviders();
      } else {
        alert('Phê duyệt thất bại. Vui lòng thử lại!');
      }
    }
  }

  public async approveDeposit(txId: string) {
    if (confirm('Xác nhận số tiền nạp đã vào tài khoản ngân hàng và duyệt giao dịch này?')) {
      const success = await this.apiService.approveDeposit(txId);
      if (success) {
        alert('Đã duyệt nạp tiền ví thành công!');
        await this.loadDeposits();
      } else {
        alert('Phê duyệt thất bại!');
      }
    }
  }

  public async rejectDeposit(txId: string) {
    if (confirm('Từ chối giao dịch nạp tiền này?')) {
      const success = await this.apiService.rejectDeposit(txId);
      if (success) {
        alert('Đã từ chối giao dịch nạp tiền ví!');
        await this.loadDeposits();
      } else {
        alert('Thao tác thất bại!');
      }
    }
  }

  public async approveWithdrawal(wdId: string) {
    if (confirm('Xác nhận đối soát rút tiền ví và chuyển tiền về tài khoản ngân hàng đối tác?')) {
      const success = await this.apiService.approveWithdrawal(wdId);
      if (success) {
        alert('Phê duyệt rút tiền thành công!');
        await this.loadWithdrawals();
      } else {
        alert('Phê duyệt thất bại!');
      }
    }
  }

  public async rejectWithdrawal(wdId: string) {
    if (confirm('Từ chối giao dịch rút tiền này?')) {
      const success = await this.apiService.rejectWithdrawal(wdId);
      if (success) {
        alert('Đã từ chối giao dịch rút tiền ví!');
        await this.loadWithdrawals();
      } else {
        alert('Thao tác thất bại!');
      }
    }
  }
}
