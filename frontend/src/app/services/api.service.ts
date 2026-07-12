import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Tour, Itinerary, Service, Booking, WalletInfo, WalletTransaction, CommunityPost, Notification } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private BACKEND_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5055/api' 
    : 'https://greensteps-6swn.onrender.com/api';

  private cache = new Map<string, { data: any; expiry: number }>();

  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }
    return cached.data;
  }

  private setCachedData(key: string, data: any, ttlMs: number = 300000): void {
    this.cache.set(key, { data, expiry: Date.now() + ttlMs });
  }

  public clearCache(prefix?: string): void {
    if (!prefix) {
      this.cache.clear();
    } else {
      for (const key of this.cache.keys()) {
        if (key.startsWith(prefix)) {
          this.cache.delete(key);
        }
      }
    }
  }

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
  public async getPresetTours(userId?: string): Promise<Tour[]> {
    const cacheKey = `preset_tours_${userId || 'guest'}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    const url = userId ? `${this.BACKEND_URL}/tours?userId=${userId}` : `${this.BACKEND_URL}/tours`;
    const res = await firstValueFrom(this.http.get<any[]>(url));
    const data = (res || []).map(t => this.mapTourToFrontend(t));
    this.setCachedData(cacheKey, data);
    return data;
  }

  public async getPresetTour(id: string): Promise<Tour | null> {
    const cacheKey = `preset_tour_${id}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const cleanId = String(id).replace('preset_', '');
      const t = await firstValueFrom(this.http.get<any>(`${this.BACKEND_URL}/tours/${cleanId}`));
      if (t) {
        const tour = this.mapTourToFrontend(t);
        this.setCachedData(cacheKey, tour);
        return tour;
      }
      return null;
    } catch (e) {
      console.warn('Failed to fetch preset tour details, falling back:', e);
      const cleanId = String(id).replace('preset_', '');
      const tours = await this.getPresetTours();
      const tour = tours.find(t => t.id === id || String(t.id).replace('preset_', '') === cleanId) || null;
      if (tour) {
        this.setCachedData(cacheKey, tour);
      }
      return tour;
    }
  }

  // 2. Itineraries APIs
  public async getItineraries(userId: string): Promise<Itinerary[]> {
    const cacheKey = `itineraries_${userId}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const res = await firstValueFrom(this.http.get<any[]>(`${this.BACKEND_URL}/itineraries/user/${userId}`));
      const data = res.map(iti => ({
        id: iti.id,
        name: iti.name,
        user_id: iti.user_id || iti.userId || userId,
        destination: iti.destination,
        days: iti.days,
        totalCost: iti.totalCost || iti.total_cost || 0,
        totalCarbon: iti.totalCarbon || iti.total_carbon || 0,
        daysData: iti.daysData || iti.days_data || [],
        status: iti.status || 'draft',
        deposit_deadline: iti.deposit_deadline || null,
        start_date: iti.start_date || null,
        end_date: iti.end_date || null,
        companion_email: iti.companion_email || null
      }));
      this.setCachedData(cacheKey, data);
      return data;
    } catch (e) {
      console.warn('Failed to load itineraries from server, reading local mockup instead.');
      return [];
    }
  }

  public async getItinerary(id: string): Promise<Itinerary | null> {
    const cacheKey = `itinerary_${id}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const iti = await firstValueFrom(this.http.get<any>(`${this.BACKEND_URL}/itineraries/${id}`));
      const data = {
        id: iti.id,
        name: iti.name,
        user_id: iti.user_id || iti.userId || '',
        destination: iti.destination,
        days: iti.days,
        totalCost: iti.totalCost || iti.total_cost || 0,
        totalCarbon: iti.totalCarbon || iti.total_carbon || 0,
        daysData: iti.daysData || iti.days_data || [],
        status: iti.status || 'draft',
        deposit_deadline: iti.deposit_deadline || null,
        start_date: iti.start_date || null,
        end_date: iti.end_date || null,
        companion_email: iti.companion_email || null
      };
      this.setCachedData(cacheKey, data);
      return data;
    } catch (e) {
      console.warn('Failed to fetch itinerary from server:', e);
      return null;
    }
  }

  public async saveItinerary(itinerary: Itinerary): Promise<boolean> {
    this.clearCache('itineraries_');
    this.clearCache(`itinerary_${itinerary.id}`);

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
          daysData: itinerary.daysData,
          status: itinerary.status,
          deposit_deadline: itinerary.deposit_deadline,
          start_date: itinerary.start_date,
          end_date: itinerary.end_date,
          companion_email: itinerary.companion_email
        })
      );
      return true;
    } catch (e) {
      console.error('Error saving itinerary to server:', e);
      return false;
    }
  }


  // Notifications APIs
  public async getNotifications(userId: string): Promise<Notification[]> {
    try {
      return await firstValueFrom(
        this.http.get<Notification[]>(`${this.BACKEND_URL}/notifications/user/${userId}`)
      );
    } catch (e) {
      console.error('Error fetching notifications:', e);
      return [];
    }
  }

  public async markNotificationRead(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post(`${this.BACKEND_URL}/notifications/${id}/read`, {}));
      return true;
    } catch (e) {
      console.error('Error marking notification read:', e);
      return false;
    }
  }

  public async markAllNotificationsRead(userId: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post(`${this.BACKEND_URL}/notifications/user/${userId}/read-all`, {}));
      return true;
    } catch (e) {
      console.error('Error marking all notifications read:', e);
      return false;
    }
  }

  public async clearNotifications(userId: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete(`${this.BACKEND_URL}/notifications/user/${userId}`));
      return true;
    } catch (e) {
      console.error('Error clearing notifications:', e);
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
      const res = await firstValueFrom(this.http.get<{ success: boolean; wallet: WalletInfo }>(`${this.BACKEND_URL}/wallet/${userId}`));
      return res.success ? res.wallet : { registered: false, balance: 0 };
    } catch (e) {
      return { registered: false, balance: 0 };
    }
  }

  public async activateWallet(userId: string): Promise<{ success: boolean; balance: number; message?: string }> {
    try {
      const res = await firstValueFrom(this.http.post<{ success: boolean; balance: number; message?: string }>(`${this.BACKEND_URL}/wallet/activate`, { userId }));
      return res;
    } catch (e) {
      return { success: false, balance: 0 };
    }
  }

  public async depositMoney(userId: string, amount: number): Promise<{ success: boolean; balance: number; message?: string }> {
    try {
      const res = await firstValueFrom(this.http.post<{ success: boolean; balance: number; message?: string }>(`${this.BACKEND_URL}/wallet/deposit`, { userId, amount }));
      return res;
    } catch (e) {
      return { success: false, balance: 0 };
    }
  }

  public async getTransactionStatus(txId: string): Promise<{ success: boolean; status: string; balance: number }> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ success: boolean; status: string; balance: number }>(`${this.BACKEND_URL}/wallet/transaction-status/${txId}`)
      );
      return res;
    } catch (e) {
      return { success: false, status: 'error', balance: 0 };
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

  public async payItineraryQr(userId: string, itineraryId: string, amount: number): Promise<{ success: boolean; balance: number; message?: string }> {
    try {
      const res = await firstValueFrom(
        this.http.post<{ success: boolean; balance: number; message?: string }>(`${this.BACKEND_URL}/wallet/pay-qr`, { userId, itineraryId, amount })
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
  public async getCommunityPosts(page = 0, limit = 15): Promise<CommunityPost[]> {
    try {
      return await firstValueFrom(this.http.get<CommunityPost[]>(`${this.BACKEND_URL}/community/posts?page=${page}&limit=${limit}`));
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

  public async deleteCommunityPost(postId: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete(`${this.BACKEND_URL}/community/posts/${postId}`));
      return true;
    } catch (e) {
      return false;
    }
  }

  public async cloneItinerary(id: string, userId: string): Promise<any> {
    try {
      return await firstValueFrom(
        this.http.post<any>(`${this.BACKEND_URL}/itineraries/${id}/clone`, { userId })
      );
    } catch (e) {
      return { success: false, message: 'Lỗi sao chép lịch trình.' };
    }
  }

  // 5. Services & Bookings APIs
  public async getServices(): Promise<Service[]> {
    const cacheKey = 'services_all';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const data = await firstValueFrom(this.http.get<Service[]>(`${this.BACKEND_URL}/services`));
      this.setCachedData(cacheKey, data);
      return data;
    } catch (e) {
      return [];
    }
  }

  public async getServicesByDestination(destination: string): Promise<any[]> {
    const cacheKey = `services_dest_${destination}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const data = await firstValueFrom(this.http.get<any[]>(`${this.BACKEND_URL}/services?destination=${encodeURIComponent(destination)}`));
      this.setCachedData(cacheKey, data);
      return data;
    } catch (e) {
      return [];
    }
  }

  public async getMyServices(providerId: string): Promise<Service[]> {
    try {
      return await firstValueFrom(this.http.get<Service[]>(`${this.BACKEND_URL}/services/provider/${providerId}`, { withCredentials: true }));
    } catch (e) {
      return [];
    }
  }

  public async addMyService(serviceData: any): Promise<boolean> {
    this.clearCache('services_');

    try {
      await firstValueFrom(this.http.post(`${this.BACKEND_URL}/services`, serviceData, { withCredentials: true }));
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

  public async createBooking(bookingData: any): Promise<{ success: boolean; bookingId?: string; message?: string }> {
    try {
      const res = await firstValueFrom(this.http.post<any>(`${this.BACKEND_URL}/bookings`, bookingData));
      return { success: true, bookingId: res.bookingId, message: res.message };
    } catch (e: any) {
      return { success: false, message: e?.error?.message || 'Có lỗi xảy ra khi tạo đặt chỗ.' };
    }
  }

  public async approveBooking(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post(`${this.BACKEND_URL}/bookings/${id}/approve`, {}, { withCredentials: true }));
      return true;
    } catch (e) {
      return false;
    }
  }

  public async rejectBooking(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post(`${this.BACKEND_URL}/bookings/${id}/reject`, {}, { withCredentials: true }));
      return true;
    } catch (e) {
      return false;
    }
  }

  // 5. Reviews & Ratings APIs
  public async getTourReviews(tourId: string): Promise<any[]> {
    try {
      const cleanId = String(tourId).replace('preset_', '');
      return await firstValueFrom(this.http.get<any[]>(`${this.BACKEND_URL}/reviews/tour/${cleanId}`));
    } catch (e) {
      console.error('Failed to load tour reviews:', e);
      return [];
    }
  }

  public async postTourReview(reviewData: { userId: string; tourId: string; rating?: number | null; text: string; parentCommentId?: string | null }): Promise<any> {
    const cleanId = String(reviewData.tourId).replace('preset_', '');
    const data = { ...reviewData, tourId: cleanId };
    return await firstValueFrom(this.http.post<any>(`${this.BACKEND_URL}/reviews/tour`, data));
  }

  public async likeComment(commentId: string): Promise<any> {
    try {
      return await firstValueFrom(this.http.post<any>(`${this.BACKEND_URL}/reviews/${commentId}/like`, {}));
    } catch (e) {
      console.error('Failed to like comment:', e);
      return null;
    }
  }

  public async getServiceReviews(serviceId: string): Promise<any[]> {
    try {
      return await firstValueFrom(this.http.get<any[]>(`${this.BACKEND_URL}/reviews/service/${serviceId}`));
    } catch (e) {
      console.error('Failed to load service reviews:', e);
      return [];
    }
  }

  public async postServiceReview(reviewData: { userId: string; serviceId: string; rating: number; text: string }): Promise<any> {
    return await firstValueFrom(this.http.post<any>(`${this.BACKEND_URL}/reviews/service`, reviewData));
  }

  // 6. Recommendation APIs
  public async getDestinations(): Promise<string[]> {
    try {
      return await firstValueFrom(this.http.get<string[]>(`${this.BACKEND_URL}/destinations`));
    } catch (e) {
      return ['Đà Lạt', 'Phú Yên', 'Đà Nẵng - Hội An']; // fallback
    }
  }

  public async getRecommendedTours(userId: string): Promise<Tour[]> {
    try {
      const res = await firstValueFrom(this.http.get<any[]>(`${this.BACKEND_URL}/recommendations/tours/${userId}`));
      return (res || []).map(t => this.mapTourToFrontend(t));
    } catch (e) {
      return this.getPresetTours(); // fallback
    }
  }

  public async getRecommendedServices(userId: string): Promise<Service[]> {
    try {
      return await firstValueFrom(this.http.get<Service[]>(`${this.BACKEND_URL}/recommendations/services/${userId}`));
    } catch (e) {
      return this.getServices(); // fallback
    }
  }

  public async sendAiMessage(message: string, destination: string, currentActivities: any[]): Promise<any> {
    try {
      return await firstValueFrom(
        this.http.post<any>(`${this.BACKEND_URL}/ai/chat`, { message, destination, currentActivities })
      );
    } catch (e) {
      console.error('Failed to send AI message:', e);
      throw e;
    }
  }

  // 7. B2B partner stats & withdrawal API calls
  public async requestWithdrawal(amount: number, bankName: string, bankAccount: string, accountHolder: string): Promise<{ success: boolean; message: string }> {
    try {
      return await firstValueFrom(
        this.http.post<any>(`${this.BACKEND_URL}/wallet/withdraw`, { amount, bankName, bankAccount, accountHolder })
      );
    } catch (e: any) {
      return { success: false, message: e?.error?.message || 'Lỗi gửi yêu cầu rút tiền!' };
    }
  }

  public async getPartnerStats(): Promise<any> {
    try {
      return await firstValueFrom(this.http.get<any>(`${this.BACKEND_URL}/partner/stats`));
    } catch (e: any) {
      return { success: false, message: e?.error?.message || 'Lỗi tải báo cáo đối soát!' };
    }
  }

  public async checkInEVoucher(evoucherCode: string): Promise<{ success: boolean; message: string }> {
    try {
      return await firstValueFrom(
        this.http.post<any>(`${this.BACKEND_URL}/bookings/checkin`, { evoucherCode })
      );
    } catch (e: any) {
      return { success: false, message: e?.error?.message || 'Lỗi xác thực E-Voucher!' };
    }
  }

  public async cancelBooking(bookingId: string): Promise<{ success: boolean; message: string }> {
    try {
      return await firstValueFrom(
        this.http.post<any>(`${this.BACKEND_URL}/bookings/cancel`, { bookingId })
      );
    } catch (e: any) {
      return { success: false, message: e?.error?.message || 'Lỗi hủy đơn đặt chỗ!' };
    }
  }

  public async registerPartner(nameProvider: string, field: string, destination: string, contractText: string): Promise<{ success: boolean; message: string }> {
    try {
      return await firstValueFrom(
        this.http.post<any>(`${this.BACKEND_URL}/partner/register`, { nameProvider, field, destination, contractText })
      );
    } catch (e: any) {
      return { success: false, message: e?.error?.message || 'Lỗi đăng ký đối tác!' };
    }
  }

  // 8. Points & Voucher API calls
  public async redeemVoucher(): Promise<{ success: boolean; message: string; voucher?: any; remainingPoints?: number }> {
    try {
      return await firstValueFrom(
        this.http.post<any>(`${this.BACKEND_URL}/vouchers/redeem`, {})
      );
    } catch (e: any) {
      return { success: false, message: e?.error?.message || 'Lỗi quy đổi điểm xanh!' };
    }
  }

  public async getMyVouchers(): Promise<any[]> {
    try {
      const res = await firstValueFrom(this.http.get<{ success: boolean; vouchers: any[] }>(`${this.BACKEND_URL}/vouchers/my`));
      return res.success ? res.vouchers : [];
    } catch (e) {
      return [];
    }
  }

  public async validateVoucher(code: string): Promise<{ success: boolean; message: string; discount?: number }> {
    try {
      return await firstValueFrom(
        this.http.post<any>(`${this.BACKEND_URL}/vouchers/validate`, { code })
      );
    } catch (e: any) {
      return { success: false, message: e?.error?.message || 'Mã Voucher không hợp lệ!' };
    }
  }

  // 9. Community engagement likes & comments
  public async likePost(postId: string): Promise<{ success: boolean; likes: number }> {
    try {
      return await firstValueFrom(this.http.post<{ success: boolean; likes: number }>(`${this.BACKEND_URL}/community/posts/${postId}/like`, {}));
    } catch (e) {
      return { success: false, likes: 0 };
    }
  }

  public async addPostComment(postId: string, text: string, parentCommentId?: string, userId?: string, fullname?: string, imageUrl?: string): Promise<{ success: boolean; comment: any }> {
    try {
      return await firstValueFrom(
        this.http.post<any>(`${this.BACKEND_URL}/community/posts/${postId}/comments`, { text, parentCommentId, userId, fullname, imageUrl })
      );
    } catch (e: any) {
      return { success: false, comment: null };
    }
  }

  public async getPostComments(postId: string): Promise<any[]> {
    try {
      return await firstValueFrom(this.http.get<any[]>(`${this.BACKEND_URL}/community/posts/${postId}/comments`));
    } catch (e) {
      return [];
    }
  }

  public async uploadImageBase64(base64Data: string): Promise<{ success: boolean; url: string }> {
    try {
      return await firstValueFrom(
        this.http.post<any>(`${this.BACKEND_URL}/upload-base64`, { base64: base64Data })
      );
    } catch (e) {
      return { success: false, url: '' };
    }
  }

  // Admin APIs
  public async getPendingProviders(): Promise<any[]> {
    try {
      return await firstValueFrom(this.http.get<any[]>(`${this.BACKEND_URL}/partner/pending`, { withCredentials: true }));
    } catch (e) {
      return [];
    }
  }

  public async approveProvider(targetUserId: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post(`${this.BACKEND_URL}/partner/approve`, { targetUserId }, { withCredentials: true }));
      return true;
    } catch (e) {
      return false;
    }
  }

  public async getPendingDeposits(): Promise<any[]> {
    try {
      return await firstValueFrom(this.http.get<any[]>(`${this.BACKEND_URL}/wallet/deposits/pending`, { withCredentials: true }));
    } catch (e) {
      return [];
    }
  }

  public async approveDeposit(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post(`${this.BACKEND_URL}/wallet/deposits/${id}/approve`, {}, { withCredentials: true }));
      return true;
    } catch (e) {
      return false;
    }
  }

  public async rejectDeposit(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post(`${this.BACKEND_URL}/wallet/deposits/${id}/reject`, {}, { withCredentials: true }));
      return true;
    } catch (e) {
      return false;
    }
  }

  public async getPendingWithdrawals(): Promise<any[]> {
    try {
      const all = await firstValueFrom(this.http.get<any[]>(`${this.BACKEND_URL}/wallet/withdrawals`, { withCredentials: true }));
      return all.filter(w => w.status === 'pending');
    } catch (e) {
      return [];
    }
  }

  public async approveWithdrawal(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post(`${this.BACKEND_URL}/wallet/withdrawals/${id}/approve`, {}, { withCredentials: true }));
      return true;
    } catch (e) {
      return false;
    }
  }

  public async rejectWithdrawal(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post(`${this.BACKEND_URL}/wallet/withdrawals/${id}/reject`, {}, { withCredentials: true }));
      return true;
    } catch (e) {
      return false;
    }
  }

  public async getPendingWallets(): Promise<any[]> {
    try {
      return await firstValueFrom(
        this.http.get<any[]>(`${this.BACKEND_URL}/wallet/pending-activations`, { withCredentials: true })
      );
    } catch (e) {
      return [];
    }
  }

  public async approveWallet(txId: string): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.post(`${this.BACKEND_URL}/wallet/pending-activations/${txId}/approve`, {}, { withCredentials: true })
      );
      return true;
    } catch (e) {
      return false;
    }
  }

  public async rejectWallet(txId: string): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.post(`${this.BACKEND_URL}/wallet/pending-activations/${txId}/reject`, {}, { withCredentials: true })
      );
      return true;
    } catch (e) {
      return false;
    }
  }

  public async getPendingBookings(): Promise<any[]> {
    try {
      return await firstValueFrom(
        this.http.get<any[]>(`${this.BACKEND_URL}/booking/pending`, { withCredentials: true })
      );
    } catch (e) {
      return [];
    }
  }

  // 15. SerpApi Google Maps Search

  public async searchSerpPlaces(query: string, destination: string): Promise<any[]> {
    try {
      return await firstValueFrom(
        this.http.get<any[]>(`${this.BACKEND_URL}/spots/search-serp?q=${encodeURIComponent(query)}&destination=${encodeURIComponent(destination)}`)
      );
    } catch (e) {
      console.error('Failed to search spots via SerpApi:', e);
      return [];
    }
  }

  public async reverseGeocodeSerp(lat: number, lng: number): Promise<any> {
    try {
      return await firstValueFrom(
        this.http.get<any>(`${this.BACKEND_URL}/spots/reverse-serp?lat=${lat}&lng=${lng}`)
      );
    } catch (e) {
      console.error('Failed reverse geocoding via SerpApi:', e);
      return null;
    }
  }
}
