import { Component, OnInit, AfterViewInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Itinerary } from '../../models/models';

declare const L: any; // Leaflet mapped globally via index.html script tag
declare const google: any; // Google Maps SDK mapped globally

@Component({
  selector: 'app-schedule-editor',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './schedule-editor.html',
})
export class ScheduleEditorComponent implements OnInit, AfterViewInit, OnDestroy {
  public activeItinerary: any = null; // Internal Editor representation
  public activeDayIdx: number = 0;
  public walletBalance: number = 5000000;
  public customPlaceTitle: string = '';
  public isListMode: boolean = false;
  public savedItineraries: any[] = [];
  public isLoadingList: boolean = false;
  public isCreateModalOpen: boolean = false;
  public modalDest: string = 'Đà Lạt';
  public modalDays: number = 3;

  private modalMap: any = null;
  private modalMarkers: { [key: string]: any } = {};
  private destCoords: { [key: string]: [number, number] } = {
    'Đà Lạt': [11.940419, 108.458313],
    'Phú Yên': [13.088198, 109.314957],
    'Đà Nẵng - Hội An': [16.047079, 108.206230]
  };

  // Maps properties
  private map: any = null;
  private leafletMarkers: any[] = [];
  private polyline: any = null;

  // AI chat properties
  public isAiChatOpen: boolean = false;
  public aiMessages: { text: string; isOutgoing: boolean; rec?: any }[] = [];
  public aiInputText: string = '';
  public isAiThinking: boolean = false;

  // Checkout modal properties
  public isCheckoutModalOpen: boolean = false;
  public isItineraryPay: boolean = false;
  public checkoutItems: { title: string; cost: number }[] = [];
  public checkoutTotal: number = 0;

  // Metrics progress calculations
  public totalCost: number = 0;
  public totalCarbon: number = 0;
  public budgetProgressPct: number = 0;
  public carbonProgressPct: number = 0;

  // Resizer Panel properties
  public sidebarWidth: number = 280;
  public mapWidthPct: number = 40;
  private isResizing: boolean = false;
  private resizeType: 'left' | 'right' = 'left';

  // Bottom Sheet Details properties
  public selectedPlaceDetails: any = null;
  public sheetHeight: number = 220;
  private isSheetResizing: boolean = false;

  // Sidebar Metrics Panel Resizing properties
  public metricsHeight: number = 90;
  public isMetricsResizing: boolean = false;
  public mapSearchQuery: string = '';
  public activeTab: 'timeline' | 'suggestions' | 'bucket' = 'timeline';
  public dynamicRecs: any[] = [];

  // Custom categorized list builder properties
  public customLists: { title: string; places: { title: string }[] }[] = [
    { title: 'Nhà hàng cần thử', places: [] },
    { title: 'Khách sạn tham khảo', places: [] }
  ];

  // Cities centers for map coordinates fallbacks
  private cityCenters: { [key: string]: number[] } = {
    "da-lat": [11.9404, 108.4373],
    "phu-yen": [13.0882, 109.3025],
    "da-nang": [16.0544, 108.2022]
  };

  // Sample AI recommendations based on destinations
  public samplePlacesRecs: { [key: string]: any[] } = {
    "da-lat": [
      { name: "Hồ Xuân Hương", category: "Khám phá", type: "attraction", cost: 0, carbon: 1, img: "image/1dc8619487310884c9d631d689ece1e7.jpg", lat: 11.9425, lng: 108.4385 },
      { name: "Lẩu bò Ba Toa quán gỗ", category: "Ăn uống", type: "dining", cost: 150000, carbon: 3, img: "image/2eee566424c1f35fbeacf85496b4b6e7.jpg", lat: 11.9325, lng: 108.4452 },
      { name: "Thác Datanla máng trượt", category: "Khám phá", type: "attraction", cost: 200000, carbon: 4, img: "image/2eee566424c1f35fbeacf85496b4b6e7.jpg", lat: 11.9015, lng: 108.4485 },
      { name: "Vườn hoa Thành phố", category: "Khám phá", type: "attraction", cost: 50000, carbon: 1, img: "image/1dc8619487310884c9d631d689ece1e7.jpg", lat: 11.9480, lng: 108.4500 },
      { name: "Đường Hầm Điêu Khắc", category: "Khám phá", type: "attraction", cost: 90000, carbon: 3, img: "image/1dc8619487310884c9d631d689ece1e7.jpg", lat: 11.8900, lng: 108.4100 },
      { name: "Chợ đêm Đà Lạt", category: "Khám phá", type: "attraction", cost: 0, carbon: 1, img: "image/1dc8619487310884c9d631d689ece1e7.jpg", lat: 11.9423, lng: 108.4360 },
      { name: "An Cafe", category: "Ăn uống", type: "dining", cost: 60000, carbon: 2, img: "image/2eee566424c1f35fbeacf85496b4b6e7.jpg", lat: 11.9400, lng: 108.4335 }
    ],
    "phu-yen": [
      { name: "Gành Đá Đĩa kỳ vĩ", category: "Khám phá", type: "attraction", cost: 40000, carbon: 8, img: "image/15a0c52a7c13e6fb493d5ce4cb1b644b.jpg", lat: 13.3650, lng: 109.2990 },
      { name: "Mắt cá ngừ đại dương bà Tám", category: "Ăn uống", type: "dining", cost: 120000, carbon: 2, img: "image/15a0c52a7c13e6fb493d5ce4cb1b644b.jpg", lat: 13.0882, lng: 109.3025 },
      { name: "Tháp Nhạn cổ kính", category: "Khám phá", type: "attraction", cost: 20000, carbon: 1, img: "image/15a0c52a7c13e6fb493d5ce4cb1b644b.jpg", lat: 13.0898, lng: 109.3005 },
      { name: "Bãi Xép (Tôi thấy hoa vàng...)", category: "Khám phá", type: "attraction", cost: 20000, carbon: 2, img: "image/15a0c52a7c13e6fb493d5ce4cb1b644b.jpg", lat: 13.2040, lng: 109.2890 },
      { name: "Hải đăng Mũi Điện", category: "Khám phá", type: "attraction", cost: 20000, carbon: 4, img: "image/15a0c52a7c13e6fb493d5ce4cb1b644b.jpg", lat: 12.8980, lng: 109.4600 },
      { name: "Cơm gà Tuyết Nhung", category: "Ăn uống", type: "dining", cost: 45000, carbon: 2, img: "image/15a0c52a7c13e6fb493d5ce4cb1b644b.jpg", lat: 13.0905, lng: 109.3032 }
    ],
    "da-nang": [
      { name: "Bà Nà Hills cáp treo", category: "Khám phá", type: "attraction", cost: 950000, carbon: 15, img: "image/Viet Nam.png", lat: 15.9960, lng: 107.9880 },
      { name: "Bánh tráng cuốn thịt heo Trần", category: "Ăn uống", type: "dining", cost: 120000, carbon: 2, img: "image/Viet Nam.png", lat: 16.0544, lng: 108.2022 },
      { name: "Chùa Linh Ứng Sơn Trà", category: "Khám phá", type: "attraction", cost: 0, carbon: 2, img: "image/Viet Nam.png", lat: 16.1000, lng: 108.2780 },
      { name: "Ngũ Hành Sơn", category: "Khám phá", type: "attraction", cost: 40000, carbon: 1, img: "image/Viet Nam.png", lat: 16.0125, lng: 108.2635 },
      { name: "Cầu Rồng Đà Nẵng", category: "Khám phá", type: "attraction", cost: 0, carbon: 1, img: "image/Viet Nam.png", lat: 16.0612, lng: 108.2268 },
      { name: "Bán đảo Sơn Trà", category: "Khám phá", type: "attraction", cost: 0, carbon: 3, img: "image/Viet Nam.png", lat: 16.1200, lng: 108.2800 },
      { name: "Mì Quảng Ếch Bếp Trang", category: "Ăn uống", type: "dining", cost: 65000, carbon: 2, img: "image/Viet Nam.png", lat: 16.0680, lng: 108.2215 }
    ]
  };

