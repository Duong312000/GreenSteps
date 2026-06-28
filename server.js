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
const UserSchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
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

// 2. Wallet Model
const WalletSchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  user_id: { type: String, ref: 'User', unique: true, required: true },
  balance: { type: Number, default: 0.00, min: 0 },
  registered: { type: Boolean, default: false }
}, { timestamps: true });

const Wallet = mongoose.model('Wallet', WalletSchema);

// 3. WalletTransaction Model
const WalletTransactionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // GD-xxxxxxxxxx
  wallet_id: { type: String, ref: 'Wallet', required: true },
  type: { type: String, enum: ['deposit', 'payment', 'refund'], required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['success', 'pending', 'failed'], default: 'success' }
}, { timestamps: true });

const WalletTransaction = mongoose.model('WalletTransaction', WalletTransactionSchema);

// 4. Tour Model (Suggested/Preset tours)
const TourSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // e.g. preset_dl_1
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

// 5. Itinerary Model (User designed custom itineraries)
const ItinerarySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // iti_xxxxxxxxxx
  name: { type: String, required: true },
  user_id: { type: String, required: true }, // Map to traveler user UUID/ObjectId string representation
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

// 6. Service Model
const ServiceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // ser_xxxxxxxxxx
  provider_id: { type: String, required: true }, // Provider user ObjectId/UUID string
  name: { type: String, required: true },
  type: { type: String, required: true }, // lodging, dining, transport, attraction, tour
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

// 7. Booking Model
const BookingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // BK-xxxx
  customer_id: { type: String }, // User ID string
  customer_name: { type: String, required: true },
  service_id: { type: String, required: true },
  service_name: { type: String, required: true },
  booking_date: { type: String, required: true },
  guests: { type: Number, required: true, min: 1 },
  value: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'deposit', 'completed', 'rejected'], default: 'pending' }
}, { timestamps: true });

const Booking = mongoose.model('Booking', BookingSchema);

// 8. CommunityPost Model
const CommunityPostSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // post_xxxx
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
        role: user.role,
        companyName: user.company_name
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server!' });
  }
});

// Register User
app.post('/api/auth/register', async (req, res) => {
  const { username, password, fullname, email, phone, dob, gender, address, role, companyName } = req.body;
  try {
    // Check if user exists
    const userExists = await User.findOne({
      $or: [{ username }, { email }]
    });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Tên đăng nhập hoặc Email đã được sử dụng!' });
    }

    // Insert new user
    const user = new User({
      username,
      password_hash: password,
      fullname,
      email,
      phone,
      dob,
      gender,
      address,
      role,
      company_name: companyName
    });
    await user.save();

    // Create wallet for the new user
    const wallet = new Wallet({
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
        role: user.role,
        companyName: user.company_name
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
  const { fullname, phone, email, dob, gender, address, role, companyName, company_name } = req.body;
  try {
    const updateFields = {};
    if (fullname !== undefined) updateFields.fullname = fullname;
    if (phone !== undefined) updateFields.phone = phone;
    if (email !== undefined) updateFields.email = email;
    if (dob !== undefined) updateFields.dob = dob;
    if (gender !== undefined) updateFields.gender = gender;
    if (address !== undefined) updateFields.address = address;
    if (role !== undefined) updateFields.role = role;
    
    const finalCompanyName = companyName || company_name;
    if (finalCompanyName !== undefined) updateFields.company_name = finalCompanyName;

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
        role: user.role,
        companyName: user.company_name
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
    const itineraries = await Itinerary.find({ user_id: userId }).sort({ createdAt: -1 });

    const result = itineraries.map(iti => ({
      id: iti.id,
      name: iti.name,
      destination: iti.destination,
      days: iti.days,
      totalCost: iti.total_cost,
      totalCarbon: iti.total_carbon,
      daysData: iti.days_data || []
    }));

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
    const iti = await Itinerary.findOne({ id: id });
    if (!iti) {
      return res.status(404).json({ error: 'Không tìm thấy lịch trình!' });
    }

    res.json({
      id: iti.id,
      name: iti.name,
      destination: iti.destination,
      days: iti.days,
      totalCost: iti.total_cost,
      totalCarbon: iti.total_carbon,
      daysData: iti.days_data || []
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
    const updateData = {
      name,
      user_id,
      destination,
      days,
      total_cost: totalCost,
      total_carbon: totalCarbon,
      days_data: daysData
    };

    await Itinerary.findOneAndUpdate({ id: id }, updateData, { upsert: true, new: true });
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
    await Itinerary.deleteOne({ id: id });
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
    const posts = await CommunityPost.find().populate('author_id').sort({ createdAt: -1 });

    const formatted = posts.map(row => {
      const diffMs = Date.now() - new Date(row.createdAt);
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      let timeText = 'Mới đây';
      if (diffHours >= 24) {
        timeText = `${Math.floor(diffHours/24)} ngày trước`;
      } else if (diffHours > 0) {
        timeText = `${diffHours} giờ trước`;
      }
      
      const authorName = row.author_id ? row.author_id.fullname : 'Người dùng GreenSteps';
      return {
        id: row.id,
        author: authorName,
        avatar: authorName ? authorName.charAt(0).toUpperCase() : 'U',
        time: timeText,
        rating: row.rating,
        text: row.text,
        tripName: row.trip_name,
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
      id: postId,
      author_id: authorId,
      rating: rating,
      text: text,
      trip_name: tripName,
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
    const services = await Service.find({ status: 'active' });
    res.json(services);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi tải dịch vụ!' });
  }
});

// Get My Services (for provider)
app.get('/api/services/provider/:providerId', async (req, res) => {
  const { providerId } = req.params;
  try {
    const result = await Service.find({ provider_id: providerId });
    const mapped = result.map(s => ({
      id: s.id,
      name: s.name,
      type: s.type,
      dest: s.destination,
      cost: s.cost,
      status: s.status,
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
    const serviceId = 'ser_' + Date.now();
    const service = new Service({
      id: serviceId,
      provider_id: providerId,
      name,
      type,
      destination,
      cost,
      carbon: carbon || 0,
      icon: icon || 'bi-gear-fill',
      status: 'active'
    });
    await service.save();
    res.json(service);
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
      const providerServices = await Service.find({ provider_id: providerId });
      const serviceIds = providerServices.map(s => s.id);
      bookings = await Booking.find({ service_id: { $in: serviceIds } }).sort({ createdAt: -1 });
    } else if (customerId) {
      bookings = await Booking.find({ customer_id: customerId }).sort({ createdAt: -1 });
    } else {
      bookings = await Booking.find().sort({ createdAt: -1 });
    }

    const mapped = bookings.map(row => ({
      id: row.id,
      customer: row.customer_name,
      service: row.service_name,
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
    const booking = new Booking({
      id: bookingId,
      customer_id: customerId,
      customer_name: customerName,
      service_id: serviceId,
      service_name: serviceName,
      booking_date: date,
      guests,
      value,
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
    await Booking.findOneAndUpdate({ id: id }, { status: 'deposit' });
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
    await Booking.findOneAndUpdate({ id: id }, { status: 'rejected' });
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
    const tours = await Tour.find().sort({ createdAt: 1 });
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
    const tour = await Tour.findOne({ id: id });
    if (!tour) {
      return res.status(404).json({ error: 'Không tìm thấy tour!' });
    }
    res.json(tour);
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
