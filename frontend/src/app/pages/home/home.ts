import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Tour } from '../../models/models';

type DestinationPosition = 'left' | 'center' | 'right';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './home.html',
})
export class HomeComponent implements OnInit {
  public searchDest: string = 'Đà Lạt';
  public realTours: Tour[] = [];
  public aiPlannerDest: string = 'Đà Nẵng';
  public aiSuggestedDays: any[] = [];
  public aiSuggestedTitle: string = 'Lịch trình gợi ý';
  public isAiLoading: boolean = false;
  public aiAssistantMessage: string = "Xin chào! Tôi là trợ lý AI của GreenSteps. Hãy chia sẻ mong muốn của bạn, tôi sẽ giúp bạn thiết kế hành trình xanh tối ưu nhất.";
  public startDate: string = '2026-06-14';
  public endDate: string = '2026-06-18';
  public guests: string = '2';
  public budget: string = '2M-5M';
  public activeDestinationIndex = 1;
  public isDestinationTransitioning = false;
  public destinationDirection: 'prev' | 'next' = 'next';
  public wrappingDestinationIndex: number | null = null;
  private destinationTransitionTimer?: ReturnType<typeof setTimeout>;
  public destinationCards: any[] = [
    {
      dest: 'Đà Lạt',
      label: 'Đà Lạt',
      title: 'Đà Lạt',
      subtitle: 'Thành phố ngàn hoa',
      image: 'image/dalat_cover.png'
    },
    {
      dest: 'Đà Nẵng - Hội An',
      label: 'Đà Nẵng - Hội An',
      title: 'Đà Nẵng - Hội An',
      subtitle: 'Di sản cổ kính & biển xanh',
      image: 'image/danang_cover.png'
    },
    {
      dest: 'Phú Yên',
      label: 'Phú Yên',
      title: 'Phú Yên',
      subtitle: 'Xứ sở hoa vàng cỏ xanh',
      image: 'image/phuyen_cover.png'
    }
  ];

  public activeHighlight: 'eco' | 'guides' | 'dates' | 'ai' = 'eco';
  
