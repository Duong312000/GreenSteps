const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();

const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/greensteps';

if (dbUri.startsWith('mongodb+srv://')) {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
}

// ==========================================================================
// NEW 24 RELATIONAL MONGOOSE SCHEMAS & MODELS WITH COMPATIBLE "id" FIELD
// ==========================================================================

const BadgeSchema = new mongoose.Schema({
  _id: { type: String }, // Badges_name PK
  id: String,
  badges_description: String,
  foruserortour: { type: Number, required: true }
}, { timestamps: true });
const Badge = mongoose.model('Badge', BadgeSchema);

const UserSchema = new mongoose.Schema({
  _id: { type: String }, // ID_User PK (UG...)
  id: String,
  role: { type: String, enum: ['traveler', 'provider'], required: true },
  username: { type: String, unique: true, required: true },
  password_hash: { type: String, required: true },
  fullname: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  phone: String,
  dob: String,
  gender: String,
  address: String,
  job: String
}, { timestamps: true });
const User = mongoose.model('User', UserSchema);

const BadgeUserSchema = new mongoose.Schema({
  badge_name: { type: String, ref: 'Badge', required: true },
  user_id: { type: String, ref: 'User', required: true }
}, { timestamps: true });
BadgeUserSchema.index({ badge_name: 1, user_id: 1 }, { unique: true });
const BadgeUser = mongoose.model('BadgeUser', BadgeUserSchema);

const WalletSchema = new mongoose.Schema({
  _id: { type: String }, // ID_EW PK (EW...)
  id: String,
  user_id: { type: String, ref: 'User', unique: true, required: true },
  balance: { type: Number, default: 0.00, min: 0 },
  registered: { type: Boolean, default: false }
}, { timestamps: true });
const Wallet = mongoose.model('Wallet', WalletSchema);

const WalletTransactionSchema = new mongoose.Schema({
  _id: { type: String }, // ID_WT PK (GD...)
  id: String,
  wallet_id: { type: String, ref: 'Wallet', required: true },
  type: { type: String, enum: ['deposit', 'payment', 'refund'], required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['success', 'pending', 'failed'], default: 'success' }
}, { timestamps: true });
const WalletTransaction = mongoose.model('WalletTransaction', WalletTransactionSchema);

const VenderSchema = new mongoose.Schema({
  _id: { type: String }, // role PK ('1')
  id: String,
  user_id: { type: String, ref: 'User', unique: true, required: true },
  registration_date: { type: String, required: true } // DD/MM/YYYY
}, { timestamps: true });
const Vender = mongoose.model('Vender', VenderSchema);

const VenderContractSchema = new mongoose.Schema({
  _id: { type: String }, // ID_VC PK (VC...)
  id: String,
  user_id: { type: String, ref: 'User', required: true },
  name_contract: { type: String, required: true },
  text: { type: String, required: true }
}, { timestamps: true });
const VenderContract = mongoose.model('VenderContract', VenderContractSchema);

const RevenueSchema = new mongoose.Schema({
  _id: { type: String }, // ID_Revenue PK (REV...)
  id: String,
  user_id: { type: String, ref: 'User', required: true },
  monthyear: { type: String, required: true }, // MM/YYYY
  total_booking: { type: Number, default: 0 },
  total_revenue: { type: Number, default: 0.00 },
  service_fee: { type: Number, default: 0.00 },
  final_profit: { type: Number, default: 0.00 }
}, { timestamps: true });
const Revenue = mongoose.model('Revenue', RevenueSchema);

const ContractSchema = new mongoose.Schema({
  _id: { type: String }, // ID_contract PK (CON...)
  id: String,
  name_contract: { type: String, required: true },
  text: { type: String, required: true },
  contract_status: { type: String, required: true } // active/inactive
}, { timestamps: true });
const Contract = mongoose.model('Contract', ContractSchema);

const ProviderSchema = new mongoose.Schema({
  _id: { type: String }, // ID_provider PK (PROV...)
  id: String,
  contract_id: { type: String, ref: 'Contract', required: true },
  name_provider: { type: String, required: true },
  field: String,
  destination: { type: String, required: true },
  image_url: String,
  provider_status: { type: String, required: true }
}, { timestamps: true });
const Provider = mongoose.model('Provider', ProviderSchema);

