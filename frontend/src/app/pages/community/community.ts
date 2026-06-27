import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { User, CommunityPost } from '../../models/models';

@Component({
  selector: 'app-community',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './community.html',
  styleUrls: []
})
export class CommunityComponent implements OnInit {
  public currentUser: User | null = null;
  public posts: CommunityPost[] = [];

  // New post form bindings
  public postText: string = '';
  public postDest: string = 'Đà Lạt';
  public postDays: number = 3;
  public postRating: number = 5;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.cdr.detectChanges();
    });

    await this.loadPosts();
  }

  private async loadPosts() {
    this.posts = await this.apiService.getCommunityPosts();
    this.cdr.detectChanges();
  }

  public setRating(stars: number) {
    this.postRating = stars;
  }

  public async submitPost(event: Event) {
    event.preventDefault();
    if (!this.postText.trim()) return;

    const authorName = this.currentUser ? this.currentUser.fullname : 'Nguyễn Minh Anh';
    const authorId = this.currentUser ? (this.currentUser.id || this.currentUser._id || '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb7d') : '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb7d';

    const newPost = {
      authorId: authorId,
      author: authorName,
      text: this.postText,
      rating: this.postRating,
      tripName: `Hành trình ${this.postDest} ${this.postDays} ngày`,
      dest: this.postDest,
      days: Number(this.postDays),
      likes: 0,
      comments: 0
    };

    const success = await this.apiService.addCommunityPost(newPost);
    if (success) {
      this.postText = '';
      this.postRating = 5;
      await this.loadPosts();
    } else {
      alert('Đăng bài viết thất bại. Vui lòng kiểm tra kết nối mạng!');
    }
  }

  public handleLike(post: CommunityPost) {
    post.likes = (post.likes || 0) + 1;
    // We can also trigger a fetch like API on the backend if needed, but standard local increment matches the old logic.
  }

  public getFirstLetter(name: string): string {
    return name ? name.charAt(0).toUpperCase() : 'U';
  }
}
