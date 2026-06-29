import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { ToursComponent } from './pages/tours/tours';
import { TourDetailComponent } from './pages/tour-detail/tour-detail';
import { AuthComponent } from './pages/auth/auth';
import { ProfileComponent } from './pages/profile/profile';
import { CommunityComponent } from './pages/community/community';
import { ScheduleEditorComponent } from './pages/schedule-editor/schedule-editor';
import { PartnerDashboardComponent } from './pages/partner/partner-dashboard';
import { PartnerServicesComponent } from './pages/partner/partner-services';
import { PartnerBookingsComponent } from './pages/partner/partner-bookings';
import { PartnerAdsComponent } from './pages/partner/partner-ads';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'tours', component: ToursComponent },
  { path: 'tours/:id', component: TourDetailComponent },
  { path: 'auth', component: AuthComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'community', component: CommunityComponent },
  { path: 'schedule', component: ScheduleEditorComponent },
  { path: 'schedule/:id', component: ScheduleEditorComponent },
  { path: 'partner-dashboard', component: PartnerDashboardComponent },
  { path: 'partner-services', component: PartnerServicesComponent },
  { path: 'partner-bookings', component: PartnerBookingsComponent },
  { path: 'partner-ads', component: PartnerAdsComponent },
  { path: '**', redirectTo: 'home' }
];