const ScheduleSchema = new mongoose.Schema({
  _id: { type: String }, // ID_Schedule PK (SCH... or iti...)
  id: String,
  tour_name: { type: String, required: true },
  destination: { type: String, required: true },
  days: { type: Number, required: true, min: 1 },
  discount: { type: Number, default: 0.00 },
  carbon: { type: Number, required: true, default: 0.00 },
  image_url: String,
  tour_description: String,
  votes_count: { type: Number, default: 0 }
}, { timestamps: true });
const Schedule = mongoose.model('Schedule', ScheduleSchema);

const BadgeScheduleSchema = new mongoose.Schema({
  badge_name: { type: String, ref: 'Badge', required: true },
  schedule_id: { type: String, ref: 'Schedule', required: true }
}, { timestamps: true });
BadgeScheduleSchema.index({ badge_name: 1, schedule_id: 1 }, { unique: true });
const BadgeSchedule = mongoose.model('BadgeSchedule', BadgeScheduleSchema);

const ScheduleSampleSchema = new mongoose.Schema({
  _id: { type: String, ref: 'Schedule' }, // ID_ScheduleS PK references Schedule
  id: String,
  provider_id: { type: String, ref: 'Provider', required: true },
  cost: { type: Number, required: true },
  old_cost: Number,
  rating: { type: Number, default: 5.0 },
  votes_count: { type: Number, default: 0 }
}, { timestamps: true });
const ScheduleSample = mongoose.model('ScheduleSample', ScheduleSampleSchema);

const ScheduleCustomSchema = new mongoose.Schema({
  _id: { type: String, ref: 'Schedule' }, // ID_ScheduleC PK references Schedule
  id: String,
  user_id: { type: String, ref: 'User', required: true },
  total_cost: { type: Number, default: 0.00 }
}, { timestamps: true });
const ScheduleCustom = mongoose.model('ScheduleCustom', ScheduleCustomSchema);

const UserScheduleSchema = new mongoose.Schema({
  user_id: { type: String, ref: 'User', required: true },
  schedule_id: { type: String, ref: 'Schedule', required: true }
}, { timestamps: true });
UserScheduleSchema.index({ user_id: 1, schedule_id: 1 }, { unique: true });
const UserSchedule = mongoose.model('UserSchedule', UserScheduleSchema);

const GreenServiceSchema = new mongoose.Schema({
  _id: { type: String }, // ID_GS PK
  id: String,
  vender_id: { type: String, ref: 'Vender', required: true },
  name_service: { type: String, required: true },
  type: { type: String, required: true }, // stay, food, transport, attraction
  cost: { type: Number, required: true },
  destination: { type: String, required: true },
  carbon: { type: Number, default: 0.00 },
  image_url: String,
  rating: { type: Number, default: 5.0 },
  bookings_count: { type: Number, default: 0 },
  current_data: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });
const GreenService = mongoose.model('GreenService', GreenServiceSchema);

const BadgeServiceSchema = new mongoose.Schema({
  badge_name: { type: String, ref: 'Badge', required: true },
  service_id: { type: String, ref: 'GreenService', required: true }
}, { timestamps: true });
BadgeServiceSchema.index({ badge_name: 1, service_id: 1 }, { unique: true });
const BadgeService = mongoose.model('BadgeService', BadgeServiceSchema);

const ServiceBookingSchema = new mongoose.Schema({
  _id: { type: String }, // ID_SB PK
  id: String,
  user_id: { type: String, ref: 'User', required: true },
  service_id: { type: String, ref: 'GreenService', required: true },
  fullname: { type: String, required: true },
  name_service: { type: String, required: true },
  booking_date: { type: String, required: true },
  guests: { type: Number, required: true, min: 1 },
  value: { type: Number, required: true },
  status: { type: String, required: true }, // pending, deposit, completed, rejected
  votes_count: { type: Number, default: 0 }
}, { timestamps: true });
const ServiceBooking = mongoose.model('ServiceBooking', ServiceBookingSchema);

