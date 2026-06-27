require('dotenv').config();
const mongoose = require('mongoose');

// Connection string
let dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/greensteps';
if (dbUri.includes('<db_username>') || dbUri.includes('<db_password>')) {
  console.warn('WARNING: MONGODB_URI contains placeholders. Using local MongoDB for seeding.');
  dbUri = 'mongodb://localhost:27017/greensteps';
}

console.log(`Connecting to database at: ${dbUri}`);

// ==========================================================================
// MODELS (Matching server.js)
// ==========================================================================

const UserSchema = new mongoose.Schema({
  _id: String,
  username: { type: String, unique: true, required: true },
  password_hash: { type: String, required: true },
  fullname: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  phone: String,
  dob: String,
  gender: String,
  address: String,
  role: { type: String, enum: ['traveler', 'provider'], required: true },
  company_name: String
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

const WalletSchema = new mongoose.Schema({
  _id: String,
  user_id: { type: String, ref: 'User', unique: true, required: true },
  balance: { type: Number, default: 0.00, min: 0 },
  registered: { type: Boolean, default: false }
}, { timestamps: true });

const Wallet = mongoose.model('Wallet', WalletSchema);

const WalletTransactionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  wallet_id: { type: String, ref: 'Wallet', required: true },
  type: { type: String, enum: ['deposit', 'payment', 'refund'], required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['success', 'pending', 'failed'], default: 'success' }
}, { timestamps: true });

const WalletTransaction = mongoose.model('WalletTransaction', WalletTransactionSchema);

const TourSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  destination: { type: String, required: true },
  days: { type: Number, required: true, min: 1 },
  cost: { type: Number, required: true, min: 0 },
  old_cost: Number,
  carbon: { type: Number, required: true, min: 0 },
  image_url: String,
  description: String,
  rating: { type: Number, default: 5.0, min: 1.0, max: 5.0 },
  votes_count: { type: Number, default: 0 },
  badges: [String],
  data: [[{
    time: String,
    name: String,
    cost: Number,
    carbon: Number,
    icon: String,
    type: { type: String, enum: ['lodging', 'dining', 'transport', 'attraction'] },
    lat: Number,
    lng: Number,
    id: String
  }]]
}, { timestamps: true });

const Tour = mongoose.model('Tour', TourSchema);

const ItinerarySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  user_id: { type: String, required: true },
  destination: { type: String, required: true },
  days: { type: Number, required: true, min: 1 },
  total_cost: { type: Number, default: 0 },
  total_carbon: { type: Number, default: 0 },
  days_data: [[{
    time: String,
    name: String,
    cost: Number,
    carbon: Number,
    icon: String,
    type: { type: String, enum: ['lodging', 'dining', 'transport', 'attraction'] },
    lat: Number,
    lng: Number,
    id: String
  }]]
}, { timestamps: true });

const Itinerary = mongoose.model('Itinerary', ItinerarySchema);

const ServiceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  provider_id: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  destination: { type: String, required: true },
  cost: { type: Number, required: true, min: 0 },
  carbon: { type: Number, default: 0 },
  icon: { type: String, default: 'bi-gear-fill' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  rating: { type: Number, default: 5.0 },
  bookings_count: { type: Number, default: 0 },
  badges: [String]
}, { timestamps: true });

const Service = mongoose.model('Service', ServiceSchema);

const BookingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  customer_id: { type: String },
  customer_name: { type: String, required: true },
  service_id: { type: String, required: true },
  service_name: { type: String, required: true },
  booking_date: { type: String, required: true },
  guests: { type: Number, required: true, min: 1 },
  value: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'deposit', 'completed', 'rejected'], default: 'pending' }
}, { timestamps: true });

const Booking = mongoose.model('Booking', BookingSchema);

const CommunityPostSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  author_id: { type: String, ref: 'User', required: true },
  rating: { type: Number, default: 5, min: 1, max: 5 },
  text: { type: String, required: true },
  trip_name: String,
  destination: String,
  days: Number,
  likes_count: { type: Number, default: 0 },
  comments_count: { type: Number, default: 0 },
  image_url: String
}, { timestamps: true });

const CommunityPost = mongoose.model('CommunityPost', CommunityPostSchema);

// ==========================================================================
// SEED DATA
// ==========================================================================

const users = [
  {
    _id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb7d',
    username: 'traveler',
    password_hash: '123456',
    fullname: 'Nguyễn Minh Anh',
    email: 'minhanh.greentravel@gmail.com',
    phone: '0901 234 567',
    dob: '12/08/1996',
    gender: 'Nữ',
    address: 'Quận 1, TP. Hồ Chí Minh',
    role: 'traveler'
  },
  {
    _id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    username: 'partner',
    password_hash: '123456',
    fullname: 'Trần Văn A',
    email: 'partner.greentravel@gmail.com',
    phone: '0902 987 654',
    dob: '15/05/1988',
    gender: 'Nam',
    address: 'Quận 3, TP. Hồ Chí Minh',
    role: 'provider',
    company_name: 'Green Valley Travel'
  }
];

const wallets = [
  {
    _id: 'w_traveler_1',
    user_id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb7d',
    balance: 1100000.00,
    registered: true
  },
  {
    _id: 'w_provider_1',
    user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    balance: 0.00,
    registered: false
  }
];

