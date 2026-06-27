import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Tour, Itinerary } from '../../models/models';

@Component({
  selector: 'app-tours',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './tours.html',
  styleUrls: []
})
export class ToursComponent implements OnInit {
  public toursData: Tour[] = [];
  public filteredTours: Tour[] = [];

  // Filter bindings
  public searchQuery: string = '';
  public filterDest: string = 'all';
  public filterType: string = 'all';
  public filterPrice: string = 'all';

  // Modal control
  public isCreateModalOpen: boolean = false;
  public modalDest: string = 'Đà Lạt';
  public modalDays: number = 3;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    this.toursData = await this.apiService.getPresetTours();
    this.filteredTours = [...this.toursData];
    this.cdr.detectChanges();

    // Read query params from URL (from home page search or Apple-style navbar)
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.searchQuery = params['search'];
      }
      if (params['dest']) {
        this.filterDest = params['dest'];
      }
      if (params['budget']) {
        const budget = params['budget'];
        if (budget === '3') this.filterPrice = 'under2M';
        else if (budget === '6') this.filterPrice = '2M-4M';
        else if (budget === '12') this.filterPrice = 'above4M';
      }
      if (params['style']) {
        const style = params['style'];
        if (style === 'eco') this.filterType = 'Trải nghiệm';
        else if (style === 'adventure') this.filterType = 'Tiết kiệm';
        else if (style === 'relax') this.filterType = 'Nghỉ dưỡng';
      }

      // Check session storage fallback from home page
      const sessionDest = sessionStorage.getItem('tours_search_dest');
      if (sessionDest) {
        this.filterDest = sessionDest;
        sessionStorage.removeItem('tours_search_dest');
      }

      this.filterTours();
    });
  }

  public filterTours() {
    const query = this.searchQuery.toLowerCase().trim();
    
    this.filteredTours = this.toursData.filter(tour => {
      // Search match
      const matchQuery = !query || 
                         tour.title.toLowerCase().includes(query) || 
                         tour.destination.toLowerCase().includes(query);

      // Destination match
      const matchDest = this.filterDest === 'all' || tour.destination === this.filterDest;

      // Type match
      const matchType = this.filterType === 'all' || tour.type === this.filterType;

      // Price match
      let matchPrice = true;
      if (this.filterPrice === 'under2M') {
        matchPrice = tour.cost < 2000000;
      } else if (this.filterPrice === '2M-4M') {
        matchPrice = tour.cost >= 2000000 && tour.cost <= 4000000;
      } else if (this.filterPrice === 'above4M') {
        matchPrice = tour.cost > 4000000;
      }

      return matchQuery && matchDest && matchType && matchPrice;
    });
    this.cdr.detectChanges();
  }

  public filterByDestination(dest: string) {
    this.filterDest = dest;
    this.filterTours();
  }

  public openCreateItineraryModal() {
    this.isCreateModalOpen = true;
  }

  public closeCreateItineraryModal() {
    this.isCreateModalOpen = false;
  }

  public async submitNewItinerary(event: Event) {
    event.preventDefault();
    this.isCreateModalOpen = false;

    const user = this.authService.getCurrentUser();
    const userId = user ? (user.id || user._id || '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb7d') : '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb7d';

    const newIti: Itinerary = {
      id: 'iti_' + Date.now(),
      name: `Lịch trình tự thiết kế ${this.modalDest}`,
      user_id: userId,
      destination: this.modalDest,
      days: Number(this.modalDays),
      totalCost: 0,
      totalCarbon: 0,
      daysData: Array.from({ length: Number(this.modalDays) }, () => [])
    };

    await this.apiService.saveItinerary(newIti);
    this.router.navigate(['/schedule', newIti.id]);
  }
}
