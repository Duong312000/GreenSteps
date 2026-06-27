import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { Tour, Itinerary, Service, Booking, WalletInfo, WalletTransaction, CommunityPost, Activity } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private BACKEND_URL = 'http://localhost:5000/api';

  // Fallback static preset tours if backend is offline
  private mockPresetTours: Tour[] = [
    {
      id: "preset_dl_1",
      title: "Tour Đà Lạt Gia Đình 3N2Đ",
      destination: "Đà Lạt",
      days: 3,
      type: "Gia đình",
      cost: 1890000,
      oldCost: 2200000,
      carbon: 45,
      image: "image/1dc8619487310884c9d631d689ece1e7.jpg",
      tags: ["Gia đình", "Phổ biến"],
      description: "Trải nghiệm 3 ngày 2 đêm tuyệt vời tại thành phố ngàn hoa Đà Lạt cùng gia đình. Tour được thiết kế đặc biệt cho các gia đình có trẻ nhỏ.",
      data: [
        [
          { time: "08:00", name: "Đón khách - Khách sạn Dahlia", cost: 0, carbon: 0, icon: "bi-building-fill", type: "lodging", id: "t_dl_1_1" },
          { time: "10:00", name: "Dạo chơi Thung lũng Tình Yêu", cost: 150000, carbon: 3, icon: "bi-tree-fill", type: "attraction", id: "t_dl_1_2" },
          { time: "12:00", name: "Ăn trưa lẩu gà lá é Tao Ngộ", cost: 80000, carbon: 1.5, icon: "bi-cup-hot-fill", type: "dining", id: "t_dl_1_3" },
          { time: "14:00", name: "Ghé Vườn hoa thành phố", cost: 50000, carbon: 1, icon: "bi-tree-fill", type: "attraction", id: "t_dl_1_4" }
        ],
        [
          { time: "08:00", name: "Ăn sáng tại khách sạn", cost: 0, carbon: 0, icon: "bi-cup-hot-fill", type: "dining", id: "t_dl_1_5" },
          { time: "10:00", name: "Trượt máng Thác Datanla", cost: 170000, carbon: 1.2, icon: "bi-tree-fill", type: "attraction", id: "t_dl_1_6" },
          { time: "14:00", name: "Khám phá Làng Cù Lần", cost: 200000, carbon: 2, icon: "bi-tree-fill", type: "attraction", id: "t_dl_1_7" }
        ],
        [
          { time: "08:00", name: "Cafe Săn Mây Đà Lạt", cost: 80000, carbon: 0.5, icon: "bi-cup-hot-fill", type: "dining", id: "t_dl_1_8" },
          { time: "11:00", name: "Mua sắm đặc sản chợ Đà Lạt", cost: 100000, carbon: 1, icon: "bi-cup-hot-fill", type: "dining", id: "t_dl_1_9" }
        ]
      ]
    },
    {
      id: "preset_py_2",
      title: "Tour Phú Yên Biển Xanh 3N2Đ",
      destination: "Phú Yên",
      days: 3,
      type: "Trải nghiệm",
      cost: 1890000,
      oldCost: 2900000,
      carbon: 15,
      image: "image/Viet Nam.png",
      tags: ["Biển xanh", "Đặc sắc"],
      description: "Khám phá trọn vẹn Phú Yên hoang sơ: check-in Gành Đá Đĩa kì thú, thưởng thức hải sản ngon đầm Ô Loan và ngắm hoàng hôn Mũi Điện.",
      data: [
        [
          { time: "08:00", name: "Xe limousine đưa đón Tuy Hòa", cost: 150000, carbon: 8, icon: "bi-bus-front-fill", type: "transport", id: "t_py_2_1" },
          { time: "12:00", name: "Check-in Homestay Hoa Vàng", cost: 400000, carbon: 3, icon: "bi-house-door-fill", type: "lodging", id: "t_py_2_2" },
          { time: "18:00", name: "Hải sản đầm Ô Loan", cost: 250000, carbon: 2, icon: "bi-cup-hot-fill", type: "dining", id: "t_py_2_3" }
        ],
        [
          { time: "08:00", name: "Trekking Gành Đá Đĩa hoang sơ", cost: 150000, carbon: 0, icon: "bi-tree-fill", type: "attraction", id: "t_py_2_4" },
          { time: "14:00", name: "Tham quan Tháp Nhạn", cost: 50000, carbon: 0.5, icon: "bi-tree-fill", type: "attraction", id: "t_py_2_5" },
          { time: "16:30", name: "Xe máy điện dạo quanh bờ kè", cost: 60000, carbon: 0.1, icon: "bi-scooter", type: "transport", id: "t_py_2_6" }
        ],
        [
          { time: "09:00", name: "Mua sắm đặc sản Tuy Hòa", cost: 100000, carbon: 1, icon: "bi-cup-hot-fill", type: "dining", id: "t_py_2_7" },
          { time: "11:30", name: "Ăn mắt cá ngừ đại dương hầm thuốc bắc", cost: 80000, carbon: 0.8, icon: "bi-cup-hot-fill", type: "dining", id: "t_py_2_8" }
        ]
      ]
    },
    {
      id: "preset_dn_2",
      title: "Đà Nẵng - Hội An Văn Hóa",
      destination: "Đà Nẵng - Hội An",
      days: 4,
      type: "Trải nghiệm",
      cost: 3990000,
      oldCost: 4500000,
      carbon: 32,
      image: "image/Viet Nam.png",
      tags: ["Phố cổ Hội An", "Chùa Cầu", "Làng nghề"],
      description: "Hành trình di sản độc đáo: check-in Cầu Vàng Bà Nà Hills, dạo bước Phố cổ Hội An lung linh đèn lồng và trải nghiệm làm đèn lồng giấy.",
      data: [
        [
          { time: "09:00", name: "Xe limousine đón tiễn sân bay", cost: 150000, carbon: 4, icon: "bi-bus-front-fill", type: "transport", id: "t_dn_2_1" },
          { time: "13:00", name: "Check-in khách sạn sinh thái Hội An", cost: 800000, carbon: 5, icon: "bi-building-fill", type: "lodging", id: "t_dn_2_2" },
          { time: "18:00", name: "Ẩm thực phố cổ Cao lầu, cơm gà", cost: 200000, carbon: 1.5, icon: "bi-cup-hot-fill", type: "dining", id: "t_dn_2_3" }
        ],
        [
          { time: "08:00", name: "Check-in Cầu Vàng nổi tiếng Bà Nà", cost: 900000, carbon: 6, icon: "bi-tree-fill", type: "attraction", id: "t_dn_2_4" },
          { time: "12:30", name: "Buffet truyền thống miền Trung", cost: 300000, carbon: 3, icon: "bi-cup-hot-fill", type: "dining", id: "t_dn_2_5" },
          { time: "18:00", name: "Thưởng thức lẩu hải sản Đà Nẵng", cost: 300000, carbon: 3, icon: "bi-cup-hot-fill", type: "dining", id: "t_dn_2_6" }
        ],
        [
          { time: "09:00", name: "Dạo bộ tham quan Phố cổ Hội An", cost: 120000, carbon: 0, icon: "bi-tree-fill", type: "attraction", id: "t_dn_2_7" },
          { time: "15:00", name: "Xe đạp dạo chơi vườn rau hữu cơ Trà Quế", cost: 50000, carbon: 0, icon: "bi-bicycle", type: "transport", id: "t_dn_2_8" },
          { time: "18:00", name: "Tham gia lớp học làm đèn lồng giấy", cost: 150000, carbon: 0.2, icon: "bi-palette-fill", type: "attraction", id: "t_dn_2_9" }
        ],
        [
          { time: "09:00", name: "Khám phá rừng dừa thúng Bảy Mẫu", cost: 150000, carbon: 0.5, icon: "bi-tsunami", type: "attraction", id: "t_dn_2_10" },
          { time: "12:00", name: "Mua sắm quà lưu niệm & tiễn khách", cost: 100000, carbon: 1, icon: "bi-bag-fill", type: "dining", id: "t_dn_2_11" }
        ]
      ]
    }
  ];

  constructor(private http: HttpClient) {}

  private mapTourToFrontend(tour: any): Tour {
    return {
      id: tour.id,
      title: tour.title,
      destination: tour.destination,
      days: tour.days,
      type: tour.badges && tour.badges.includes('Gia đình') ? 'Gia đình' : 
            tour.badges && tour.badges.includes('Trải nghiệm') ? 'Trải nghiệm' :
            tour.badges && tour.badges.includes('Tiết kiệm') ? 'Tiết kiệm' : 'Nghỉ dưỡng',
      cost: Number(tour.cost),
      oldCost: Number(tour.old_cost || tour.oldCost || tour.cost * 1.2),
      image: tour.image_url || tour.image,
      tags: tour.badges || tour.tags || [],
      rating: Number(tour.rating || 5.0),
      votes: Number(tour.votes_count || tour.votes || 0),
      carbon: Number(tour.carbon || 0),
      data: tour.data || []
    };
  }

  // 1. Tours APIs
  public async getPresetTours(): Promise<Tour[]> {
    try {
      const res = await firstValueFrom(this.http.get<any[]>(`${this.BACKEND_URL}/tours`));
      if (res && res.length > 0) {
        return res.map(t => this.mapTourToFrontend(t));
      }
    } catch (e) {
      console.warn('Backend tours endpoint offline. Using fallback preset tours...');
    }
    return this.mockPresetTours;
  }

  public async getPresetTour(id: string): Promise<Tour | null> {
    const cleanId = String(id).replace('preset_', '');
    try {
      const tours = await this.getPresetTours();
      return tours.find(t => t.id === id || String(t.id).replace('preset_', '') === cleanId) || null;
    } catch (e) {
      return null;
    }
  }

  // 2. Itineraries APIs
  public async getItineraries(userId: string): Promise<Itinerary[]> {
    try {
      const res = await firstValueFrom(this.http.get<any[]>(`${this.BACKEND_URL}/itineraries/user/${userId}`));
      return res.map(iti => ({
        id: iti.id,
        name: iti.name,
        user_id: iti.user_id || iti.userId || userId,
        destination: iti.destination,
        days: iti.days,
        totalCost: iti.totalCost || iti.total_cost || 0,
        totalCarbon: iti.totalCarbon || iti.total_carbon || 0,
        daysData: iti.daysData || iti.days_data || []
      }));
    } catch (e) {
      console.warn('Failed to load itineraries from server, reading local mockup instead.');
      return [];
    }
  }

  public async getItinerary(id: string): Promise<Itinerary | null> {
    try {
      const iti = await firstValueFrom(this.http.get<any>(`${this.BACKEND_URL}/itineraries/${id}`));
      return {
        id: iti.id,
        name: iti.name,
        user_id: iti.user_id || iti.userId || '',
        destination: iti.destination,
        days: iti.days,
        totalCost: iti.totalCost || iti.total_cost || 0,
        totalCarbon: iti.totalCarbon || iti.total_carbon || 0,
        daysData: iti.daysData || iti.days_data || []
      };
    } catch (e) {
      console.warn('Failed to fetch itinerary from server:', e);
      return null;
    }
  }

  public async saveItinerary(itinerary: Itinerary): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.post(`${this.BACKEND_URL}/itineraries`, {
          id: itinerary.id,
          name: itinerary.name,
          user_id: itinerary.user_id,
          destination: itinerary.destination,
          days: itinerary.days,
          totalCost: itinerary.totalCost,
          totalCarbon: itinerary.totalCarbon,
          daysData: itinerary.daysData
        })
      );
      return true;
    } catch (e) {
      console.error('Error saving itinerary to server:', e);
      return false;
    }
  }

  public async deleteItinerary(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete(`${this.BACKEND_URL}/itineraries/${id}`));
      return true;
    } catch (e) {
      console.error('Error deleting itinerary:', e);
      return false;
    }
  }

  // 3. Wallet APIs
  public async getWalletInfo(userId: string): Promise<WalletInfo> {
    try {
      return await firstValueFrom(this.http.get<WalletInfo>(`${this.BACKEND_URL}/wallet/${userId}`));
    } catch (e) {
      return { registered: false, balance: 0 };
    }
  }

  public async activateWallet(userId: string): Promise<{ success: boolean; balance: number }> {
    try {
      const res = await firstValueFrom(this.http.post<{ success: boolean; balance: number }>(`${this.BACKEND_URL}/wallet/activate`, { userId }));
      return res;
    } catch (e) {
      return { success: false, balance: 0 };
    }
  }

  public async depositMoney(userId: string, amount: number): Promise<{ success: boolean; balance: number }> {
    try {
      const res = await firstValueFrom(this.http.post<{ success: boolean; balance: number }>(`${this.BACKEND_URL}/wallet/deposit`, { userId, amount }));
      return res;
    } catch (e) {
      return { success: false, balance: 0 };
    }
  }

  public async payItinerary(userId: string, itineraryId: string, amount: number): Promise<{ success: boolean; balance: number; message?: string }> {
    try {
      const res = await firstValueFrom(
        this.http.post<{ success: boolean; balance: number; message?: string }>(`${this.BACKEND_URL}/wallet/pay`, { userId, itineraryId, amount })
      );
      return res;
    } catch (e: any) {
      return { success: false, balance: 0, message: e?.error?.message || 'Lỗi thanh toán!' };
    }
  }

  public async getTransactions(userId: string): Promise<WalletTransaction[]> {
    try {
      return await firstValueFrom(this.http.get<WalletTransaction[]>(`${this.BACKEND_URL}/wallet/transactions/${userId}`));
    } catch (e) {
      return [];
    }
  }

  // 4. Community APIs
  public async getCommunityPosts(): Promise<CommunityPost[]> {
    try {
      return await firstValueFrom(this.http.get<CommunityPost[]>(`${this.BACKEND_URL}/community/posts`));
    } catch (e) {
      return [];
    }
  }

  public async addCommunityPost(postData: any): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post(`${this.BACKEND_URL}/community/posts`, postData));
      return true;
    } catch (e) {
      return false;
    }
  }

  // 5. Services & Bookings APIs
  public async getServices(): Promise<Service[]> {
    try {
      return await firstValueFrom(this.http.get<Service[]>(`${this.BACKEND_URL}/services`));
    } catch (e) {
      return [];
    }
  }

  public async getMyServices(providerId: string): Promise<Service[]> {
    try {
      return await firstValueFrom(this.http.get<Service[]>(`${this.BACKEND_URL}/services/provider/${providerId}`));
    } catch (e) {
      return [];
    }
  }

  public async addMyService(serviceData: any): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post(`${this.BACKEND_URL}/services`, serviceData));
      return true;
    } catch (e) {
      return false;
    }
  }

  public async getBookings(providerId?: string, customerId?: string): Promise<Booking[]> {
    try {
      let query = '';
      if (providerId) query = `providerId=${providerId}`;
      else if (customerId) query = `customerId=${customerId}`;
      return await firstValueFrom(this.http.get<Booking[]>(`${this.BACKEND_URL}/bookings?${query}`));
    } catch (e) {
      return [];
    }
  }

  public async createBooking(bookingData: any): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post(`${this.BACKEND_URL}/bookings`, bookingData));
      return true;
    } catch (e) {
      return false;
    }
  }

  public async approveBooking(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post(`${this.BACKEND_URL}/bookings/${id}/approve`, {}));
      return true;
    } catch (e) {
      return false;
    }
  }

  public async rejectBooking(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post(`${this.BACKEND_URL}/bookings/${id}/reject`, {}));
      return true;
    } catch (e) {
      return false;
    }
  }
}