const transactions = [
  {
    id: 'GD-2026060101',
    wallet_id: 'w_traveler_1',
    type: 'deposit',
    description: 'Nạp tiền ví du lịch',
    amount: 2000000.00,
    status: 'success'
  },
  {
    id: 'GD-2026060202',
    wallet_id: 'w_traveler_1',
    type: 'payment',
    description: 'Đặt cọc Tour Phú Yên',
    amount: -1200000.00,
    status: 'success'
  },
  {
    id: 'GD-2026060403',
    wallet_id: 'w_traveler_1',
    type: 'refund',
    description: 'Hoàn tiền dịch vụ xe điện',
    amount: 300000.00,
    status: 'success'
  }
];

const services = [
  {
    id: 'ser_1',
    provider_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'Homestay Xanh Đà Lạt',
    type: 'stay',
    destination: 'Đà Lạt',
    cost: 850000.00,
    carbon: 2.5,
    icon: 'bi-house-door-fill',
    status: 'active',
    rating: 4.8,
    bookings_count: 42,
    badges: ['green', 'budget']
  },
  {
    id: 'ser_2',
    provider_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'Cafe Săn Mây Đà Lạt',
    type: 'food',
    destination: 'Đà Lạt',
    cost: 80000.00,
    carbon: 0.5,
    icon: 'bi-cup-hot-fill',
    status: 'active',
    rating: 4.7,
    bookings_count: 25,
    badges: ['green']
  },
  {
    id: 'ser_3',
    provider_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'Tour Phú Yên Biển Xanh 3N2Đ',
    type: 'tour',
    destination: 'Phú Yên',
    cost: 1890000.00,
    carbon: 15.0,
    icon: 'bi-tree-fill',
    status: 'active',
    rating: 4.9,
    bookings_count: 16,
    badges: ['green', 'best seller']
  }
];

const bookings = [
  {
    id: 'BK-1042',
    customer_id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb7d',
    customer_name: 'Nguyễn Minh Anh',
    service_id: 'ser_3',
    service_name: 'Tour Phú Yên Biển Xanh 3N2Đ',
    booking_date: '12/10/2026',
    guests: 2,
    value: 4500000.00,
    status: 'deposit'
  },
  {
    id: 'BK-1041',
    customer_id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb7d',
    customer_name: 'Nguyễn Minh Anh',
    service_id: 'ser_1',
    service_name: 'Homestay Xanh Đà Lạt',
    booking_date: '15/10/2026',
    guests: 4,
    value: 8200000.00,
    status: 'pending'
  },
  {
    id: 'BK-1040',
    customer_id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb7d',
    customer_name: 'Nguyễn Minh Anh',
    service_id: 'ser_2',
    service_name: 'Cafe Săn Mây Đà Lạt',
    booking_date: '20/10/2026',
    guests: 1,
    value: 1200000.00,
    status: 'deposit'
  }
];

const posts = [
  {
    id: 'post_1',
    author_id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb7d',
    rating: 5,
    text: 'Chuyến đi Phú Yên 3 ngày 2 đêm của mình siêu xanh và đáng nhớ! Nhờ thuê xe điện VinFast mà mình vi vu khắp Tuy Hòa hết rất ít tiền, lại không ồn ào. Các bạn nên ghé qua homestay Hoa Vàng nhé, cực kỳ xinh xắn và chủ nhà thân thiện lắm. Đặc biệt là ngắm bình minh ở Mũi Điện thực sự rất xúc động.',
    trip_name: 'Tour Phú Yên Biển Xanh 3N2Đ',
    destination: 'Phú Yên',
    days: 3,
    likes_count: 24,
    comments_count: 8,
    image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'post_2',
    author_id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb7d',
    rating: 5,
    text: 'Tính năng customize lịch trình của GreenSteps rất tiện lợi. Mình có thể thêm bớt địa điểm theo ý thích và hệ thống tự động tính toán lại chi phí. Đáng đồng tiền bát gạo! Chùa Cầu Hội An lúc hoàng hôn cực kỳ lung linh. Mình cũng đã thử tour xe đạp quanh phố cổ, rất thư giãn và bảo vệ môi trường.',
    trip_name: 'Đà Nẵng - Hội An Văn Hóa 4N3Đ',
    destination: 'Đà Nẵng - Hội An',
    days: 4,
    likes_count: 45,
    comments_count: 12,
    image_url: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80'
  }
];

const itineraries = [
  {
    id: 'iti_sample',
    name: 'Lịch trình Phú Yên của tôi',
    user_id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb7d',
    destination: 'Phú Yên',
    days: 3,
    total_cost: 1000000,
    total_carbon: 13.0,
    days_data: [
      [
        { time: "08:00", name: "Check-in Homestay Hoa Vàng", cost: 400000, carbon: 3.0, icon: "bi-house-door-fill", type: "lodging", lat: 13.2205, lng: 109.2885, id: "sample1" },
        { time: "18:00", name: "Hải sản đầm Ô Loan", cost: 250000, carbon: 2.0, icon: "bi-cup-hot-fill", type: "dining", lat: 13.2625, lng: 109.2780, id: "sample2" }
      ],
      [
        { time: "08:00", name: "Trekking Gành Đá Đĩa hoang sơ", cost: 150000, carbon: 0.0, icon: "bi-tree-fill", type: "attraction", lat: 13.3645, lng: 109.3045, id: "sample3" },
        { time: "15:00", name: "Thuê xe máy điện VinFast", cost: 120000, carbon: 0.1, icon: "bi-scooter", type: "transport", lat: 13.0882, lng: 109.3025, id: "sample4" }
      ],
      [
        { time: "10:00", name: "Bánh Hỏi Lòng Heo Bà Năm", cost: 80000, carbon: 1.0, icon: "bi-cup-hot-fill", type: "dining", lat: 13.0905, lng: 109.2995, id: "sample5" }
      ]
    ]
  }
];

