import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { User, Booking } from '../../models/models';

@Component({
  selector: 'app-partner-bookings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './partner-bookings.html',
  styleUrls: []
})
export class PartnerBookingsComponent implements OnInit {
  public currentUser: User | null = null;
  public bookings: Booking[] = [];

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
        this.loadBookings();
      }
      this.cdr.detectChanges();
    });
  }

  public async loadBookings() {
    if (!this.currentUser) return;
    const providerId = this.currentUser.id || this.currentUser._id || '';
    this.bookings = await this.apiService.getBookings(providerId);
    this.cdr.detectChanges();
  }

  public async approveBooking(id: string) {
    if (confirm('Bạn có chắc chắn muốn phê duyệt đơn đặt cọc này?')) {
      const success = await this.apiService.approveBooking(id);
      if (success) {
        alert('Phê duyệt đặt cọc thành công!');
        await this.loadBookings();
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
        await this.loadBookings();
      } else {
        alert('Có lỗi xảy ra khi từ chối đơn hàng.');
      }
      this.cdr.detectChanges();
    }
  }
}
