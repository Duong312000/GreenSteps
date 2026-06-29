import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LoginModalService } from '../../services/login-modal.service';
import { Tour, User } from '../../models/models';

type BookingFor = 'self' | 'other';
type PaymentMethod = 'wallet' | 'card' | 'bank' | 'counter';
type PayTiming = 'now' | 'later';

interface GuestInfo {
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  phone: string;
  receiveEmailConfirm: boolean;
}

interface OtherGuest {
  fullName: string;
  phone: string;
  note: string;
}

interface BookingContext {
  hotelId: string;
  roomId: string;
  tourId: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  roomCount: number;
}

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './booking.html'
})
export class BookingComponent implements OnInit {
  public currentUser: User | null = null;
  public activeTour: Tour | null = null;
  public isPaymentStep = false;
  public isCompleteStep = false;
  public submitted = false;
  public paymentSubmitted = false;
  public toastMessage = '';

  public bookingContext: BookingContext = {
    hotelId: 'hotel_dahlia_dalat',
    roomId: 'premium_double_window',
    tourId: '',
    checkIn: '2026-06-15',
    checkOut: '2026-06-18',
    guestCount: 2,
    roomCount: 1
  };

  public guestInfo: GuestInfo = {
    firstName: '',
    lastName: '',
    email: '',
    country: 'Việt Nam',
    phone: '',
    receiveEmailConfirm: true
  };

  public bookingFor: BookingFor = 'self';
  public otherGuest: OtherGuest = {
    fullName: '',
    phone: '',
    note: ''
  };

  public addOns: string[] = [];
  public specialRequest = '';
  public arrivalTime = '';
  public payTiming: PayTiming = 'now';
  public paymentMethod: PaymentMethod = 'wallet';
  public acceptedTerms = false;
  public cardForm = {
    cardName: '',
    cardNumber: '',
    expiry: '',
    cvc: ''
  };

  public errors: Record<string, string> = {};
  public paymentErrors: Record<string, string> = {};

