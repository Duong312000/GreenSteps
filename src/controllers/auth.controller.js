const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User } = require('../models/index');
const { JWT_SECRET } = require('../middlewares/auth.middleware');
const {
  PASSWORD_MESSAGE,
  normalizeEmail,
  normalizeText,
  isValidEmail,
  isValidPassword,
  isValidOtp
} = require('../utils/auth.validation');
const {
  createAndSendOtp,
  createAndSendPendingRegistrationOtp,
  resendPendingRegistrationOtp,
  verifyPendingRegistrationOtp,
  verifyOtp,
  createResetToken,
  consumeResetToken
} = require('../services/otp.service');

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    fullname: user.fullname,
    phone: user.phone,
    dob: user.dob,
    gender: user.gender,
    address: user.address,
    company_name: user.company_name,
    avatarUrl: user.avatarUrl,
    is_verified: user.is_verified
  };
}

function createUserId() {
  return 'UG' + Math.floor(10000000 + Math.random() * 90000000);
}

function signAuthToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, fullname: user.fullname },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

async function findUserByIdentifier(identifier) {
  const normalized = normalizeText(identifier);
  const email = normalizeEmail(normalized);
  return User.findOne({
    where: {
      [Op.or]: [
        { username: normalized },
        { email }
      ]
    }
  });
}

exports.register = async (req, res, next) => {
  try {
    const username = normalizeText(req.body.username);
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!username) return res.status(400).json({ success: false, message: 'Tên đăng nhập không được để trống.' });
    if (username.length < 3) return res.status(400).json({ success: false, message: 'Tên đăng nhập phải có ít nhất 3 ký tự.' });
    if (!email) return res.status(400).json({ success: false, message: 'Email không được để trống.' });
    if (!isValidEmail(email)) return res.status(400).json({ success: false, message: 'Email không hợp lệ.' });
    if (!password) return res.status(400).json({ success: false, message: 'Mật khẩu không được để trống.' });
    if (!isValidPassword(password)) return res.status(400).json({ success: false, message: PASSWORD_MESSAGE });

    // Run database query and bcrypt hashing in parallel to minimize latency
    const [existingUser, password_hash] = await Promise.all([
      User.findOne({
        where: {
          [Op.or]: [
            { username },
            { email }
          ]
        }
      }),
      bcrypt.hash(password, 10)
    ]);

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ success: false, message: 'Tên tài khoản này đã được sử dụng!' });
      }
      if (existingUser.email === email) {
        return res.status(400).json({ success: false, message: 'Email này đã được sử dụng!' });
      }
    }

    await User.sequelize.transaction(async (transaction) => {
      await createAndSendPendingRegistrationOtp({
        username,
        email,
        passwordHash: password_hash
      }, transaction);
    });

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.',
      requiresVerification: true,
      user: {
        username,
        email,
        is_verified: false
      }
    });
  } catch (error) {
    if (error.code === 'OTP_RESEND_TOO_SOON') {
      return res.status(429).json({
        success: false,
        code: error.code,
        message: error.message,
        retryAfterSeconds: error.retryAfterSeconds
      });
    }
    next(error);
  }
};

exports.verifyRegisterOtp = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || '').trim();
    if (!isValidEmail(email)) return res.status(400).json({ success: false, message: 'Email không hợp lệ.' });
    if (!isValidOtp(otp)) return res.status(400).json({ success: false, message: 'Mã OTP phải gồm đúng 6 chữ số.' });

    const pending = await verifyPendingRegistrationOtp({ email, otp });
    const createdAccount = await User.sequelize.transaction(async (transaction) => {
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { username: pending.username },
            { email: pending.email }
          ]
        },
        transaction
      });

      if (existingUser) {
        const error = new Error('Email hoặc tên đăng nhập đã được sử dụng.');
        error.statusCode = 400;
        error.code = 'ACCOUNT_ALREADY_EXISTS';
        throw error;
      }

      const createdUser = await User.create({
        id: createUserId(),
        role: 'traveler',
        username: pending.username,
        password_hash: pending.password_hash,
        email: pending.email,
        fullname: null,
        phone: null,
        dob: null,
        gender: 'Khác',
        address: '',
        job: '',
        is_verified: true
      }, { transaction });

      pending.consumed_at = new Date();
      await pending.save({ transaction });
      return createdUser;
    });

    const token = signAuthToken(createdAccount);
    setAuthCookie(res, token);

    return res.json({
      success: true,
      message: 'Xác thực tài khoản thành công.',
      token,
      user: publicUser(createdAccount)
    });
  } catch (error) {
    next(error);
  }
};

exports.resendRegisterOtp = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!isValidEmail(email)) return res.status(400).json({ success: false, message: 'Email không hợp lệ.' });

    await resendPendingRegistrationOtp(email);
    res.json({ success: true, message: 'Mã xác thực mới đã được gửi.' });
  } catch (error) {
    if (error.code === 'OTP_RESEND_TOO_SOON') {
      return res.status(429).json({
        success: false,
        code: error.code,
        message: error.message,
        retryAfterSeconds: error.retryAfterSeconds
      });
    }
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const identifier = normalizeText(req.body.identifier || req.body.username);
    const password = String(req.body.password || '');
    if (!identifier) return res.status(400).json({ success: false, message: 'Vui lòng nhập email hoặc tên đăng nhập.' });
    if (!password) return res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu.' });

    const user = await findUserByIdentifier(identifier);
    if (!user) return res.status(401).json({ success: false, message: 'Email/tên đăng nhập hoặc mật khẩu không chính xác!' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Email/tên đăng nhập hoặc mật khẩu không chính xác!' });

    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Tài khoản chưa được xác thực.',
        email: user.email
      });
    }

    const token = signAuthToken(user);
    setAuthCookie(res, token);

    res.json({
      success: true,
      message: 'Đăng nhập hệ thống thành công!',
      token,
      user: publicUser(user)
    });
  } catch (error) {
    next(error);
  }
};

