# Kế hoạch triển khai: GreenSteps Travel - Tái cấu trúc Thư mục & Giao diện sát PDF (Ferrari Style)

Tài liệu này trình bày kế hoạch dọn dẹp, tái tổ chức thư mục dự án và tái lập các trang giao diện trong `prj/` để khớp hoàn toàn 1:1 với tài liệu thiết kế `GreenSteps System.pdf` theo phong cách Ferrari góc cạnh tối giản.

## User Review Required

> [!IMPORTANT]
> **1. Quy hoạch cấu trúc thư mục (Folder Reorganization):**
> * Toàn bộ các script python trích xuất (`extract_*.py`, `render_*.py`), các file văn bản nháp (`idea_content.txt`, `system_content.txt`) và hơn 150 hình ảnh trích xuất lẻ từ PDF đang nằm rải rác ở gốc thư mục `prj/` sẽ được **di chuyển hoàn toàn ra ngoài thư mục dự án**, đưa vào thư mục lưu trữ riêng biệt ở thư mục cha: `d:\hoc\phattrienwebkinhdoanh\Project\tools_and_extracts\`.
> * Thư mục phát triển ứng dụng `prj/` sẽ cực kỳ gọn gàng, chỉ chứa:
>   * Các tệp trang web HTML (`index.html`, `tours.html`, `tour_detail.html`, `schedule_editor.html`, `auth.html`, `profile.html`, `community.html` và các trang nhà cung cấp).
>   * `css/style.css` (Design system dùng chung).
>   * `js/` (`api.js`, `state.js`, `main.js` chứa logic điều khiển).
>   * `img/` (Chứa các logo, icon hoặc hình ảnh giao diện được sử dụng thực tế).
>   * `server.js`, `package.json`, `schema.json` (Hệ thống backend API & CSDL).

> [!IMPORTANT]
> **2. Thiết kế giao diện khớp 1:1 PDF & Ferrari Style (0px border-radius):**
> * Các trang web sẽ được dựng bằng cấu trúc HTML phức tạp lấy từ bản mẫu gốc (`index copy.html`, `schedule_editor.html`, `schedule.html`) để đảm bảo khớp hoàn hảo bố cục trong slide PDF.
> * Mọi nút bấm, ảnh nền, viền thẻ card, ô nhập liệu sẽ được ép kiểu phẳng góc cạnh (`border-radius: 0px !important`).
> * Các đường viền đen đậm có độ tương phản cao, font chữ Outfit và Inter hiện đại.

---

## Proposed Changes

### [Component: Folder Reorganization]

Chúng ta sẽ dọn dẹp thư mục `prj` bằng cách di chuyển các file không liên quan trực tiếp đến runtime của ứng dụng web:

#### [NEW] [tools_and_extracts/](file:///d:/hoc/phattrienwebkinhdoanh/Project/tools_and_extracts)
Tạo thư mục lưu trữ ngoài `prj/` và chuyển các tệp sau vào đây:
* Các tệp script: `extract_images.py`, `extract_pdf.py`, `extract_system_pdf.py`, `render_pdf_pages.py`.
* Các tệp text: `idea_content.txt`, `system_content.txt`.
* Hơn 150 ảnh trích xuất: `page_*.png` và `rendered_page_*.png`.

---

### [Component: Frontend Web Application (`prj/`)]

#### [MODIFY] [style.css](file:///d:/hoc/phattrienwebkinhdoanh/Project/prj/css/style.css)
* Áp đặt triệt để `border-radius: 0px !important` cho tất cả mọi tag.
* Thêm CSS hỗ trợ bố cục 3 cột (Wanderlog style), lưới 3 cột Destinations, AI Planner feature box, Feedback card, thống kê và nhà cung cấp.

#### [MODIFY] [main.js](file:///d:/hoc/phattrienwebkinhdoanh/Project/prj/js/main.js)
* Nạp Header & Footer động, xử lý responsive tự động ẩn các tab tràn trên Apple Navbar và đưa vào menu Hover phụ.
* Đồng bộ phiên đăng nhập của Traveler và Partner.

#### [MODIFY] [index.html](file:///d:/hoc/phattrienwebkinhdoanh/Project/prj/index.html)
* Xây dựng lại trang chủ khớp 1:1 slide Page 5: Search panel đè lên banner chính với 3 tab chuyển đổi, khu vực Khám phá 3 vùng đất (Đà Lạt, Đà Nẵng, Phú Yên) có badge màu và tag, khu vực AI Planner 2 cột, danh sách 3 Nhà cung cấp nổi bật, và khu vực Feedback kèm banner 4 cột Thống kê.

#### [MODIFY] [tours.html](file:///d:/hoc/phattrienwebkinhdoanh/Project/prj/tours.html)
* Tái cấu trúc trang duyệt tour rộng toàn màn hình khớp slide Page 7: Bộ lọc dropdown phía trên (Tất cả điểm đến, Tất cả loại tour, Tất cả mức giá), danh sách tour chia theo vùng miền (Đà Lạt, Phú Yên, Đà Nẵng - Hội An), thẻ nét đứt "Tạo Lịch Trình Mới".

#### [MODIFY] [tour_detail.html](file:///d:/hoc/phattrienwebkinhdoanh/Project/prj/tour_detail.html)
* Khớp slide Page 3: Bảng "Thiết kế theo ý bạn" ở cột phải. Lịch trình khám phá theo ngày ở cột trái.
* **Tương tác mở rộng (Page 1, 2, 6):** Khi bấm vào từng ngày, accordion sẽ trượt mở hiển thị timeline chi tiết theo giờ (08:00, 10:00, 12:00...) tương ứng với dữ liệu hoạt động thực tế của ngày đó.

#### [MODIFY] [schedule_editor.html](file:///d:/hoc/phattrienwebkinhdoanh/Project/prj/schedule_editor.html)
* Khớp slide Page 4: Layout 3 cột Wanderlog. Cột 1 (Sidebar chỉ số Carbon, Ngân sách & Thanh toán gộp), Cột 2 (Timeline kéo thả hoạt động, khoảng cách di chuyển giữa các card), Cột 3 (Places from AI đề xuất địa danh sinh thái của tỉnh).

#### [NEW] [auth.html](file:///d:/hoc/phattrienwebkinhdoanh/Project/prj/auth.html)
* Trang Đăng nhập / Đăng ký phẳng, tối giản.

#### [NEW] [profile.html](file:///d:/hoc/phattrienwebkinhdoanh/Project/prj/profile.html)
* Thông tin tài khoản, tích hợp Đăng ký ví du lịch, hiển thị số dư và danh sách lịch sử giao dịch ví.

#### [NEW] [community.html](file:///d:/hoc/phattrienwebkinhdoanh/Project/prj/community.html)
* Bảng tin mạng xã hội xanh, cho phép hiển thị các bài viết chia sẻ và đính kèm trực tiếp tour/lịch trình đã đi.

#### [NEW] [partner_register.html](file:///d:/hoc/phattrienwebkinhdoanh/Project/prj/partner_register.html)
* Giao diện đăng ký nâng cấp tài khoản lên đối tác (nhà xe, khách sạn, nhà hàng).

#### [NEW] [partner_dashboard.html](file:///d:/hoc/phattrienwebkinhdoanh/Project/prj/partner_dashboard.html)
* Thống kê lượt đặt chỗ, doanh thu, biểu đồ phân tích và chỉ số tiết kiệm carbon của nhà cung cấp.

#### [NEW] [partner_services.html](file:///d:/hoc/phattrienwebkinhdoanh/Project/prj/partner_services.html)
* Quản lý danh sách dịch vụ đang kinh doanh và giao diện phê duyệt các yêu cầu đặt cọc/thanh toán của du khách.

---

## Verification Plan

### Automated Tests
* Chạy máy chủ `node server.js` đảm bảo API kết nối CSDL PostgreSQL khởi tạo bảng chính xác hoặc tự động chuyển sang LocalStorage fallback khi offline.

### Manual Verification
1. Truy cập trang chủ `index.html` kiểm tra giao diện tìm kiếm và đánh giá.
2. Kiểm tra bộ lọc và phân nhóm tour ở `tours.html`.
3. Kiểm tra tính năng accordion xem chi tiết hoạt động theo giờ ở `tour_detail.html`.
4. Trải nghiệm tạo lịch trình AI, nạp tiền vào ví, đặt và thanh toán gộp trên `schedule_editor.html`.
