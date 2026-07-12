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
  styleUrls: ['./tour-detail.css']
})
export class TourDetailComponent implements OnInit {
  public activeTour: Tour | null = null;
  public slideImages: string[] = [];
  public activeSlideIndex: number = 0;
  public isPageLoading: boolean = true;
  public isPhotoGalleryOpen: boolean = false;

  public galleryPhotoUrl: string = '';
  public activeDayIndex: number = 0;
  public activeInfoTab: 'overview' | 'included' | 'itinerary' | 'policy' | 'reviews' = 'overview';

  // Booking details
  public bookingDate: string = '2026-06-15';
  public bookingGuests: number = 2;
  public bookingAdults: number = 2;
  public bookingChildren: number = 0;

  // Fallback slider images by destination
  private destinationImages: { [key: string]: string[] } = {
    "Đà Lạt": [
      "image/1dc8619487310884c9d631d689ece1e7.jpg",
      "image/52627caa0015b2f833fbdc632d37dc82.jpg",
      "image/2eee566424c1f35fbeacf85496b4b6e7.jpg",
      "image/41a413334d9e3753b26c50f3a3921309.jpg",
      "image/dalat_cover.png",
      "image/cb4fbf769d60d911e13c255f7fb39dcc.jpg",
      "image/581559b0ca4ebbb8ec09d933fc7bff3d.jpg"
    ],
    "Phú Yên": [
      "image/cb4fbf769d60d911e13c255f7fb39dcc.jpg",
      "image/15a0c52a7c13e6fb493d5ce4cb1b644b.jpg",
      "image/e8b896896439701c1ff79d65290703b0.jpg",
      "image/4302842f8d693c25238f2141964a64b2.jpg",
      "image/68e15971da05ec82c116fe191abb8c7f.jpg",
      "image/phuyen_cover.png",
      "image/52627caa0015b2f833fbdc632d37dc82.jpg"
    ],
    "Đà Nẵng - Hội An": [
      "image/da38f44902391ce9a9e4f0fd4b69fb04.jpg",
      "image/b025d2b33ebe6db7e576ff3476f9acde.jpg",
      "image/7c9e14a82698a594dd914369bfb8eaa5.jpg",
      "image/Viet Nam.png",
      "image/Gemini_Generated_Image_szp1ouszp1ouszp1.png",
      "image/danang_cover.png",
      "image/41a413334d9e3753b26c50f3a3921309.jpg"
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
      this.isPageLoading = false;
      this.cdr.detectChanges();
    } else {
      this.isPageLoading = false;
    }
  }


  private setupSlides() {
    if (!this.activeTour) return;
    const coverImage = this.activeTour.image || this.activeTour.image_url || this.localTourImage('cover.jpg');
    const galleryImages = (this.activeTour.gallery || []).filter(Boolean);

    this.slideImages = [coverImage, ...galleryImages];

    for (let index = 1; this.slideImages.length < 7 && index <= 6; index++) {
      const localGalleryImage = this.localTourImage(`gallery-${String(index).padStart(2, '0')}.jpg`);
      if (!this.slideImages.includes(localGalleryImage)) {
        this.slideImages.push(localGalleryImage);
      }
    }

    this.slideImages = this.slideImages.slice(0, 7);
    this.activeSlideIndex = 0;

    if (this.slideImages.length >= 7) return;
    const dest = this.activeTour.destination || 'Đà Lạt';
    const destImgs = this.destinationImages[dest] || this.destinationImages['Đà Lạt'];
    const highQualityFallbacks = [
      "image/1dc8619487310884c9d631d689ece1e7.jpg",
      "image/cb4fbf769d60d911e13c255f7fb39dcc.jpg",
      "image/dalat_cover.png",
      "image/15a0c52a7c13e6fb493d5ce4cb1b644b.jpg",
      "image/phuyen_cover.png",
      "image/da38f44902391ce9a9e4f0fd4b69fb04.jpg",
      "image/danang_cover.png",
      "image/Viet Nam.png",
      "image/Gemini_Generated_Image_szp1ouszp1ouszp1.png",
      "image/41a413334d9e3753b26c50f3a3921309.jpg",
      "image/b025d2b33ebe6db7e576ff3476f9acde.jpg",
      "image/52627caa0015b2f833fbdc632d37dc82.jpg",
      "image/581559b0ca4ebbb8ec09d933fc7bff3d.jpg",
      "image/2eee566424c1f35fbeacf85496b4b6e7.jpg"
    ];

    destImgs.forEach(img => {
      if (img !== this.activeTour?.image && this.slideImages.length < 7) {
        this.slideImages.push(img);
      }
    });

    if (this.slideImages.length === 0) {
      this.slideImages = destImgs.slice(0, 7);
    }

    while (this.slideImages.length < 7) {
      this.slideImages.push(destImgs[this.slideImages.length % destImgs.length]);
    }

    this.slideImages = this.slideImages.filter(img => !this.isLowQualityGalleryImage(img));
    highQualityFallbacks.forEach(img => {
      if (this.slideImages.length < 7 && !this.slideImages.includes(img)) {
        this.slideImages.push(img);
      }
    });
    this.slideImages = this.slideImages.slice(0, 7);
  }

