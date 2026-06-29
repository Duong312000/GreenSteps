import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoginModalService } from '../../services/login-modal.service';
import { User } from '../../models/models';

@Component({
  selector: 'app-partner-ads',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './partner-ads.html',
  styleUrls: []
})
export class PartnerAdsComponent implements OnInit {
  public currentUser: User | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private loginModalService: LoginModalService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (!user || user.role !== 'provider') {
        this.loginModalService.open();
      }
      this.cdr.detectChanges();
    });
  }

  public buyCampaign(name: string) {
    alert(`Đăng ký thành công chiến dịch: "${name}"! Đội ngũ đối tác sẽ liên hệ và thiết lập hiển thị cho bạn.`);
  }
}