  public highlightPreviews: { [key: string]: { title: string; subtitle: string; days: { label: string; title: string; desc: string; img: string }[] } } = {
    eco: {
      title: "Chuyến đi 5 ngày Miền Trung Xanh",
      subtitle: "Trải nghiệm lưu trú sinh thái & phục hồi tự nhiên",
      days: [
        { label: "Ngày 1", title: "Đến Đà Nẵng", desc: "Bamboo Eco Cabin Resort, nghỉ ngơi tại bãi biển Mỹ Khê", img: "image/danang_cover.png" },
        { label: "Ngày 2", title: "Lưu trú tại Hội An", desc: "Chèo thuyền thúng rừng dừa, nông nghiệp hữu cơ", img: "image/b025d2b33ebe6db7e576ff3476f9acde.jpg" },
        { label: "Ngày 3", title: "Đi bộ Ngũ Hành Sơn", desc: "Đi bộ leo núi ngắm cảnh, thưởng trà thảo mộc", img: "image/7c9e14a82698a594dd914369bfb8eaa5.jpg" },
        { label: "Ngày 4", title: "Khu bảo tồn Bà Nà", desc: "Trải nghiệm cáp treo sinh thái, ngắm cảnh rừng xanh", img: "image/da38f44902391ce9a9e4f0fd4b69fb04.jpg" },
        { label: "Ngày 5", title: "Kết thúc hành trình", desc: "Gieo mầm cây lưu niệm bảo vệ môi trường, chào tạm biệt", img: "image/68e15971da05ec82c116fe191abb8c7f.jpg" }
      ]
    },
    guides: {
      title: "Hành trình Văn hóa Bản địa 5 ngày",
      subtitle: "Tìm hiểu di sản cùng người kể chuyện bản xứ",
      days: [
        { label: "Ngày 1", title: "Di sản Đà Nẵng", desc: "Đón khách, tour đi bộ và nghe kể chuyện bảo tàng Chăm", img: "image/danang_cover.png" },
        { label: "Ngày 2", title: "Lồng đèn phố cổ", desc: "Học làm lồng đèn giấy truyền thống cùng nghệ nhân", img: "image/b025d2b33ebe6db7e576ff3476f9acde.jpg" },
        { label: "Ngày 3", title: "Làng rau Trà Quế", desc: "Trải nghiệm làm nông dân trồng rau sạch cùng người bản địa", img: "image/7c9e14a82698a594dd914369bfb8eaa5.jpg" },
        { label: "Ngày 4", title: "Thánh địa Mỹ Sơn", desc: "Khám phá thung lũng đền đài cổ kính cùng hướng dẫn viên", img: "image/da38f44902391ce9a9e4f0fd4b69fb04.jpg" },
        { label: "Ngày 5", title: "Kết thúc hành trình", desc: "Lớp học nấu ăn đặc sản miền Trung, chia tay kết thúc tour", img: "image/68e15971da05ec82c116fe191abb8c7f.jpg" }
      ]
    },
    dates: {
      title: "Lộ trình Linh hoạt Đà Lạt 3 ngày",
      subtitle: "Tự chủ thời gian và điểm đến mong muốn",
      days: [
        { label: "Ngày 1", title: "Đón khách linh hoạt", desc: "Xe điện đón sân bay linh động theo giờ bay riêng của khách", img: "image/dalat_cover.png" },
        { label: "Ngày 2", title: "Trekking LangBiang", desc: "Tự chọn cung đường đi bộ ngắn/dài tùy thuộc sức khỏe", img: "image/7c9e14a82698a594dd914369bfb8eaa5.jpg" },
        { label: "Ngày 3", title: "Tự do mua sắm", desc: "Thoải mái check-out muộn và tự do tham quan thành phố", img: "image/68e15971da05ec82c116fe191abb8c7f.jpg" }
      ]
    },
    ai: {
      title: "Lịch trình AI Gemini Tự động Lập",
      subtitle: "Tối ưu hóa phát thải CO2 bằng thuật toán AI",
      days: [
        { label: "Ngày 1", title: "Tối ưu hóa phát thải", desc: "Đặt xe điện đưa đón và chọn homestay tiết kiệm năng lượng", img: "image/danang_cover.png" },
        { label: "Ngày 2", title: "Ẩm thực chay thực dưỡng", desc: "Gợi ý các quán ăn chay hữu cơ từ vườn và đi bộ ngắm cảnh", img: "image/b025d2b33ebe6db7e576ff3476f9acde.jpg" },
        { label: "Ngày 3", title: "Cắm trại không rác thải", desc: "Trải nghiệm cắm trại không sử dụng đồ nhựa dùng một lần", img: "image/dalat_cover.png" },
        { label: "Ngày 4", title: "Khám phá xe điện", desc: "Thuê xe máy điện dạo quanh thành phố, giảm thiểu ô nhiễm tiếng ồn", img: "image/da38f44902391ce9a9e4f0fd4b69fb04.jpg" },
        { label: "Ngày 5", title: "Quyên góp cây xanh", desc: "Tính toán tổng phát thải và quy đổi thành cây xanh đóng góp", img: "image/68e15971da05ec82c116fe191abb8c7f.jpg" }
      ]
    }
  };

  public get currentPreview() {
    return this.highlightPreviews[this.activeHighlight] || this.highlightPreviews['eco'];
  }

  public selectHighlight(section: 'eco' | 'guides' | 'dates' | 'ai') {
    this.activeHighlight = section;
  }

