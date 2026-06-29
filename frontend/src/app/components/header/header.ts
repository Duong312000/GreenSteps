import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { User } from '../../models/models';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LoginModalComponent } from '../login-modal/login-modal';
import { LoginModalService } from '../../services/login-modal.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LoginModalComponent],
  templateUrl: './header.html',
  styleUrls: []
})
export class HeaderComponent implements OnInit, AfterViewInit, OnDestroy {
  public currentUser: User | null = null;
  public currentPath: string = '';
  public smartSearchQuery: string = '';
  public isSearchDropdownActive: boolean = false;
  public isMobileMenuOpen: boolean = false;
  public isLoginModalOpen: boolean = false;
  public isOverflowOpen: boolean = false;  // controlled by mouseenter/mouseleave
  public isProfileOpen: boolean = false;   // profile dropdown hover
  public navStartX: number = 0;            // left-x of first nav tab, for overflow panel alignment

  // All tabs combined (traveler + provider when applicable)
  public allTabs: any[] = [];
  // Subset that overflows the nav row — rendered in the dropdown panel
  public overflowTabs: any[] = [];
  // Indices of tabs that overflow — used to hide them in the main nav
  public overflowTabIndices: Set<number> = new Set<number>();

  // AI Planner Modal
  public isCreateModalOpen: boolean = false;
  public modalDest: string = 'Đà Lạt';
  public modalDays: number = 3;

  // Smart Search filters
  public filterDest: string = 'Đà Lạt';
  public filterBudget: string = '6';
  public filterStyle: string = 'eco';

  public currentTheme: 'light' | 'dark' = 'light';
  public isScrolled: boolean = false;

  @ViewChild('headerWrapper') headerWrapperRef!: ElementRef<HTMLElement>;
  @ViewChild('navContainer') navContainerRef!: ElementRef<HTMLElement>;
  @ViewChild('searchInput') searchInput!: ElementRef;
  @ViewChild('filterDropdown') filterDropdown!: ElementRef;

  private resizeObserver!: ResizeObserver;
  private loginModalSubscription?: Subscription;
  private updateScrollState() {
    const nextIsScrolled = window.scrollY > 0;
    if (this.isScrolled === nextIsScrolled) return;

    this.isScrolled = nextIsScrolled;
    if (this.isHomeHeaderCollapsed) {
      this.isOverflowOpen = false;
    }
  }

  @HostListener('window:scroll')
  public onWindowScroll() {
    this.updateScrollState();
  }

  @HostListener('mouseenter')
  onMouseEnter() {
    if (this.isHomeHeaderCollapsed) return;
    this.isOverflowOpen = true;
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.isOverflowOpen = false;
  }

  @HostListener('window:resize')
  onResize() {
    this.scheduleOverflowCalc();
  }

  public isHomePage(): boolean {
    return this.router.url === '/' || this.router.url.startsWith('/home');
  }

  public get isHomeHeaderCollapsed(): boolean {
    return this.isHomePage() && !this.isScrolled;
  }

  constructor(
    public authService: AuthService,
    private router: Router,
    private apiService: ApiService,
    private loginModalService: LoginModalService
  ) {}

  @HostListener('document:mousedown', ['$event'])
  public onClickOutside(event: MouseEvent) {
    if (this.isSearchDropdownActive &&
        this.searchInput &&
        this.filterDropdown &&
        !this.searchInput.nativeElement.contains(event.target) &&
        !this.filterDropdown.nativeElement.contains(event.target)) {
      this.isSearchDropdownActive = false;
    }
  }

  public toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  public openLoginModal() {
    this.isMobileMenuOpen = false;
    this.isLoginModalOpen = true;
  }

  public closeLoginModal() {
    this.isLoginModalOpen = false;
  }

