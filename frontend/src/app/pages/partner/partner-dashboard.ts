import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { User, Booking } from '../../models/models';

@Component({
  selector: 'app-partner-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './partner-dashboard.html',
  styleUrls: []
})
export class PartnerDashboardComponent implements OnInit {
  public currentUser: User | null = null;
  public bookings: Booking[] = [];

  // Provider stats
  public bookingsCount: number = 0;
  public totalRevenue: number = 0;
  public carbonSaved: number = 0;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (!user || user.role !== 'provider') {
        this.router.navigate(['/auth']);
      } else {
        this.loadDashboardData();
      }
      this.cdr.detectChanges();
    });
  }

  private async loadDashboardData() {
    if (!this.currentUser) return;
    const providerId = this.currentUser.id || this.currentUser._id || '';

    // Load bookings
    this.bookings = await this.apiService.getBookings(providerId);

    // Calculate stats
    this.bookingsCount = this.bookings.length;
    
    // Revenue from completed or deposited bookings
    this.totalRevenue = this.bookings
      .filter(b => b.status === 'completed' || b.status === 'deposit' || b.status === 'pending')
      .reduce((sum, b) => sum + b.value, 0);

    // Carbon saved (mock calculation: 5.5 kg saved per booking guest)
    this.carbonSaved = this.bookings
      .filter(b => b.status === 'completed' || b.status === 'deposit')
      .reduce((sum, b) => sum + (b.guests * 5.5), 0);
    
    this.cdr.detectChanges();
  }

  public async approveBooking(id: string) {
    if (confirm('Bạn có chắc chắn muốn phê duyệt đặt cọc đơn hàng này?')) {
      const success = await this.apiService.approveBooking(id);
      if (success) {
        alert('Phê duyệt đặt cọc thành công!');
        await this.loadDashboardData();
      } else {
        alert('Có lỗi xảy ra khi phê duyệt đơn hàng.');
      }
      this.cdr.detectChanges();
    }
  }

  public async rejectBooking(id: string) {
    if (confirm('Bạn có chắc chắn muốn hủy/từ chối đơn hàng này?')) {
      const success = await this.apiService.rejectBooking(id);
      if (success) {
        alert('Đã từ chối đơn hàng thành công!');
        await this.loadDashboardData();
      } else {
        alert('Có lỗi xảy ra khi từ chối đơn hàng.');
      }
      this.cdr.detectChanges();
    }
  }
}
