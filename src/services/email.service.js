const nodemailer = require('nodemailer');

function requireSmtpConfig() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  const missing = [];
  if (!SMTP_HOST) missing.push('SMTP_HOST');
  if (!SMTP_PORT) missing.push('SMTP_PORT');
  if (!SMTP_USER) missing.push('SMTP_USER');
  if (!SMTP_PASS) missing.push('SMTP_PASS');
  if (!SMTP_FROM) missing.push('SMTP_FROM');

  if (missing.length) {
    const error = new Error(`Thiếu cấu hình SMTP để gửi OTP thật: ${missing.join(', ')}`);
    error.statusCode = 500;
    error.code = 'SMTP_NOT_CONFIGURED';
    throw error;
  }

  return {
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    },
    from: SMTP_FROM
  };
}

let transporterInstance = null;

function getTransporter() {
  if (!transporterInstance) {
    const config = requireSmtpConfig();
    transporterInstance = nodemailer.createTransport({
      // Disable pooling on Render to avoid delayed email sending
      pool: false,
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: config.auth,
      tls: { rejectUnauthorized: false }
    });
  }
  return transporterInstance;
}

async function assertMailDomainCanReceive(email) {
  const domain = String(email || '').split('@')[1]?.toLowerCase();
  if (!domain) {
    const error = new Error('Email không hợp lệ.');
    error.statusCode = 400;
    error.code = 'EMAIL_INVALID';
    throw error;
  }

  const typoDomains = new Set([
    'gmai.com',
    'gmail.co',
    'gmail.con',
    'gmial.com',
    'gmal.com',
    'gmil.com',
    'gmill.com',
    'gnail.com',
    'hotmial.com',
    'outlok.com',
    'yaho.com'
  ]);

  if (typoDomains.has(domain)) {
    const error = new Error(`Có vẻ bạn nhập sai tên miền email "${domain}". Vui lòng kiểm tra lại địa chỉ email.`);
    error.statusCode = 400;
    error.code = 'EMAIL_DOMAIN_TYPO';
    throw error;
  }
}

function throwDeliveryError() {
  const error = new Error('Không gửi được OTP đến email này. Vui lòng kiểm tra lại địa chỉ email.');
  error.statusCode = 400;
  error.code = 'EMAIL_DELIVERY_FAILED';
  throw error;
}

async function sendOtpEmail({ to, otp, purpose }) {
  await assertMailDomainCanReceive(to);

  const config = requireSmtpConfig();
  const transporter = getTransporter();
  const isRegister = purpose === 'REGISTER';
  const subject = isRegister
    ? 'Mã xác thực tài khoản GreenSteps'
    : 'Mã xác thực đặt lại mật khẩu GreenSteps';
  const title = isRegister ? 'Xác thực tài khoản GreenSteps' : 'Đặt lại mật khẩu GreenSteps';

  try {
    const info = await transporter.sendMail({
      from: config.from,
      to,
      subject,
      text: `${title}\n\nMã OTP của bạn là: ${otp}\nMã có hiệu lực trong 5 phút. Không chia sẻ mã này với bất kỳ ai.`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#12372d">
          <h2>${title}</h2>
          <p>Mã OTP của bạn là:</p>
          <p style="font-size:28px;font-weight:700;letter-spacing:6px;color:#0E9F6E">${otp}</p>
          <p>Mã có hiệu lực trong 5 phút. Không chia sẻ mã này với bất kỳ ai.</p>
        </div>
      `
    });

    const accepted = info.accepted || [];
    const rejected = info.rejected || [];
    if (!accepted.length || rejected.includes(to)) throwDeliveryError();
    return info;
  } catch (error) {
    if (error.statusCode) throw error;
    throwDeliveryError();
  }
}

module.exports = { assertMailDomainCanReceive, sendOtpEmail };
