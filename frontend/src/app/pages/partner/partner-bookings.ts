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

  public bookingsMock: any[] = [];

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

  public changeRequestsMock: any[] = [];

  public mockTours: any[] = [];
  public selectedTour: any = { id: '', name: '', duration: '', type: '', image: '' };
  public activeSection: 'itinerary' | 'route' | 'campsite' = 'itinerary';
  public tourSearchQuery: string = '';

  // Schedules Waypoints, Timelines, Campsite
  public waypoints: any[] = [];
  public itinerary: any[] = [];
  public zones: any[] = [];

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
    const realBookings = await this.apiService.getBookings(providerId) || [];
    this.bookings = realBookings;

    // Map database fields to the properties expected by the HTML template
    this.bookingsMock = realBookings.map((b: any) => {
      let uiStatus = 'pending';
      if (b.status === 'deposit') uiStatus = 'confirmed';
      else if (b.status === 'completed') uiStatus = 'completed';
      else if (b.status === 'rejected' || b.status === 'refunded') uiStatus = 'cancelled';
      else if (b.status === 'pending') uiStatus = 'pending';

      return {
        id: b.id,
        customerName: b.customer || 'Khách hàng',
        customerPhone: '0903 xxx xxx', // Mock phone
        serviceName: b.service || 'Dịch vụ',
        useDate: b.date || '2026-07-12',
        guests: b.guests || 1,
        totalPrice: b.value || 0,
        paidAmount: b.status === 'deposit' || b.status === 'completed' ? b.value : 0,
        status: uiStatus
      };
    });

    // Load real tours
    const tours = await this.apiService.getPresetTours(this.currentUser.id) || [];
    this.mockTours = tours.map(t => ({
      id: t.id,
      name: t.title,
      type: t.tags && t.tags[0] ? t.tags[0] : 'Trải nghiệm',
      image: t.image || 'image/greensteps_logo.png',
      duration: `${t.days} Ngày`,
      status: 'active',
      data: t.data
    }));

    if (this.mockTours.length > 0) {
      this.selectTour(this.mockTours[0]);
    }

    this.cdr.detectChanges();
  }

  public selectTour(t: any) {
    this.selectedTour = t;
    if (t && t.data) {
      this.itinerary = t.data.map((dayActs: any[], index: number) => ({
        day: index + 1,
        title: `Hành trình Ngày ${index + 1}`,
        activities: dayActs.map((act: any) => ({
          id: act.id,
          time: act.time,
          title: act.name,
          type: act.type || 'experience',
          description: act.description || `Tham gia hoạt động ${act.name} tại địa điểm.`
        }))
      }));

      const wps: any[] = [];
      t.data.forEach((dayActs: any[], dIdx: number) => {
        dayActs.forEach((act: any) => {
          if (act.lat && act.lng) {
            wps.push({
              id: act.id,
              name: act.name,
              tag: `Ngày ${dIdx + 1} - ${act.time}`,
              color: dIdx === 0 ? 'bg-green-700' : 'bg-teal-600',
              lat: act.lat,
              lng: act.lng
            });
          }
        });
      });
      this.waypoints = wps;

      // Populate default campsite zones for visual demo
      this.zones = [
        { id: 'A', name: 'Glamping Cao Cấp', desc: 'Lều mông cổ cực lớn view rừng thông.', capacity: 15, unit: 'lều', status: 'Còn trống 5', color: 'green', top: '30%', left: '25%', icon: 'Tent' },
        { id: 'B', name: 'Lều Chữ A Tiêu Chuẩn', desc: 'Lều chống thấm 4 người sàn gỗ nâng.', capacity: 30, unit: 'lều', status: 'Đã kín (Full)', color: 'blue', top: '60%', left: '45%', icon: 'Tent' },
        { id: 'C', name: 'Khu Sinh Hoạt & BBQ', desc: 'Sân gỗ đốt lửa trại bàn gỗ lớn.', capacity: 10, unit: 'bàn', status: 'Sẵn sàng', color: 'orange', top: '40%', left: '70%', icon: 'Fire' }
      ];
    } else {
      this.itinerary = [];
      this.waypoints = [];
      this.zones = [];
    }
    this.cdr.detectChanges();
  }

  public get newBookingsCount(): number {
    return this.bookingsMock.length;
  }

  public get pendingCount(): number {
    return this.bookingsMock.filter(b => b.status === 'pending').length;
  }

  public get confirmedCount(): number {
    return this.bookingsMock.filter(b => b.status === 'confirmed').length;
  }

  public get ongoingCount(): number {
    const today = new Date();
    return this.bookingsMock.filter(b => {
      if (b.status !== 'confirmed') return false;
      const bDate = new Date(b.useDate);
      const diffTime = bDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= -1 && diffDays <= 7;
    }).length;
  }

  public get completedCount(): number {
    return this.bookingsMock.filter(b => b.status === 'completed').length;
  }

  public get cancelledCount(): number {
    return this.bookingsMock.filter(b => b.status === 'cancelled').length;
  }

  public get changePendingCount(): number {
    return this.changeRequestsMock.filter(r => r.status === 'pending').length;
  }

  public get changeApprovedCount(): number {
    return this.changeRequestsMock.filter(r => r.status === 'approved').length;
  }

  public get changeRejectedCount(): number {
    return this.changeRequestsMock.filter(r => r.status === 'rejected').length;
  }

  public get changeProposedCount(): number {
    return this.changeRequestsMock.filter(r => r.status === 'proposed').length;
  }

  public get changeCancelCount(): number {
    return this.changeRequestsMock.filter(r => r.type === 'cancel').length;
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

  public async submitConfirm() {
    if (this.selectedBooking) {
      const success = await this.apiService.approveBooking(this.selectedBooking.id);
      if (success) {
        alert('Đã duyệt và xác nhận booking thành công!');
        await this.loadBookings();
      } else {
        alert('Có lỗi xảy ra khi phê duyệt booking.');
      }
      this.showConfirmModal = false;
      this.selectedBooking = null;
      this.cdr.detectChanges();
    }
  }

  public async submitReject() {
    if (this.selectedBooking) {
      const success = await this.apiService.rejectBooking(this.selectedBooking.id);
      if (success) {
        alert('Đã từ chối đơn đặt chỗ thành công.');
        await this.loadBookings();
      } else {
        alert('Có lỗi xảy ra khi từ chối đơn đặt chỗ.');
      }
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
