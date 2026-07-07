import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { User } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private BACKEND_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5055/api/auth' 
    : 'https://greensteps-6swn.onrender.com/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadSession();
  }

  private loadSession() {
    const userStr = localStorage.getItem('greensteps_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch (e) {
        localStorage.removeItem('greensteps_user');
      }
    }
  }

  public getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  public setCurrentUser(user: User | null) {
    if (user) {
      localStorage.setItem('greensteps_user', JSON.stringify(user));
      document.cookie = `isLoggedIn=true; path=/; max-age=86400`;
      document.cookie = `role=${user.role}; path=/; max-age=86400`;
      document.cookie = `userId=${user.id || user._id}; path=/; max-age=86400`;
      document.cookie = `fullname=${encodeURIComponent(user.fullname)}; path=/; max-age=86400`;
    } else {
      localStorage.removeItem('greensteps_user');
      document.cookie = `isLoggedIn=; path=/; max-age=0`;
      document.cookie = `role=; path=/; max-age=0`;
      document.cookie = `userId=; path=/; max-age=0`;
      document.cookie = `fullname=; path=/; max-age=0`;
    }
    this.currentUserSubject.next(user);
  }

  public async login(username: string, password: string): Promise<{ success: boolean; message?: string; user?: User }> {
    // 1. Try to connect to backend NodeJS
    try {
      const res = await firstValueFrom(
        this.http.post<{ success: boolean; user?: any; message?: string }>(`${this.BACKEND_URL}/login`, { username, password }, { withCredentials: true })
      );
      if (res && res.success && res.user) {
        const mappedUser: User = {
          id: res.user.id || res.user._id,
          username: res.user.username,
          fullname: res.user.fullname,
          email: res.user.email,
          phone: res.user.phone,
          dob: res.user.dob,
          gender: res.user.gender,
          address: res.user.address,
          role: res.user.role,
          companyName: res.user.companyName || res.user.company_name
        };
        this.setCurrentUser(mappedUser);
        return { success: true, user: mappedUser };
      } else {
        return { success: false, message: res?.message || 'Sai tên đăng nhập hoặc mật khẩu!' };
      }
    } catch (err: any) {
      return { success: false, message: err?.error?.message || 'Sai tên đăng nhập hoặc mật khẩu!' };
    }
  }

  public async register(formData: any): Promise<{ success: boolean; message?: string; user?: User }> {
    try {
      const res = await firstValueFrom(
        this.http.post<{ success: boolean; user?: any; message?: string }>(`${this.BACKEND_URL}/register`, formData, { withCredentials: true })
      );
      if (res && res.success && res.user) {
        const mappedUser: User = {
          id: res.user.id || res.user._id,
          username: res.user.username,
          fullname: res.user.fullname,
          email: res.user.email,
          phone: res.user.phone,
          dob: res.user.dob,
          gender: res.user.gender,
          address: res.user.address,
          role: res.user.role,
          companyName: res.user.companyName || res.user.company_name
        };
        this.setCurrentUser(mappedUser);
        return { success: true, user: mappedUser };
      }
      return { success: false, message: res?.message || 'Đăng ký thất bại!' };
    } catch (err) {
      console.error('Registration failed:', err);
      return { success: false, message: 'Lỗi kết nối server đăng ký!' };
    }
  }

  public async loginOrCreateWithIdentifier(identifier: string): Promise<{ success: boolean; message?: string; user?: User }> {
    const normalized = identifier.trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
    const storedUsers = this.getOtpUsers();
    const existingStoredUser = storedUsers.find(user =>
      (isEmail && user.email?.toLowerCase() === normalized.toLowerCase()) ||
      (!isEmail && this.normalizePhone(user.phone || '') === this.normalizePhone(normalized))
    );

    if (existingStoredUser) {
      this.setCurrentUser(existingStoredUser);
      return { success: true, user: existingStoredUser };
    }

    const demoUser = this.findDemoUser(normalized, isEmail);
    if (demoUser) {
      this.setCurrentUser(demoUser);
      return { success: true, user: demoUser };
    }

    const username = isEmail ? normalized.split('@')[0] : this.normalizePhone(normalized);
    const user: User = {
      id: `otp_${Date.now()}`,
      username,
      fullname: isEmail ? username : `GreenSteps ${this.normalizePhone(normalized).slice(-4)}`,
      email: isEmail ? normalized : `${this.normalizePhone(normalized)}@greensteps.local`,
      phone: isEmail ? '' : normalized,
      role: 'traveler'
    };

    storedUsers.push(user);
    localStorage.setItem('greensteps_otp_users', JSON.stringify(storedUsers));
    this.setCurrentUser(user);
    return { success: true, user };
  }

  public async updateProfile(userId: string, profileData: any): Promise<{ success: boolean; message?: string; user?: User }> {
    try {
      const res = await firstValueFrom(
        this.http.put<{ success: boolean; user?: any; message?: string }>(`${this.BACKEND_URL}/profile/${userId}`, profileData, { withCredentials: true })
      );
      if (res && res.success && res.user) {
        const mappedUser: User = {
          id: res.user.id || res.user._id,
          username: res.user.username,
          fullname: res.user.fullname,
          email: res.user.email,
          phone: res.user.phone,
          dob: res.user.dob,
          gender: res.user.gender,
          address: res.user.address,
          role: res.user.role,
          companyName: res.user.companyName || res.user.company_name
        };
        this.setCurrentUser(mappedUser);
        return { success: true, user: mappedUser };
      }
      return { success: false, message: res?.message || 'Cập nhật thất bại!' };
    } catch (err) {
      console.error('Update profile failed:', err);
      return { success: false, message: 'Lỗi kết nối server cập nhật!' };
    }
  }

  public async toggleRole(userId: string): Promise<string | null> {
    const user = this.getCurrentUser();
    if (!user) return null;

    try {
      const res = await firstValueFrom(
        this.http.post<{ success: boolean; role: 'traveler' | 'provider' }>(`${this.BACKEND_URL}/role/${userId}`, {}, { withCredentials: true })
      );
      if (res && res.success) {
        user.role = res.role;
        this.setCurrentUser(user);
        return res.role;
      }
      return null;
    } catch (err: any) {
      console.error('Backend toggle role failed:', err);
      return null;
    }
  }

  public logout() {
    this.setCurrentUser(null);
  }

  private getOtpUsers(): User[] {
    try {
      return JSON.parse(localStorage.getItem('greensteps_otp_users') || '[]');
    } catch (e) {
      localStorage.removeItem('greensteps_otp_users');
      return [];
    }
  }

  private findDemoUser(identifier: string, isEmail: boolean): User | null {
    const demoUsers: User[] = [
      {
        id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb7d',
        username: 'traveler',
        fullname: 'Nguyễn Minh Anh',
        email: 'minhanh.greentravel@gmail.com',
        phone: '0901 234 567',
        dob: '12/08/1996',
        gender: 'Nữ',
        address: 'Quận 1, TP. Hồ Chí Minh',
        role: 'traveler'
      },
      {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        username: 'partner',
        fullname: 'Trần Văn A',
        companyName: 'Green Valley Travel',
        email: 'partner.greentravel@gmail.com',
        phone: '0902 987 654',
        address: 'Quận 3, TP. Hồ Chí Minh',
        role: 'provider'
      }
    ];

    return demoUsers.find(user =>
      (isEmail && user.email?.toLowerCase() === identifier.toLowerCase()) ||
      (!isEmail && this.normalizePhone(user.phone || '') === this.normalizePhone(identifier))
    ) || null;
  }

  private normalizePhone(value: string): string {
    return value.replace(/\D/g, '').replace(/^84/, '0');
  }
}
