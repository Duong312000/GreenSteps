import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Tour, Itinerary } from '../../models/models';

@Component({
  selector: 'app-tour-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './tour-detail.html',
  styleUrls: []
})
export class TourDetailComponent implements OnInit {
  public activeTour: Tour | null = null;
  public slideImages: string[] = [];
  public activeSlideIndex: number = 0;
  public activeDayIndex: number = 0;

  // Booking details
  public bookingDate: string = '2026-06-15';
  public bookingGuests: number = 2;

  // Fallback slider images by destination
  private destinationImages: { [key: string]: string[] } = {
    "Đà Lạt": [
      "image/1dc8619487310884c9d631d689ece1e7.jpg",
      "image/52627caa0015b2f833fbdc632d37dc82.jpg",
      "image/581559b0ca4ebbb8ec09d933fc7bff3d.jpg",
      "image/2eee566424c1f35fbeacf85496b4b6e7.jpg"
    ],
    "Phú Yên": [
      "image/cb4fbf769d60d911e13c255f7fb39dcc.jpg",
      "image/15a0c52a7c13e6fb493d5ce4cb1b644b.jpg",
      "image/e8b896896439701c1ff79d65290703b0.jpg",
      "image/4302842f8d693c25238f2141964a64b2.jpg"
    ],
    "Đà Nẵng - Hội An": [
      "image/da38f44902391ce9a9e4f0fd4b69fb04.jpg",
      "image/b025d2b33ebe6db7e576ff3476f9acde.jpg",
      "image/7c9e14a82698a594dd914369bfb8eaa5.jpg",
      "image/Viet Nam.png"
    ]
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.activeTour = await this.apiService.getPresetTour(id);
      if (this.activeTour) {
        this.setupSlides();
      }
      this.cdr.detectChanges();
    }
  }

  private setupSlides() {
    if (!this.activeTour) return;
    const dest = this.activeTour.destination || 'Đà Lạt';
    const destImgs = this.destinationImages[dest] || this.destinationImages['Đà Lạt'];
    
    this.slideImages = [];
    if (this.activeTour.image) {
      this.slideImages.push(this.activeTour.image);
    }
    
    destImgs.forEach(img => {
      if (img !== this.activeTour?.image && this.slideImages.length < 3) {
        this.slideImages.push(img);
      }
    });

    if (this.slideImages.length === 0) {
      this.slideImages = destImgs.slice(0, 3);
    }
  }

  public setSlide(index: number) {
    this.activeSlideIndex = index;
  }

  public setDay(index: number) {
    this.activeDayIndex = index;
  }

  public get totalPrice(): number {
    if (!this.activeTour) return 0;
    return this.activeTour.cost * this.bookingGuests;
  }

  public async cloneAndEditTrip() {
    if (!this.activeTour) return;
    
    const user = this.authService.getCurrentUser();
    const userId = user ? (user.id || user._id || '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb7d') : '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb7d';

    const newIti: Itinerary = {
      id: "iti_" + Date.now(),
      name: this.activeTour.title + " (Custom)",
      user_id: userId,
      destination: this.activeTour.destination,
      days: this.activeTour.days,
      totalCost: this.activeTour.cost,
      totalCarbon: this.activeTour.carbon,
      daysData: JSON.parse(JSON.stringify(this.activeTour.data))
    };

    await this.apiService.saveItinerary(newIti);
    this.router.navigate(['/schedule', newIti.id]);
  }

  public async submitBooking(event: Event) {
    event.preventDefault();

    const user = this.authService.getCurrentUser();
    if (!user) {
      alert("Bạn cần đăng nhập để đặt tour!");
      this.router.navigate(['/auth']);
      return;
    }

    const userId = user.id || user._id || '';

    const newBooking = {
      id: "BK-" + Date.now().toString().slice(-4),
      customer: user.fullname,
      customerId: userId,
      service: this.activeTour ? this.activeTour.title : "Tour",
      serviceId: this.activeTour ? this.activeTour.id : "ser_3",
      date: new Date(this.bookingDate).toLocaleDateString('vi-VN'),
      guests: this.bookingGuests,
      value: this.totalPrice,
      status: "pending"
    };

    const success = await this.apiService.createBooking(newBooking);
    if (success) {
      alert(`Đặt tour thành công! Mã đơn hàng: ${newBooking.id}. Vui lòng kiểm tra ví và trạng thái duyệt tại trang cá nhân.`);
      this.router.navigate(['/profile']);
    } else {
      alert('Đã xảy ra lỗi khi đặt tour. Vui lòng thử lại!');
    }
  }
}
