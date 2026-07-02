import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { LoginModalService } from '../../services/login-modal.service';
import { User, WalletTransaction } from '../../models/models';

type ProfileSection = 'overview' | 'personal';

type ProfileSidebarItem = {
  icon: string;
  label: string;
  section?: ProfileSection;
  route?: string;
  action?: 'planner';
  badge?: string;
};

type ProfileSidebarGroup = {
  heading: string;
  items: ProfileSidebarItem[];
};

type TravelPreference = {
  label: string;
  icon: string;
  selected?: boolean;
};

type SmartCostSuggestion = {
  label: string;
  saving: string;
};

type TripReminder = {
  icon: string;
  label: string;
};

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile-dashboard.css'],
})
export class ProfileComponent implements OnInit {
  public activeSection: ProfileSection = 'overview';
  public currentUser: User | null = null;
  public profileUser: User = {
    id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb7d',
    username: 'kienldvk24411',
    fullname: 'kienldvk24411',
    email: 'kienldvk24411@st.uel.edu.vn',
    phone: '',
    dob: '',
    gender: 'Nữ',
    address: '',
    role: 'traveler'
  };

  public walletRegistered = false;
  public walletBalance = 0;
  public transactions: WalletTransaction[] = [];

  public isEditing = false;
  public detFullname = '';
  public detPhone = '';
  public detEmail = '';
  public detDob = '';
  public detGender = 'Nữ';
  public detAddress = '';

  public readonly sidebarGroups: ProfileSidebarGroup[] = [
    {
      heading: 'TỔNG QUAN',
      items: [{ icon: 'bi-house-door', label: 'Tổng quan', section: 'overview' }]
    },
    {
      heading: 'CHUYẾN ĐI CỦA TÔI',
      items: [
        { icon: 'bi-calendar2-week', label: 'Lịch trình của tôi', route: '/schedule' },
        { icon: 'bi-ticket-perforated', label: 'Tour đã đặt', route: '/tours' },
        { icon: 'bi-credit-card', label: 'Vé & thanh toán' },
        { icon: 'bi-heart', label: 'Địa điểm yêu thích' }
      ]
    },
    {
      heading: 'CÔNG CỤ HỮU ÍCH',
      items: [
        { icon: 'bi-stars', label: 'AI Travel Planner', action: 'planner' },
        { icon: 'bi-geo-alt', label: 'Bản đồ tương tác' },
        { icon: 'bi-chat-dots', label: 'Chatbot hỗ trợ', badge: 'AI' }
      ]
    },
    {
      heading: 'TÀI KHOẢN',
      items: [
        { icon: 'bi-person', label: 'Thông tin cá nhân', section: 'personal' },
        { icon: 'bi-shield-lock', label: 'Bảo mật tài khoản' },
        { icon: 'bi-bell', label: 'Thông báo' },
        { icon: 'bi-wallet2', label: 'Ví GreenSteps' },
        { icon: 'bi-gift', label: 'Chương trình ưu đãi' },
        { icon: 'bi-gear', label: 'Cài đặt' }
      ]
    }
  ];

  public readonly dashboardStats = [
    { icon: 'bi-luggage', value: '3', label: 'Lịch trình đã lưu', link: 'Xem tất cả' },
    { icon: 'bi-ticket-perforated', value: '0', label: 'Tour đã đặt', link: 'Xem tất cả' },
    { icon: 'bi-leaf', value: '120', label: 'Điểm xanh', link: 'Chi tiết' },
    { icon: 'bi-cloud', value: '8.5 kg', label: 'CO₂ đã tiết kiệm', link: 'Chi tiết' }
  ];

  public readonly checklistItems = [
    { label: 'Đặt vé & xác nhận lịch trình', done: true },
    { label: 'Chuẩn bị giấy tờ tùy thân', done: true },
    { label: 'Đặt chỗ ở', done: true },
    { label: 'Kiểm tra thời tiết', done: false },
    { label: 'Chuẩn bị hành lý', done: false },
    { label: 'Mua bảo hiểm du lịch', done: false },
    { label: 'Đổi tiền mặt', done: false }
  ];

  public readonly carbonBreakdown = [
    { icon: 'bi-bus-front', label: 'Phương tiện', value: '5.2 kg' },
    { icon: 'bi-house-heart', label: 'Lưu trú', value: '2.1 kg' },
    { icon: 'bi-bicycle', label: 'Hoạt động', value: '1.2 kg' }
  ];

  public readonly greenTravelLevel = {
    title: 'Cấp độ du lịch xanh',
    level: 'Nature Explorer',
    current: 120,
    target: 200,
    nextLevel: 'Eco Adventurer'
  };

  public readonly travelTasteProfile = {
    persona: 'Nature Explorer',
    description: 'Ưa trải nghiệm xanh, trekking và khám phá văn hóa địa phương.',
    match: 72
  };

  public readonly travelPreferences: TravelPreference[] = [
    { icon: 'bi-signpost-split', label: 'Trekking', selected: true },
    { icon: 'bi-tree', label: 'Camping', selected: true },
    { icon: 'bi-leaf', label: 'Ecotourism', selected: true },
    { icon: 'bi-house-heart', label: 'Homestay', selected: true },
    { icon: 'bi-cup-hot', label: 'Food tour' }
  ];

