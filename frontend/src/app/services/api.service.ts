import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Tour, Itinerary, Service, Booking, WalletInfo, WalletTransaction, CommunityPost } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private BACKEND_URL = 'http://localhost:5055/api';



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
    const res = await firstValueFrom(this.http.get<any[]>(`${this.BACKEND_URL}/tours`));
    return (res || []).map(t => this.mapTourToFrontend(t));
  }

  public async getPresetTour(id: string): Promise<Tour | null> {
    const cleanId = String(id).replace('preset_', '');
    const tours = await this.getPresetTours();
    return tours.find(t => t.id === id || String(t.id).replace('preset_', '') === cleanId) || null;
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

  public async getServicesByDestination(destination: string): Promise<any[]> {
    try {
      return await firstValueFrom(this.http.get<any[]>(`${this.BACKEND_URL}/services?destination=${encodeURIComponent(destination)}`));
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

  public async postTourReview(reviewData: { userId: string; tourId: string; rating: number; text: string }): Promise<any> {
    const cleanId = String(reviewData.tourId).replace('preset_', '');
    const data = { ...reviewData, tourId: cleanId };
    return await firstValueFrom(this.http.post<any>(`${this.BACKEND_URL}/reviews/tour`, data));
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
}
