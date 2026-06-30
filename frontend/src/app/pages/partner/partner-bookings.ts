import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LoginModalService } from '../../services/login-modal.service';
import { User, Booking } from '../../models/models';

@Component({
  selector: 'app-partner-bookings',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './partner-bookings.html',
})
export class PartnerBookingsComponent implements OnInit {
  public currentUser: User | null = null;
  public bookings: Booking[] = []; // Live database bookings

  // Tab State
  public activeTab: 'bookings' | 'change-requests' | 'schedules' = 'bookings';

  // Bookings Tab Filters & Modals
  public searchQuery: string = '';
  public statusFilter: string = 'Tất cả';
  public dateFilter: string = 'Tất cả';
  public showConfirmModal: boolean = false;
  public showRejectModal: boolean = false;
  public selectedBooking: any = null;
  public rejectReason: string = 'Dịch vụ đã hết chỗ';
  public rejectNotes: string = '';

  // Rich bookings mock dataset (matching BookingsTab.tsx)
  public bookingsMock = [
    { id: 'BK-1042', customerName: 'Nguyễn Văn A', customerPhone: '0903 111 222', serviceName: 'Tour Trekking Tà Năng Phan Dũng', useDate: '2026-07-12', guests: 2, totalPrice: 4500000, paidAmount: 4500000, status: 'confirmed' },
    { id: 'BK-1041', customerName: 'Trần Thị B', customerPhone: '0912 333 444', serviceName: 'Combo Khách sạn Mường Thanh Phú Yên', useDate: '2026-07-15', guests: 4, totalPrice: 8200000, paidAmount: 2000000, status: 'pending' },
    { id: 'BK-1040', customerName: 'Lê Hoàng C', customerPhone: '0988 555 666', serviceName: 'Tour Khám phá Vịnh Xuân Đài 1 ngày', useDate: '2026-07-20', guests: 1, totalPrice: 1200000, paidAmount: 1200000, status: 'confirmed' },
    { id: 'BK-1039', customerName: 'Phạm Thị D', customerPhone: '0977 777 888', serviceName: 'Tour Xe đạp Xanh quanh Đà Lạt', useDate: '2026-07-22', guests: 3, totalPrice: 2800000, paidAmount: 0, status: 'cancelled' },
  ];

  // Change Requests Tab Filters & Modals
  public changeSearchQuery: string = '';
  public changeTypeFilter: string = 'Tất cả';
  public changeStatusFilter: string = 'Tất cả';
  public showApproveModal: boolean = false;
  public showRejectChangeModal: boolean = false;
  public showProposeModal: boolean = false;
  public selectedRequest: any = null;
  public proposeNewDate: string = '';
  public proposePriceDiff: number | null = null;
  public proposeNotes: string = '';

  public changeRequestsMock = [
    { id: 'YC-501', bookingId: 'BK-1041', customerName: 'Trần Thị B', serviceName: 'Combo Khách sạn Mường Thanh Phú Yên', type: 'date_change', requestDate: '2026-06-28', status: 'pending' },
    { id: 'YC-502', bookingId: 'BK-1042', customerName: 'Nguyễn Văn A', serviceName: 'Tour Trekking Tà Năng Phan Dũng', type: 'guest_change', requestDate: '2026-06-25', status: 'approved' },
    { id: 'YC-503', bookingId: 'BK-1039', customerName: 'Phạm Thị D', serviceName: 'Tour Xe đạp Xanh quanh Đà Lạt', type: 'cancel', requestDate: '2026-06-20', status: 'rejected' },
  ];

  // Schedules Tab Config
  public mockTours = [
    { id: 'T1', name: 'Trekking LangBiang leo đỉnh', type: 'Trekking', image: 'image/1dc8619487310884c9d631d689ece1e7.jpg', duration: '2 Ngày 1 Đêm', status: 'active' },
    { id: 'T2', name: 'Cắm trại săn mây Đồi Đa Phú', type: 'Cắm trại', image: 'image/41a413334d9e3753b26c50f3a3921309.jpg', duration: 'Qua đêm', status: 'active' },
    { id: 'T3', name: 'Thuyền thúng rừng dừa Hội An', type: 'Trải nghiệm', image: 'image/Gemini_Generated_Image_szp1ouszp1ouszp1.png', duration: 'Nửa ngày', status: 'active' },
  ];
  public selectedTour: any = this.mockTours[0];
  public activeSection: 'itinerary' | 'route' | 'campsite' = 'itinerary';
  public tourSearchQuery: string = '';

