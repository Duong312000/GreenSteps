export interface User {
  id?: string;
  _id?: string; // MongoDB format
  username: string;
  fullname: string;
  email: string;
  phone?: string;
  dob?: string;
  gender?: string;
  address?: string;
  role: 'traveler' | 'provider';
  companyName?: string;
  company_name?: string;
  avatarUrl?: string;
}

export interface Activity {
  id: string;
  time: string;
  name: string;
  cost: number;
  carbon: number;
  icon: string;
  type: 'lodging' | 'dining' | 'transport' | 'attraction';
  lat?: number;
  lng?: number;
}

export interface Tour {
  id: string;
  title: string;
  destination: string;
  days: number;
  type?: string; // Mapped type: Gia đình, Trải nghiệm, Tiết kiệm, Nghỉ dưỡng
  cost: number;
  oldCost?: number;
  old_cost?: number;
  carbon: number;
  image?: string;
  image_url?: string;
  description?: string;
  rating?: number;
  votes?: number;
  votes_count?: number;
  badges?: string[];
  tags?: string[];
  data: Activity[][];
}

export interface Itinerary {
  id: string;
  name: string;
  user_id: string;
  destination: string;
  days: number;
  totalCost: number;
  total_cost?: number;
  totalCarbon: number;
  total_carbon?: number;
  daysData: Activity[][];
  days_data?: Activity[][];
}

export interface Service {
  id: string;
  provider_id: string;
  name: string;
  type: string;
  destination: string;
  cost: number;
  carbon: number;
  icon?: string;
  status: 'active' | 'inactive' | 'pending' | 'rejected' | 'hidden';
  rating?: number;
  bookings_count?: number;
  bookingsCount?: number;
  badges?: string[];
}

export interface Booking {
  id: string;
  customer?: string;
  customer_name?: string;
  customer_id?: string;
  service: string;
  service_name?: string;
  service_id: string;
  date: string;
  booking_date?: string;
  guests: number;
  value: number;
  status: 'pending' | 'deposit' | 'completed' | 'rejected';
}

export interface WalletInfo {
  registered: boolean;
  balance: number;
}

export interface WalletTransaction {
  id: string;
  type: 'deposit' | 'payment' | 'refund';
  desc: string;
  date: string;
  amount: number;
  status: 'success' | 'pending' | 'failed';
}

export interface CommunityPost {
  id: string;
  author: string;
  avatar: string;
  time: string;
  rating: number;
  text: string;
  tripName: string;
  dest: string;
  days: number;
  likes: number;
  comments: number;
  image?: string;
}
