import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-booking-lookup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './booking-lookup.html',
})
export class BookingLookupComponent implements OnInit {
  public bookingCode = '';
  public isLoading = false;
  public result: any = null;
  public errorMsg = '';

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef, private route: ActivatedRoute) {}

  ngOnInit() {
    const code = this.route.snapshot.queryParamMap.get('code');
    if (code) {
      this.bookingCode = code;
      this.lookup();
    }
  }

  public async lookup() {
    const code = this.bookingCode.trim();
    if (!code) { this.errorMsg = 'Vui lòng nhập mã đặt chỗ.'; return; }
    this.isLoading = true;
    this.result = null;
    this.errorMsg = '';
    try {
      const data = await this.apiService.getBooking(code);
      if (data) {
        this.result = data;
      } else {
        this.errorMsg = 'Không tìm thấy đơn đặt chỗ với mã này. Vui lòng kiểm tra lại.';
      }
    } catch {
      this.errorMsg = 'Đã xảy ra lỗi. Vui lòng thử lại sau.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  public getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: 'Chờ xác nhận',
      deposit: 'Đã đặt cọc',
      confirmed: 'Đã xác nhận',
      accepted: 'Đã chấp nhận',
      rejected: 'Bị từ chối',
      cancelled: 'Đã hủy',
      completed: 'Hoàn thành',
    };
    return map[status] || status;
  }

  public getStatusClass(status: string): string {
    if (['deposit', 'confirmed', 'accepted', 'completed'].includes(status)) return 'ok';
    if (['rejected', 'cancelled'].includes(status)) return 'bad';
    return 'wait';
  }
}