  // Schedules Waypoints, Timelines, Campsite
  public waypoints = [
    { id: 'wp1', name: 'Điểm tập trung (Chợ Đà Lạt)', tag: 'Bắt đầu', color: 'bg-green-700' },
    { id: 'wp2', name: 'Trạm dừng chân số 1 (km3)', tag: 'Check', color: 'bg-blue-600' },
    { id: 'wp3', name: 'Khu đồi thông nghỉ trưa', tag: 'Nghỉ', color: 'bg-blue-700' },
    { id: 'wp4', name: 'Vách đá đứng dốc km8', tag: 'Nguy hiểm', color: 'bg-red-700' },
    { id: 'wp5', name: 'Đỉnh LangBiang lộng gió', tag: 'Kết thúc', color: 'bg-orange-500' },
  ];
  public itinerary = [
    {
      day: 1,
      title: 'Đón khách & Bắt đầu leo núi',
      activities: [
        { id: 'a1', time: '08:00', title: 'Tập trung tại trung tâm Đà Lạt', type: 'transport', description: 'Đón khách bằng xe 16 chỗ di chuyển đến chân núi LangBiang.' },
        { id: 'a2', time: '09:00', title: 'Bắt đầu hành trình leo núi', type: 'trekking', description: 'Phổ biến quy tắc an toàn và bắt đầu leo qua rặng thông.' },
        { id: 'a3', time: '12:00', title: 'Nghỉ trưa & Ăn nhẹ', type: 'food', description: 'Ăn trưa picnic tại trạm dừng chân số 1.' },
        { id: 'a4', time: '15:00', title: 'Dựng trại tại đỉnh đồi', type: 'camp', description: 'Cùng dựng lều, chuẩn bị BBQ củi ngoài trời.' },
      ]
    },
    {
      day: 2,
      title: 'Săn mây & Xuống núi',
      activities: [
        { id: 'a5', time: '05:00', title: 'Thức giấc săn mây bình minh', type: 'experience', description: 'Chào ngày mới lộng gió, ngắm sương mù thung lũng.' },
        { id: 'a6', time: '08:00', title: 'Ăn sáng dọn dẹp lều', type: 'camp', description: 'Dọn dẹp rác sạch sẽ, thu gọn lều trại gọn gàng.' },
        { id: 'a7', time: '09:00', title: 'Hành trình xuống núi', type: 'trekking', description: 'Đi bộ xuống núi theo lối cũ rừng thông.' },
      ]
    }
  ];

  public zones = [
    { id: 'A', name: 'Glamping Cao Cấp', desc: 'Lều mông cổ cực lớn view rừng thông.', capacity: 15, unit: 'lều', status: 'Còn trống 5', color: 'green', top: '30%', left: '25%', icon: 'Tent' },
    { id: 'B', name: 'Lều Chữ A Tiêu Chuẩn', desc: 'Lều chống thấm 4 người sàn gỗ nâng.', capacity: 30, unit: 'lều', status: 'Đã kín (Full)', color: 'blue', top: '60%', left: '45%', icon: 'Tent' },
    { id: 'C', name: 'Khu Sinh Hoạt & BBQ', desc: 'Sân gỗ đốt lửa trại bàn gỗ lớn.', capacity: 10, unit: 'bàn', status: 'Sẵn sàng', color: 'orange', top: '40%', left: '70%', icon: 'Fire' }
  ];

