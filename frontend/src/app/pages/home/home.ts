import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

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

  public goToDestination(dest: string) {
    sessionStorage.setItem('tours_search_dest', dest);
    this.router.navigate(['/tours'], { queryParams: { dest } });
  }
}