  public readonly carbonTrend = [
    { month: 'Jan', value: 12 },
    { month: 'Feb', value: 10 },
    { month: 'Mar', value: 9.5 },
    { month: 'Apr', value: 11 },
    { month: 'May', value: 8.5 },
    { month: 'Jun', value: 8.5 }
  ];

  public readonly weatherAlert = {
    destination: 'Sapa',
    range: '18-22°C',
    description: 'Có thể có mưa nhẹ vào buổi chiều. Nên mang áo khoác mỏng và giày chống trượt.'
  };

  public readonly smartCostSuggestions: SmartCostSuggestion[] = [
    { label: 'Đổi sang homestay đối tác', saving: '-450.000đ' },
    { label: 'Đi shuttle bus thay vì xe riêng', saving: '-270.000đ' },
    { label: 'Ghép nhóm trekking 4 người', saving: '-100.000đ' }
  ];

  public readonly tripReminders: TripReminder[] = [
    { icon: 'bi-person-vcard', label: 'Chuẩn bị giấy tờ tùy thân' },
    { icon: 'bi-cloud-drizzle', label: 'Kiểm tra thời tiết trước 24h' },
    { icon: 'bi-chat-left-text', label: 'Xác nhận lịch trình với nhóm' }
  ];

  public readonly coverImage = 'image/2eee566424c1f35fbeacf85496b4b6e7.jpg';
  public readonly tripImage = 'image/4302842f8d693c25238f2141964a64b2.jpg';
  public readonly offerImage = 'image/1dc8619487310884c9d631d689ece1e7.jpg';

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private loginModalService: LoginModalService
  ) {}

  ngOnInit() {
    const existingUser = this.authService.getCurrentUser();
    if (existingUser) this.applyProfileUser(existingUser);

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.applyProfileUser(user);
        this.loadWalletAndTransactions();
      } else {
        this.loginModalService.open();
      }
      this.cdr.detectChanges();
    });
  }

  private applyProfileUser(user: User) {
    this.currentUser = user;
    this.profileUser = {
      ...this.profileUser,
      ...user,
      fullname: user.fullname || user.username || this.profileUser.fullname,
      email: user.email || this.profileUser.email,
      role: user.role || this.profileUser.role
    };
    this.detFullname = this.profileUser.fullname;
    this.detPhone = this.profileUser.phone || '';
    this.detEmail = this.profileUser.email;
    this.detDob = this.profileUser.dob || '';
    this.detGender = this.profileUser.gender || 'Nữ';
    this.detAddress = this.profileUser.address || '';
  }

  private async loadWalletAndTransactions() {
    if (!this.currentUser) return;
    const userId = this.currentUser.id || this.currentUser._id || '';
    const wallet = await this.apiService.getWalletInfo(userId);
    this.walletRegistered = wallet.registered;
    this.walletBalance = wallet.balance;
    this.transactions = await this.apiService.getTransactions(userId);
    this.cdr.detectChanges();
  }

  public handleSidebarItem(item: ProfileSidebarItem) {
    if (item.section) {
      this.activeSection = item.section;
      return;
    }
    if (item.route) {
      this.router.navigate([item.route]);
      return;
    }
    if (item.action === 'planner') this.router.navigate(['/schedule']);
  }

  public isSidebarItemActive(item: ProfileSidebarItem): boolean {
    return item.section === this.activeSection;
  }

  public showPersonalInfo() {
    this.activeSection = 'personal';
  }

  public navigateToProviderRegistration() {
    this.router.navigate(['/partner-register']);
  }

  public async saveDetails(event: Event) {
    event.preventDefault();
    if (!this.currentUser) return;
    const userId = this.currentUser.id || this.currentUser._id || '';
    const res = await this.authService.updateProfile(userId, {
      fullname: this.detFullname,
      phone: this.detPhone,
      email: this.detEmail,
      dob: this.detDob,
      gender: this.detGender,
      address: this.detAddress
    });
    if (res.success) {
      alert('Lưu thông tin thành công!');
    } else {
      alert(res.message || 'Cập nhật thất bại!');
    }
    this.cdr.detectChanges();
  }

  public async handleWalletActivation() {
    if (!this.currentUser) return;
    const userId = this.currentUser.id || this.currentUser._id || '';
    const res = await this.apiService.activateWallet(userId);
    if (res.success) {
      alert('Kích hoạt ví thành công! Bạn nhận được quà tặng chào mừng 5.000.000đ.');
      this.loadWalletAndTransactions();
    } else {
      alert('Kích hoạt ví thất bại. Vui lòng thử lại!');
    }
  }

  public async handleRoleToggle() {
    if (!this.currentUser) return;
    const userId = this.currentUser.id || this.currentUser._id || '';
    const newRole = await this.authService.toggleRole(userId);
    alert(`Đã chuyển đổi vai trò thành công! Vai trò hiện tại: ${newRole === 'provider' ? 'Nhà cung cấp' : 'Khách du lịch'}`);
    this.router.navigate([newRole === 'provider' ? '/partner-dashboard' : '/']);
  }

  public handleLogout() {
    this.authService.logout();
    alert('Đã đăng xuất tài khoản!');
    this.router.navigate(['/']);
  }

  public getFirstLetter(name: string): string {
    return name ? name.charAt(0).toUpperCase() : 'U';
  }
}