  // Schedule modal state
  public showActivityModal: boolean = false;
  public selectedDayIndex: number = 1;
  public newActivityTime: string = '08:00';
  public newActivityTitle: string = '';
  public newActivityType: string = 'experience';
  public newActivityDesc: string = '';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    public cdr: ChangeDetectorRef,
    private loginModalService: LoginModalService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (!user || user.role !== 'provider') {
        this.loginModalService.open();
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

  public setActiveTab(tab: 'bookings' | 'change-requests' | 'schedules') {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }

  // Filter lists
  public get filteredBookings() {
    return this.bookingsMock.filter(b => {
      const matchSearch = b.id.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
                          b.customerName.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchStatus = this.statusFilter === 'Tất cả' || 
                          (this.statusFilter === 'Chờ xác nhận' && b.status === 'pending') ||
                          (this.statusFilter === 'Đã xác nhận' && b.status === 'confirmed') ||
                          (this.statusFilter === 'Đã hủy' && b.status === 'cancelled');
      return matchSearch && matchStatus;
    });
  }

  public get filteredRequests() {
    return this.changeRequestsMock.filter(r => {
      const matchSearch = r.id.toLowerCase().includes(this.changeSearchQuery.toLowerCase()) || 
                          r.bookingId.toLowerCase().includes(this.changeSearchQuery.toLowerCase()) ||
                          r.customerName.toLowerCase().includes(this.changeSearchQuery.toLowerCase());
      const matchStatus = this.changeStatusFilter === 'Tất cả' || 
                          (this.changeStatusFilter === 'Chờ xử lý' && r.status === 'pending') ||
                          (this.changeStatusFilter === 'Đã duyệt' && r.status === 'approved') ||
                          (this.changeStatusFilter === 'Từ chối' && r.status === 'rejected') ||
                          (this.changeStatusFilter === 'Đã đề xuất' && r.status === 'proposed');
      return matchSearch && matchStatus;
    });
  }

  public get filteredTours() {
    return this.mockTours.filter(t => t.name.toLowerCase().includes(this.tourSearchQuery.toLowerCase()));
  }

  // Actions for Bookings
  public handleBookingAction(booking: any, action: 'confirm' | 'reject') {
    this.selectedBooking = booking;
    if (action === 'confirm') {
      this.showConfirmModal = true;
    } else {
      this.showRejectModal = true;
    }
    this.cdr.detectChanges();
  }

  public submitConfirm() {
    if (this.selectedBooking) {
      this.bookingsMock = this.bookingsMock.map(b => b.id === this.selectedBooking.id ? { ...b, status: 'confirmed' } : b);
      alert('Đã duyệt và xác nhận booking thành công!');
      this.showConfirmModal = false;
      this.selectedBooking = null;
      this.cdr.detectChanges();
    }
  }

  public submitReject() {
    if (this.selectedBooking) {
      this.bookingsMock = this.bookingsMock.map(b => b.id === this.selectedBooking.id ? { ...b, status: 'cancelled' } : b);
      alert('Đã từ chối đơn đặt chỗ thành công.');
      this.showRejectModal = false;
      this.selectedBooking = null;
      this.cdr.detectChanges();
    }
  }

  // Actions for Change Requests
  public handleChangeAction(req: any, action: 'approve' | 'reject' | 'propose') {
    this.selectedRequest = req;
    if (action === 'approve') {
      this.showApproveModal = true;
    } else if (action === 'reject') {
      this.showRejectChangeModal = true;
    } else {
      this.showProposeModal = true;
    }
    this.cdr.detectChanges();
  }

  public submitApproveChange() {
    if (this.selectedRequest) {
      this.changeRequestsMock = this.changeRequestsMock.map(r => r.id === this.selectedRequest.id ? { ...r, status: 'approved' } : r);
      alert('Đã duyệt yêu cầu thay đổi thành công!');
      this.showApproveModal = false;
      this.selectedRequest = null;
      this.cdr.detectChanges();
    }
  }

  public submitRejectChange() {
    if (this.selectedRequest) {
      this.changeRequestsMock = this.changeRequestsMock.map(r => r.id === this.selectedRequest.id ? { ...r, status: 'rejected' } : r);
      alert('Đã từ chối yêu cầu thay đổi.');
      this.showRejectChangeModal = false;
      this.selectedRequest = null;
      this.cdr.detectChanges();
    }
  }

  public submitProposeChange() {
    if (this.selectedRequest) {
      this.changeRequestsMock = this.changeRequestsMock.map(r => r.id === this.selectedRequest.id ? { ...r, status: 'proposed' } : r);
      alert(`Đã gửi đề xuất lịch mới (${this.proposeNewDate}) thành công đến khách hàng!`);
      this.showProposeModal = false;
      this.selectedRequest = null;
      this.cdr.detectChanges();
    }
  }

  // Actions for Schedule Configurator
  public openAddActivity(dayIndex: number) {
    this.selectedDayIndex = dayIndex;
    this.showActivityModal = true;
    this.cdr.detectChanges();
  }

  public submitAddActivity() {
    const act = {
      id: 'a_' + Date.now(),
      time: this.newActivityTime,
      title: this.newActivityTitle,
      type: this.newActivityType,
      description: this.newActivityDesc
    };
    
    this.itinerary = this.itinerary.map(d => {
      if (d.day === this.selectedDayIndex) {
        return {
          ...d,
          activities: [...d.activities, act].sort((a, b) => a.time.localeCompare(b.time))
        };
      }
      return d;
    });

    this.showActivityModal = false;
    this.newActivityTitle = '';
    this.newActivityDesc = '';
    this.cdr.detectChanges();
  }

  public getRequestTypeLabel(type: string): string {
    if (type === 'date_change') return 'Đổi ngày sử dụng';
    if (type === 'cancel') return 'Yêu cầu hủy đơn';
    if (type === 'guest_change') return 'Thay đổi số khách';
    return 'Thay đổi thông tin liên hệ';
  }
}
