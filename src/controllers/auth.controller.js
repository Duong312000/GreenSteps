const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Wallet } = require('../models/index');
const { JWT_SECRET } = require('../middlewares/auth.middleware');

exports.register = async (req, res, next) => {
  try {
    const { username, password, fullname, email, phone, dob, gender, address, job } = req.body;

    // 1. Check if user already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Tên tài khoản này đã được sử dụng!' });
    }

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Email này đã được sử dụng!' });
    }

    // 2. Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // 3. Generate ID (UGXXXXXXXX)
    const customId = 'UG' + Math.floor(10000000 + Math.random() * 90000000);

    // 4. Create User & Wallet inside database transaction
    const result = await User.sequelize.transaction(async (t) => {
      const newUser = await User.create({
        id: customId,
        role: 'traveler', // default role
        username,
        password_hash,
        fullname,
        email,
        phone,
        dob: dob || null,
        gender: gender || 'Khác',
        address: address || '',
        job: job || ''
      }, { transaction: t });

      return newUser;
    });

    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản du khách thành công!',
      userId: result.id
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // 1. Find user in DB
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác!' });
    }

    // 2. Check password hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác!' });
    }

    // 3. Sign JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, fullname: user.fullname },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 4. Set Http-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      message: 'Đăng nhập hệ thống thành công!',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullname: user.fullname,
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : req.params.userId;
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password_hash'] }
    });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin tài khoản!' });
    }
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

function promptTerminalApproval(message) {
  return new Promise((resolve) => {
    console.log('\n========================================');
    console.log('!!! YÊU CẦU PHÊ DUYỆT TỪ TERMINAL !!!');
    console.log(message);
    console.log('========================================\n');

    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Phê duyệt yêu cầu này? (y/n): ', (answer) => {
      rl.close();
      if (answer.toLowerCase().trim() === 'y') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}

exports.updateProfile = async (req, res, next) => {
  try {
    const { fullname, phone, dob, gender, address, job, role, company_name, companyName, avatarUrl, avatar_url } = req.body;
    const userId = req.user ? req.user.id : req.params.userId;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản!' });
    }

    if (role === 'provider' && user.role !== 'provider') {
      const displayCompanyName = company_name || companyName || 'Chưa đặt tên doanh nghiệp';
      const msg = `Tài khoản #${userId} (${fullname || user.fullname}) YÊU CẦU ĐĂNG KÝ LÀM NHÀ CUNG CẤP ĐỐI TÁC - Doanh nghiệp: "${displayCompanyName}"`;
      const approved = await promptTerminalApproval(msg);
      if (!approved) {
        return res.status(400).json({ success: false, message: 'Yêu cầu đăng ký nhà cung cấp bị từ chối bởi Quản trị viên tại Terminal.' });
      }

      // Automatically create a Vender record for this user if it doesn't exist
      const { Vender } = require('../models/index');
      let vender = await Vender.findOne({ where: { user_id: userId } });
      if (!vender) {
        await Vender.create({
          id: 'vender_' + Date.now().toString().slice(-6),
          user_id: userId,
          registration_date: new Date()
        });
      }
    }

    const finalCompanyName = company_name || companyName || user.company_name;
    const finalAvatarUrl = avatarUrl !== undefined ? avatarUrl : (avatar_url !== undefined ? avatar_url : user.avatarUrl);

    await User.update(
      { fullname, phone, dob: dob || null, gender, address, job, role, company_name: finalCompanyName, avatarUrl: finalAvatarUrl },
      { where: { id: userId } }
    );

    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password_hash'] }
    });

    res.json({
      success: true,
      message: 'Cập nhật hồ sơ cá nhân thành công!',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Mật khẩu cũ không chính xác!' });
    }

    const hashedNewPwd = await bcrypt.hash(newPassword, 10);
    await User.update({ password_hash: hashedNewPwd }, { where: { id: userId } });

    res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
  } catch (error) {
    next(error);
  }
};

exports.trackInterest = async (req, res, next) => {
  try {
    const { destination } = req.body;
    const userId = req.user ? req.user.id : (req.body.userId || req.body.customerId);

    if (!destination) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp điểm đến quan tâm!' });
    }

    await User.update({ last_interest: destination }, { where: { id: userId } });
    res.json({ success: true, message: 'Ghi nhận địa điểm quan tâm thành công.' });
  } catch (error) {
    next(error);
  }
};
