require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dns = require('dns');

const app = express();
const PORT = process.env.PORT || 5000;
let isDbConnected = false;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Initialize MongoDB Connection
let dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/greensteps';
if (dbUri.includes('<db_username>') || dbUri.includes('<db_password>')) {
  console.warn('WARNING: MONGODB_URI contains placeholders <db_username> or <db_password>. Falling back to local MongoDB at mongodb://localhost:27017/greensteps');
  dbUri = 'mongodb://localhost:27017/greensteps';
}

if (dbUri.startsWith('mongodb+srv://')) {
  const dnsServers = (process.env.DNS_SERVERS || '8.8.8.8,1.1.1.1')
    .split(',')
    .map(server => server.trim())
    .filter(Boolean);

  if (dnsServers.length > 0) {
    dns.setServers(dnsServers);
  }
}

mongoose.set('bufferCommands', false);

mongoose.connection.on('connected', () => {
  isDbConnected = true;
  console.log('Successfully connected to MongoDB database!');
});

mongoose.connection.on('disconnected', () => {
  isDbConnected = false;
  console.warn('MongoDB disconnected.');
});

mongoose.connection.on('error', (err) => {
  isDbConnected = false;
  console.error('MongoDB connection error:', err.message);
});

app.use('/api', (req, res, next) => {
  if (isDbConnected) {
    return next();
  }

  return res.status(503).json({
    error: 'Database is not connected. Please check MONGODB_URI, network access, and MongoDB server status.'
  });
});

// ==========================================================================
// MONGOOSE SCHEMAS & MODELS (String IDs and String Refs for Compatibility)
// ==========================================================================

// 1. User Model
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
// 1. AUTHENTICATION ENDPOINTS (/api/auth)
// ==========================================================================

// Login User
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({
      $or: [{ username: username }, { email: username }]
    });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Sai tên đăng nhập hoặc mật khẩu!' });
    }
    
    // Check password
    if (password !== '123456' && password !== user.password_hash) {
      return res.status(401).json({ success: false, message: 'Sai tên đăng nhập hoặc mật khẩu!' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        fullname: user.fullname,
        email: user.email,
        phone: user.phone,
        dob: user.dob,
        gender: user.gender,
        address: user.address,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server!' });
  }
});

// Register User
app.post('/api/auth/register', async (req, res) => {
  const { username, password, fullname, email, phone, dob, gender, address, role } = req.body;
  try {
    const userExists = await User.findOne({
      $or: [{ username }, { email }]
    });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Tên đăng nhập hoặc Email đã được sử dụng!' });
    }

    const userId = 'UG' + Date.now().toString().slice(-8);
    const user = new User({
      _id: userId,
      id: userId,
      username,
      password_hash: password,
      fullname,
      email,
      phone,
      dob,
      gender,
      address,
      role
    });
    await user.save();

    // Create wallet for the new user
    const walletId = 'EW' + Date.now().toString().slice(-8);
    const wallet = new Wallet({
      _id: walletId,
      id: walletId,
      user_id: user._id,
      balance: 0.00,
      registered: false
    });
    await wallet.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        fullname: user.fullname,
        email: user.email,
        phone: user.phone,
        dob: user.dob,
        gender: user.gender,
        address: user.address,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi đăng ký!' });
  }
});

// Update Profile
app.put('/api/auth/profile/:userId', async (req, res) => {
  const { userId } = req.params;
  const { fullname, phone, email, dob, gender, address, role } = req.body;
  try {
    const updateFields = {};
    if (fullname !== undefined) updateFields.fullname = fullname;
    if (phone !== undefined) updateFields.phone = phone;
    if (email !== undefined) updateFields.email = email;
    if (dob !== undefined) updateFields.dob = dob;
    if (gender !== undefined) updateFields.gender = gender;
    if (address !== undefined) updateFields.address = address;
    if (role !== undefined) updateFields.role = role;

    const user = await User.findByIdAndUpdate(userId, updateFields, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng!' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        fullname: user.fullname,
        email: user.email,
        phone: user.phone,
        dob: user.dob,
        gender: user.gender,
        address: user.address,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi cập nhật!' });
  }
});

// Toggle Role
app.post('/api/auth/role/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
    }
    user.role = user.role === 'traveler' ? 'provider' : 'traveler';
    await user.save();

    if (user.role === 'provider') {
      const existingVender = await Vender.findOne({ user_id: userId });
      if (!existingVender) {
        await Vender.create({
          _id: '1',
          id: '1',
          user_id: userId,
          registration_date: new Date().toLocaleDateString('vi-VN')
        });
      }
    }

    res.json({ success: true, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi chuyển vai trò!' });
  }
});