const ScheduleActivitySchema = new mongoose.Schema({
  _id: { type: String }, // ID_Activity PK
  id: String,
  service_id: { type: String, ref: 'GreenService' }, // optional
  schedule_id: { type: String, ref: 'Schedule', required: true },
  day_number: { type: Number, required: true },
  time: { type: String, required: true },
  activity_name: { type: String, required: true },
  activity_cost: { type: Number, default: 0.00 },
  carbon: { type: Number, default: 0.00 },
  icon: String,
  type: String,
  coordinates: String // "lat, lng"
}, { timestamps: true });
const ScheduleActivity = mongoose.model('ScheduleActivity', ScheduleActivitySchema);

const AdCampaignSchema = new mongoose.Schema({
  _id: { type: String }, // ID_ADC PK
  id: String,
  user_id: { type: String, ref: 'User', required: true },
  service_id: { type: String, ref: 'GreenService', required: true },
  campaigns_type: { type: String, required: true },
  campaigns_name: { type: String, required: true },
  campaigns_cost: { type: Number, required: true },
  duration_days: { type: Number, required: true },
  start_date: { type: String, required: true },
  end_date: { type: String, required: true },
  status: { type: String, required: true }
}, { timestamps: true });
const AdCampaign = mongoose.model('AdCampaign', AdCampaignSchema);