const presetTours = [
  {
    id: "preset_dl_1",
    title: "Tour Đà Lạt Gia Đình 3N2Đ",
    destination: "Đà Lạt",
    days: 3,
    cost: 1890000,
    carbon: 45,
    image_url: "image/1dc8619487310884c9d631d689ece1e7.jpg",
    badges: ["Gia đình", "Phổ biến"],
    description: "Trải nghiệm 3 ngày 2 đêm tuyệt vời tại thành phố ngàn hoa Đà Lạt cùng gia đình. Tour được thiết kế đặc biệt cho các gia đình có trẻ nhỏ.",
    data: [
      [
        { time: "08:00", name: "Đón khách - Khách sạn Dahlia", cost: 0, carbon: 0, icon: "bi-building-fill", id: "t_dl_1_1" },
        { time: "10:00", name: "Dạo chơi Thung lũng Tình Yêu", cost: 150000, carbon: 3, icon: "bi-tree-fill", id: "t_dl_1_2" },
        { time: "12:00", name: "Ăn trưa lẩu gà lá é Tao Ngộ", cost: 80000, carbon: 1.5, icon: "bi-cup-hot-fill", id: "t_dl_1_3" },
        { time: "14:00", name: "Ghé Vườn hoa thành phố", cost: 50000, carbon: 1, icon: "bi-tree-fill", id: "t_dl_1_4" }
      ],
      [
        { time: "08:00", name: "Ăn sáng tại khách sạn", cost: 0, carbon: 0, icon: "bi-cup-hot-fill", id: "t_dl_1_5" },
        { time: "10:00", name: "Trượt máng Thác Datanla", cost: 170000, carbon: 1.2, icon: "bi-tree-fill", id: "t_dl_1_6" },
        { time: "14:00", name: "Khám phá Làng Cù Lần", cost: 200000, carbon: 2, icon: "bi-tree-fill", id: "t_dl_1_7" }
      ],
      [
        { time: "08:00", name: "Cafe Săn Mây Đà Lạt", cost: 80000, carbon: 0.5, icon: "bi-cup-hot-fill", id: "t_dl_1_8" },
        { time: "11:00", name: "Mua sắm đặc sản chợ Đà Lạt", cost: 100000, carbon: 1, icon: "bi-cup-hot-fill", id: "t_dl_1_9" }
      ]
    ]
  },
  {
    id: "preset_dl_2",
    title: "Tour Mạo Hiểm Đà Lạt",
    destination: "Đà Lạt",
    days: 2,
    cost: 1890000,
    carbon: 55,
    image_url: "image/52627caa0015b2f833fbdc632d37dc82.jpg",
    badges: ["Trải nghiệm", "Mạo hiểm"],
    description: "Thử thách bản thân với trekking, leo núi vượt thác Datanla (canyoning), đu dây và cắm trại qua đêm giữa rừng thông Đà Lạt.",
    data: [
      [
        { time: "08:00", name: "Đón khách di chuyển lên đỉnh Langbiang", cost: 0, carbon: 5, icon: "bi-bus-front-fill", id: "t_dl_2_1" },
        { time: "09:30", name: "Trekking leo núi chinh phục đỉnh Langbiang", cost: 120000, carbon: 0, icon: "bi-tree-fill", id: "t_dl_2_2" },
        { time: "13:00", name: "Ăn trưa dã ngoại (Eco Lunch)", cost: 100000, carbon: 0.5, icon: "bi-cup-hot-fill", id: "t_dl_2_3" },
        { time: "15:00", name: "Dựng lều trại & chuẩn bị BBQ tối", cost: 300000, carbon: 2, icon: "bi-house-door-fill", id: "t_dl_2_4" }
      ],
      [
        { time: "05:30", name: "Ngắm bình minh trên đỉnh núi & Cafe sáng", cost: 50000, carbon: 0.2, icon: "bi-cup-hot-fill", id: "t_dl_2_5" },
        { time: "08:30", name: "Trải nghiệm Canyoning vượt thác Datanla", cost: 1100000, carbon: 1.5, icon: "bi-tree-fill", id: "t_dl_2_6" },
        { time: "13:00", name: "Ăn trưa tại nhà hàng sinh thái", cost: 150000, carbon: 1.2, icon: "bi-cup-hot-fill", id: "t_dl_2_7" },
        { time: "15:00", name: "Trải nghiệm Zipline xuyên rừng thông", cost: 350000, carbon: 0.5, icon: "bi-tree-fill", id: "t_dl_2_8" }
      ]
    ]
  },
  {
    id: "preset_dl_3",
    title: "Tour Đà Lạt Tiết Kiệm",
    destination: "Đà Lạt",
    days: 2,
    cost: 990000,
    carbon: 15,
    image_url: "image/581559b0ca4ebbb8ec09d933fc7bff3d.jpg",
    badges: ["Tiết kiệm", "Giá rẻ"],
    description: "Khám phá Đà Lạt thanh bình với chi phí tối ưu nhất, nghỉ tại homestay sinh thái và di chuyển bằng xe đạp/xe bus công cộng.",
    data: [
      [
        { time: "08:00", name: "Nhận xe đạp và bắt đầu tour quanh Hồ Xuân Hương", cost: 50000, carbon: 0, icon: "bi-bicycle", id: "t_dl_3_1" },
        { time: "10:00", name: "Tham quan Ga Đà Lạt cổ kính", cost: 20000, carbon: 0.2, icon: "bi-tree-fill", id: "t_dl_3_2" },
        { time: "12:00", name: "Bánh mì xíu mại Hoàng Diệu", cost: 35000, carbon: 0.8, icon: "bi-cup-hot-fill", id: "t_dl_3_3" },
        { time: "14:00", name: "Khám phá Dinh I Bảo Đại nghệ thuật", cost: 60000, carbon: 1, icon: "bi-tree-fill", id: "t_dl_3_4" }
      ],
      [
        { time: "08:30", name: "Khám phá Chùa Linh Phước (Chùa Ve Chai)", cost: 30000, carbon: 1.5, icon: "bi-tree-fill", id: "t_dl_3_5" },
        { time: "11:30", name: "Ăn trưa cơm niêu đất dân dã Đà Lạt", cost: 75000, carbon: 1.2, icon: "bi-cup-hot-fill", id: "t_dl_3_6" },
        { time: "14:00", name: "Dạo bước trong rừng thông hồ Tuyền Lâm", cost: 0, carbon: 0.2, icon: "bi-tree-fill", id: "t_dl_3_7" },
        { time: "16:00", name: "Trà chiều & Bánh ngọt ngắm hoàng hôn", cost: 80000, carbon: 0.5, icon: "bi-cup-hot-fill", id: "t_dl_3_8" }
      ]
    ]
  },
  {
    id: "preset_dl_4",
    title: "Nghỉ Dưỡng Đà Lạt 4N3Đ",
    destination: "Đà Lạt",
    days: 4,
    cost: 5990000,
    carbon: 60,
    image_url: "image/6ba7b55db5bf22fa2ff07b46ec6ff3a2.jpg",
    badges: ["Nghỉ dưỡng", "Sang trọng"],
    description: "Kỳ nghỉ dưỡng sinh thái cao cấp tại Ana Mandara Villas Dalat Resort & Spa cổ kính, tận hưởng không gian riêng tư giữa rừng thông.",
    data: [
      [
        { time: "09:00", name: "Đón sân bay Liên Khương bằng xe điện riêng", cost: 250000, carbon: 0.2, icon: "bi-bus-front-fill", id: "t_dl_4_1" },
        { time: "10:30", name: "Check-in Ana Mandara Villas Dalat Resort", cost: 5990000, carbon: 18, icon: "bi-building-fill", id: "t_dl_4_2" },
        { time: "12:00", name: "Ăn trưa lãng mạn tại nhà hàng Le Petit", cost: 600000, carbon: 3.5, icon: "bi-cup-hot-fill", id: "t_dl_4_3" },
        { time: "15:00", name: "Liệu trình Massage thảo mộc tại Spa resort", cost: 1000000, carbon: 0.5, icon: "bi-heart-fill", id: "t_dl_4_4" }
      ],
      [
        { time: "09:00", name: "Tham quan Vườn Dâu Tây sinh học công nghệ cao", cost: 100000, carbon: 0.8, icon: "bi-tree-fill", id: "t_dl_4_5" },
        { time: "12:00", name: "Ăn trưa salad hữu cơ tự hái tại vườn", cost: 200000, carbon: 0.4, icon: "bi-cup-hot-fill", id: "t_dl_4_6" },
        { time: "15:00", name: "Chơi golf mini tại resort biệt lập", cost: 300000, carbon: 2, icon: "bi-tree-fill", id: "t_dl_4_7" }
      ],
      [
        { time: "08:30", name: "Trekking nhẹ khám phá đỉnh Robin", cost: 100000, carbon: 0.1, icon: "bi-tree-fill", id: "t_dl_4_8" },
        { time: "10:30", name: "Trải nghiệm Cáp treo đồi Robin ngắm rừng thông", cost: 120000, carbon: 2.5, icon: "bi-tree-fill", id: "t_dl_4_9" },
        { time: "13:00", name: "Ăn trưa lẩu rau buffet tươi ngon", cost: 250000, carbon: 1.5, icon: "bi-cup-hot-fill", id: "t_dl_4_10" },
        { time: "16:00", name: "Trà chiều kiểu Anh bên lò sưởi cổ kính", cost: 180000, carbon: 0.8, icon: "bi-cup-hot-fill", id: "t_dl_4_11" }
      ],
      [
        { time: "09:00", name: "Lớp học làm mứt dâu tây truyền thống", cost: 150000, carbon: 1, icon: "bi-cup-hot-fill", id: "t_dl_4_12" },
        { time: "12:00", name: "Trả phòng & xe tiễn sân bay kết thúc hành trình", cost: 250000, carbon: 4.5, icon: "bi-bus-front-fill", id: "t_dl_4_13" }
      ]
    ]
  },
  {
    id: "preset_py_1",
    title: "Tour Phú Yên Gia Đình",
    destination: "Phú Yên",
    days: 3,
    cost: 2990000,
    carbon: 22,
    image_url: "image/3cb236b2f70b777a941ea5d71c4c1d42.jpg",
    badges: ["Gia đình", "Nghỉ dưỡng"],
    description: "Chuyến du lịch gia đình thư thái tại vùng đất hoa vàng trên cỏ xanh, trải nghiệm bãi cát trắng và ẩm thực hải sản phong phú.",
    data: [
      [
        { time: "08:30", name: "Đón gia đình tại sân bay bằng xe điện", cost: 150000, carbon: 0.5, icon: "bi-bus-front-fill", id: "t_py_1_1" },
        { time: "10:00", name: "Check-in Eco Beach Resort", cost: 1500000, carbon: 5, icon: "bi-house-door-fill", id: "t_py_1_2" },
        { time: "12:00", name: "Bữa trưa gia đình tại nhà hàng resort", cost: 400000, carbon: 3, icon: "bi-cup-hot-fill", id: "t_py_1_3" },
        { time: "15:00", name: "Tắm biển cát trắng Tuy Hòa", cost: 0, carbon: 0, icon: "bi-tree-fill", id: "t_py_1_4" }
      ],
      [
        { time: "08:30", name: "Phim trường Hoa Vàng Trên Cỏ Xanh", cost: 80000, carbon: 1.5, icon: "bi-camera-video-fill", id: "t_py_1_5" },
        { time: "12:00", name: "Ăn trưa hải sản đầm Ô Loan", cost: 350000, carbon: 2, icon: "bi-cup-hot-fill", id: "t_py_1_6" },
        { time: "14:30", name: "Tham quan Hải đăng Mũi Điện", cost: 50000, carbon: 1.8, icon: "bi-tree-fill", id: "t_py_1_7" }
      ],
      [
        { time: "08:30", name: "Tham quan tháp Nghinh Phong", cost: 0, carbon: 0.2, icon: "bi-tree-fill", id: "t_py_1_8" },
        { time: "10:30", name: "Mua đặc sản bò một nắng, bánh tráng", cost: 150000, carbon: 0.8, icon: "bi-bag-fill", id: "t_py_1_9" },
        { time: "12:00", name: "Ăn trưa cơm gà Tuy Hòa", cost: 80000, carbon: 1, icon: "bi-cup-hot-fill", id: "t_py_1_10" }
      ]
    ]
  },
  {
    id: "preset_py_2",
    title: "Tour Phú Yên Biển Xanh 3N2Đ",
    destination: "Phú Yên",
    days: 3,
    cost: 1890000,
    carbon: 15,
    image_url: "image/Viet Nam.png",
    badges: ["Biển xanh", "Đặc sắc"],
    description: "Khám phá trọn vẹn Phú Yên hoang sơ: check-in Gành Đá Đĩa kì thú, thưởng thức hải sản ngon đầm Ô Loan và ngắm hoàng hôn Mũi Điện.",
    data: [
      [
        { time: "08:00", name: "Xe limousine đưa đón Tuy Hòa", cost: 150000, carbon: 8, icon: "bi-bus-front-fill", id: "t_py_2_1" },
        { time: "12:00", name: "Check-in Homestay Hoa Vàng", cost: 400000, carbon: 3, icon: "bi-house-door-fill", id: "t_py_2_2" },
        { time: "18:00", name: "Hải sản đầm Ô Loan", cost: 250000, carbon: 2, icon: "bi-cup-hot-fill", id: "t_py_2_3" }
      ],
      [
        { time: "08:00", name: "Trekking Gành Đá Đĩa hoang sơ", cost: 150000, carbon: 0, icon: "bi-tree-fill", id: "t_py_2_4" },
        { time: "14:00", name: "Tham quan Tháp Nhạn", cost: 50000, carbon: 0.5, icon: "bi-tree-fill", id: "t_py_2_5" },
        { time: "16:30", name: "Xe máy điện dạo quanh bờ kè", cost: 60000, carbon: 0.1, icon: "bi-scooter", id: "t_py_2_6" }
      ],
      [
        { time: "09:00", name: "Mua sắm đặc sản Tuy Hòa", cost: 100000, carbon: 1, icon: "bi-cup-hot-fill", id: "t_py_2_7" },
        { time: "11:30", name: "Ăn mắt cá ngừ đại dương hầm thuốc bắc", cost: 80000, carbon: 0.8, icon: "bi-cup-hot-fill", id: "t_py_2_8" }
      ]
    ]
  },
  {
    id: "preset_py_3",
    title: "Tour Phú Yên Tiết Kiệm",
    destination: "Phú Yên",
    days: 2,
    cost: 990000,
    carbon: 5,
    image_url: "image/Viet Nam (1).png",
    badges: ["Tiết kiệm", "Giá tốt"],
    description: "Khám phá Xứ Nẫu mộc mạc với ngân sách tiết kiệm nhất, di chuyển hoàn toàn bằng xe máy điện sinh thái và ở homestay cộng đồng.",
    data: [
      [
        { time: "08:30", name: "Thuê xe máy điện VinFast tự lái", cost: 120000, carbon: 0.1, icon: "bi-scooter", id: "t_py_3_1" },
        { time: "10:00", name: "Check-in Homestay phòng Dorm", cost: 200000, carbon: 1.5, icon: "bi-house-door-fill", id: "t_py_3_2" },
        { time: "12:00", name: "Ăn trưa bánh xèo tôm nhảy", cost: 40000, carbon: 0.6, icon: "bi-cup-hot-fill", id: "t_py_3_3" },
        { time: "14:00", name: "Chụp ảnh tại Bãi Xép hoang sơ", cost: 20000, carbon: 0.4, icon: "bi-tree-fill", id: "t_py_3_4" }
      ],
      [
        { time: "08:30", name: "Check-in cầu gỗ Ông Cọp", cost: 10000, carbon: 0.2, icon: "bi-tree-fill", id: "t_py_3_5" },
        { time: "11:30", name: "Ăn trưa cơm niêu đất dân dã", cost: 50000, carbon: 1, icon: "bi-cup-hot-fill", id: "t_py_3_6" },
        { time: "14:00", name: "Ghé thăm nhà thờ Mằng Lăng cổ", cost: 0, carbon: 0.3, icon: "bi-tree-fill", id: "t_py_3_7" }
      ]
    ]
  },
  {
    id: "preset_py_4",
    title: "Nghỉ Dưỡng Phú Yên 4N3Đ",
    destination: "Phú Yên",
    days: 4,
    cost: 5990000,
    carbon: 45,
    image_url: "image/Viet Nam (2).png",
    badges: ["Nghỉ dưỡng", "Sang trọng"],
    description: "Tận hưởng kỳ nghỉ sang trọng tại biệt thự Eco Beach Resort view biển Tuy Hòa, trải nghiệm spa và lặn ngắm san hô đảo Hòn Yến.",
    data: [
      [
        { time: "09:00", name: "Xe điện resort đón khách Tuy Hòa", cost: 20000, carbon: 0.4, icon: "bi-bus-front-fill", id: "t_py_4_1" },
        { time: "10:30", name: "Check-in biệt thự Eco Beach", cost: 2200000, carbon: 6, icon: "bi-house-door-fill", id: "t_py_4_2" },
        { time: "12:30", name: "Ăn trưa tại nhà hàng ngắm biển", cost: 650000, carbon: 4, icon: "bi-cup-hot-fill", id: "t_py_4_3" },
        { time: "15:30", name: "Tắm hồ bơi vô cực & Cocktail", cost: 150000, carbon: 0.8, icon: "bi-cup-hot-fill", id: "t_py_4_4" }
      ],
      [
        { time: "08:30", name: "Đón bình minh cực Đông bằng cano", cost: 800000, carbon: 5, icon: "bi-tsunami", id: "t_py_4_5" },
        { time: "12:00", name: "Ăn trưa hải sản tại Bãi Môn", cost: 500000, carbon: 3.5, icon: "bi-cup-hot-fill", id: "t_py_4_6" },
        { time: "15:00", name: "Trị liệu Spa đá nóng phục hồi", cost: 700000, carbon: 0.8, icon: "bi-heart-fill", id: "t_py_4_7" }
      ],
      [
        { time: "09:00", name: "Tham quan đảo Nhất Tự Sơn hoang sơ", cost: 400000, carbon: 2, icon: "bi-tsunami", id: "t_py_4_8" },
        { time: "12:30", name: "Bữa trưa dã ngoại trên đảo", cost: 300000, carbon: 1.5, icon: "bi-cup-hot-fill", id: "t_py_4_9" },
        { time: "15:30", name: "Lặn ngắm san hô tại Hòn Yến", cost: 450000, carbon: 1.2, icon: "bi-tree-fill", id: "t_py_4_10" }
      ],
      [
        { time: "09:00", name: "Yoga thiền trên bãi cát resort", cost: 0, carbon: 0.1, icon: "bi-tree-fill", id: "t_py_4_11" },
        { time: "12:00", name: "Trả phòng & tiễn khách Tuy Hòa", cost: 250000, carbon: 1.8, icon: "bi-bus-front-fill", id: "t_py_4_12" }
      ]
    ]
  },
  {
    id: "preset_dn_1",
    title: "Tour Đà Nẵng Gia Đình",
    destination: "Đà Nẵng - Hội An",
    days: 3,
    cost: 3890000,
    carbon: 30,
    image_url: "image/7c9e14a82698a594dd914369bfb8eaa5.jpg",
    badges: ["Gia đình", "Phổ biến"],
    description: "Khám phá thành phố đáng sống nhất Việt Nam cùng cả nhà: vui chơi Bà Nà Hills, tắm biển Mỹ Khê và thưởng thức ẩm thực miền Trung đặc trưng.",
    data: [
      [
        { time: "08:30", name: "Đón gia đình tại sân bay về resort", cost: 150000, carbon: 3.5, icon: "bi-bus-front-fill", id: "t_dn_1_1" },
        { time: "10:00", name: "Check-in Golden Bay Hotel Đà Nẵng", cost: 1200000, carbon: 4.5, icon: "bi-building-fill", id: "t_dn_1_2" },
        { time: "12:00", name: "Ăn trưa cơm niêu gia đình ấm cúng", cost: 250000, carbon: 2, icon: "bi-cup-hot-fill", id: "t_dn_1_3" },
        { time: "15:30", name: "Ngắm Voọc chà vá bán đảo Sơn Trà", cost: 100000, carbon: 1.5, icon: "bi-tree-fill", id: "t_dn_1_4" }
      ],
      [
        { time: "08:30", name: "Vui chơi giải trí tại Bà Nà Hills", cost: 950000, carbon: 6, icon: "bi-tree-fill", id: "t_dn_1_5" },
        { time: "12:30", name: "Ăn buffet trưa quốc tế Bà Nà Hills", cost: 350000, carbon: 3, icon: "bi-cup-hot-fill", id: "t_dn_1_6" },
        { time: "18:30", name: "Ăn tối hải sản biển Mỹ Khê", cost: 400000, carbon: 2.8, icon: "bi-cup-hot-fill", id: "t_dn_1_7" }
      ],
      [
        { time: "09:00", name: "Tham quan bảo tàng điêu khắc Chăm", cost: 60000, carbon: 0.5, icon: "bi-tree-fill", id: "t_dn_1_8" },
        { time: "11:00", name: "Mua sắm đặc sản chợ Hàn", cost: 150000, carbon: 1.2, icon: "bi-bag-fill", id: "t_dn_1_9" }
      ]
    ]
  },
  {
    id: "preset_dn_2",
    title: "Đà Nẵng - Hội An Văn Hóa",
    destination: "Đà Nẵng - Hội An",
    days: 4,
    cost: 3990000,
    carbon: 32,
    image_url: "image/Viet Nam.png",
    badges: ["Văn hóa", "Trải nghiệm"],
    description: "Hành trình di sản độc đáo: check-in Cầu Vàng Bà Nà Hills, dạo bước Phố cổ Hội An lung linh đèn lồng và trải nghiệm làm đèn lồng giấy.",
    data: [
      [
        { time: "09:00", name: "Xe limousine đón tiễn sân bay", cost: 150000, carbon: 4, icon: "bi-bus-front-fill", id: "t_dn_2_1" },
        { time: "13:00", name: "Check-in khách sạn sinh thái Hội An", cost: 800000, carbon: 5, icon: "bi-building-fill", id: "t_dn_2_2" },
        { time: "18:00", name: "Ẩm thực phố cổ Cao lầu, cơm gà", cost: 200000, carbon: 1.5, icon: "bi-cup-hot-fill", id: "t_dn_2_3" }
      ],
      [
        { time: "08:00", name: "Check-in Cầu Vàng nổi tiếng Bà Nà", cost: 900000, carbon: 6, icon: "bi-tree-fill", id: "t_dn_2_4" },
        { time: "12:30", name: "Buffet truyền thống miền Trung", cost: 300000, carbon: 3, icon: "bi-cup-hot-fill", id: "t_dn_2_5" },
        { time: "18:00", name: "Thưởng thức lẩu hải sản Đà Nẵng", cost: 300000, carbon: 3, icon: "bi-cup-hot-fill", id: "t_dn_2_6" }
      ],
      [
        { time: "09:00", name: "Dạo bộ tham quan Phố cổ Hội An", cost: 120000, carbon: 0, icon: "bi-tree-fill", id: "t_dn_2_7" },
        { time: "15:00", name: "Xe đạp dạo chơi vườn rau hữu cơ Trà Quế", cost: 50000, carbon: 0, icon: "bi-bicycle", id: "t_dn_2_8" },
        { time: "18:00", name: "Tham gia lớp học làm đèn lồng giấy", cost: 150000, carbon: 0.2, icon: "bi-palette-fill", id: "t_dn_2_9" }
      ],
      [
        { time: "09:00", name: "Khám phá rừng dừa thúng Bảy Mẫu", cost: 150000, carbon: 0.5, icon: "bi-tsunami", id: "t_dn_2_10" },
        { time: "12:00", name: "Mua sắm quà lưu niệm & tiễn khách", cost: 100000, carbon: 1, icon: "bi-bag-fill", id: "t_dn_2_11" }
      ]
    ]
  },
  {
    id: "preset_dn_3",
    title: "Tour Đà Nẵng Tiết Kiệm",
    destination: "Đà Nẵng - Hội An",
    days: 2,
    cost: 990000,
    carbon: 14,
    image_url: "image/b025d2b33ebe6db7e576ff3476f9acde.jpg",
    badges: ["Tiết kiệm", "Đường phố"],
    description: "Khám phá thành phố của những cây cầu với chi phí tối giản, ăn uống chợ đêm ẩm thực phong phú và đi bộ khám phá phố cổ.",
    data: [
      [
        { time: "08:30", name: "Đi xe bus công cộng Danabus", cost: 20000, carbon: 0.5, icon: "bi-bus-front-fill", id: "t_dn_3_1" },
        { time: "10:00", name: "Check-in hostel giường Dorm", cost: 150000, carbon: 1.5, icon: "bi-house-door-fill", id: "t_dn_3_2" },
        { time: "12:00", name: "Bánh mì Phượng Hội An nổi tiếng", cost: 40000, carbon: 0.8, icon: "bi-cup-hot-fill", id: "t_dn_3_3" },
        { time: "14:00", name: "Leo núi Ngũ Hành Sơn hang động", cost: 40000, carbon: 0.4, icon: "bi-tree-fill", id: "t_dn_3_4" }
      ],
      [
        { time: "09:00", name: "Thuê xe đạp ngắm biển Mỹ Khê", cost: 40000, carbon: 0, icon: "bi-bicycle", id: "t_dn_3_5" },
        { time: "12:00", name: "Ăn trưa Mỳ Quảng ếch ngon rẻ", cost: 50000, carbon: 1, icon: "bi-cup-hot-fill", id: "t_dn_3_6" },
        { time: "14:30", name: "Chụp ảnh Cầu Rồng biểu tượng", cost: 0, carbon: 0.2, icon: "bi-tree-fill", id: "t_dn_3_7" }
      ]
    ]
  },
  {
    id: "preset_dn_4",
    title: "Nghỉ Dưỡng Đà Nẵng 5N4Đ",
    destination: "Đà Nẵng - Hội An",
    days: 5,
    cost: 7990000,
    carbon: 90,
    image_url: "image/7c9e14a82698a594dd914369bfb8eaa5.jpg",
    badges: ["Nghỉ dưỡng", "Sang trọng"],
    description: "Kỳ nghỉ dưỡng đẳng cấp thượng lưu tại resort Intercontinental bán đảo Sơn Trà, trải nghiệm chơi golf và du thuyền ngắm hoàng hôn.",
    data: [
      [
        { time: "09:00", name: "Đón khách bằng xe điện VIP", cost: 300000, carbon: 0.2, icon: "bi-bus-front-fill", id: "t_dn_4_1" },
        { time: "10:30", name: "Check-in Intercontinental Resort", cost: 7990000, carbon: 20, icon: "bi-building-fill", id: "t_dn_4_2" },
        { time: "12:30", name: "Ăn trưa tại Citron ngắm biển", cost: 950000, carbon: 5, icon: "bi-cup-hot-fill", id: "t_dn_4_3" },
        { time: "15:30", name: "Thư giãn trên bãi cát resort riêng tư", cost: 0, carbon: 0, icon: "bi-tree-fill", id: "t_dn_4_4" }
      ],
      [
        { time: "09:00", name: "Chơi Golf 18 hố ven biển", cost: 2200000, carbon: 4.5, icon: "bi-tree-fill", id: "t_dn_4_5" },
        { time: "13:00", name: "Buffet hải sản hảo hạng quốc tế", cost: 750000, carbon: 5.5, icon: "bi-cup-hot-fill", id: "t_dn_4_6" },
        { time: "16:00", name: "Trị liệu xông hơi thải độc thảo dược", cost: 1200000, carbon: 1, icon: "bi-heart-fill", id: "t_dn_4_7" }
      ],
      [
        { time: "08:30", name: "Đi cano cao tốc ra Cù Lao Chàm", cost: 900000, carbon: 12, icon: "bi-tsunami", id: "t_dn_4_8" },
        { time: "12:00", name: "Ăn trưa hải sản nướng hoang sơ", cost: 600000, carbon: 3.5, icon: "bi-cup-hot-fill", id: "t_dn_4_9" },
        { time: "14:30", name: "Lặn san hô bảo tồn rực rỡ sắc màu", cost: 500000, carbon: 0.8, icon: "bi-tree-fill", id: "t_dn_4_10" }
      ],
      [
        { time: "09:30", name: "Lớp học nấu ăn các món miền Trung", cost: 600000, carbon: 1.5, icon: "bi-cup-hot-fill", id: "t_dn_4_11" },
        { time: "15:00", name: "Du thuyền buồm ngắm hoàng hôn vịnh", cost: 1500000, carbon: 3, icon: "bi-tsunami", id: "t_dn_4_12" },
        { time: "19:00", name: "Bữa tối nến lãng mạn bờ biển resort", cost: 1200000, carbon: 4, icon: "bi-cup-hot-fill", id: "t_dn_4_13" }
      ],
      [
        { time: "09:00", name: "Tập Taichi dưỡng sinh trên bãi cát", cost: 0, carbon: 0.1, icon: "bi-tree-fill", id: "t_dn_4_14" },
        { time: "12:00", name: "Trả phòng & tiễn đưa ra sân bay", cost: 300000, carbon: 3.5, icon: "bi-bus-front-fill", id: "t_dn_4_15" }
      ]
    ]
  }
];

