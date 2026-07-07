import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

type AuthStep = 'login' | 'forgot' | 'verify' | 'reset' | 'resetDone';
type VerifyMethod = 'email' | 'phone';
type PasswordField = 'reset' | 'resetConfirm';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-modal.html',
  styleUrls: ['./login-modal.css']
})
export class LoginModalComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() initialMode: 'login' | 'register' = 'login';
  @Output() close = new EventEmitter<void>();
  @ViewChild('loginDialog') loginDialog!: ElementRef<HTMLElement>;
  @ViewChild('firstField') firstField?: ElementRef<HTMLInputElement>;

  // Component state
  public mode: 'login' | 'register' = 'login';
  public authStep: AuthStep = 'login';
  public isSubmitting = false;
  public errorMessage = '';
  public successMessage = '';
  
  // Login Form
  public loginUsername = '';
  public loginPassword = '';
  public showPassword = false;
  public rememberMe = false;

  // Register Form
  public registerUsername = '';
  public registerFullname = '';
  public registerEmail = '';
  public registerPhone = '';
  public registerPassword = '';

  // Password Recovery / OTP
  public identifier = ''; // Recovery email
  public otpDigits = ['', '', '', '', '', ''];
  public resendSeconds = 59;
  public verificationMethod: VerifyMethod = 'email';
  public showResetPassword = false;
  public showResetConfirm = false;
  public resetForm = {
    password: '',
    confirmPassword: ''
  };

  private readonly previousBodyOverflow = document.body.style.overflow;
  private countdownTimer?: number;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.mode = this.initialMode;
  }

  ngAfterViewInit() {
    document.body.style.overflow = 'hidden';
    this.focusFirstField();
  }

  ngOnDestroy() {
    document.body.style.overflow = this.previousBodyOverflow;
    this.clearCountdown();
  }

  @HostListener('document:keydown', ['$event'])
  public onDocumentKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') return this.requestClose();
    if (event.key === 'Tab') this.trapFocus(event);
  }

  public requestClose() {
    this.close.emit();
  }

  public setStep(step: AuthStep) {
    this.authStep = step;
    this.errorMessage = '';
    this.successMessage = '';
    if (step !== 'verify') this.clearCountdown();
    this.focusFirstField();
  }

  public setMode(mode: 'login' | 'register') {
    this.mode = mode;
    this.errorMessage = '';
    this.successMessage = '';
    this.focusFirstField();
  }

  // Handle Standard Password-based Login
  public async onLoginSubmit(event: Event) {
    event.preventDefault();
    this.errorMessage = '';

    if (!this.loginUsername.trim() || !this.loginPassword.trim()) {
      this.errorMessage = 'Vui lòng điền đầy đủ thông tin đăng nhập.';
      return;
    }

    this.isSubmitting = true;
    const res = await this.authService.login(this.loginUsername.trim(), this.loginPassword.trim());
    this.isSubmitting = false;

    if (res.success && res.user) {
      this.requestClose();
      this.router.navigate(['/profile']);
      return;
    }

    this.errorMessage = res.message || 'Sai tên đăng nhập hoặc mật khẩu!';
  }

  // Handle Standard Password-based Register
  public async onRegisterSubmit(event: Event) {
    event.preventDefault();
    this.errorMessage = '';

    const username = this.registerUsername.trim();
    const fullname = this.registerFullname.trim();
    const email = this.registerEmail.trim();
    const phone = this.registerPhone.trim();
    const password = this.registerPassword;

    if (!username || !fullname || !email || !phone || !password) {
      this.errorMessage = 'Vui lòng điền đầy đủ tất cả các trường.';
      return;
    }

    if (username.length < 3) {
      this.errorMessage = 'Tên đăng nhập phải chứa ít nhất 3 ký tự.';
      return;
    }

    if (password.length < 6) {
      this.errorMessage = 'Mật khẩu phải chứa ít nhất 6 ký tự.';
      return;
    }

    this.isSubmitting = true;
    const res = await this.authService.register({
      username,
      fullname,
      email,
      phone,
      password,
      role: 'traveler'
    });
    this.isSubmitting = false;

    if (res.success && res.user) {
      this.requestClose();
      this.router.navigate(['/profile']);
      return;
    }

    this.errorMessage = res.message || 'Đăng ký tài khoản thất bại. Vui lòng thử lại!';
  }

  // Recovery Flows
  public openRecovery() {
    this.identifier = '';
    this.verificationMethod = 'email';
    this.setStep('forgot');
  }

  public onForgotSubmit(event: Event) {
    event.preventDefault();
    this.errorMessage = '';
    const email = this.identifier.trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.errorMessage = 'Vui lòng nhập địa chỉ email hợp lệ.';
      return;
    }

    this.openVerify('Mã xác thực khôi phục mật khẩu đã được gửi đến email của bạn.');
  }

  public onOtpInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '').slice(-1);
    this.otpDigits[index] = value;
    input.value = value;
    if (value && index < 5) this.focusOtp(index + 1);
  }

  public onOtpKeydown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace' && !this.otpDigits[index] && index > 0) this.focusOtp(index - 1);
  }

  public onOtpPaste(event: ClipboardEvent) {
    const text = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6) || '';
    if (!text) return;
    event.preventDefault();
    this.otpDigits = Array.from({ length: 6 }, (_, index) => text[index] || '');
    setTimeout(() => this.focusOtp(Math.min(text.length, 6) - 1), 0);
  }

  public async verifyOtp(event: Event) {
    event.preventDefault();
    this.errorMessage = '';
    const otp = this.otpDigits.join('');
    if (otp.length !== 6) {
      this.errorMessage = 'Vui lòng nhập đầy đủ 6 chữ số.';
      return;
    }

    this.clearCountdown();
    
    // Accept mock OTP code '123456' for verification bypass
    if (otp === '123456' || otp === '000000') {
      this.setStep('reset');
    } else {
      this.errorMessage = 'Mã xác thực không hợp lệ. Vui lòng nhập mã thử nghiệm 123456.';
    }
  }

  public resendOtp() {
    if (this.resendSeconds > 0) return;
    this.openVerify('Mã xác thực mới đã được gửi thành công.');
  }

  public onResetSubmit(event: Event) {
    event.preventDefault();
    this.errorMessage = '';
    
    if (this.resetForm.password.length < 6) {
      this.errorMessage = 'Mật khẩu mới phải chứa ít nhất 6 ký tự.';
      return;
    }

    if (this.resetForm.password !== this.resetForm.confirmPassword) {
      this.errorMessage = 'Mật khẩu xác nhận không khớp.';
      return;
    }

    this.setStep('resetDone');
  }

  public alertSocial(provider: string) {
    alert(`GreenSteps đang tích hợp đăng nhập ${provider}. Vui lòng đăng ký tài khoản trước nhé.`);
  }

  private openVerify(message: string) {
    this.otpDigits = ['', '', '', '', '', ''];
    this.successMessage = message;
    this.authStep = 'verify';
    this.startCountdown();
    setTimeout(() => this.focusOtp(0), 80);
  }

  private startCountdown() {
    this.clearCountdown();
    this.resendSeconds = 59;
    this.countdownTimer = window.setInterval(() => {
      this.resendSeconds = Math.max(0, this.resendSeconds - 1);
      if (this.resendSeconds === 0) this.clearCountdown();
    }, 1000);
  }

  private clearCountdown() {
    if (this.countdownTimer) window.clearInterval(this.countdownTimer);
    this.countdownTimer = undefined;
  }

  private focusFirstField() {
    setTimeout(() => this.firstField?.nativeElement.focus(), 80);
  }

  private focusOtp(index: number) {
    const dialog = this.loginDialog?.nativeElement;
    dialog?.querySelectorAll<HTMLInputElement>('.otp-input')[index]?.focus();
  }

  private trapFocus(event: KeyboardEvent) {
    const dialog = this.loginDialog?.nativeElement;
    if (!dialog) return;
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])')).filter(el => el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      last.focus();
      event.preventDefault();
    } else if (!event.shiftKey && document.activeElement === last) {
      first.focus();
      event.preventDefault();
    }
  }
}