  public readonly countries = ['Việt Nam', 'Singapore', 'Thái Lan', 'Hàn Quốc', 'Nhật Bản', 'Khác'];
  public readonly arrivalOptions = ['12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-18:00', '18:00-20:00', 'Sau 20:00'];
  public readonly paymentMethods = [
    { id: 'wallet' as PaymentMethod, label: 'Ví điện tử', desc: 'Thanh toán nhanh qua ví liên kết.', icon: 'bi-wallet2' },
    { id: 'card' as PaymentMethod, label: 'Thẻ ngân hàng', desc: 'Nhập thông tin thẻ bảo mật.', icon: 'bi-credit-card' },
    { id: 'bank' as PaymentMethod, label: 'Chuyển khoản', desc: 'Nhận thông tin chuyển khoản GreenSteps.', icon: 'bi-bank' },
    { id: 'counter' as PaymentMethod, label: 'Thanh toán tại quầy', desc: 'Giữ chỗ tạm thời và xác nhận tại quầy.', icon: 'bi-shop' }
  ];
  public readonly addOnOptions = [
    { id: 'airport', label: 'Tôi muốn đặt xe đưa đón sân bay', desc: 'Xe tiết kiệm nhiên liệu, tài xế địa phương.', price: 280000, icon: 'bi-car-front' },
    { id: 'electric-bike', label: 'Tôi muốn thuê xe máy/xe điện', desc: 'Phù hợp di chuyển ngắn trong thành phố.', price: 180000, icon: 'bi-bicycle' },
    { id: 'green-plan', label: 'Tôi muốn nhận gợi ý lịch trình xanh', desc: 'GreenSteps gợi ý điểm đến ít phát thải.', price: 0, icon: 'bi-leaf' },
    { id: 'insurance', label: 'Tôi muốn thêm bảo hiểm du lịch', desc: 'Bảo vệ cơ bản cho hành trình tour.', price: 120000, icon: 'bi-shield-check' }
  ];

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    private loginModalService: LoginModalService
  ) {}

  async ngOnInit() {
    this.syncStepFromUrl();
    this.loadContext();
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.prefillUserInfo(user);
    });

    if (this.bookingContext.tourId) {
      this.activeTour = await this.apiService.getPresetTour(this.bookingContext.tourId);
    }
    if (!this.activeTour) {
      const tours = await this.apiService.getPresetTours();
      this.activeTour = tours[0] || null;
    }

    if (this.isPaymentStep || this.isCompleteStep) {
      const draft = localStorage.getItem('greensteps_booking_draft');
      if (draft) this.restoreDraft(JSON.parse(draft));
    }
  }

  public openAuth() {
    this.loginModalService.open();
  }

  public changeSelection() {
    if (this.activeTour?.id) {
      this.router.navigate(['/tours', this.activeTour.id]);
      return;
    }
    this.router.navigate(['/tours']);
  }

  public toggleAddOn(id: string, checked: boolean) {
    if (checked && !this.addOns.includes(id)) {
      this.addOns = [...this.addOns, id];
    } else if (!checked) {
      this.addOns = this.addOns.filter(item => item !== id);
    }
  }

  public hasAddOn(id: string) {
    return this.addOns.includes(id);
  }

  public continueToPayment() {
    this.submitted = true;
    this.errors = this.validateDetails();
    if (Object.keys(this.errors).length > 0) {
      this.toastMessage = 'Vui lòng hoàn tất thông tin bắt buộc.';
      setTimeout(() => this.toastMessage = '', 2600);
      this.scrollToFirstError();
      return;
    }

    this.saveDraft();
    this.router.navigate(['/booking/payment']);
  }

  public completeDeposit() {
    this.paymentSubmitted = true;
    this.paymentErrors = this.validatePayment();
    if (Object.keys(this.paymentErrors).length > 0) {
      this.toastMessage = 'Vui lòng hoàn tất thông tin thanh toán.';
      setTimeout(() => this.toastMessage = '', 2600);
      this.scrollToFirstPaymentError();
      return;
    }

    this.saveDraft();
    this.router.navigate(['/booking/confirm']);
  }

  public get hotelName() {
    return this.activeTour?.title || 'Tour GreenSteps Travel';
  }

  public get hotelAddress() {
    return this.activeTour?.destination ? `Điểm đến: ${this.activeTour.destination}` : 'Hành trình du lịch xanh';
  }

  public get roomName() {
    return 'Gói tour tiêu chuẩn GreenSteps';
  }

  public get basePrice() {
    return Math.max(this.activeTour?.cost || 1890000, 0) * Math.max(this.bookingContext.guestCount, 1);
  }

  public get discountAmount() {
    return Math.round(this.basePrice * 0.08);
  }

  public get serviceFee() {
    return 120000;
  }

  public get totalAmount() {
    return this.basePrice - this.discountAmount + this.serviceFee + this.addOnsTotal;
  }

  public get depositAmount() {
    return Math.round(this.totalAmount * 0.3);
  }

  public get remainingAmount() {
    return this.totalAmount - this.depositAmount;
  }

  public get addOnsTotal() {
    return this.addOnOptions
      .filter(option => this.addOns.includes(option.id))
      .reduce((sum, option) => sum + option.price, 0);
  }

  public get selectedAddOnLabels() {
    return this.addOnOptions
      .filter(option => this.addOns.includes(option.id))
      .map(option => option.label);
  }

  public get nights() {
    const checkIn = new Date(this.bookingContext.checkIn);
    const checkOut = new Date(this.bookingContext.checkOut);
    const diff = Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000);
    return Math.max(diff || (this.activeTour?.days ? this.activeTour.days - 1 : 1), 1);
  }

  public get cancellationDate() {
    const checkIn = new Date(this.bookingContext.checkIn);
    checkIn.setDate(checkIn.getDate() - 3);
    return checkIn.toLocaleDateString('vi-VN');
  }

  public get selectedPaymentLabel() {
    return this.paymentMethods.find(method => method.id === this.paymentMethod)?.label || 'Ví điện tử';
  }

  public get paymentReady() {
    return Object.keys(this.validatePayment(true)).length === 0;
  }

  public fieldError(name: string) {
    return this.submitted ? this.errors[name] : '';
  }

  public paymentError(name: string) {
    return this.paymentSubmitted ? this.paymentErrors[name] : '';
  }

  private loadContext() {
    const storedContext = localStorage.getItem('greensteps_booking_context');
    if (storedContext) {
      this.bookingContext = { ...this.bookingContext, ...JSON.parse(storedContext) };
    }

    const query = this.route.snapshot.queryParamMap;
    this.bookingContext = {
      ...this.bookingContext,
      tourId: query.get('tourId') || this.bookingContext.tourId,
      checkIn: query.get('checkIn') || this.bookingContext.checkIn,
      checkOut: query.get('checkOut') || this.bookingContext.checkOut,
      guestCount: Number(query.get('guestCount') || this.bookingContext.guestCount),
      roomCount: Number(query.get('roomCount') || this.bookingContext.roomCount)
    };
  }

  private prefillUserInfo(user: User | null) {
    if (!user) return;
    const parts = (user.fullname || '').trim().split(/\s+/);
    const firstName = parts.pop() || '';
    const lastName = parts.join(' ');

    this.guestInfo = {
      ...this.guestInfo,
      firstName: this.guestInfo.firstName || firstName,
      lastName: this.guestInfo.lastName || lastName,
      email: this.guestInfo.email || user.email || '',
      phone: this.guestInfo.phone || user.phone || '',
      country: this.guestInfo.country || 'Việt Nam'
    };
  }

  private validateDetails() {
    const errors: Record<string, string> = {};
    if (!this.guestInfo.lastName.trim()) errors['lastName'] = 'Vui lòng nhập họ.';
    if (!this.guestInfo.firstName.trim()) errors['firstName'] = 'Vui lòng nhập tên.';
    if (!this.isEmail(this.guestInfo.email)) errors['email'] = 'Email không hợp lệ.';
    if (!this.guestInfo.country.trim()) errors['country'] = 'Vui lòng chọn vùng/quốc gia.';
    if (!this.isPhone(this.guestInfo.phone)) errors['phone'] = 'Số điện thoại không hợp lệ.';
    return errors;
  }

  private validatePayment(includeCard = true) {
    const errors: Record<string, string> = {};
    if (!this.paymentMethod) errors['paymentMethod'] = 'Vui lòng chọn phương thức thanh toán.';
    if (this.paymentMethod === 'card' && includeCard) {
      if (!this.cardForm.cardName.trim()) errors['cardName'] = 'Vui lòng nhập tên trên thẻ.';
      if (!/^[0-9\s]{12,23}$/.test(this.cardForm.cardNumber.trim())) errors['cardNumber'] = 'Số thẻ không hợp lệ.';
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(this.cardForm.expiry.trim())) errors['expiry'] = 'Dùng định dạng TT/NN.';
      if (!/^\d{3,4}$/.test(this.cardForm.cvc.trim())) errors['cvc'] = 'CVC không hợp lệ.';
    }
    if (!this.acceptedTerms) errors['acceptedTerms'] = 'Bạn cần đồng ý với điều kiện thanh toán.';
    return errors;
  }

  private saveDraft() {
    const draft = {
      hotelId: this.bookingContext.hotelId,
      roomId: this.bookingContext.roomId,
      tourId: this.activeTour?.id || this.bookingContext.tourId,
      checkIn: this.bookingContext.checkIn,
      checkOut: this.bookingContext.checkOut,
      guestCount: this.bookingContext.guestCount,
      roomCount: this.bookingContext.roomCount,
      depositAmount: this.depositAmount,
      userInfo: this.guestInfo,
      bookingFor: this.bookingFor,
      otherGuest: this.otherGuest,
      specialRequests: this.specialRequest,
      addOns: this.addOns,
      arrivalTime: this.arrivalTime,
      payTiming: this.payTiming,
      paymentMethod: this.paymentMethod,
      cardForm: this.cardForm,
      acceptedTerms: this.acceptedTerms,
      createdAt: new Date().toISOString()
    };

    localStorage.setItem('greensteps_booking_draft', JSON.stringify(draft));
  }

  private restoreDraft(draft: any) {
    this.guestInfo = { ...this.guestInfo, ...(draft.userInfo || {}) };
    this.bookingFor = draft.bookingFor || 'self';
    this.otherGuest = { ...this.otherGuest, ...(draft.otherGuest || {}) };
    this.specialRequest = draft.specialRequests || '';
    this.addOns = draft.addOns || [];
    this.arrivalTime = draft.arrivalTime || '';
    this.payTiming = draft.payTiming || 'now';
    this.paymentMethod = draft.paymentMethod || 'wallet';
    this.cardForm = { ...this.cardForm, ...(draft.cardForm || {}) };
    this.acceptedTerms = !!draft.acceptedTerms;
    this.bookingContext = { ...this.bookingContext, ...draft };
  }

  private syncStepFromUrl() {
    this.isPaymentStep = this.router.url.startsWith('/booking/payment');
    this.isCompleteStep = this.router.url.startsWith('/booking/confirm');
  }

  private isEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  private isPhone(value: string) {
    return /^(\+?[0-9]{8,15}|0[0-9\s.-]{8,13})$/.test(value.trim());
  }

  private scrollToFirstError() {
    setTimeout(() => {
      const firstError = document.querySelector<HTMLElement>('.booking-field.invalid input, .booking-field.invalid select, .booking-field.invalid textarea');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstError?.focus?.();
    }, 50);
  }

  private scrollToFirstPaymentError() {
    setTimeout(() => {
      const firstError = document.querySelector<HTMLElement>('.payment-field.invalid input, .payment-method-error, .terms-error');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstError?.focus?.();
    }, 50);
  }
}