const CommunityPostSchema = new mongoose.Schema({
  _id: { type: String }, // ID_CUP PK
  id: String,
  user_id: { type: String, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  text: { type: String, required: true },
  tour_name: String,
  destination: String,
  image_url: String,
  tour_description: String,
  days: Number,
  likes_count: { type: Number, default: 0 },
  comments_count: { type: Number, default: 0 },
  current_data: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });
const CommunityPost = mongoose.model('CommunityPost', CommunityPostSchema);

const CommentPostSchema = new mongoose.Schema({
  _id: { type: String }, // ID_CEP PK
  id: String,
  user_id: { type: String, ref: 'User' },
  post_id: { type: String, ref: 'CommunityPost', required: true }, // maps to ID_CUP
  parent_comment_id: { type: String, ref: 'CommentPost' }, // optional
  rating: Number,
  text: { type: String, required: true },
  image_url: String
}, { timestamps: true });
const CommentPost = mongoose.model('CommentPost', CommentPostSchema);

const CPSSSchema = new mongoose.Schema({
  comment_id: { type: String, ref: 'CommentPost', required: true },
  schedule_sample_id: { type: String, ref: 'ScheduleSample', required: true }
}, { timestamps: true });
CPSSSchema.index({ comment_id: 1, schedule_sample_id: 1 }, { unique: true });
const CPSS = mongoose.model('CPSS', CPSSSchema);

const CPGSSchema = new mongoose.Schema({
  comment_id: { type: String, ref: 'CommentPost', required: true },
  service_id: { type: String, ref: 'GreenService', required: true }
}, { timestamps: true });
CPGSSchema.index({ comment_id: 1, service_id: 1 }, { unique: true });
const CPGS = mongoose.model('CPGS', CPGSSchema);


// ==========================================================================
// MIGRATION & SEEDING EXECUTION
// ==========================================================================

async function seed() {
  console.log('Connecting to database:', dbUri);
  await mongoose.connect(dbUri);
  console.log('Connected! Starting migration and seeding...');

  // 1. Drop old collections to clear conflicting unique indexes
  console.log('Dropping old collections to reset indexes...');
  const collectionsToDrop = [
    'badges', 'users', 'badgeusers', 'wallets', 'wallettransactions',
    'venders', 'vendercontracts', 'revenues', 'contracts', 'providers',
    'schedules', 'badgeschedules', 'schedulesamples', 'schedulecustoms',
    'userschedules', 'greenservices', 'badgeservices', 'servicebookings',
    'scheduleactivities', 'adcampaigns', 'communityposts', 'commentposts',
    'cpss', 'cpgs', 'cpsses', 'cpgses'
  ];

  for (const cName of collectionsToDrop) {
    try {
      await mongoose.connection.db.collection(cName).drop();
      console.log(`- Dropped collection: ${cName}`);
    } catch (e) {
      // Ignore if collection doesn't exist
    }
  }

  // 2. Insert Badges
  console.log('Seeding Badges...');
  await Badge.insertMany([
    { _id: 'green', id: 'green', badges_description: 'Chứng nhận sinh thái xanh thân thiện môi trường', foruserortour: 2 },
    { _id: 'budget', id: 'budget', badges_description: 'Giá cả tiết kiệm, phù hợp ngân sách học sinh sinh viên', foruserortour: 0 },
    { _id: 'bestseller', id: 'bestseller', badges_description: 'Sản phẩm/dịch vụ lữ hành bán chạy nhất hệ thống', foruserortour: 1 }
  ]);

  // 3. Insert Users
  console.log('Seeding Users & Wallets...');
  const defaultUsers = [
    {
      _id: 'UG26tra0001',
      id: 'UG26tra0001',
      role: 'traveler',
      username: 'traveler',
      password_hash: '$2b$10$T8VqU8dG2C1F1JjHkL6hUe9eB5Z2D3O4P5Q6R7S8T9U0V1W2X3Y4Z', // placeholder for '123456'
      fullname: 'Nguyễn Minh Anh',
      email: 'minhanh.greentravel@gmail.com',
      phone: '0901 234 567',
      dob: '12/08/1996',
      gender: '0',
      address: 'Quận 1, TP. Hồ Chí Minh',
      job: 'Nhân viên văn phòng'
    },
    {
      _id: 'UG26pro0001',
      id: 'UG26pro0001',
      role: 'provider',
      username: 'partner',
      password_hash: '$2b$10$T8VqU8dG2C1F1JjHkL6hUe9eB5Z2D3O4P5Q6R7S8T9U0V1W2X3Y4Z', // placeholder for '123456'
      fullname: 'Trần Văn A',
      email: 'partner.greentravel@gmail.com',
      phone: '0902 987 654',
      dob: '15/05/1988',
      gender: '1',
      address: 'Quận 3, TP. Hồ Chí Minh',
      job: 'Kinh doanh homestay'
    }
  ];

  // Try checking if there are existing users in MongoDB to preserve their passwords
  try {
    const existingUsers = await mongoose.connection.db.collection('users_backup').find().toArray();
    if (existingUsers.length > 0) {
      for (const eu of existingUsers) {
        const mappedRole = eu.role === 'provider' ? 'provider' : 'traveler';
        const id = eu.id || eu._id.toString();
        await User.create({
          _id: id,
          id: id,
          role: mappedRole,
          username: eu.username,
          password_hash: eu.password_hash || eu.password || '$2b$10$T8VqU8dG2C1F1JjHkL6hUe9eB5Z2D3O4P5Q6R7S8T9U0V1W2X3Y4Z',
          fullname: eu.fullname || eu.name || eu.username,
          email: eu.email,
          phone: eu.phone || '',
          dob: eu.dob || '',
          gender: eu.gender || '0',
          address: eu.address || '',
          job: eu.job || ''
        });
      }
      console.log(`Migrated ${existingUsers.length} existing users.`);
    } else {
      await User.insertMany(defaultUsers);
    }
  } catch (err) {
    await User.insertMany(defaultUsers);
  }

  // 4. Create Vender & VenderContract
  console.log('Seeding Vender & VenderContracts...');
  await Vender.create({ _id: '1', id: '1', user_id: 'UG26pro0001', registration_date: '28/06/2026' });
  await VenderContract.create({
    _id: 'VC26pro0001',
    id: 'VC26pro0001',
    user_id: 'UG26pro0001',
    name_contract: 'Hợp đồng liên kết đối tác bán hàng GreenSteps',
    text: 'Nội dung chi tiết về điều khoản chiết khấu, cam kết chất lượng xanh của hộ kinh doanh...'
  });

  // 5. Create Ewallet & Transactions
  console.log('Seeding Wallets & Transactions...');
  await Wallet.create({ _id: 'EW26tra0001', id: 'EW26tra0001', user_id: 'UG26tra0001', balance: 1100000.00, registered: true });
  await Wallet.create({ _id: 'EW26pro0001', id: 'EW26pro0001', user_id: 'UG26pro0001', balance: 0.00, registered: false });

  await WalletTransaction.insertMany([
    { _id: 'GD260601010001', id: 'GD260601010001', wallet_id: 'EW26tra0001', type: 'deposit', description: 'Nạp tiền ví du lịch', amount: 2000000.00, status: 'success' },
    { _id: 'GD260602020002', id: 'GD260602020002', wallet_id: 'EW26tra0001', type: 'payment', description: 'Đặt cọc Tour Phú Yên', amount: -1200000.00, status: 'success' },
    { _id: 'GD260604030003', id: 'GD260604030003', wallet_id: 'EW26tra0001', type: 'refund', description: 'Hoàn tiền dịch vụ xe điện', amount: 300000.00, status: 'success' }
  ]);

  // 6. Create Revenue
  await Revenue.create({
    _id: 'REV2606pro0001',
    id: 'REV2606pro0001',
    user_id: 'UG26pro0001',
    monthyear: '06/2026',
    total_booking: 12,
    total_revenue: 15000000.00,
    service_fee: 1500000.00,
    final_profit: 13500000.00
  });

  // 7. Create B2B contracts & providers
  console.log('Seeding Contract & Providers...');
  await Contract.create({
    _id: 'CON0001',
    id: 'CON0001',
    name_contract: 'Hợp đồng hợp tác chiến lược Saigontourist B2B',
    text: 'Nội dung hợp tác quảng bá gói sản phẩm lữ hành sinh thái...',
    contract_status: 'active'
  });

  await Provider.create({
    _id: 'PROV0001',
    id: 'PROV0001',
    contract_id: 'CON0001',
    name_provider: 'Saigontourist',
    field: 'Lữ hành quốc tế & nội địa',
    destination: 'TP. Hồ Chí Minh',
    image_url: 'https://example.com/logo.png',
    provider_status: 'active'
  });

  // 8. Seeding Tours (Schedule + ScheduleSample + ScheduleActivity)
  console.log('Migrating & Seeding Tours/Schedules...');
  const defaultTours = [
    {
      id: "preset_dl_1",
      title: "Tour Đà Lạt Gia Đình 3N2Đ",
      destination: "Đà Lạt",
      days: 3,
      cost: 1890000,
      oldCost: 2200000,
      carbon: 45,
      image: "image/1dc8619487310884c9d631d689ece1e7.jpg",
      description: "Trải nghiệm 3 ngày 2 đêm tuyệt vời tại thành phố ngàn hoa Đà Lạt cùng gia đình. Tour được thiết kế đặc biệt cho các gia đình có trẻ nhỏ.",
      data: [
        [
          { time: "08:00", name: "Đón khách - Khách sạn Dahlia", cost: 0, carbon: 0, icon: "bi-building-fill", type: "lodging", id: "t_dl_1_1" },
          { time: "10:00", name: "Dạo chơi Thung lũng Tình Yêu", cost: 150000, carbon: 3, icon: "bi-tree-fill", type: "attraction", id: "t_dl_1_2" },
          { time: "12:00", name: "Ăn trưa lẩu gà lá é Tao Ngộ", cost: 80000, carbon: 1.5, icon: "bi-cup-hot-fill", type: "dining", id: "t_dl_1_3" },
          { time: "14:00", name: "Ghé Vườn hoa thành phố", cost: 50000, carbon: 1, icon: "bi-tree-fill", type: "attraction", id: "t_dl_1_4" }
        ],
        [
          { time: "08:00", name: "Ăn sáng tại khách sạn", cost: 0, carbon: 0, icon: "bi-cup-hot-fill", type: "dining", id: "t_dl_1_5" },
          { time: "10:00", name: "Trượt máng Thác Datanla", cost: 170000, carbon: 1.2, icon: "bi-tree-fill", type: "attraction", id: "t_dl_1_6" },
          { time: "14:00", name: "Khám phá Làng Cù Lần", cost: 200000, carbon: 2, icon: "bi-tree-fill", type: "attraction", id: "t_dl_1_7" }
        ],
        [
          { time: "08:00", name: "Cafe Săn Mây Đà Lạt", cost: 80000, carbon: 0.5, icon: "bi-cup-hot-fill", type: "dining", id: "t_dl_1_8" },
          { time: "11:00", name: "Mua sắm đặc sản chợ Đà Lạt", cost: 100000, carbon: 1, icon: "bi-cup-hot-fill", type: "dining", id: "t_dl_1_9" }
        ]
      ]
    },
    {
      id: "preset_py_2",
      title: "Tour Phú Yên Biển Xanh 3N2Đ",
      destination: "Phú Yên",
      days: 3,
      cost: 1890000,
      oldCost: 2900000,
      carbon: 15,
      image: "image/Viet Nam.png",
      description: "Khám phá trọn vẹn Phú Yên hoang sơ: check-in Gành Đá Đĩa kì thú, thưởng thức hải sản ngon đầm Ô Loan và ngắm hoàng hôn Mũi Điện.",
      data: [
        [
          { time: "08:00", name: "Xe limousine đưa đón Tuy Hòa", cost: 150000, carbon: 8, icon: "bi-bus-front-fill", type: "transport", id: "t_py_2_1" },
          { time: "12:00", name: "Check-in Homestay Hoa Vàng", cost: 400000, carbon: 3, icon: "bi-house-door-fill", type: "lodging", id: "t_py_2_2" },
          { time: "18:00", name: "Hải sản đầm Ô Loan", cost: 250000, carbon: 2, icon: "bi-cup-hot-fill", type: "dining", id: "t_py_2_3" }
        ],
        [
          { time: "08:00", name: "Trekking Gành Đá Đĩa hoang sơ", cost: 150000, carbon: 0, icon: "bi-tree-fill", type: "attraction", id: "t_py_2_4" },
          { time: "14:00", name: "Tham quan Tháp Nhạn", cost: 50000, carbon: 0.5, icon: "bi-tree-fill", type: "attraction", id: "t_py_2_5" },
          { time: "16:30", name: "Xe máy điện dạo quanh bờ kè", cost: 60000, carbon: 0.1, icon: "bi-scooter", type: "transport", id: "t_py_2_6" }
        ],
        [
          { time: "09:00", name: "Mua sắm đặc sản Tuy Hòa", cost: 100000, carbon: 1, icon: "bi-cup-hot-fill", type: "dining", id: "t_py_2_7" },
          { time: "11:30", name: "Ăn mắt cá ngừ đại dương hầm thuốc bắc", cost: 80000, carbon: 0.8, icon: "bi-cup-hot-fill", type: "dining", id: "t_py_2_8" }
        ]
      ]
    },
    {
      id: "preset_dn_2",
      title: "Đà Nẵng - Hội An Văn Hóa 4N3Đ",
      destination: "Đà Nẵng - Hội An",
      days: 4,
      cost: 3990000,
      oldCost: 4500000,
      carbon: 32,
      image: "image/Viet Nam.png",
      description: "Hành trình di sản độc đáo: check-in Cầu Vàng Bà Nà Hills, dạo bước Phố cổ Hội An lung linh đèn lồng và trải nghiệm làm đèn lồng giấy.",
      data: [
        [
          { time: "09:00", name: "Xe limousine đón tiễn sân bay", cost: 150000, carbon: 4, icon: "bi-bus-front-fill", type: "transport", id: "t_dn_2_1" },
          { time: "13:00", name: "Check-in khách sạn sinh thái Hội An", cost: 800000, carbon: 5, icon: "bi-building-fill", type: "lodging", id: "t_dn_2_2" },
          { time: "18:00", name: "Ẩm thực phố cổ Cao lầu, cơm gà", cost: 200000, carbon: 1.5, icon: "bi-cup-hot-fill", type: "dining", id: "t_dn_2_3" }
        ],
        [
          { time: "08:00", name: "Check-in Cầu Vàng nổi tiếng Bà Nà", cost: 900000, carbon: 6, icon: "bi-tree-fill", type: "attraction", id: "t_dn_2_4" },
          { time: "12:30", name: "Buffet truyền thống miền Trung", cost: 300000, carbon: 3, icon: "bi-cup-hot-fill", type: "dining", id: "t_dn_2_5" },
          { time: "18:00", name: "Thưởng thức lẩu hải sản Đà Nẵng", cost: 300000, carbon: 3, icon: "bi-cup-hot-fill", type: "dining", id: "t_dn_2_6" }
        ],
        [
          { time: "09:00", name: "Dạo bộ tham quan Phố cổ Hội An", cost: 120000, carbon: 0, icon: "bi-tree-fill", type: "attraction", id: "t_dn_2_7" },
          { time: "15:00", name: "Xe đạp dạo chơi vườn rau hữu cơ Trà Quế", cost: 50000, carbon: 0, icon: "bi-bicycle", type: "transport", id: "t_dn_2_8" },
          { time: "18:00", name: "Tham gia lớp học làm đèn lồng giấy", cost: 150000, carbon: 0.2, icon: "bi-palette-fill", type: "attraction", id: "t_dn_2_9" }
        ],
        [
          { time: "09:00", name: "Khám phá rừng dừa thúng Bảy Mẫu", cost: 150000, carbon: 0.5, icon: "bi-tsunami", type: "attraction", id: "t_dn_2_10" },
          { time: "12:00", name: "Mua sắm quà lưu niệm & tiễn khách", cost: 100000, carbon: 1, icon: "bi-bag-fill", type: "dining", id: "t_dn_2_11" }
        ]
      ]
    }
  ];

  // We migrate additional tours from the database if they were backed up
  let legacyTours = [];
  try {
    legacyTours = await mongoose.connection.db.collection('tours_backup').find().toArray();
  } catch (e) {}

  const allTours = [...defaultTours];
  for (const lt of legacyTours) {
    if (!allTours.some(t => t.id === lt.id)) {
      allTours.push({
        id: lt.id,
        title: lt.title,
        destination: lt.destination,
        days: lt.days,
        cost: lt.cost || 0,
        oldCost: lt.old_cost || lt.oldCost || lt.cost * 1.2,
        carbon: lt.carbon || 0,
        image: lt.image_url || lt.image || 'image/Viet Nam.png',
        description: lt.description || '',
        data: lt.data || []
      });
    }
  }

  for (const tour of allTours) {
    await Schedule.create({
      _id: tour.id,
      id: tour.id,
      tour_name: tour.title,
      destination: tour.destination,
      days: tour.days,
      discount: tour.oldCost ? Math.round(((tour.oldCost - tour.cost) / tour.oldCost) * 100) : 0,
      carbon: tour.carbon,
      image_url: tour.image,
      tour_description: tour.description
    });

    await ScheduleSample.create({
      _id: tour.id,
      id: tour.id,
      provider_id: 'PROV0001',
      cost: tour.cost,
      old_cost: tour.oldCost,
      rating: 4.9,
      votes_count: 15
    });

    if (tour.data && tour.data.length > 0) {
      for (let d = 0; d < tour.data.length; d++) {
        const dayActivities = tour.data[d] || [];
        for (let a = 0; a < dayActivities.length; a++) {
          const act = dayActivities[a];
          const actId = act.id || `act_${tour.id}_${d + 1}_${a + 1}`;
          
          await ScheduleActivity.create({
            _id: actId,
            id: actId,
            schedule_id: tour.id,
            day_number: d + 1,
            time: act.time || '08:00',
            activity_name: act.name || act.title || 'Hoạt động',
            activity_cost: act.cost || 0,
            carbon: act.carbon || 0,
            icon: act.icon || 'bi-tree-fill',
            type: act.type || 'attraction',
            coordinates: act.lat && act.lng ? `${act.lat}, ${act.lng}` : null
          });
        }
      }
    }

    if (tour.id === 'preset_dl_1') {
      await BadgeSchedule.create({ badge_name: 'green', schedule_id: tour.id });
      await BadgeSchedule.create({ badge_name: 'bestseller', schedule_id: tour.id });
    } else if (tour.id === 'preset_py_2') {
      await BadgeSchedule.create({ badge_name: 'green', schedule_id: tour.id });
      await BadgeSchedule.create({ badge_name: 'bestseller', schedule_id: tour.id });
    } else {
      await BadgeSchedule.create({ badge_name: 'green', schedule_id: tour.id });
    }
  }

  // 9. Seed GreenServices
  console.log('Seeding GreenServices...');
  await GreenService.create({
    _id: 'GSstaypro0001',
    id: 'GSstaypro0001',
    vender_id: '1',
    name_service: 'Homestay Xanh Đà Lạt',
    type: 'stay',
    cost: 850000.00,
    destination: 'Đà Lạt',
    carbon: 2.50,
    image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
    rating: 4.8,
    bookings_count: 42,
    current_data: { wifi: true, parking: true }
  });
  await GreenService.create({
    _id: 'GSfoodpro0001',
    id: 'GSfoodpro0001',
    vender_id: '1',
    name_service: 'Cafe Săn Mây Đà Lạt',
    type: 'food',
    cost: 80000.00,
    destination: 'Đà Lạt',
    carbon: 0.50,
    image_url: 'https://images.unsplash.com/photo-1555244162-803834f70033',
    rating: 4.7,
    bookings_count: 25,
    current_data: { menu: ['cafe', 'tea'] }
  });

  await BadgeService.create({ badge_name: 'green', service_id: 'GSstaypro0001' });
  await BadgeService.create({ badge_name: 'green', service_id: 'GSfoodpro0001' });

  // 10. Seed ServiceBooking
  await ServiceBooking.create({
    _id: 'BK2606010001',
    id: 'BK2606010001',
    user_id: 'UG26tra0001',
    service_id: 'GSstaypro0001',
    fullname: 'Nguyễn Minh Anh',
    name_service: 'Homestay Xanh Đà Lạt',
    booking_date: '15/10/2026',
    guests: 4,
    value: 3400000.00,
    status: 'deposit',
    votes_count: 42
  });

  // 11. Seed ad_campaigns
  await AdCampaign.create({
    _id: 'ADC0001',
    id: 'ADC0001',
    user_id: 'UG26pro0001',
    service_id: 'GSstaypro0001',
    campaigns_type: 'top_recommend',
    campaigns_name: 'Chiến dịch mùa hè rực rỡ',
    campaigns_cost: 500000.00,
    duration_days: 30,
    start_date: '01/06/2026',
    end_date: '01/07/2026',
    status: 'active'
  });

  // 12. Seed Community & Comments
  console.log('Seeding Community & Comments...');
  await CommunityPost.create({
    _id: 'CUPtra000101',
    id: 'CUPtra000101',
    user_id: 'UG26tra0001',
    rating: 5,
    text: 'Chuyến đi Phú Yên 3 ngày 2 đêm của mình siêu xanh và đáng nhớ! Nhờ thuê xe điện VinFast mà mình vi vu khắp Tuy Hòa hết rất ít tiền, lại không ồn ào. Các bạn nên ghé qua homestay Hoa Vàng nhé.',
    tour_name: 'Tour Phú Yên Biển Xanh 3N2Đ',
    destination: 'Phú Yên',
    image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    tour_description: 'Khám phá Phú Yên',
    days: 3,
    likes_count: 24,
    comments_count: 8,
    current_data: { tips: 'Nên đi mùa khô' }
  });

  await CommentPost.create({
    _id: 'CEPtra00010001',
    id: 'CEPtra00010001',
    user_id: 'UG26tra0001',
    post_id: 'CUPtra000101',
    rating: 5,
    text: 'Chuyến đi tuyệt vời quá bạn ơi!',
    image_url: null
  });

  await CPSS.create({
    comment_id: 'CEPtra00010001',
    schedule_sample_id: 'preset_py_2'
  });

  console.log('Database migrated & seeded successfully! Disconnecting...');
  await mongoose.disconnect();
  console.log('Done!');
}

seed().catch(err => {
  console.error('Error seeding database:', err);
  process.exit(1);
});