  @HostListener('document:mousedown', ['$event'])
  public onDocumentClick(event: MouseEvent) {
    if (this.selectedPlaceDetails) {
      const target = event.target as HTMLElement;
      const clickedInsideSheet = target.closest('.map-details-sheet');
      const clickedMarker = target.closest('.leaflet-marker-icon') || target.closest('.leaflet-popup');
      
      if (!clickedInsideSheet && !clickedMarker) {
        this.closePlaceDetails();
      }
    }
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Set default AI welcome message
    this.aiMessages.push({
      text: "Xin chào! Tôi là trợ lý hành trình xanh của GreenSteps. Hãy cho tôi biết bạn đang muốn đi đâu hoặc muốn ăn gì ở khu vực này, tôi sẽ gợi ý các điểm đến giảm thiểu phát thải carbon thấp nhất cho bạn!",
      isOutgoing: false
    });
    this.cdr.detectChanges();



    const user = this.authService.getCurrentUser();
    if (user) {
      this.apiService.getWalletInfo(user.id || user._id || '').then(wallet => {
        this.walletBalance = wallet.balance;
        this.cdr.detectChanges();
      });
    }
  }

  ngAfterViewInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isListMode = false;
        this.loadItineraryToEditor(id);
        localStorage.setItem('greensteps_working_itinerary_id', id);
      } else {
        this.isListMode = true;
        this.activeItinerary = null;
        this.loadSavedItinerariesList();
      }
    });
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  public async loadSavedItinerariesList() {
    this.isLoadingList = true;
    this.cdr.detectChanges();
    try {
      const user = this.authService.getCurrentUser();
      const userId = user ? (user.id || user._id || '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb7d') : '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb7d';
      this.savedItineraries = await this.apiService.getItineraries(userId);
    } catch (e) {
      console.error(e);
    } finally {
      this.isLoadingList = false;
      this.cdr.detectChanges();
    }
  }

  public async deleteSavedItinerary(id: string, event: Event) {
    event.stopPropagation();
    if (confirm('Bạn có chắc chắn muốn xóa lịch trình này?')) {
      const success = await this.apiService.deleteItinerary(id);
      if (success) {
        if (localStorage.getItem('greensteps_working_itinerary_id') === id) {
          localStorage.removeItem('greensteps_working_itinerary_id');
        }
        alert('Đã xóa lịch trình thành công!');
        this.loadSavedItinerariesList();
      } else {
        alert('Xóa lịch trình thất bại!');
      }
    }
  }

  public openItinerary(id: string) {
    this.router.navigate(['/schedule', id]);
  }

  public openCreateModal() {
    this.isCreateModalOpen = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.initModalMap('editorModalMap');
    }, 150);
  }

  public closeCreateModal() {
    this.isCreateModalOpen = false;
    this.cdr.detectChanges();
    if (this.modalMap) {
      try {
        this.modalMap.remove();
      } catch (e) {}
      this.modalMap = null;
      this.modalMarkers = {};
    }
  }

  private initModalMap(containerId: string) {
    const mapEl = document.getElementById(containerId);
    if (!mapEl) return;

    if (this.modalMap) {
      try {
        this.modalMap.remove();
      } catch (e) {}
      this.modalMap = null;
      this.modalMarkers = {};
    }

    this.modalMap = L.map(containerId, {
      zoomControl: true,
      attributionControl: false
    }).setView([14.2, 108.8], 6);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 18
    }).addTo(this.modalMap);

    Object.keys(this.destCoords).forEach(dest => {
      const coords = this.destCoords[dest];
      const isSelected = this.modalDest === dest;
      
      const markerIcon = L.divIcon({
        className: 'custom-modal-marker',
        html: `<div class="modal-pin ${isSelected ? 'active-pin' : ''}" style="
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background-color: ${isSelected ? '#0E9F6E' : '#9CA3AF'};
          border: 3px solid #FFFFFF;
          box-shadow: 0 0 10px rgba(0,0,0,0.3);
          transition: all 0.3s;
          transform: scale(${isSelected ? 1.4 : 1});
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const marker = L.marker(coords, { icon: markerIcon }).addTo(this.modalMap);
      
      marker.bindTooltip(dest, {
        permanent: true,
        direction: 'right',
        className: 'modal-marker-tooltip',
        offset: [10, 0]
      });

      marker.on('click', () => {
        this.selectDestinationFromMap(dest);
      });

      this.modalMarkers[dest] = marker;
    });

    setTimeout(() => {
      if (this.modalMap) {
        this.modalMap.invalidateSize();
      }
    }, 200);
  }

  public selectDestinationFromMap(dest: string) {
    this.modalDest = dest;
    this.cdr.detectChanges();
    this.updateModalMarkers();
    if (this.modalMap) {
      this.modalMap.panTo(this.destCoords[dest]);
    }
  }

  private updateModalMarkers() {
    Object.keys(this.modalMarkers).forEach(dest => {
      const marker = this.modalMarkers[dest];
      if (!marker) return;
      
      const isSelected = this.modalDest === dest;
      
      const icon = L.divIcon({
        className: 'custom-modal-marker',
        html: `<div class="modal-pin ${isSelected ? 'active-pin' : ''}" style="
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background-color: ${isSelected ? '#0E9F6E' : '#9CA3AF'};
          border: 3px solid #FFFFFF;
          box-shadow: 0 0 10px rgba(0,0,0,0.3);
          transition: all 0.3s;
          transform: scale(${isSelected ? 1.4 : 1});
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      
      marker.setIcon(icon);
    });
  }

  public onModalDestChange() {
    this.updateModalMarkers();
    if (this.modalMap && this.destCoords[this.modalDest]) {
      this.modalMap.panTo(this.destCoords[this.modalDest]);
    }
  }

  public async createNewItinerary(event: Event) {
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
        day.forEach(act => {
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
      totalCost: totalCost,
      totalCarbon: totalCarbon,
      daysData: daysData
    };

    const success = await this.apiService.saveItinerary(newIti);
    if (success) {
      localStorage.setItem('greensteps_working_itinerary_id', newIti.id);
      this.router.navigate(['/schedule', newIti.id]);
    } else {
      alert('Không thể khởi tạo lịch trình mới!');
    }
  }

  public goBackToList() {
    localStorage.removeItem('greensteps_working_itinerary_id');
    this.router.navigate(['/schedule']);
  }

  private mapDestToSlug(destName: string): string {
    if (!destName) return "da-lat";
    const normalized = destName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
    if (normalized.includes("dalat") || normalized.includes("da lat")) return "da-lat";
    if (normalized.includes("phu yen")) return "phu-yen";
    if (normalized.includes("da nang") || normalized.includes("hoi an")) return "da-nang";
    return "da-lat";
  }

  private mapSlugToDestLabel(slug: string): string {
    if (slug === "da-lat") return "Đà Lạt";
    if (slug === "phu-yen") return "Phú Yên";
    if (slug === "da-nang") return "Đà Nẵng - Hội An";
    return "Đà Lạt";
  }

  private getCoordinatesForPlace(name: string, destSlug: string): { lat: number; lng: number } {
    const recs = this.samplePlacesRecs[destSlug] || [];
    const foundRec = recs.find(r => r.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(r.name.toLowerCase()));
    if (foundRec) {
      return { lat: foundRec.lat, lng: foundRec.lng };
    }
    const center = this.cityCenters[destSlug] || [11.9404, 108.4373];
    return {
      lat: center[0] + (Math.random() - 0.5) * 0.04,
      lng: center[1] + (Math.random() - 0.5) * 0.04
    };
  }

  private convertApiToEditorItinerary(apiIti: any): any {
    const destSlug = this.mapDestToSlug(apiIti.destination);
    const destLabel = apiIti.destination || this.mapSlugToDestLabel(destSlug);
    
    const days: any[] = [];
    const rawDaysData = apiIti.daysData || apiIti.days_data || apiIti.data || [];
    const daysCount = apiIti.days || rawDaysData.length || 1;
    
    for (let i = 0; i < daysCount; i++) {
      const activities: any[] = [];
      const rawActivities = rawDaysData[i] ? rawDaysData[i] : [];
      
      rawActivities.forEach((act: any) => {
        let lat = act.lat;
        let lng = act.lng;
        if (typeof lat !== "number" || typeof lng !== "number") {
          const coords = this.getCoordinatesForPlace(act.name || act.title, destSlug);
          lat = coords.lat;
          lng = coords.lng;
        }
        
        const title = act.title || act.name || "Hoạt động";
        
        let type = act.type;
        if (!type) {
          const icon = act.icon || '';
          if (icon.includes("building") || icon.includes("house")) type = "lodging";
          else if (icon.includes("cup") || icon.includes("utensils")) type = "dining";
          else if (icon.includes("car") || icon.includes("scooter") || icon.includes("bus") || icon.includes("bicycle")) type = "transport";
          else type = "attraction";
        }
        
        activities.push({
          time: act.time || "08:00",
          title: title,
          type: type,
          cost: act.cost || 0,
          carbon: act.carbon || 0,
          lat: lat,
          lng: lng
        });
      });
      
      days.push({
        dayNum: i + 1,
        title: `Ngày ${i + 1}`,
        activities: activities
      });
    }
    
    return {
      id: apiIti.id,
      title: apiIti.name || "Lịch trình tự thiết kế",
      dest: destSlug,
      destLabel: destLabel,
      days: days
    };
  }

  private convertEditorToApiItinerary(editorIti: any): Itinerary {
    const daysData: any[][] = [];
    let totalCost = 0;
    let totalCarbon = 0;
    
    editorIti.days.forEach((day: any) => {
      const dayActivities: any[] = [];
      day.activities.forEach((act: any) => {
        totalCost += act.cost;
        totalCarbon += act.carbon;
        
        let icon = "bi-tree-fill";
        if (act.type === "lodging") icon = "bi-house-door-fill";
        else if (act.type === "dining") icon = "bi-cup-hot-fill";
        else if (act.type === "transport") icon = "bi-scooter";
        
        dayActivities.push({
          id: "act_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
          time: act.time,
          name: act.title,
          cost: act.cost,
          carbon: act.carbon,
          icon: icon,
          type: act.type,
          lat: act.lat,
          lng: act.lng
        });
      });
      daysData.push(dayActivities);
    });
    
    const user = this.authService.getCurrentUser();
    const userId = user ? (user.id || user._id || '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb7d') : '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb7d';

    return {
      id: editorIti.id || ("iti_" + Date.now()),
      name: editorIti.title,
      user_id: userId,
      destination: editorIti.destLabel,
      days: editorIti.days.length,
      totalCost: totalCost,
      totalCarbon: totalCarbon,
      daysData: daysData
    };
  }

  private async saveItineraryToDb() {
    if (!this.activeItinerary) return;
    const apiIti = this.convertEditorToApiItinerary(this.activeItinerary);
    await this.apiService.saveItinerary(apiIti);
  }

  private async loadItineraryToEditor(tourId: string) {
    if (tourId === 'new') {
      const newTour = {
        id: "iti_" + Date.now(),
        title: "Lịch trình trống của tôi",
        dest: "da-lat",
        destLabel: "Đà Lạt",
        days: [
          {
            dayNum: 1,
            title: "Ngày khởi đầu",
            activities: []
          }
        ]
      };
      this.openEditorWithItinerary(newTour);
      await this.saveItineraryToDb();
      return;
    }

    // Try loading custom itinerary first
    const custom = await this.apiService.getItinerary(tourId);
    if (custom) {
      const cloned = this.convertApiToEditorItinerary(custom);
      this.openEditorWithItinerary(cloned);
      return;
    }

    // Load preset tours
    const preset = await this.apiService.getPresetTour(tourId);
    if (preset) {
      const cloned = this.convertApiToEditorItinerary(preset);
      cloned.title = preset.title;
      this.openEditorWithItinerary(cloned);
    }
    this.cdr.detectChanges();
  }

  private openEditorWithItinerary(itinerary: any) {
    this.activeItinerary = itinerary;
    this.activeDayIdx = 0;

    this.recalculateMetrics();
    
    // Load dynamic suggestions from backend
    this.loadDynamicRecommendations();
    
    // Defer Map initialization to let DOM render
    setTimeout(() => {
      this.initLeafletMap();
    }, 100);
  }

  public async loadDynamicRecommendations() {
    if (!this.activeItinerary) return;
    const destLabel = this.activeItinerary.destLabel || this.mapSlugToDestLabel(this.activeItinerary.dest);
    try {
      const services = await this.apiService.getServicesByDestination(destLabel);
      if (services && services.length > 0) {
        this.dynamicRecs = services.map(srv => {
          let recType = srv.type;
          if (recType === 'stay') recType = 'lodging';
          else if (recType === 'food') recType = 'dining';
          
          return {
            name: srv.name,
            category: srv.current_data?.category || (srv.type === 'food' ? 'Ăn uống' : srv.type === 'stay' ? 'Lưu trú' : 'Khám phá'),
            type: recType,
            cost: srv.cost,
            carbon: srv.carbon,
            img: srv.current_data?.img || this.getServiceFallbackImage(srv.type),
            lat: srv.current_data?.lat,
            lng: srv.current_data?.lng,
            badges: srv.badges || ['green']
          };
        });
      } else {
        this.loadStaticFallbackRecommendations();
      }
    } catch (e) {
      console.error('Error loading dynamic recommendations', e);
      this.loadStaticFallbackRecommendations();
    }
    this.cdr.detectChanges();
    this.plotMapMarkers();
  }

  private loadStaticFallbackRecommendations() {
    const destSlug = this.activeItinerary.dest || 'da-lat';
    const staticList = this.samplePlacesRecs[destSlug] || [];
    this.dynamicRecs = staticList.map(rec => ({
      name: rec.name,
      category: rec.category,
      type: rec.type,
      cost: rec.cost,
      carbon: rec.carbon,
      img: rec.img,
      lat: rec.lat,
      lng: rec.lng,
      badges: ['green']
    }));
  }

  private getServiceFallbackImage(type: string): string {
    if (type === 'stay' || type === 'lodging') {
      return 'image/1dc8619487310884c9d631d689ece1e7.jpg';
    } else if (type === 'food' || type === 'dining') {
      return 'image/2eee566424c1f35fbeacf85496b4b6e7.jpg';
    }
    return 'image/Viet Nam.png';
  }

  public switchActiveDay(dayIdx: number) {
    this.activeDayIdx = dayIdx;
    this.plotMapMarkers();
  }

  public getDayPreviewText(day: any): string {
    if (!day || !day.activities || day.activities.length === 0) {
      return 'Chưa có địa điểm';
    }
    return day.activities.slice(0, 3).map((a: any) => a.title).join(' • ');
  }

  public async addDayToItinerary() {
    if (!this.activeItinerary) return;
    const newDayNum = this.activeItinerary.days.length + 1;
    this.activeItinerary.days.push({
      dayNum: newDayNum,
      title: "Khám phá mới",
      activities: []
    });
    this.activeDayIdx = newDayNum - 1;

    this.plotMapMarkers();
    await this.saveItineraryToDb();
  }

  public getActivityTypeLabel(type: string): string {
    if (type === "lodging") return "Nơi lưu trú";
    if (type === "dining") return "Ăn uống";
    if (type === "transport") return "Di chuyển";
    return "Điểm tham quan";
  }

  public async deleteActivity(idx: number) {
    if (!this.activeItinerary) return;
    const activeDay = this.activeItinerary.days[this.activeDayIdx];
    activeDay.activities.splice(idx, 1);

    this.plotMapMarkers();
    this.recalculateMetrics();
    await this.saveItineraryToDb();
  }

  public async moveActivity(idx: number, direction: number) {
    if (!this.activeItinerary) return;
    const activeDay = this.activeItinerary.days[this.activeDayIdx];
    const targetIdx = idx + direction;

    if (targetIdx < 0 || targetIdx >= activeDay.activities.length) return;

    const temp = activeDay.activities[idx];
    activeDay.activities[idx] = activeDay.activities[targetIdx];
    activeDay.activities[targetIdx] = temp;

    // Swap times
    const tempTime = activeDay.activities[idx].time;
    activeDay.activities[idx].time = activeDay.activities[targetIdx].time;
    activeDay.activities[targetIdx].time = tempTime;

    this.plotMapMarkers();
    await this.saveItineraryToDb();
  }

  public async addCustomPlaceToActiveDay() {
    const val = this.customPlaceTitle.trim();
    if (!val || !this.activeItinerary) return;

    const time = this.getNextSuggestedTime();
    const center = this.cityCenters[this.activeItinerary.dest] || [11.9404, 108.4373];
    const randLat = center[0] + (Math.random() - 0.5) * 0.05;
    const randLng = center[1] + (Math.random() - 0.5) * 0.05;

    const newAct = {
      time: time,
      title: val,
      type: "attraction",
      cost: 50000,
      carbon: 3,
      lat: randLat,
      lng: randLng
    };

    this.activeItinerary.days[this.activeDayIdx].activities.push(newAct);
    this.customPlaceTitle = '';

    this.plotMapMarkers();
    this.recalculateMetrics();
    await this.saveItineraryToDb();
  }

  public async addPoolItemToActiveDay(name: string, type: string, cost: number, carbon: number, lat?: number, lng?: number) {
    if (!this.activeItinerary) return;
    const time = this.getNextSuggestedTime();

    let finalLat = lat;
    let finalLng = lng;
    if (!finalLat) {
      const center = this.cityCenters[this.activeItinerary.dest] || [11.9404, 108.4373];
      finalLat = center[0] + (Math.random() - 0.5) * 0.04;
      finalLng = center[1] + (Math.random() - 0.5) * 0.04;
    }

    const newAct = {
      time: time,
      title: name,
      type: type,
      cost: cost,
      carbon: carbon,
      lat: finalLat,
      lng: finalLng
    };
    
    this.activeItinerary.days[this.activeDayIdx].activities.push(newAct);

    this.plotMapMarkers();
    this.recalculateMetrics();
    await this.saveItineraryToDb();
  }

  private getNextSuggestedTime(): string {
    if (!this.activeItinerary) return "08:00";
    const activeDay = this.activeItinerary.days[this.activeDayIdx];
    if (activeDay.activities.length === 0) return "08:00";

    const lastAct = activeDay.activities[activeDay.activities.length - 1];
    const timeParts = lastAct.time.split(":");
    let hour = parseInt(timeParts[0]) + 2;
    if (hour >= 22) hour = 21;
    return `${hour.toString().padStart(2, "0")}:00`;
  }

  private recalculateMetrics() {
    if (!this.activeItinerary) return;

    let totalBudget = 0;
    let carbonSum = 0;

    this.activeItinerary.days.forEach((day: any) => {
      day.activities.forEach((act: any) => {
        totalBudget += act.cost;
        carbonSum += act.carbon;
      });
    });

    this.totalCost = totalBudget;
    this.totalCarbon = carbonSum;

    this.budgetProgressPct = Math.min((totalBudget / 8000000) * 100, 100);
    this.carbonProgressPct = Math.min((carbonSum / 80) * 100, 100);
    this.cdr.detectChanges();
  }

  // LEAFLET MAP HANDLERS
  private initLeafletMap() {
    if (!this.activeItinerary) return;

    const dest = this.activeItinerary.dest;
    const center = this.cityCenters[dest] || [11.9404, 108.4373];

    // Clear previous map if initialized
    if (this.map) {
      try {
        this.map.remove();
      } catch (e) {}
      this.map = null;
    }

    try {
      this.map = L.map('leafletMap', {
        zoomControl: false
      }).setView(center, 12);

      // CartoDB Voyager style (beautiful, premium, clean and loaded without errors)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 20
      }).addTo(this.map);

      this.map.on("click", () => {
        this.closePlaceDetails();
      });

      this.plotMapMarkers();
    } catch (err) {
      console.warn("Leaflet library not ready or loaded:", err);
    }
  }

  private plotMapMarkers() {
    if (!this.map || !this.activeItinerary) return;

    // Clear previous markers
    if (this.leafletMarkers && this.leafletMarkers.length > 0) {
      this.leafletMarkers.forEach(m => {
        try {
          this.map.removeLayer(m);
        } catch (e) {}
      });
    }
    this.leafletMarkers = [];

    if (this.polyline) {
      try {
        this.map.removeLayer(this.polyline);
      } catch (e) {}
      this.polyline = null;
    }

    const activeDay = this.activeItinerary.days[this.activeDayIdx];
    const coordinates: any[] = [];

    // 1. PLOT ACTIVE ITINERARY ACTIVITIES (Numbered pins)
    activeDay.activities.forEach((act: any, idx: number) => {
      if (typeof act.lat === "number" && typeof act.lng === "number") {
        const latlng: number[] = [act.lat, act.lng];
        coordinates.push(latlng);

        const customIcon = L.divIcon({
          html: `<div class="map-leaflet-pin" style="background-color: #184A37; border: 2.5px solid #FFFFFF; color: #FFFFFF; font-weight: 800; font-size: 11px; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-sm);">${idx + 1}</div>`,
          className: 'custom-div-icon',
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });

        const marker = L.marker(latlng, { icon: customIcon }).addTo(this.map);
        
        marker.on("click", () => {
          this.focusTimelineItem(act.title);
          this.selectedPlaceDetails = {
            title: act.title,
            type: act.type,
            cost: act.cost,
            carbon: act.carbon,
            lat: act.lat,
            lng: act.lng,
            time: act.time,
            isActivity: true,
            index: idx
          };
          this.cdr.detectChanges();
        });

        this.leafletMarkers.push(marker);
      }
    });

    // 2. PLOT LOCAL SUGGESTIONS (Eco recommendation markers with visual categories)
    const recs = this.dynamicRecs;
    
    recs.forEach((rec: any) => {
      const isAlreadyAdded = activeDay.activities.some((act: any) => act.title === rec.name);
      if (isAlreadyAdded) return;

      if (typeof rec.lat === "number" && typeof rec.lng === "number") {
        const latlng: number[] = [rec.lat, rec.lng];
        
        let iconHtml = '<i class="bi bi-geo-alt-fill"></i>';
        let bgColor = '#0E9F6E';
        if (rec.type === 'dining') {
          iconHtml = '<i class="bi bi-cup-hot-fill" style="font-size: 12px;"></i>';
          bgColor = '#F97316'; // Orange for food
        } else if (rec.type === 'lodging') {
          iconHtml = '<i class="bi bi-house-door-fill" style="font-size: 12px;"></i>';
          bgColor = '#3B82F6'; // Blue for hotel
        } else if (rec.type === 'explore' || rec.type === 'attraction') {
          iconHtml = '<i class="bi bi-tree-fill" style="font-size: 12px;"></i>';
          bgColor = '#10B981'; // Green for attractions
        }

        const customIcon = L.divIcon({
          html: `<div class="map-leaflet-rec-pin" style="background-color: ${bgColor}; border: 2px solid #FFFFFF; color: #FFFFFF; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-sm);">${iconHtml}</div>`,
          className: 'custom-div-icon-rec',
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });

        const marker = L.marker(latlng, { icon: customIcon }).addTo(this.map);
        
        marker.on("click", () => {
          this.selectedPlaceDetails = {
            title: rec.name,
            type: rec.type,
            cost: rec.cost,
            carbon: rec.carbon,
            lat: rec.lat,
            lng: rec.lng,
            isActivity: false
          };
          this.cdr.detectChanges();
        });

        this.leafletMarkers.push(marker);
      }
    });

    // Draw route path
    if (coordinates.length > 1) {
      this.polyline = L.polyline(coordinates, {
        color: '#0E9F6E',
        weight: 3.5,
        dashArray: '5, 8',
        opacity: 0.8
      }).addTo(this.map);
    }

    if (coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates);
      this.map.fitBounds(bounds, { padding: [40, 40] });
    }
  }

  public highlightMapPin(idx: number, highlight: boolean) {
    const marker = this.leafletMarkers[idx];
    if (!marker || typeof marker.getElement !== 'function') return;
    const el = marker.getElement();
    if (!el) return;
    const pin = el.querySelector(".map-leaflet-pin");
    if (pin) {
      if (highlight) {
        pin.style.backgroundColor = "#0E9F6E";
        pin.style.transform = "scale(1.25)";
        pin.style.boxShadow = "0 4px 12px rgba(14,159,110,0.4)";
      } else {
        pin.style.backgroundColor = "#184A37";
        pin.style.transform = "none";
        pin.style.boxShadow = "var(--shadow-sm)";
      }
    }
  }

  // OpenStreetMap Nominatim Search
  public async searchPlaceOnMap() {
    const query = this.mapSearchQuery.trim();
    if (!query || !this.activeItinerary) return;

    const destSlug = this.mapDestToSlug(this.activeItinerary.destination);
    const destLabel = this.mapSlugToDestLabel(destSlug);
    const fullQuery = `${query}, ${destLabel}`;

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(fullQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const first = data[0];
        const lat = parseFloat(first.lat);
        const lng = parseFloat(first.lon);
        
        let placeType = "attraction";
        if (first.type === "cafe" || first.type === "restaurant" || first.class === "amenity") {
          placeType = "dining";
        } else if (first.type === "hotel" || first.class === "tourism") {
          placeType = "lodging";
        }

        if (this.map) {
          this.map.panTo([lat, lng]);
          this.map.setZoom(15);
        }

        // Add temporary pin representing search result (Red Search Pin)
        const tempMarker = L.marker([lat, lng], {
          icon: L.divIcon({
            html: `<div class="map-leaflet-rec-pin" style="background-color: #EF4444; border: 2px solid #FFFFFF; color: white; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-md);"><i class="bi bi-search" style="font-size: 11px;"></i></div>`,
            className: 'custom-div-icon-temp',
            iconSize: [26, 26],
            iconAnchor: [13, 13]
          })
        }).addTo(this.map);

        this.leafletMarkers.push(tempMarker);

        this.selectedPlaceDetails = {
          title: first.name || query,
          type: placeType,
          cost: placeType === "dining" ? 80000 : (placeType === "lodging" ? 500000 : 30000),
          carbon: placeType === "dining" ? 2 : 4,
          lat: lat,
          lng: lng,
          isActivity: false
        };
        this.cdr.detectChanges();
      } else {
        alert('Không tìm thấy địa điểm này ở ' + destLabel);
      }
    } catch (e) {
      console.error('Search error:', e);
    }
  }

  public getBucketListCount(): number {
    let total = 0;
    this.customLists.forEach(l => {
      total += l.places.length;
    });
    return total;
  }

  // HTML5 Drag and Drop Handlers
  private dragSrcIdx: number | null = null;

  public onDragStart(event: DragEvent, idx: number) {
    this.dragSrcIdx = idx;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', idx.toString());
    }
    const target = event.target as HTMLElement;
    target.classList.add('dragging-item');
  }

  public onDragOver(event: DragEvent, idx: number) {
    event.preventDefault();
    if (this.dragSrcIdx !== null && this.dragSrcIdx !== idx) {
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
      }
    }
  }

  public onDrop(event: DragEvent, targetIdx: number) {
    event.preventDefault();
    const srcIdx = this.dragSrcIdx;
    if (srcIdx !== null && srcIdx !== targetIdx && this.activeItinerary) {
      const activeDay = this.activeItinerary.days[this.activeDayIdx];
      const movedItem = activeDay.activities[srcIdx];
      activeDay.activities.splice(srcIdx, 1);
      activeDay.activities.splice(targetIdx, 0, movedItem);

      this.reorderActivityTimes(activeDay.activities);
      this.plotMapMarkers();
      this.saveItineraryToDb();
    }
    this.dragSrcIdx = null;
  }

  public onDragEnd(event: DragEvent) {
    const target = event.target as HTMLElement;
    target.classList.remove('dragging-item');
    this.dragSrcIdx = null;
  }

  private reorderActivityTimes(activities: any[]) {
    const times = activities.map(act => act.time).sort();
    activities.forEach((act, idx) => {
      act.time = times[idx] || "08:00";
    });
  }

  // Map detail card actions
  public async addPlaceFromMap(details: any) {
    if (!this.activeItinerary) return;
    await this.addPoolItemToActiveDay(details.title, details.type, details.cost, details.carbon, details.lat, details.lng);
    this.closePlaceDetails();
  }

  public async deletePlaceFromMap(index: number) {
    if (!this.activeItinerary) return;
    await this.deleteActivity(index);
    this.closePlaceDetails();
  }

  private focusTimelineItem(name: string) {
    const el = document.getElementById('timelineList');
    if (!el) return;
    const cards = el.querySelectorAll('.timeline-item');
    cards.forEach(cardEl => {
      const titleEl = cardEl.querySelector('.activity-card-title');
      if (titleEl && titleEl.textContent === name) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const actCard = cardEl.querySelector('.activity-card') as HTMLElement;
        if (actCard) {
          actCard.style.transform = "scale(1.02)";
          actCard.style.borderColor = "#2563EB";
          setTimeout(() => {
            actCard.style.transform = "none";
            actCard.style.borderColor = "var(--border-color)";
          }, 1200);
        }
      }
    });
  }

  // AI RECOMMENDATION CHAT
  public toggleAiChat() {
    this.isAiChatOpen = !this.isAiChatOpen;
  }

  public sendAiMessage() {
    const text = this.aiInputText.trim();
    if (!text) return;

    this.aiMessages.push({ text: text, isOutgoing: true });
    this.aiInputText = '';
    this.isAiThinking = true;

    // Simulate AI recommendations
    setTimeout(() => {
      this.isAiThinking = false;
      const query = text.toLowerCase();
      const dest = this.activeItinerary ? this.activeItinerary.dest : 'da-lat';
      
      let replyText = "Tôi đã gợi ý thêm một số địa điểm xanh quanh khu vực của bạn:";
      let rec: any = null;

      if (query.includes("cafe") || query.includes("cà phê")) {
        if (dest === "da-lat") {
          replyText = "Đà Lạt có các quán cafe ngắm thông rất thơ mộng. Gợi ý cho bạn:";
          rec = { name: 'Cafe Túi Mơ To', type: 'dining', cost: 65000, carbon: 1, lat: 11.9567, lng: 108.4715 };
        } else {
          replyText = "Gợi ý quán cafe mang phong cách hoài cổ ven sông Hàn:";
          rec = { name: 'Cộng Cà Phê Bạch Đằng', type: 'dining', cost: 45000, carbon: 1, lat: 16.0680, lng: 108.2235 };
        }
      } else if (query.includes("ăn") || query.includes("nhà hàng")) {
        if (dest === "da-lat") {
          replyText = "Gợi ý quán ăn địa phương nổi tiếng ấm cúng:";
          rec = { name: 'Lẩu gà lá é Tao Ngộ', type: 'dining', cost: 100000, carbon: 2, lat: 11.9325, lng: 108.4452 };
        } else {
          replyText = "Địa điểm thưởng thức hải sản Tuy Hòa cực ngon:";
          rec = { name: 'Mắt cá ngừ bà Tám', type: 'dining', cost: 80000, carbon: 2, lat: 13.0882, lng: 109.3025 };
        }
      } else {
        replyText = "Địa điểm tham quan có lượng khí thải cực thấp được đề xuất:";
        rec = { name: 'Tháp Nghinh Phong', type: 'attraction', cost: 0, carbon: 0.5, lat: 13.1090, lng: 109.3175 };
      }

      this.aiMessages.push({
        text: replyText,
        isOutgoing: false,
        rec: rec
      });
    }, 1000);
  }

  // WALLET & CHECKOUT MODAL
  public openCheckout() {
    this.isCheckoutModalOpen = true;
    this.isItineraryPay = false;
    this.checkoutItems = [];
    this.checkoutTotal = 0;
  }

  public triggerCheckout() {
    if (!this.activeItinerary) return;
    this.isCheckoutModalOpen = true;
    this.isItineraryPay = true;

    this.checkoutItems = [];
    let total = 0;
    this.activeItinerary.days.forEach((day: any) => {
      day.activities.forEach((act: any) => {
        if (act.cost > 0) {
          total += act.cost;
          this.checkoutItems.push({ title: act.title, cost: act.cost });
        }
      });
    });

    this.checkoutTotal = total;
  }

  public closeCheckout() {
    this.isCheckoutModalOpen = false;
  }

  public async modalDepositWallet() {
    const user = this.authService.getCurrentUser();
    if (!user) {
      alert("Vui lòng đăng nhập để nạp tiền!");
      return;
    }
    const userId = user.id || user._id || '';
    const res = await this.apiService.depositMoney(userId, 2000000);
    if (res.success) {
      this.walletBalance = res.balance;
      alert("Nạp thành công 2.000.000đ vào Ví du lịch!");
    }
  }

  public async payCheckoutItinerary() {
    if (!this.activeItinerary) return;

    if (this.checkoutTotal === 0) {
      alert("Lịch trình trống hoặc toàn bộ dịch vụ đều miễn phí!");
      return;
    }

    if (this.walletBalance < this.checkoutTotal) {
      alert("Số dư ví không đủ! Vui lòng nạp thêm tiền gộp.");
      return;
    }

    const user = this.authService.getCurrentUser();
    if (!user) {
      alert("Vui lòng đăng nhập để thanh toán!");
      return;
    }
    const userId = user.id || user._id || '';

    const res = await this.apiService.payItinerary(userId, this.activeItinerary.id, this.checkoutTotal);
    if (res.success) {
      this.walletBalance = res.balance;
      this.closeCheckout();
      alert(`Thanh toán đặt chỗ thành công! Đã trừ gộp ${this.checkoutTotal.toLocaleString("vi-VN")}đ từ Ví du lịch của bạn.`);
    } else {
      alert(res.message || "Thanh toán thất bại!");
    }
  }

  // Custom categorized list builder methods
  public addNewCustomList() {
    const title = prompt("Nhập tên danh mục tự chọn mới (ví dụ: 'Quán Cafe đẹp', 'Điểm chụp ảnh'):");
    if (title && title.trim()) {
      this.customLists.push({ title: title.trim(), places: [] });
      this.cdr.detectChanges();
    }
  }

  public addPlaceToCustomList(listIdx: number, val: string) {
    if (!val || !val.trim()) return;
    this.customLists[listIdx].places.push({ title: val.trim() });
    this.cdr.detectChanges();
  }

  public deleteCustomList(listIdx: number) {
    if (confirm(`Bạn có chắc chắn muốn xóa danh mục "${this.customLists[listIdx].title}" không?`)) {
      this.customLists.splice(listIdx, 1);
      this.cdr.detectChanges();
    }
  }

  public deletePlaceFromCustomList(listIdx: number, placeIdx: number) {
    this.customLists[listIdx].places.splice(placeIdx, 1);
    this.cdr.detectChanges();
  }

  public alertNotesDev() {
    alert("Tính năng Ghi chú hành trình tự do đang phát triển! Bạn có thể lưu trữ ghi chú của mình ở đây.");
  }

  public alertPlacesDev() {
    alert("Tính năng lưu trữ các địa điểm đã ghim đang được phát triển!");
  }

  // Drag-to-resize panel layout handler
  public startResizing(event: MouseEvent, type: 'left' | 'right') {
    event.preventDefault();
    this.isResizing = true;
    this.resizeType = type;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!this.isResizing) return;
      if (this.resizeType === 'left') {
        const newWidth = moveEvent.clientX;
        if (newWidth > 200 && newWidth < 450) {
          this.sidebarWidth = newWidth;
          this.cdr.detectChanges();
        }
      } else {
        const containerWidth = window.innerWidth;
        const mapWidthPx = containerWidth - moveEvent.clientX;
        const pct = (mapWidthPx / containerWidth) * 100;
        if (pct > 20 && pct < 60) {
          this.mapWidthPct = pct;
          this.cdr.detectChanges();
          if (this.map) {
            if (typeof this.map.invalidateSize === 'function') {
              this.map.invalidateSize();
            } else if (typeof google !== 'undefined') {
              google.maps.event.trigger(this.map, 'resize');
            }
          }
        }
      }
    };

    const onMouseUp = () => {
      this.isResizing = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  // Place Details Bottom Sheet Helpers
  public getCategoryLabel(type: string): string {
    if (type === 'dining') return 'Ẩn thực / Nhà hàng';
    if (type === 'lodging') return 'Lưu trú / Homestay';
    if (type === 'transport') return 'Di chuyển xanh';
    return 'Địa điểm tham quan';
  }

  public getPlaceWikiDescription(name: string): string {
    if (!name) return "";
    if (name.includes("Hồ Xuân Hương")) return "Hồ Xuân Hương là một hồ nước nhân tạo tuyệt đẹp nằm giữa trung tâm thành phố Đà Lạt, là biểu tượng thơ mộng thu hút hàng triệu lượt du khách ghé thăm mỗi năm.";
    if (name.includes("Lẩu bò Ba Toa")) return "Lẩu bò Ba Toa quán gỗ nổi tiếng với hương vị lẩu bò truyền thống đậm đà, thịt bò tươi ngon, ăn kèm rau xanh tươi của Đà Lạt.";
    if (name.includes("Thác Datanla")) return "Thác Datanla là ngọn thác nổi tiếng với các trò chơi máng trượt xuyên rừng, đu dây vượt thác đầy tính mạo hiểm và thân thiện với thiên nhiên.";
    if (name.includes("Gành Đá Đĩa")) return "Gành Đá Đĩa là kỳ quan thiên nhiên độc nhất vô nhị tại Phú Yên với các cột đá hình lăng trụ xếp chồng lên nhau như những chiếc đĩa khổng lồ.";
    if (name.includes("Mắt cá ngừ")) return "Mắt cá ngừ đại dương bà Tám là món ăn đặc sản trứ danh của tỉnh Phú Yên, hầm thuốc bắc bổ dưỡng thơm ngon.";
    if (name.includes("Bà Nà Hills")) return "Bà Nà Hills nổi tiếng với Cầu Vàng khổng lồ được nâng đỡ bởi đôi bàn tay đá, khu vui chơi giải trí hàng đầu Việt Nam.";
    return "Địa danh du lịch nổi tiếng với cảnh quan thiên nhiên trong lành, cam kết giảm thiểu khí thải carbon, bảo tồn văn hóa và môi trường địa phương.";
  }

  public getPlacePlaceholderImage(name: string): string {
    if (!name) return "image/Viet Nam.png";
    if (name.includes("Hồ Xuân Hương")) return "image/1dc8619487310884c9d631d689ece1e7.jpg";
    if (name.includes("Phú Yên") || name.includes("Gành Đá Đĩa")) return "image/15a0c52a7c13e6fb493d5ce4cb1b644b.jpg";
    if (name.includes("Lẩu bò") || name.includes("Datanla")) return "image/cb4fbf769d60d911e13c255f7fb39dcc.jpg";
    return "image/Viet Nam.png";
  }

  public closePlaceDetails() {
    this.selectedPlaceDetails = null;
    this.cdr.detectChanges();
  }

  public startSheetResizing(event: MouseEvent) {
    event.preventDefault();
    this.isSheetResizing = true;
    const startHeight = this.sheetHeight;
    const startY = event.clientY;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!this.isSheetResizing) return;
      const dy = startY - moveEvent.clientY;
      const newHeight = startHeight + dy;
      if (newHeight > 140 && newHeight < 480) {
        this.sheetHeight = newHeight;
        this.cdr.detectChanges();
      }
    };

    const onMouseUp = () => {
      this.isSheetResizing = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  public startMetricsResizing(event: MouseEvent) {
    event.preventDefault();
    this.isMetricsResizing = true;
    const startHeight = this.metricsHeight;
    const startY = event.clientY;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!this.isMetricsResizing) return;
      const dy = startY - moveEvent.clientY;
      const newHeight = startHeight + dy;
      if (newHeight > 70 && newHeight < 360) {
        this.metricsHeight = newHeight;
        this.cdr.detectChanges();
      }
    };

    const onMouseUp = () => {
      this.isMetricsResizing = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }
}
