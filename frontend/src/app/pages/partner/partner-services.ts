import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LoginModalService } from '../../services/login-modal.service';
import { User, Service } from '../../models/models';

@Component({
  selector: 'app-partner-services',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './partner-services.html',
})
export class PartnerServicesComponent implements OnInit {
  public currentUser: User | null = null;
  public myServices: Service[] = [];

  // Add Service Form
  public isAddModalOpen: boolean = false;
  public serviceName: string = '';
  public serviceType: string = 'stay';
  public serviceCost: number | null = null;
  public serviceCarbon: number | null = null;
  public serviceDest: string = 'Đà Lạt';
  public serviceAddress: string = '';
  public selectedBadges: string[] = ['green'];

  // Filters State
  public searchQuery: string = '';
  public selectedTypes: string[] = [];
  public selectedLocations: string[] = [];
  public selectedStatuses: string[] = [];

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
        this.loadServices();
      }
      this.cdr.detectChanges();
    });
  }

  public async loadServices() {
    if (!this.currentUser) return;
    const providerId = this.currentUser.id || this.currentUser._id || '';
    this.myServices = await this.apiService.getMyServices(providerId);
    this.cdr.detectChanges();
  }

  // Filter actions
  public toggleTypeFilter(type: string) {
    if (this.selectedTypes.includes(type)) {
      this.selectedTypes = this.selectedTypes.filter(t => t !== type);
    } else {
      this.selectedTypes.push(type);
    }
    this.cdr.detectChanges();
  }

  public toggleLocationFilter(loc: string) {
    if (this.selectedLocations.includes(loc)) {
      this.selectedLocations = this.selectedLocations.filter(l => l !== loc);
    } else {
      this.selectedLocations.push(loc);
    }
    this.cdr.detectChanges();
  }

  public toggleStatusFilter(status: string) {
    if (this.selectedStatuses.includes(status)) {
      this.selectedStatuses = this.selectedStatuses.filter(s => s !== status);
    } else {
      this.selectedStatuses.push(status);
    }
    this.cdr.detectChanges();
  }

  public clearAllFilters() {
    this.selectedTypes = [];
    this.selectedLocations = [];
    this.selectedStatuses = [];
    this.searchQuery = '';
    this.cdr.detectChanges();
  }

  public get filteredServices(): Service[] {
    return this.myServices.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchType = this.selectedTypes.length === 0 || this.selectedTypes.includes(s.type);
      const matchLocation = this.selectedLocations.length === 0 || this.selectedLocations.includes(s.destination);
      
      // Default all items to active if status is missing
      const status = s.status || 'active';
      const matchStatus = this.selectedStatuses.length === 0 || this.selectedStatuses.includes(status);
      
      return matchSearch && matchType && matchLocation && matchStatus;
    });
  }

  // Count calculations
  public get totalCount(): number {
    return this.myServices.length;
  }

  public get activeCount(): number {
    return this.myServices.filter(s => !s.status || s.status === 'active').length;
  }

  public get pendingCount(): number {
    return this.myServices.filter(s => s.status === 'pending').length;
  }

  public get rejectedCount(): number {
    return this.myServices.filter(s => s.status === 'rejected' || s.status === 'hidden').length;
  }

  public getServiceImage(srv: Service): string {
    if (srv.type === 'stay') {
      return 'image/1dc8619487310884c9d631d689ece1e7.jpg';
    } else if (srv.type === 'food') {
      return 'image/41a413334d9e3753b26c50f3a3921309.jpg';
    } else if (srv.type === 'transport') {
      return 'image/greensteps_logo.png';
    }
    return 'image/Gemini_Generated_Image_szp1ouszp1ouszp1.png';
  }

  public openAddModal() {
    this.isAddModalOpen = true;
    this.serviceName = '';
    this.serviceCost = null;
    this.serviceCarbon = null;
    this.serviceAddress = '';
  }

  public closeAddModal() {
    this.isAddModalOpen = false;
  }

  public toggleBadge(badge: string) {
    const idx = this.selectedBadges.indexOf(badge);
    if (idx >= 0) {
      this.selectedBadges.splice(idx, 1);
    } else {
      this.selectedBadges.push(badge);
    }
    this.cdr.detectChanges();
  }

  public exportServicesList() {
    let csv = "Tên dịch vụ,Loại hình,Khu vực,Giá dịch vụ\n";
    this.myServices.forEach(srv => {
      csv += `"${srv.name}","${srv.type}","${srv.destination}",${srv.cost}\n`;
    });

    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "danh_sach_dich_vu.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  public async submitNewService(event: Event) {
    event.preventDefault();
    if (!this.currentUser) return;

    const providerId = this.currentUser.id || this.currentUser._id || '';
    const categoryMap: Record<string, string> = { stay: 'Lưu trú', food: 'Ăn uống', tour: 'Khám phá', transport: 'Di chuyển', attraction: 'Khám phá' };

    let resolvedLat: number | null = null;
    let resolvedLng: number | null = null;

    // Resolve address to GPS coordinates using Nominatim API behind the scenes
    if (this.serviceAddress) {
      try {
        const query = `${this.serviceAddress}, ${this.serviceDest}, Vietnam`;
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
        
        const res = await Promise.race([
          fetch(url, { headers: { 'User-Agent': 'GreenStepsApp/1.0' } }).then(r => r.json()),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1200))
        ]) as any[];

        if (res && res.length > 0) {
          resolvedLat = parseFloat(res[0].lat);
          resolvedLng = parseFloat(res[0].lon);
        }
      } catch (e) {
        console.warn('Geocoding failed, falling back to null', e);
      }
    }

    const newService = {
      id: 'ser_' + Date.now(),
      providerId: providerId,
      name: this.serviceName,
      type: this.serviceType,
      destination: this.serviceDest,
      cost: Number(this.serviceCost),
      carbon: Number(this.serviceCarbon),
      lat: resolvedLat,
      lng: resolvedLng,
      address: this.serviceAddress,
      category: categoryMap[this.serviceType] || 'Khám phá',
      badges: ['green'], // Assigned by system/admin by default
      status: 'active'
    };

    const success = await this.apiService.addMyService(newService);
    if (success) {
      alert('Đăng ký dịch vụ xanh thành công!');
      this.isAddModalOpen = false;
      this.serviceName = '';
      this.serviceCost = null;
      this.serviceCarbon = null;
      this.serviceAddress = '';
      await this.loadServices();
    } else {
      alert('Có lỗi xảy ra khi thêm dịch vụ. Vui lòng kiểm tra lại!');
    }
    this.cdr.detectChanges();
  }

  public getActivityTypeLabel(type: string): string {
    if (type === "stay" || type === "lodging") return "Nơi lưu trú";
    if (type === "food" || type === "dining") return "Ăn uống";
    if (type === "transport") return "Di chuyển";
    return "Trải nghiệm / Tour";
  }

  public onCostOrTypeChange() {
    if (this.serviceCost === null || this.serviceCost === undefined || this.serviceCost <= 0) {
      this.serviceCarbon = null;
      return;
    }
    const cost = Number(this.serviceCost);
    let calculated = 0;
    switch (this.serviceType) {
      case 'stay':
        calculated = 2.5 + Math.min(7.5, cost / 500000);
        break;
      case 'food':
        calculated = 1.0 + Math.min(4.0, cost / 300000);
        break;
      case 'transport':
        calculated = 0.5 + Math.min(7.5, cost / 200000);
        break;
      case 'attraction':
      default:
        calculated = 1.0 + Math.min(14.0, cost / 200000);
        break;
    }
    this.serviceCarbon = Math.round(calculated * 10) / 10;
    this.cdr.detectChanges();
  }
}