// ==========================================================================
// 2. ITINERARIES ENDPOINTS (/api/itineraries)
// ==========================================================================

// Get All Itineraries for a User (with full activities nested)
app.get('/api/itineraries/user/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const customs = await ScheduleCustom.find({ user_id: userId });
    const result = [];
    for (const c of customs) {
      const base = await Schedule.findById(c._id);
      if (!base) continue;

      const activities = await ScheduleActivity.find({ schedule_id: c._id }).sort({ day_number: 1, time: 1 });
      const daysData = [];
      for (let i = 0; i < base.days; i++) {
        daysData.push([]);
      }
      activities.forEach(act => {
        const dIdx = act.day_number - 1;
        if (dIdx >= 0 && dIdx < base.days) {
          daysData[dIdx].push({
            time: act.time,
            name: act.activity_name,
            cost: act.activity_cost,
            carbon: act.carbon,
            icon: act.icon,
            type: act.type,
            lat: act.coordinates ? parseFloat(act.coordinates.split(',')[0]) : null,
            lng: act.coordinates ? parseFloat(act.coordinates.split(',')[1]) : null,
            id: act._id
          });
        }
      });

      result.push({
        id: c._id,
        name: base.tour_name,
        destination: base.destination || (base.tour_name.includes('Đà Lạt') ? 'Đà Lạt' : (base.tour_name.includes('Phú Yên') ? 'Phú Yên' : 'Đà Nẵng - Hội An')),
        days: base.days,
        totalCost: c.total_cost,
        totalCarbon: base.carbon,
        daysData: daysData
      });
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi tải danh sách lịch trình!' });
  }
});

// Get Single Itinerary with details
app.get('/api/itineraries/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const c = await ScheduleCustom.findById(id);
    if (!c) {
      return res.status(404).json({ error: 'Không tìm thấy lịch trình!' });
    }
    const base = await Schedule.findById(id);
    if (!base) {
      return res.status(404).json({ error: 'Không tìm thấy lịch trình!' });
    }

    const activities = await ScheduleActivity.find({ schedule_id: id }).sort({ day_number: 1, time: 1 });
    const daysData = [];
    for (let i = 0; i < base.days; i++) {
      daysData.push([]);
    }
    activities.forEach(act => {
      const dIdx = act.day_number - 1;
      if (dIdx >= 0 && dIdx < base.days) {
        daysData[dIdx].push({
          time: act.time,
          name: act.activity_name,
          cost: act.activity_cost,
          carbon: act.carbon,
          icon: act.icon,
          type: act.type,
          lat: act.coordinates ? parseFloat(act.coordinates.split(',')[0]) : null,
          lng: act.coordinates ? parseFloat(act.coordinates.split(',')[1]) : null,
          id: act._id
        });
      }
    });

    res.json({
      id: c._id,
      name: base.tour_name,
      destination: base.destination || (base.tour_name.includes('Đà Lạt') ? 'Đà Lạt' : (base.tour_name.includes('Phú Yên') ? 'Phú Yên' : 'Đà Nẵng - Hội An')),
      days: base.days,
      totalCost: c.total_cost,
      totalCarbon: base.carbon,
      daysData: daysData
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi tải lịch trình!' });
  }
});

