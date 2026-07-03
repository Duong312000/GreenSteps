import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { ToursComponent } from './pages/tours/tours';
import { TourDetailComponent } from './pages/tour-detail/tour-detail';
import { ProfileComponent } from './pages/profile/profile';
import { CommunityComponent } from './pages/community/community';
import { ScheduleEditorComponent } from './pages/schedule-editor/schedule-editor';
import { PartnerDashboardComponent } from './pages/partner/partner-dashboard';
import { PartnerServicesComponent } from './pages/partner/partner-services';
import { PartnerBookingsComponent } from './pages/partner/partner-bookings';
import { PartnerAdsComponent } from './pages/partner/partner-ads';
import { PartnerRegisterComponent } from './pages/partner/partner-register';
import { BookingComponent } from './pages/booking/booking';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'tours', component: ToursComponent },
  { path: 'tours/:id', component: TourDetailComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'community', component: CommunityComponent },
  { path: 'schedule', component: ScheduleEditorComponent },
  { path: 'schedule/:id', component: ScheduleEditorComponent },
  { path: 'booking', component: BookingComponent },
  { path: 'booking/payment', component: BookingComponent },
  { path: 'booking/confirm', component: BookingComponent },
  { path: 'partner-dashboard', component: PartnerDashboardComponent, canActivate: [roleGuard] },
  { path: 'partner-services', component: PartnerServicesComponent, canActivate: [roleGuard] },
  { path: 'partner-bookings', component: PartnerBookingsComponent, canActivate: [roleGuard] },
  { path: 'partner-ads', component: PartnerAdsComponent, canActivate: [roleGuard] },
  { path: 'partner-register', component: PartnerRegisterComponent },
  { path: '**', redirectTo: 'home' }
];