// ==========================================================================
// SEEDING LOGIC
// ==========================================================================

async function seed() {
  try {
    // 1. Clean old data
    console.log('Cleaning old databases...');
    await User.deleteMany({});
    await Wallet.deleteMany({});
    await WalletTransaction.deleteMany({});
    await Tour.deleteMany({});
    await Itinerary.deleteMany({});
    await Service.deleteMany({});
    await Booking.deleteMany({});
    await CommunityPost.deleteMany({});
    
    // 2. Insert Users
    console.log('Seeding Users...');
    await User.insertMany(users);
    
    // 3. Insert Wallets
    console.log('Seeding Wallets...');
    await Wallet.insertMany(wallets);
    
    // 4. Insert Transactions
    console.log('Seeding Wallet Transactions...');
    await WalletTransaction.insertMany(transactions);
    
    // 5. Insert Services
    console.log('Seeding Services...');
    await Service.insertMany(services);
    
    // 6. Insert Bookings
    console.log('Seeding Bookings...');
    await Booking.insertMany(bookings);
    
    // 7. Insert Community Posts
    console.log('Seeding Community Posts...');
    await CommunityPost.insertMany(posts);
    
    // 8. Insert Custom Itineraries
    console.log('Seeding Custom Itineraries...');
    await Itinerary.insertMany(itineraries);
    
    // 9. Insert Preset Tours
    console.log('Seeding Preset Tours...');
    await Tour.insertMany(presetTours);
    
    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed with error:', err);
    process.exit(1);
  }
}

mongoose.connect(dbUri)
  .then(() => console.log('Connected to MongoDB database, starting seeding...'))
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  });

mongoose.connection.on('open', seed);