  private localTourImage(fileName: string): string {
    const tourId = (this.activeTour?.id || '').toLowerCase();
    return tourId ? `image/tours/${tourId}/${fileName}` : `image/Viet Nam.png`;
  }

  public setSlide(index: number) {
    this.activeSlideIndex = index;
  }

  private isLowQualityGalleryImage(img: string): boolean {
    return img.startsWith('http') ||
      img.includes('e8b896896439701c1ff79d65290703b0') ||
      img.includes('68e15971da05ec82c116fe191abb8c7f') ||
      img.includes('7c9e14a82698a594dd914369bfb8eaa5') ||
      img.includes('4302842f8d693c25238f2141964a64b2');
  }

  public selectGalleryPhoto(index: number, event?: Event) {
    event?.stopPropagation();
    this.activeSlideIndex = index;
    this.galleryPhotoUrl = this.slideImages[index] || this.slideImages[0] || '';
    this.cdr.detectChanges();
  }

  public openPhotoGallery(index: number = this.activeSlideIndex) {
    this.activeSlideIndex = index;
    this.galleryPhotoUrl = this.slideImages[index] || this.slideImages[0] || '';
    this.isPhotoGalleryOpen = true;
    this.cdr.detectChanges();
  }

  public closePhotoGallery() {
    this.isPhotoGalleryOpen = false;
    this.galleryPhotoUrl = '';
  }

  public setDay(index: number) {
    this.activeDayIndex = index;
  }

  public setInfoTab(tab: 'overview' | 'included' | 'itinerary' | 'policy' | 'reviews') {
    this.activeInfoTab = tab;
  }

  public get totalPrice(): number {
    if (!this.activeTour) return 0;
    return this.activeTour.cost * this.totalGuests;
  }

  public get totalGuests(): number {
    return Number(this.bookingAdults) + Number(this.bookingChildren);
  }

  public get displayOldCost(): number {
    if (!this.activeTour) return 0;
    return this.activeTour.oldCost || this.activeTour.old_cost || Math.round(this.activeTour.cost * 1.12);
  }

  public get displayNights(): number {
    return Math.max((this.activeTour?.days || 1) - 1, 1);
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
    if (!this.activeTour) return;

    const checkIn = this.bookingDate;
    const checkOutDate = new Date(checkIn);
    checkOutDate.setDate(checkOutDate.getDate() + Math.max(this.activeTour.days - 1, 1));
    const checkOut = checkOutDate.toISOString().slice(0, 10);

    const bookingContext = {
      hotelId: `hotel_${this.activeTour.destination || 'greensteps'}`.toLowerCase().replace(/\s+/g, '_'),
      roomId: 'premium_double_window',
      tourId: this.activeTour.id,
      checkIn,
      checkOut,
      guestCount: this.totalGuests,
      roomCount: 1
    };

    localStorage.setItem('greensteps_booking_context', JSON.stringify(bookingContext));
    this.router.navigate(['/booking'], { queryParams: bookingContext });
  }
}