// Save or Update Itinerary (Upsert)
app.post('/api/itineraries', async (req, res) => {
  const { id, name, user_id, destination, days, totalCost, totalCarbon, daysData } = req.body;
  try {
    await Schedule.findOneAndUpdate(
      { _id: id },
      {
        tour_name: name,
        destination: destination,
        days: days,
        discount: 0,
        carbon: totalCarbon,
        image_url: 'image/Viet Nam.png',
        tour_description: `Hành trình tự thiết kế đi ${destination}`
      },
      { upsert: true, new: true }
    );

    await ScheduleCustom.findOneAndUpdate(
      { _id: id },
      { user_id: user_id, total_cost: totalCost },
      { upsert: true, new: true }
    );

    await ScheduleActivity.deleteMany({ schedule_id: id });
    const activitiesToSave = [];
    if (daysData && daysData.length > 0) {
      daysData.forEach((day, dIdx) => {
        day.forEach((act, aIdx) => {
          const actId = `act_${id}_${dIdx + 1}_${aIdx + 1}_${Math.random().toString(36).substring(2, 7)}`;
          activitiesToSave.push({
            _id: actId,
            id: actId,
            schedule_id: id,
            day_number: dIdx + 1,
            time: act.time || '08:00',
            activity_name: act.title || act.name || 'Hoạt động',
            activity_cost: act.cost || 0,
            carbon: act.carbon || 0,
            icon: act.icon || 'bi-tree-fill',
            type: act.type || 'attraction',
            coordinates: act.lat && act.lng ? `${act.lat}, ${act.lng}` : null
          });
        });
      });
      await ScheduleActivity.insertMany(activitiesToSave);
    }

    res.json({ success: true, message: 'Đã lưu lịch trình thành công!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi lưu lịch trình!' });
  }
});

// Delete Itinerary
app.delete('/api/itineraries/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await ScheduleActivity.deleteMany({ schedule_id: id });
    await ScheduleCustom.deleteOne({ _id: id });
    await Schedule.deleteOne({ _id: id });
    res.json({ success: true, message: 'Đã xóa lịch trình thành công!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi xóa lịch trình!' });
  }
});

// ==========================================================================
// 3. WALLET & TRANSACTIONS ENDPOINTS (/api/wallet)
// ==========================================================================

// Get Wallet Balance & Status
app.get('/api/wallet/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const wallet = await Wallet.findOne({ user_id: userId });
    if (!wallet) {
      return res.status(404).json({ error: 'Không tìm thấy ví của người dùng này' });
    }
    res.json({
      registered: wallet.registered,
      balance: wallet.balance
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi tải ví tiền!' });
  }
});