  public updatePreviewFromDatabase() {
    if (!this.realTours || this.realTours.length === 0) return;

    // 1. Find Eco tour (Phú Yên)
    const ecoTour = this.realTours.find(t => t.title.toLowerCase().includes('phú yên') || t.title.toLowerCase().includes('biển') || t.title.toLowerCase().includes('sinh thái')) || this.realTours[0];
    
    // 2. Find Culture/Guides tour (Đà Nẵng - Hội An)
    const guidesTour = this.realTours.find(t => t.title.toLowerCase().includes('đà nẵng') || t.title.toLowerCase().includes('hội an') || t.title.toLowerCase().includes('văn hóa')) || this.realTours[1] || this.realTours[0];

    // 3. Find Dates/Family tour (Đà Lạt Gia Đình)
    const datesTour = this.realTours.find(t => t.title.toLowerCase().includes('gia đình') || t.title.toLowerCase().includes('đà lạt')) || this.realTours[2] || this.realTours[0];

    // 4. Find AI tour (Trekking Rừng Thông Đồi Sương)
    const aiTour = this.realTours.find(t => t.title.toLowerCase().includes('đồi sương') || t.title.toLowerCase().includes('trekking')) || this.realTours[3] || this.realTours[0];

    const tourMapping = {
      eco: ecoTour,
      guides: guidesTour,
      dates: datesTour,
      ai: aiTour
    };

    Object.keys(tourMapping).forEach(key => {
      const t = tourMapping[key as 'eco' | 'guides' | 'dates' | 'ai'];
      if (!t) return;

      const days = (t.data || []).map((dayActs, dIdx) => {
        const mainAct = dayActs[0] || { name: 'Hoạt động tự do', time: '08:00' };
        
        let img = 'image/greensteps_logo.png';
        if (t.image) {
          img = t.image;
        }
        
        const actName = mainAct.name || '';
        const dest = t.destination || '';
        
        if (actName.toLowerCase().includes('đà nẵng') || actName.toLowerCase().includes('sân bay') || dest.includes('Đà Nẵng')) {
          img = 'image/danang_cover.png';
        } else if (actName.toLowerCase().includes('hội an') || actName.toLowerCase().includes('đèn lồng')) {
          img = 'image/b025d2b33ebe6db7e576ff3476f9acde.jpg';
        } else if (actName.toLowerCase().includes('ngũ hành sơn') || actName.toLowerCase().includes('chùa')) {
          img = 'image/7c9e14a82698a594dd914369bfb8eaa5.jpg';
        } else if (actName.toLowerCase().includes('bà nà') || actName.toLowerCase().includes('cáp treo')) {
          img = 'image/da38f44902391ce9a9e4f0fd4b69fb04.jpg';
        } else if (dest.includes('Phú Yên')) {
          img = 'image/phuyen_cover.png';
        } else if (dest.includes('Đà Lạt')) {
          img = 'image/dalat_cover.png';
        }

        return {
          label: `Ngày ${dIdx + 1}`,
          title: mainAct.name,
          desc: `${mainAct.time} - Khám phá chặng xanh`,
          img: img
        };
      });

      this.highlightPreviews[key] = {
        title: t.title,
        subtitle: t.destination || 'Trải nghiệm du lịch sinh thái cùng GreenSteps',
        days: days.slice(0, 5) // Limit to max 5 days for preview display
      };
    });
  }

  constructor(private router: Router, private apiService: ApiService) {}

  async ngOnInit() {
    try {
      const dbDests = await this.apiService.getDestinations();
      if (dbDests && dbDests.length > 0) {
        this.destinationCards = dbDests.map(dest => {
          let label = dest;
          let subtitle = 'Điểm đến du lịch xanh thân thiện';
          let image = 'image/danang_cover.png';
          if (dest === 'Đà Lạt') {
            label = 'Đà Lạt';
            subtitle = 'Thành phố ngàn hoa';
            image = 'image/dalat_cover.png';
          } else if (dest === 'Phú Yên') {
            label = 'Phú Yên';
            subtitle = 'Xứ sở hoa vàng cỏ xanh';
            image = 'image/phuyen_cover.png';
          } else if (dest === 'Đà Nẵng - Hội An') {
            label = 'Đà Nẵng - Hội An';
            subtitle = 'Di sản cổ kính & biển xanh';
            image = 'image/danang_cover.png';
          }
          return {
            dest: dest,
            label: label,
            title: dest,
            subtitle: subtitle,
            image: image
          };
        });
        if (this.destinationCards.length > 0) {
          this.searchDest = this.destinationCards[0].dest;
          this.activeDestinationIndex = 0;
        }
      }
      
      // Load real tours and build previews
      this.realTours = await this.apiService.getPresetTours() || [];
      this.updatePreviewFromDatabase();
      this.generateAiItinerary();
    } catch (e) {
      console.warn('Failed to load dynamic destinations:', e);
    }
  }

  public setSearchDest(dest: string) {
    this.searchDest = dest;
  }

