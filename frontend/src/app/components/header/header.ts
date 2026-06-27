import { Component, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/models';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './header.html',
  styleUrls: []
})
export class HeaderComponent implements OnInit {
  public currentUser: User | null = null;
  public currentPath: string = '';
  public smartSearchQuery: string = '';
  public isSearchDropdownActive: boolean = false;

  // Smart Search Dropdown filters
  public filterDest: string = 'Đà Lạt';
  public filterBudget: string = '6';
  public filterStyle: string = 'eco';

  public currentTheme: 'light' | 'dark' = 'light';

  @ViewChild('searchInput') searchInput!: ElementRef;
  @ViewChild('filterDropdown') filterDropdown!: ElementRef;

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Track active path for active class highlighting
    this.currentPath = this.router.url;
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentPath = event.url;
    });

    // Theme initialization
    const savedTheme = localStorage.getItem('greensteps_theme') as 'light' | 'dark';
    if (savedTheme) {
      this.currentTheme = savedTheme;
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }

  public toggleTheme() {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', this.currentTheme);
    localStorage.setItem('greensteps_theme', this.currentTheme);
  }

  public showSearchDropdown() {
    this.isSearchDropdownActive = true;
  }

  @HostListener('document:mousedown', ['$event'])
  public onClickOutside(event: MouseEvent) {
    if (this.isSearchDropdownActive && 
        this.searchInput && 
        this.filterDropdown && 
        !this.searchInput.nativeElement.contains(event.target) && 
        !this.filterDropdown.nativeElement.contains(event.target)) {
      this.isSearchDropdownActive = false;
    }
  }

  public onSearchKeypress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.triggerSearch();
    }
  }

  public triggerSearch() {
    const query = this.smartSearchQuery.trim();
    this.isSearchDropdownActive = false;
    if (query) {
      this.router.navigate(['/tours'], { queryParams: { search: query } });
    }
  }

  public applySmartFilters() {
    this.isSearchDropdownActive = false;
    this.router.navigate(['/tours'], { 
      queryParams: { 
        dest: this.filterDest, 
        budget: this.filterBudget, 
        style: this.filterStyle 
      } 
    });
  }

  public getFirstLetter(name: string): string {
    return name ? name.charAt(0).toUpperCase() : 'U';
  }

  public showGreenHandbookAlert() {
    alert('Tính năng Cẩm Nang Xanh đang phát triển!');
  }
}
