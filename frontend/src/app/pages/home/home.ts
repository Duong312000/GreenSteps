import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

type DestinationPosition = 'left' | 'center' | 'right';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './home.html',
  styleUrls: []
})
export class HomeComponent {
  public searchDest: string = 'Đà Lạt';
  public startDate: string = '2026-06-14';
  public endDate: string = '2026-06-18';
  public guests: string = '2';
  public budget: string = '2M-5M';
  public activeDestinationIndex = 1;
  public isDestinationTransitioning = false;
  public destinationDirection: 'prev' | 'next' = 'next';
  public wrappingDestinationIndex: number | null = null;
  private destinationTransitionTimer?: ReturnType<typeof setTimeout>;
  public destinationCards = [
    {
      dest: 'Đà Lạt',
      label: 'Da Lat',
      title: 'Da Lat',
      subtitle: 'The city of eternal spring',
      image: 'image/1dc8619487310884c9d631d689ece1e7.jpg'
    },
    {
      dest: 'Đà Nẵng - Hội An',
      label: 'Da Nang - Hoi An',
      title: 'Đà Nẵng - Hội An',
      subtitle: 'Heritage, beaches & vibrant culture',
      image: 'image/Viet Nam.png'
    },
    {
      dest: 'Phú Yên',
      label: 'Phu Yen',
      title: 'Phu Yen',
      subtitle: 'Wild beauty, peaceful shores',
      image: 'image/15a0c52a7c13e6fb493d5ce4cb1b644b.jpg'
    }
  ];

  constructor(private router: Router) {}

  public setSearchDest(dest: string) {
    this.searchDest = dest;
  }

  public handleSearchSubmit(event: Event) {
    event.preventDefault();
    sessionStorage.setItem('tours_search_dest', this.searchDest);

    let budgetParam = '6';
    if (this.budget === '1M-2M') budgetParam = '3';
    else if (this.budget === '5M+') budgetParam = '12';

    this.router.navigate(['/tours'], {
      queryParams: {
        dest: this.searchDest,
        budget: budgetParam
      }
    });
  }

  public rotateDestinations(direction: 'prev' | 'next') {
    if (this.isDestinationTransitioning) return;

    const total = this.destinationCards.length;
    this.destinationDirection = direction;
    this.wrappingDestinationIndex = direction === 'next'
      ? (this.activeDestinationIndex - 1 + total) % total
      : (this.activeDestinationIndex + 1) % total;

    this.activeDestinationIndex = direction === 'next'
      ? (this.activeDestinationIndex + 1) % total
      : (this.activeDestinationIndex - 1 + total) % total;

    this.lockDestinationTransition();
  }

  public setActiveDestination(index: number) {
    if (this.isDestinationTransitioning || index === this.activeDestinationIndex) return;

    this.destinationDirection = index > this.activeDestinationIndex ? 'next' : 'prev';
    this.wrappingDestinationIndex = null;
    this.activeDestinationIndex = index;
    this.lockDestinationTransition();
  }

  public getDestinationPosition(index: number): DestinationPosition {
    const total = this.destinationCards.length;

    if (index === this.activeDestinationIndex) return 'center';
    if (index === (this.activeDestinationIndex - 1 + total) % total) return 'left';

    return 'right';
  }

  public isDestinationWrapping(index: number): boolean {
    return this.wrappingDestinationIndex === index;
  }

  public goToDestination(dest: string) {
    sessionStorage.setItem('tours_search_dest', dest);
    this.router.navigate(['/tours'], { queryParams: { dest } });
  }

  private lockDestinationTransition() {
    this.isDestinationTransitioning = true;

    if (this.destinationTransitionTimer) {
      clearTimeout(this.destinationTransitionTimer);
    }

    this.destinationTransitionTimer = setTimeout(() => {
      this.isDestinationTransitioning = false;
      this.wrappingDestinationIndex = null;
    }, 920);
  }
}
