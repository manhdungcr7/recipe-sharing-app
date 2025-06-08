const nodemailer = require('nodemailer');

// Cấu hình transporter cho email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-actual-email@gmail.com', // Thay thế bằng email thực của bạn
    pass: 'your-app-password' // Thay thế bằng App Password của bạn
  }
});

/**
 * Gửi email xác minh tài khoản
 * @param {string} email - Địa chỉ email người nhận
 * @param {string} verificationToken - Token xác minh
 */
const sendVerificationEmail = async (email, verificationToken) => {
  try {
    const verificationLink = `http://localhost:5000/api/auth/verify/${verificationToken}`;
    
    const mailOptions = {
      from: '"Recipe Sharing" <your-actual-email@gmail.com>',
      to: email,
      subject: 'Xác minh tài khoản Recipe Sharing',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e8e8e8; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #FF6B6B;">Recipe Sharing</h2>
          </div>
          <h1 style="color: #333; font-size: 24px;">Chào mừng bạn đến với Recipe Sharing!</h1>
          <p style="color: #666; line-height: 1.6;">Cảm ơn bạn đã đăng ký tài khoản. Vui lòng nhấn vào liên kết dưới đây để xác minh email của bạn:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="padding: 12px 24px; background-color: #FF6B6B; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Xác minh email</a>
          </div>
          <p style="color: #666;">Nếu bạn không nhấp được vào nút trên, hãy sao chép liên kết sau:</p>
          <p style="color: #666; word-break: break-all;">${verificationLink}</p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

/**
 * Gửi email xác minh tài khoản lại
 * @param {string} email - Địa chỉ email người nhận
 * @param {string} verificationToken - Token xác minh mới
 */
const sendReVerificationEmail = async (email, verificationToken) => {
  try {
    const verificationLink = `http://localhost:5000/api/auth/verify/${verificationToken}`;
    
    const mailOptions = {
      from: '"Recipe Sharing" <your-email@gmail.com>',
      to: email,
      subject: 'Xác minh lại tài khoản Recipe Sharing',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e8e8e8; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #FF6B6B;">Recipe Sharing</h2>
          </div>
          <h1 style="color: #333; font-size: 24px;">Yêu cầu xác minh lại email</h1>
          <p style="color: #666; line-height: 1.6;">Vui lòng nhấn vào liên kết dưới đây để xác minh email của bạn:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="padding: 12px 24px; background-color: #FF6B6B; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Xác minh email</a>
          </div>
          <p style="color: #666;">Nếu bạn không nhấp được vào nút trên, hãy sao chép liên kết sau:</p>
          <p style="color: #666; word-break: break-all;">${verificationLink}</p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendReVerificationEmail
};