  ngOnInit() {
    this.updateScrollState();
    this.loginModalSubscription = this.loginModalService.open$.subscribe(() => this.openLoginModal());

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.updateNavigation();
      // Recalculate after DOM updates with new tabs
      setTimeout(() => this.calculateOverflow(), 50);
    });

    this.currentPath = this.router.url;
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentPath = event.url;
      this.updateScrollState();
    });

    const savedTheme = localStorage.getItem('greensteps_theme') as 'light' | 'dark';
    if (savedTheme) {
      this.currentTheme = savedTheme;
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }

  ngAfterViewInit() {
    // Double rAF ensures DOM layout is complete before measuring
    this.scheduleOverflowCalc();
    if (this.navContainerRef) {
      this.resizeObserver = new ResizeObserver(() => this.scheduleOverflowCalc());
      this.resizeObserver.observe(this.navContainerRef.nativeElement);
    }
  }

  /** Schedule overflow calc on next paint frame */
  private scheduleOverflowCalc() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.calculateOverflow());
    });
  }

  ngOnDestroy() {
    this.loginModalSubscription?.unsubscribe();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  /**
   * Measures which tabs overflow the nav container's visible width.
   * Uses getBoundingClientRect for accuracy regardless of offsetParent.
   * Populates both overflowTabs (for the panel) and overflowTabIndices (to hide in main nav).
   */
  public calculateOverflow() {
    if (!this.navContainerRef) return;
    const navEl = this.navContainerRef.nativeElement;
    const parentEl = navEl.parentElement || navEl;
    const parentRect = parentEl.getBoundingClientRect();
    const tabEls = navEl.querySelectorAll<HTMLElement>('.nav-tab-item');

    const newOverflow: any[] = [];
    const newIndices = new Set<number>();
    let firstVisibleLeft: number = 0;
    let firstVisibleFound = false;

    tabEls.forEach((el, i) => {
      const elRect = el.getBoundingClientRect();
      // Tab is overflowing if its right edge exceeds the clipping parent container's right edge
      if (elRect.right > parentRect.right + 1 && this.allTabs[i]) {
        newOverflow.push(this.allTabs[i]);
        newIndices.add(i);
      } else if (!firstVisibleFound) {
        firstVisibleLeft = elRect.left;
        firstVisibleFound = true;
      }
    });
    this.overflowTabs = newOverflow;
    this.overflowTabIndices = newIndices;
    // Align overflow panel: use exact left position of first visible tab relative to the wrapper content area
    if (firstVisibleFound && this.headerWrapperRef) {
      const wrapperEl = this.headerWrapperRef.nativeElement;
      const wrapperRect = wrapperEl.getBoundingClientRect();
      const wrapperStyle = window.getComputedStyle(wrapperEl);
      const paddingLeft = parseFloat(wrapperStyle.paddingLeft || '0');
      this.navStartX = firstVisibleLeft - wrapperRect.left - paddingLeft;
    } else {
      this.navStartX = 0;
    }
  }

  public toggleTheme() {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', this.currentTheme);
    localStorage.setItem('greensteps_theme', this.currentTheme);
  }

  public showSearchDropdown() {
    this.isSearchDropdownActive = true;
  }

  public onSearchKeypress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.triggerSearch();
    }
  }

  public triggerSearch() {
    const query = this.smartSearchQuery.trim();
    this.isSearchDropdownActive = false;
    if (query) {
      this.router.navigate(['/tours'], { queryParams: { search: query } });
    }
  }

  public applySmartFilters() {
    this.isSearchDropdownActive = false;
    this.router.navigate(['/tours'], {
      queryParams: {
        dest: this.filterDest,
        budget: this.filterBudget,
        style: this.filterStyle
      }
    });
  }

  public getFirstLetter(name: string): string {
    return name ? name.charAt(0).toUpperCase() : 'U';
  }

  public showGreenHandbookAlert() {
    alert('Tính năng Cẩm Nang Xanh đang phát triển!');
  }

  public isAiPlannerActive(): boolean {
    return this.router.url.startsWith('/schedule');
  }

  public handleAiPlannerClick() {
    if (this.isAiPlannerActive()) return;
    const workingId = localStorage.getItem('greensteps_working_itinerary_id');
    if (workingId) {
      this.router.navigate(['/schedule', workingId]);
    } else {
      this.router.navigate(['/schedule']);
    }
  }

  public openCreateItineraryModal() {
    this.isCreateModalOpen = true;
  }

  public closeCreateItineraryModal() {
    this.isCreateModalOpen = false;
  }

  public async submitNewItinerary(event: Event) {
    event.preventDefault();
    this.isCreateModalOpen = false;

    const user = this.authService.getCurrentUser();
    const userId = user ? (user.id || user._id || '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb7d') : '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb7d';

    const presets = await this.apiService.getPresetTours();
    const matchedPreset = presets.find(t =>
      t.destination.toLowerCase().includes(this.modalDest.toLowerCase()) ||
      this.modalDest.toLowerCase().includes(t.destination.toLowerCase())
    );

    let daysData: any[][] = [];
    let totalCost = 0;
    let totalCarbon = 0;

    if (matchedPreset) {
      const rawData = matchedPreset.data || [];
      for (let i = 0; i < Number(this.modalDays); i++) {
        const dayActivities = rawData[i] || [];
        daysData.push(JSON.parse(JSON.stringify(dayActivities)));
      }
      daysData.forEach(day => {
        day.forEach((act: any) => {
          totalCost += act.cost || 0;
          totalCarbon += act.carbon || 0;
        });
      });
    } else {
      daysData = Array.from({ length: Number(this.modalDays) }, () => []);
    }

    const newIti = {
      id: 'iti_' + Date.now(),
      name: `Lịch trình tự thiết kế ${this.modalDest}`,
      user_id: userId,
      destination: this.modalDest,
      days: Number(this.modalDays),
      totalCost,
      totalCarbon,
      daysData
    };

    await this.apiService.saveItinerary(newIti);
    this.router.navigate(['/schedule', newIti.id]);
  }

  public async handleRoleToggle() {
    if (!this.currentUser) return;
    const userId = this.currentUser.id || this.currentUser._id || '';
    const newRole = await this.authService.toggleRole(userId);
    alert(`Đã chuyển đổi vai trò thành công! Vai trò hiện tại: ${newRole === 'provider' ? 'Nhà cung cấp' : 'Khách du lịch'}`);
    this.updateNavigation();
    if (newRole === 'provider') {
      this.router.navigate(['/partner-dashboard']);
    } else {
      this.router.navigate(['/']);
    }
  }

  public handleLogout() {
    this.authService.logout();
    alert('Đã đăng xuất tài khoản!');
    this.router.navigate(['/']);
  }

  public updateNavigation() {
    const isProvider = this.currentUser && this.currentUser.role === 'provider';

    const travelerTabs = [
      { label: 'Cộng đồng', link: '/community' },
      { label: 'Lịch trình', link: '/tours' },
      { label: 'Cẩm nang', action: 'green_handbook' },
      { label: 'AI Planner', action: 'ai_planner' }
    ];

    const providerTabs = isProvider ? [
      { label: 'Thống kê', link: '/partner-dashboard' },
      { label: 'Dịch vụ', link: '/partner-services' },
      { label: 'Đơn đặt', link: '/partner-bookings' },
      { label: 'Quảng cáo', link: '/partner-ads' }
    ] : [];

    // All tabs compete equally for space in the main nav row
    this.allTabs = [...travelerTabs, ...providerTabs];
    this.overflowTabs = [];
  }
}
