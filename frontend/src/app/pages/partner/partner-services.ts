import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { User, Service } from '../../models/models';

@Component({
  selector: 'app-partner-services',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './partner-services.html',
  styleUrls: []
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

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (!user || user.role !== 'provider') {
        this.router.navigate(['/auth']);
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

  public openAddModal() {
    this.isAddModalOpen = true;
  }

  public closeAddModal() {
    this.isAddModalOpen = false;
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

    const newService = {
      id: 'ser_' + Date.now(),
      providerId: providerId,
      name: this.serviceName,
      type: this.serviceType,
      destination: this.serviceDest,
      cost: Number(this.serviceCost),
      carbon: Number(this.serviceCarbon),
      status: 'active',
      badges: ['green']
    };

    const success = await this.apiService.addMyService(newService);
    if (success) {
      alert('Đăng ký dịch vụ xanh thành công!');
      this.isAddModalOpen = false;
      this.serviceName = '';
      this.serviceCost = null;
      this.serviceCarbon = null;
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
}