  public async generateAiItinerary(shouldRedirect = false) {
    if (!this.realTours || this.realTours.length === 0) return;
    
    this.isAiLoading = true;
    const searchKey = (this.aiPlannerDest || '').trim();
    
    let destination = 'Đà Nẵng';
    if (searchKey.toLowerCase().includes('đà lạt')) {
      destination = 'Đà Lạt';
    } else if (searchKey.toLowerCase().includes('phú yên')) {
      destination = 'Phú Yên';
    } else if (searchKey.toLowerCase().includes('đà nẵng') || searchKey.toLowerCase().includes('hội an')) {
      destination = 'Đà Nẵng';
    }

    try {
      // 1. Fetch live response from backend Gemini AI model
      const res = await this.apiService.sendAiMessage(searchKey, destination, []);
      if (res && res.success) {
        this.aiAssistantMessage = res.reply;
      }
    } catch (e) {
      console.warn('Failed to fetch live AI chat response:', e);
      this.aiAssistantMessage = `Tôi đã phân tích điểm đến "${destination}" và tìm thấy lịch trình xanh tối ưu cho bạn. Hãy tham khảo chi tiết các ngày ở bảng Suggested Itinerary bên cạnh nhé!`;
    }
    
    // 2. Fetch and map the matching database preset tour
    const matchedTour = this.realTours.find(t => 
      t.title.toLowerCase().includes(searchKey.toLowerCase()) || 
      t.destination.toLowerCase().includes(destination.toLowerCase())
    ) || this.realTours[0]; // fallback
    
    if (matchedTour) {
      this.aiSuggestedTitle = `Lộ trình đề xuất: ${matchedTour.title}`;
      this.aiSuggestedDays = (matchedTour.data || []).map((dayActs, dIdx) => {
        const mainAct = dayActs[0] || { name: 'Khám phá tự do', time: '08:00', description: 'Trải nghiệm du lịch sinh thái cùng GreenSteps.' };
        
        let img = 'image/danang_cover.png';
        const actName = (mainAct.name || '').toLowerCase();
        const destName = (matchedTour.destination || '').toLowerCase();
        
        if (actName.includes('đà nẵng') || destName.includes('đà nẵng')) {
          img = 'image/danang_cover.png';
        } else if (actName.includes('hội an') || actName.includes('đèn lồng')) {
          img = 'image/b025d2b33ebe6db7e576ff3476f9acde.jpg';
        } else if (actName.includes('bà nà') || actName.includes('cáp treo') || actName.includes('cầu vàng')) {
          img = 'image/da38f44902391ce9a9e4f0fd4b69fb04.jpg'; // Golden Bridge
        } else if (destName.includes('phú yên')) {
          img = 'image/phuyen_cover.png';
        } else if (destName.includes('đà lạt') || actName.includes('đồi sương') || actName.includes('cắm trại')) {
          img = 'image/dalat_cover.png';
        } else if (matchedTour.image) {
          img = matchedTour.image;
        }
        
        return {
          day: `Ngày ${dIdx + 1}`,
          title: mainAct.name,
          desc: (mainAct as any).description || 'Khám phá các điểm checkin sinh thái và dịch vụ xanh bảo vệ môi trường.',
          img: img
        };
      });

      // 3. If redirect is requested, create the itinerary and navigate to schedule editor page
      if (shouldRedirect) {
        const userJson = localStorage.getItem('currentUser');
        const user = userJson ? JSON.parse(userJson) : null;
        const userId = user ? (user.id || user._id || '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb7d') : '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb7d';

        // Deep copy activities
        const daysData = JSON.parse(JSON.stringify(matchedTour.data || []));
        let totalCost = 0;
        let totalCarbon = 0;

        daysData.forEach((day: any[]) => {
          day.forEach((act: any) => {
            totalCost += Number(act.cost || 0);
            totalCarbon += Number(act.carbon || 0);
          });
        });

        const newIti = {
          id: 'iti_' + Date.now(),
          name: `Hành trình AI: ${matchedTour.title}`,
          user_id: userId,
          destination: matchedTour.destination,
          days: matchedTour.days || 3,
          totalCost,
          totalCarbon,
          daysData
        };

        try {
          await this.apiService.saveItinerary(newIti);
          this.router.navigate(['/schedule', newIti.id]);
        } catch (e) {
          console.error('Failed to create itinerary from home page:', e);
        }
      }
    }
    
    this.isAiLoading = false;
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
