import { BasePage } from './BasePage.js';

export class LoginPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.emailInput = '~login-email-input';
    this.passwordInput = '~login-password-input';
    this.submitBtn = '~login-submit-btn';
    this.forgotPasswordLink = '~forgot-password-link';
    this.signupBtn = '~goto-signup-btn';
    this.otpInput = '~otp-digit-1';
    this.verifyOtpBtn = '~verify-otp-btn';
  }

  async login(email, password) {
    console.log(`[LoginPage] Performing login for user: ${email}`);
    await this.type(this.emailInput, email);
    await this.type(this.passwordInput, password);
    await this.click(this.submitBtn);
    return true;
  }

  async enterOtp(otpCode = '123456') {
    console.log(`[LoginPage] Submitting OTP verification code: ${otpCode}`);
    await this.type(this.otpInput, otpCode);
    await this.click(this.verifyOtpBtn);
    return true;
  }

  async clickForgotPassword() {
    return await this.click(this.forgotPasswordLink);
  }

  async navigateToRegister() {
    return await this.click(this.signupBtn);
  }
}