exports.requestForgotPasswordOtp = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!isValidEmail(email)) return res.status(400).json({ success: false, message: 'Email không hợp lệ.' });

    const user = await User.findOne({ where: { email } });
    if (user) await createAndSendOtp(user, 'RESET_PASSWORD');

    res.json({
      success: true,
      message: 'Nếu email tồn tại trong hệ thống, mã xác thực đã được gửi.'
    });
  } catch (error) {
    if (error.code === 'OTP_RESEND_TOO_SOON') {
      return res.status(429).json({
        success: false,
        code: error.code,
        message: error.message,
        retryAfterSeconds: error.retryAfterSeconds
      });
    }
    next(error);
  }
};

exports.verifyForgotPasswordOtp = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || '').trim();
    if (!isValidEmail(email)) return res.status(400).json({ success: false, message: 'Email không hợp lệ.' });
    if (!isValidOtp(otp)) return res.status(400).json({ success: false, message: 'Mã OTP phải gồm đúng 6 chữ số.' });

    const { user, otpRecord } = await verifyOtp({ email, otp, purpose: 'RESET_PASSWORD' });
    const resetToken = await createResetToken(user, otpRecord);
    res.json({ success: true, message: 'Xác thực OTP thành công.', resetToken });
  } catch (error) {
    next(error);
  }
};

exports.resetForgotPassword = async (req, res, next) => {
  try {
    const resetToken = String(req.body.resetToken || '');
    const newPassword = String(req.body.newPassword || '');
    if (!resetToken) return res.status(400).json({ success: false, message: 'Thiếu reset token.' });
    if (!isValidPassword(newPassword)) return res.status(400).json({ success: false, message: PASSWORD_MESSAGE });

    const user = await consumeResetToken(resetToken);
    user.password_hash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ success: true, message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.' });
  } catch (error) {
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : req.params.userId;
    const user = await User.findByPk(userId, { attributes: { exclude: ['password_hash'] } });
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin tài khoản!' });
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
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Phê duyệt yêu cầu này? (y/n): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase().trim() === 'y');
    });
  });
}

exports.updateProfile = async (req, res, next) => {
  try {
    const { fullname, phone, dob, gender, address, job, role, company_name, companyName, avatarUrl, avatar_url } = req.body;
    const userId = req.user ? req.user.id : req.params.userId;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản!' });

    let pendingApproval = false;
    if (role === 'provider' && user.role !== 'provider') {
      pendingApproval = true;
      const displayCompanyName = company_name || companyName || 'Chưa đặt tên doanh nghiệp';

      const { Vender, Provider, VenderContract } = require('../models/index');
      
      let vender = await Vender.findOne({ where: { user_id: userId } });
      if (!vender) {
        vender = await Vender.create({
          id: 'vender_' + Date.now().toString().slice(-6),
          user_id: userId,
          registration_date: new Date()
        });
      }

      // Check or create Provider record
      const providerId = 'PROV-' + Date.now().toString().slice(-6);
      await Provider.create({
        id: providerId,
        contract_id: 'CON0001',
        name_provider: displayCompanyName,
        field: 'Dịch vụ sinh thái',
        destination: address || user.address || 'Việt Nam',
        image_url: 'image/Viet Nam.png',
        provider_status: 'pending'
      });

      // Create VenderContract record to show up in Admin Dashboard pending list
      let venderContract = await VenderContract.findOne({ where: { user_id: userId } });
      if (!venderContract) {
        await VenderContract.create({
          id: 'VC-' + Date.now().toString().slice(-6),
          user_id: userId,
          name_contract: 'Hợp đồng đăng ký Nhà cung cấp',
          text: `Tài khoản #${userId} (${fullname || user.fullname || user.username}) yêu cầu đăng ký làm nhà cung cấp cho doanh nghiệp: "${displayCompanyName}"`
        });
      }
    }

    await User.update({
      fullname,
      phone,
      dob: dob || null,
      gender,
      address,
      job,
      role: (role === 'provider' && user.role !== 'provider') ? user.role : role,
      company_name: company_name || companyName || user.company_name,
      avatarUrl: avatarUrl !== undefined ? avatarUrl : (avatar_url !== undefined ? avatar_url : user.avatarUrl)
    }, { where: { id: userId } });

    const updatedUser = await User.findByPk(userId, { attributes: { exclude: ['password_hash'] } });
    if (pendingApproval) {
      res.json({
        success: true,
        pending: true,
        message: 'Yêu cầu đăng ký làm nhà cung cấp đã được gửi và đang chờ Admin phê duyệt!',
        user: updatedUser
      });
    } else {
      res.json({ success: true, message: 'Cập nhật hồ sơ cá nhân thành công!', user: updatedUser });
    }
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;
    if (!isValidPassword(String(newPassword || ''))) {
      return res.status(400).json({ success: false, message: PASSWORD_MESSAGE });
    }

    const user = await User.findByPk(userId);
    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Mật khẩu cũ không chính xác!' });

    user.password_hash = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
  } catch (error) {
    next(error);
  }
};

exports.trackInterest = async (req, res, next) => {
  try {
    const { destination } = req.body;
    const userId = req.user ? req.user.id : (req.body.userId || req.body.customerId);
    if (!destination) return res.status(400).json({ success: false, message: 'Vui lòng cung cấp điểm đến quan tâm!' });
    await User.update({ last_interest: destination }, { where: { id: userId } });
    res.json({ success: true, message: 'Ghi nhận địa điểm quan tâm thành công.' });
  } catch (error) {
    next(error);
  }
};
