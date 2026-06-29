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

  // Next.js Mock Datasets
  public topProducts = [
    { id: '01', name: 'Tour Phú Yên Biển Xanh', popularity: 45, color: '#3b82f6' },
    { id: '02', name: 'Khách sạn Mường Thanh', popularity: 29, color: '#10b981' },
    { id: '03', name: 'Combo Đà Lạt 3N2Đ', popularity: 18, color: '#8b5cf6' },
    { id: '04', name: 'Trải nghiệm Hái Chè', popularity: 25, color: '#f59e0b' },
  ];

  public campaignPerformance = [
    { id: 'cp-1', name: 'Flash Sale Đà Lạt', status: 'Đang chạy', impressions: '45,200', clicks: '3,100', ctr: '6.8%', bookings: 42, revenue: '24.5Tr' },
    { id: 'cp-2', name: 'Ưu Đãi Đà Nẵng - Hội An', status: 'Đã kết thúc', impressions: '32,150', clicks: '1,850', ctr: '5.7%', bookings: 28, revenue: '18.2Tr' },
    { id: 'cp-3', name: 'Combo Phú Yên', status: 'Tạm dừng', impressions: '12,050', clicks: '420', ctr: '3.4%', bookings: 5, revenue: '4.5Tr' }
  ];

  public recentBookings = [
    { id: 'BK-1042', customer: 'Nguyễn Văn A', service: 'Tour Trekking Tà Năng...', date: '12/10/2024', guests: 2, total: '4.500.000đ', status: 'Đã xác nhận' },
    { id: 'BK-1041', customer: 'Trần Thị B', service: 'Combo Khách sạn Hội An...', date: '15/10/2024', guests: 4, total: '8.200.000đ', status: 'Chờ thanh toán' },
    { id: 'BK-1040', customer: 'Lê Hoàng C', service: 'Tour Khám phá Vịnh...', date: '20/10/2024', guests: 1, total: '1.200.000đ', status: 'Đã xác nhận' },
    { id: 'BK-1039', customer: 'Phạm Thị D', service: 'Tour Xe đạp Ninh Bình...', date: '22/10/2024', guests: 3, total: '2.800.000đ', status: 'Đã hủy' },
  ];

  public bestServices = [
    { id: 'bs-1', name: 'Tour Phú Yên Biển Xanh 3N2Đ', bookings: 42, cr: '4.2%', img: 'image/Viet Nam.png' },
    { id: 'bs-2', name: 'Home Stays Xanh Đà Lạt', bookings: 38, cr: '3.8%', img: 'image/Gemini_Generated_Image_szp1ouszp1ouszp1.png' },
    { id: 'bs-3', name: 'Nghỉ dưỡng Đà Nẵng - Hội An', bookings: 25, cr: '2.5%', img: 'image/Viet Nam.png' },
  ];

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    public cdr: ChangeDetectorRef
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