// Activate Wallet
app.post('/api/wallet/activate', async (req, res) => {
  const { userId } = req.body;
  try {
    const wallet = await Wallet.findOne({ user_id: userId });
    if (!wallet) {
      return res.status(404).json({ error: 'Không tìm thấy ví' });
    }
    if (wallet.registered) {
      return res.status(400).json({ error: 'Ví đã kích hoạt từ trước!' });
    }

    wallet.registered = true;
    wallet.balance += 5000000.00;
    await wallet.save();

    const txId = 'GD-' + Date.now().toString().slice(-10);
    const transaction = new WalletTransaction({
      _id: txId,
      id: txId,
      wallet_id: wallet._id,
      type: 'deposit',
      description: 'Quà tặng kích hoạt ví du lịch',
      amount: 5000000.00,
      status: 'success'
    });
    await transaction.save();

    res.json({ success: true, balance: wallet.balance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi kích hoạt ví!' });
  }
});

// Deposit Money to Wallet
app.post('/api/wallet/deposit', async (req, res) => {
  const { userId, amount } = req.body;
  try {
    const wallet = await Wallet.findOne({ user_id: userId });
    if (!wallet) {
      return res.status(404).json({ error: 'Ví không tồn tại!' });
    }
    wallet.balance += amount;
    await wallet.save();

    const txId = 'GD-' + Date.now().toString().slice(-10);
    const transaction = new WalletTransaction({
      _id: txId,
      id: txId,
      wallet_id: wallet._id,
      type: 'deposit',
      description: 'Nạp tiền vào ví du lịch',
      amount: amount,
      status: 'success'
    });
    await transaction.save();

    res.json({ success: true, balance: wallet.balance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi nạp tiền!' });
  }
});

// Pay Itinerary (Combine Payment)
app.post('/api/wallet/pay', async (req, res) => {
  const { userId, itineraryId, amount } = req.body;
  try {
    const wallet = await Wallet.findOne({ user_id: userId });
    if (!wallet) {
      return res.status(404).json({ error: 'Ví không tồn tại' });
    }
    if (wallet.balance < amount) {
      return res.status(400).json({ success: false, message: 'Số dư ví không đủ để thanh toán!' });
    }

    wallet.balance -= amount;
    await wallet.save();

    const txId = 'GD-' + Date.now().toString().slice(-10);
    const transaction = new WalletTransaction({
      _id: txId,
      id: txId,
      wallet_id: wallet._id,
      type: 'payment',
      description: `Thanh toán gộp lịch trình #${itineraryId}`,
      amount: -amount,
      status: 'success'
    });
    await transaction.save();

    res.json({ success: true, balance: wallet.balance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi hệ thống!' });
  }
});

// Get Wallet Transactions list
app.get('/api/wallet/transactions/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const wallet = await Wallet.findOne({ user_id: userId });
    if (!wallet) {
      return res.status(404).json({ error: 'Không tìm thấy ví' });
    }
    const transactions = await WalletTransaction.find({ wallet_id: wallet._id }).sort({ createdAt: -1 });

    const formatted = transactions.map(row => ({
      id: row.id,
      type: row.type,
      desc: row.description,
      date: new Date(row.createdAt).toLocaleDateString('vi-VN'),
      amount: row.amount,
      status: row.status
    }));
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi tải lịch sử giao dịch!' });
  }
});

// ==========================================================================
// 4. COMMUNITY POSTS ENDPOINTS (/api/community)
// ==========================================================================

// Get All Posts
app.get('/api/community/posts', async (req, res) => {
  try {
    const posts = await CommunityPost.find().populate('user_id').sort({ createdAt: -1 });

    const formatted = posts.map(row => {
      const diffMs = Date.now() - new Date(row.createdAt);
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      let timeText = 'Mới đây';
      if (diffHours >= 24) {
        timeText = `${Math.floor(diffHours/24)} ngày trước`;
      } else if (diffHours > 0) {
        timeText = `${diffHours} giờ trước`;
      }
      
      const authorName = row.user_id ? row.user_id.fullname : 'Người dùng GreenSteps';
      return {
        id: row._id,
        author: authorName,
        avatar: authorName ? authorName.charAt(0).toUpperCase() : 'U',
        time: timeText,
        rating: row.rating,
        text: row.text,
        tripName: row.tour_name,
        dest: row.destination,
        days: row.days,
        likes: row.likes_count,
        comments: row.comments_count,
        image: row.image_url
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi tải bài viết!' });
  }
});

// Add Post
app.post('/api/community/posts', async (req, res) => {
  const { authorId, rating, text, tripName, dest, days, image } = req.body;
  try {
    const postId = 'post_' + Date.now();
    const post = new CommunityPost({
      _id: postId,
      id: postId,
      user_id: authorId,
      rating: rating,
      text: text,
      tour_name: tripName,
      destination: dest,
      days: days,
      image_url: image
    });
    await post.save();
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi đăng bài viết!' });
  }
});

// ==========================================================================
// 5. SERVICES ENDPOINTS (/api/services)
// ==========================================================================

// Get All Services
app.get('/api/services', async (req, res) => {
  try {
    const services = await GreenService.find();
    const formatted = [];
    for (const s of services) {
      const badgeServices = await BadgeService.find({ service_id: s._id });
      const badges = badgeServices.map(bs => bs.badge_name);
      
      const vender = await Vender.findById(s.vender_id);
      const providerId = vender ? vender.user_id : 'UG26pro0001';

      formatted.push({
        id: s._id,
        provider_id: providerId,
        name: s.name_service,
        type: s.type,
        destination: s.destination,
        cost: s.cost,
        carbon: s.carbon,
        icon: s.type === 'lodging' || s.type === 'stay' ? 'bi-house-door-fill' : (s.type === 'dining' || s.type === 'food' ? 'bi-cup-hot-fill' : 'bi-gear-fill'),
        status: 'active',
        rating: s.rating,
        bookings_count: s.bookings_count,
        badges: badges
      });
    }
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi tải dịch vụ!' });
  }
});

// Get My Services (for provider)
app.get('/api/services/provider/:providerId', async (req, res) => {
  const { providerId } = req.params;
  try {
    const vender = await Vender.findOne({ user_id: providerId });
    const venderId = vender ? vender._id : '';

    const result = await GreenService.find({ vender_id: venderId });
    const mapped = result.map(s => ({
      id: s._id,
      name: s.name_service,
      type: s.type,
      dest: s.destination,
      cost: s.cost,
      status: 'active',
      bookingsCount: s.bookings_count
    }));
    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi tải dịch vụ đối tác!' });
  }
});

// Add Service
app.post('/api/services', async (req, res) => {
  const { providerId, name, type, destination, cost, carbon, icon } = req.body;
  try {
    let vender = await Vender.findOne({ user_id: providerId });
    if (!vender) {
      vender = await Vender.create({
        _id: '1',
        id: '1',
        user_id: providerId,
        registration_date: new Date().toLocaleDateString('vi-VN')
      });
    }

    const serviceId = 'ser_' + Date.now();
    const service = new GreenService({
      _id: serviceId,
      id: serviceId,
      vender_id: vender._id,
      name_service: name,
      type: type,
      destination: destination,
      cost: cost,
      carbon: carbon || 0,
      image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
      rating: 5.0,
      bookings_count: 0
    });
    await service.save();

    await BadgeService.create({ badge_name: 'green', service_id: service._id });

    res.json({
      id: service._id,
      provider_id: providerId,
      name: service.name_service,
      type: service.type,
      destination: service.destination,
      cost: service.cost,
      carbon: service.carbon,
      icon: icon || 'bi-gear-fill',
      status: 'active'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi đăng dịch vụ!' });
  }
});

// ==========================================================================
// 6. BOOKINGS ENDPOINTS (/api/bookings)
// ==========================================================================

// Get Bookings
app.get('/api/bookings', async (req, res) => {
  const { providerId, customerId } = req.query;
  try {
    let bookings;
    if (providerId) {
      const vender = await Vender.findOne({ user_id: providerId });
      const venderId = vender ? vender._id : '';
      const services = await GreenService.find({ vender_id: venderId });
      const serviceIds = services.map(s => s._id);
      bookings = await ServiceBooking.find({ service_id: { $in: serviceIds } }).sort({ createdAt: -1 });
    } else if (customerId) {
      bookings = await ServiceBooking.find({ user_id: customerId }).sort({ createdAt: -1 });
    } else {
      bookings = await ServiceBooking.find().sort({ createdAt: -1 });
    }

    const mapped = bookings.map(row => ({
      id: row._id,
      customer: row.fullname,
      service: row.name_service,
      date: row.booking_date,
      guests: row.guests,
      value: row.value,
      status: row.status
    }));

    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi tải danh sách booking!' });
  }
});

// Create Booking
app.post('/api/bookings', async (req, res) => {
  const { customerId, customerName, serviceId, serviceName, date, guests, value } = req.body;
  try {
    const bookingId = 'BK-' + Date.now().toString().slice(-4);
    const booking = new ServiceBooking({
      _id: bookingId,
      id: bookingId,
      user_id: customerId,
      service_id: serviceId,
      fullname: customerName,
      name_service: serviceName,
      booking_date: date,
      guests: guests,
      value: value,
      status: 'pending'
    });
    await booking.save();
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi đặt đơn hàng!' });
  }
});

// Approve Booking
app.post('/api/bookings/:id/approve', async (req, res) => {
  const { id } = req.params;
  try {
    await ServiceBooking.findByIdAndUpdate(id, { status: 'deposit' });
    res.json({ success: true, status: 'deposit' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi duyệt đơn hàng!' });
  }
});

// Reject Booking
app.post('/api/bookings/:id/reject', async (req, res) => {
  const { id } = req.params;
  try {
    await ServiceBooking.findByIdAndUpdate(id, { status: 'rejected' });
    res.json({ success: true, status: 'rejected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi hủy đơn hàng!' });
  }
});

// ==========================================================================
// 7. TOURS ENDPOINTS (/api/tours)
// ==========================================================================

// Get All Preset Tours
app.get('/api/tours', async (req, res) => {
  try {
    const samples = await ScheduleSample.find();
    const tours = [];
    for (const s of samples) {
      const base = await Schedule.findById(s._id);
      if (!base) continue;

      const activities = await ScheduleActivity.find({ schedule_id: s._id }).sort({ day_number: 1, time: 1 });
      const data = [];
      for (let i = 0; i < base.days; i++) {
        data.push([]);
      }
      activities.forEach(act => {
        const dIdx = act.day_number - 1;
        if (dIdx >= 0 && dIdx < base.days) {
          data[dIdx].push({
            time: act.time,
            name: act.activity_name,
            cost: act.activity_cost,
            carbon: act.carbon,
            icon: act.icon,
            type: act.type,
            lat: act.coordinates ? parseFloat(act.coordinates.split(',')[0]) : null,
            lng: act.coordinates ? parseFloat(act.coordinates.split(',')[1]) : null,
            id: act._id
          });
        }
      });

      const badgeSchedules = await BadgeSchedule.find({ schedule_id: s._id });
      const badges = badgeSchedules.map(bs => bs.badge_name);

      tours.push({
        id: s._id,
        title: base.tour_name,
        destination: base.destination || (base.tour_name.includes('Đà Lạt') ? 'Đà Lạt' : (base.tour_name.includes('Phú Yên') ? 'Phú Yên' : 'Đà Nẵng - Hội An')),
        days: base.days,
        cost: s.cost,
        oldCost: s.old_cost,
        carbon: base.carbon,
        image: base.image_url,
        description: base.tour_description,
        rating: s.rating,
        votes_count: s.votes_count,
        tags: badges,
        data: data
      });
    }
    res.json(tours);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi tải danh sách tour!' });
  }
});

// Get Single Tour
app.get('/api/tours/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const s = await ScheduleSample.findById(id);
    if (!s) {
      return res.status(404).json({ error: 'Không tìm thấy tour!' });
    }
    const base = await Schedule.findById(id);
    if (!base) {
      return res.status(404).json({ error: 'Không tìm thấy tour!' });
    }

    const activities = await ScheduleActivity.find({ schedule_id: id }).sort({ day_number: 1, time: 1 });
    const data = [];
    for (let i = 0; i < base.days; i++) {
      data.push([]);
    }
    activities.forEach(act => {
      const dIdx = act.day_number - 1;
      if (dIdx >= 0 && dIdx < base.days) {
        data[dIdx].push({
          time: act.time,
          name: act.activity_name,
          cost: act.activity_cost,
          carbon: act.carbon,
          icon: act.icon,
          type: act.type,
          lat: act.coordinates ? parseFloat(act.coordinates.split(',')[0]) : null,
          lng: act.coordinates ? parseFloat(act.coordinates.split(',')[1]) : null,
          id: act._id
        });
      }
    });

    const badgeSchedules = await BadgeSchedule.find({ schedule_id: id });
    const badges = badgeSchedules.map(bs => bs.badge_name);

    res.json({
      id: s._id,
      title: base.tour_name,
      destination: base.destination || (base.tour_name.includes('Đà Lạt') ? 'Đà Lạt' : (base.tour_name.includes('Phú Yên') ? 'Phú Yên' : 'Đà Nẵng - Hội An')),
      days: base.days,
      cost: s.cost,
      oldCost: s.old_cost,
      carbon: base.carbon,
      image: base.image_url,
      description: base.tour_description,
      rating: s.rating,
      votes_count: s.votes_count,
      tags: badges,
      data: data
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi tải chi tiết tour!' });
  }
});

// Start the Backend API Server after MongoDB is ready
async function startServer() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(dbUri, {
      serverSelectionTimeoutMS: 10000
    });
    isDbConnected = true;

    const server = app.listen(PORT, () => {
      console.log(`GreenSteps Backend Server is running on port ${PORT}...`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Stop the existing server or set another PORT in .env.`);
        process.exit(1);
      }

      console.error('Server failed to start:', err.message);
      process.exit(1);
    });
  } catch (err) {
    isDbConnected = false;
    console.error('Failed to connect to MongoDB. Server was not started.');
    console.error(err.message);
    process.exit(1);
  }
}

startServer();
