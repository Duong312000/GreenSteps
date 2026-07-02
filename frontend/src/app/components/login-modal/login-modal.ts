import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, OnDestroy, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

type AuthStep = 'login' | 'forgot' | 'verify' | 'reset' | 'resetDone';
type VerifyMethod = 'email' | 'phone';
type VerifyPurpose = 'login' | 'forgot';
type PasswordField = 'reset' | 'resetConfirm';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-modal.html',
  styleUrls: ['./login-modal.css']
})
export class LoginModalComponent implements AfterViewInit, OnDestroy {
  @Output() close = new EventEmitter<void>();
  @ViewChild('loginDialog') loginDialog!: ElementRef<HTMLElement>;
  @ViewChild('firstField') firstField?: ElementRef<HTMLInputElement>;
  @ViewChildren('otpInput') otpInputs?: QueryList<ElementRef<HTMLInputElement>>;

  public authStep: AuthStep = 'login';
  public verificationMethod: VerifyMethod = 'email';
  public verificationPurpose: VerifyPurpose = 'login';
  public identifier = '';
  public otpDigits = ['', '', '', '', '', ''];
  public resendSeconds = 59;

  public showResetPassword = false;
  public showResetConfirm = false;
  public isSubmitting = false;
  public errorMessage = '';
  public successMessage = '';

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

  public openRecovery() {
    this.identifier = '';
    this.verificationMethod = 'email';
    this.verificationPurpose = 'forgot';
    this.setStep('forgot');
  }

  public chooseRecoveryMethod(method: VerifyMethod) {
    this.verificationMethod = method;
    this.identifier = '';
    this.errorMessage = '';
    this.focusFirstField();
  }

  public togglePassword(field: PasswordField) {
    if (field === 'reset') this.showResetPassword = !this.showResetPassword;
    if (field === 'resetConfirm') this.showResetConfirm = !this.showResetConfirm;
  }

  public alertSocial(provider: string) {
    alert(`GreenSteps đang tích hợp đăng nhập ${provider}. Vui lòng sử dụng email hoặc số điện thoại trước nhé.`);
  }

  public onContinueSubmit(event: Event) {
    event.preventDefault();
    this.errorMessage = '';
    if (this.isSubmitting || !this.validateIdentifier()) return;

    this.verificationPurpose = 'login';
    this.openVerify('Mã demo là 123456 để tiếp tục.');
  }

  public onForgotSubmit(event: Event) {
    event.preventDefault();
    this.errorMessage = '';
    if (!this.validateIdentifier()) return;

    this.verificationPurpose = 'forgot';
    this.openVerify('Mã demo là 123456 để tiếp tục đặt lại mật khẩu.');
  }

  public trackOtpIndex(index: number) {
    return index;
  }

  public onOtpBeforeInput(event: InputEvent) {
    if (event.inputType === 'insertText' && event.data && !/^\d$/.test(event.data)) {
      event.preventDefault();
    }
  }

  public onOtpInput(value: string, index: number) {
    const digit = value.replace(/\D/g, '').slice(-1);
    this.otpDigits = this.otpDigits.map((current, digitIndex) => digitIndex === index ? digit : current);

    if (digit && index < this.otpDigits.length - 1) {
      requestAnimationFrame(() => this.focusOtp(index + 1));
    }
  }

  public onOtpKeydown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace') {
      event.preventDefault();
      if (this.otpDigits[index]) {
        this.otpDigits = this.otpDigits.map((digit, digitIndex) => digitIndex === index ? '' : digit);
      } else if (index > 0) {
        this.otpDigits = this.otpDigits.map((digit, digitIndex) => digitIndex === index - 1 ? '' : digit);
        requestAnimationFrame(() => this.focusOtp(index - 1));
      }
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      this.focusOtp(index - 1);
      return;
    }

    if (event.key === 'ArrowRight' && index < 5) {
      event.preventDefault();
      this.focusOtp(index + 1);
    }
  }

  public onOtpPaste(event: ClipboardEvent, index: number) {
    event.preventDefault();
    const text = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, this.otpDigits.length - index) || '';
    if (!text) return;

    this.otpDigits = this.otpDigits.map((digit, digitIndex) => {
      if (digitIndex < index || digitIndex >= index + text.length) return digit;
      return text[digitIndex - index] || '';
    });

    requestAnimationFrame(() => this.focusOtp(Math.min(index + text.length, this.otpDigits.length - 1)));
  }

  public selectOtp(event: Event) {
    (event.target as HTMLInputElement).select();
  }

  public async verifyOtp(event: Event) {
    event.preventDefault();
    this.errorMessage = '';
    if (this.isSubmitting) return;
    if (this.otpDigits.join('') !== '123456') {
      this.errorMessage = 'Mã xác thực không chính xác.';
      return;
    }

    this.clearCountdown();
    if (this.verificationPurpose === 'forgot') {
      this.setStep('reset');
      return;
    }

    this.isSubmitting = true;
    const res = await this.authService.loginOrCreateWithIdentifier(this.identifier);
    this.isSubmitting = false;

    if (res.success && res.user) {
      this.requestClose();
      this.router.navigate(['/profile']);
      return;
    }

    this.errorMessage = res.message || 'Không thể đăng nhập lúc này. Vui lòng thử lại.';
  }

  public goBackFromVerify() {
    this.setStep(this.verificationPurpose === 'forgot' ? 'forgot' : 'login');
  }

  public resendOtp() {
    if (this.resendSeconds > 0) return;
    this.openVerify('Mã xác thực mới đã được gửi. Mã demo là 123456.');
  }

  public onResetSubmit(event: Event) {
    event.preventDefault();
    this.errorMessage = '';
    if (!this.validateReset()) return;
    this.setStep('resetDone');
  }

  public get identifierIcon() {
    if (!this.identifier.trim()) return 'bi-person';
    return this.isEmail(this.identifier) ? 'bi-envelope' : 'bi-telephone';
  }

  public get passwordStrength() {
    const password = this.resetForm.password;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score >= 4 ? 'Mạnh' : score >= 2 ? 'Trung bình' : 'Yếu';
  }

  private validateIdentifier() {
    const value = this.identifier.trim();
    if (!value) {
      this.errorMessage = 'Vui lòng nhập email hoặc số điện thoại.';
      return false;
    }

    const method: VerifyMethod = this.isEmail(value) ? 'email' : 'phone';
    this.verificationMethod = method;
    this.identifier = value;

    if (method === 'phone' && !this.isPhone(value)) {
      this.errorMessage = 'Email hoặc số điện thoại không hợp lệ.';
      return false;
    }
    return true;
  }

  private validateReset() {
    if (!this.isStrongEnough(this.resetForm.password)) {
      this.errorMessage = 'Mật khẩu phải có ít nhất 8 ký tự.';
      return false;
    }
    if (this.resetForm.password !== this.resetForm.confirmPassword) {
      this.errorMessage = 'Xác nhận mật khẩu không khớp.';
      return false;
    }
    return true;
  }

  private isEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  private isPhone(value: string) {
    return /^(0|\+84)[0-9\s.-]{8,13}$/.test(value.trim());
  }

  private isStrongEnough(value: string) {
    return value.length >= 8;
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
    const input = this.otpInputs?.get(index)?.nativeElement;
    input?.focus();
    input?.select();
  }

  private trapFocus(event: KeyboardEvent) {
    const dialog = this.loginDialog?.nativeElement;
    if (!dialog) return;
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])')).filter(el => el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
