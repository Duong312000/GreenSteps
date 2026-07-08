import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { User, CommunityPost } from '../../models/models';

@Component({
  selector: 'app-community',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './community.html',
})
export class CommunityComponent implements OnInit {
  public currentUser: User | null = null;
  public posts: CommunityPost[] = [];

  // New post form bindings
  public postText: string = '';
  public postDest: string = 'Đà Lạt';
  public postDays: number = 3;
  public postRating: number = 5;
  public postImage: string = '';
  public isUploading: boolean = false;

  // Comments bindings
  public expandedComments: { [postId: string]: boolean } = {};
  public postComments: { [postId: string]: any[] } = {};
  public commentInputs: { [postId: string]: string } = {};
  public activeReplyTarget: { [commentId: string]: boolean } = {};
  public replyInputs: { [commentId: string]: string } = {};

  public likedPostsSet = new Set<string>();

  // New post optional details toggle
  public showPostDetails: boolean = false;

  // Comment image drafts & upload state maps
  public commentImageDrafts: { [postId: string]: string } = {};
  public isCommentUploading: { [postId: string]: boolean } = {};

  // Custom Alert Modal properties
  public alertVisible = false;
  public alertTitle = '';
  public alertMessage = '';
  public alertType: 'warning' | 'info' | 'error' = 'info';
  public alertIcon = 'bi-info-circle-fill';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  public showAlert(title: string, message: string, type: 'warning' | 'info' | 'error' = 'info') {
    this.alertTitle = title;
    this.alertMessage = message;
    this.alertType = type;
    
    if (type === 'warning') this.alertIcon = 'bi-exclamation-triangle-fill';
    else if (type === 'info') this.alertIcon = 'bi-info-circle-fill';
    else this.alertIcon = 'bi-x-circle-fill';

    this.alertVisible = true;
    this.cdr.detectChanges();
  }

  public closeAlert() {
    this.alertVisible = false;
    this.cdr.detectChanges();
  }

  public showCommunityFeature(name: string, description: string) {
    this.showAlert(name, description, 'info');
  }

  async ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.cdr.detectChanges();
    });

    // Load liked posts
    const liked = JSON.parse(localStorage.getItem('greensteps_liked_posts') || '[]');
    this.likedPostsSet = new Set<string>(liked);

    await this.loadPosts();
  }

  private async loadPosts() {
    this.posts = await this.apiService.getCommunityPosts();
    this.cdr.detectChanges();
  }

  public setRating(stars: number) {
    this.postRating = stars;
  }

  public onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e: any) => {
      const base64 = e.target.result;
      this.isUploading = true;
      this.cdr.detectChanges();

      const res = await this.apiService.uploadImageBase64(base64);
      this.isUploading = false;
      if (res && res.success) {
        this.postImage = res.url;
      } else {
        alert("Không thể tải ảnh lên!");
      }
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
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
      comments: 0,
      image: this.postImage || null
    };

    const success = await this.apiService.addCommunityPost(newPost);
    if (success) {
      this.postText = '';
      this.postRating = 5;
      this.postImage = '';
      this.showPostDetails = false;
      await this.loadPosts();
    } else {
      alert('Đăng bài viết thất bại. Vui lòng kiểm tra kết nối mạng!');
    }
  }

  public async handleLike(post: CommunityPost) {
    if (this.likedPostsSet.has(post.id)) {
      alert("Bạn đã thích bài viết này rồi!");
      return;
    }

    const res = await this.apiService.likePost(post.id);
    if (res && res.success) {
      post.likes = res.likes;
      this.likedPostsSet.add(post.id);
      localStorage.setItem('greensteps_liked_posts', JSON.stringify(Array.from(this.likedPostsSet)));
      this.cdr.detectChanges();
    } else {
      alert("Thích bài viết thất bại!");
    }
  }

  public async toggleComments(post: CommunityPost) {
    const postId = post.id;
    this.expandedComments[postId] = !this.expandedComments[postId];
    if (this.expandedComments[postId]) {
      await this.loadComments(postId);
    }
    this.cdr.detectChanges();
  }

  public async loadComments(postId: string) {
    const comments = await this.apiService.getPostComments(postId);
    this.postComments[postId] = this.buildCommentTree(comments);
    this.cdr.detectChanges();
  }

  private buildCommentTree(flatComments: any[]): any[] {
    const roots = flatComments.filter(c => !c.parent_comment_id);
    const children = flatComments.filter(c => c.parent_comment_id);
    
    roots.forEach(root => {
      root.replies = children.filter(c => c.parent_comment_id === root.id);
    });
    return roots;
  }

  public toggleReplyBox(commentId: string) {
    this.activeReplyTarget[commentId] = !this.activeReplyTarget[commentId];
    if (this.activeReplyTarget[commentId]) {
      this.replyInputs[commentId] = '';
    }
    this.cdr.detectChanges();
  }

  public async submitComment(postId: string, parentCommentId?: string) {
    const text = parentCommentId ? this.replyInputs[parentCommentId] : this.commentInputs[postId];
    if (!text || !text.trim()) return;

    const authorName = this.currentUser ? this.currentUser.fullname : 'Nguyễn Minh Anh';
    const authorId = this.currentUser ? (this.currentUser.id || this.currentUser._id || '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb7d') : '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb7d';
    const imageUrl = parentCommentId ? '' : (this.commentImageDrafts[postId] || '');

    // Call API passing text, parentCommentId, authorId, authorName, and comment imageUrl
    const res = await this.apiService.addPostComment(postId, text, parentCommentId, authorId, authorName, imageUrl);
    if (res && res.success) {
      if (parentCommentId) {
        this.replyInputs[parentCommentId] = '';
        this.activeReplyTarget[parentCommentId] = false;
      } else {
        this.commentInputs[postId] = '';
        this.commentImageDrafts[postId] = ''; // Clear image draft
      }
      
      await this.loadComments(postId);
      
      // Update count locally
      const post = this.posts.find(p => p.id === postId);
      if (post) {
        post.comments = (post.comments || 0) + 1;
      }
      this.cdr.detectChanges();
    } else {
      alert("Đăng bình luận thất bại!");
    }
  }

  // Comment Image Upload Handlers
  public onCommentFileSelected(event: any, postId: string) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e: any) => {
      const base64 = e.target.result;
      this.isCommentUploading[postId] = true;
      this.cdr.detectChanges();

      try {
        const res = await this.apiService.uploadImageBase64(base64);
        this.isCommentUploading[postId] = false;
        if (res && res.success) {
          this.commentImageDrafts[postId] = res.url;
        } else {
          alert("Không thể tải ảnh lên bình luận!");
        }
      } catch (err) {
        this.isCommentUploading[postId] = false;
        alert("Lỗi tải ảnh lên!");
      }
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  public removeCommentImage(postId: string) {
    this.commentImageDrafts[postId] = '';
  }

  public getFirstLetter(name: string): string {
    return name ? name.charAt(0).toUpperCase() : 'U';
  }

  public isAvatarUrl(avatar: string | undefined | null): boolean {
    if (!avatar) return false;
    return avatar.trim().length > 1;
  }
}
