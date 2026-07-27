import { BasePage } from './BasePage.js';

export class RegisterPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.nameInput = '~register-name-input';
    this.emailInput = '~register-email-input';
    this.phoneInput = '~register-phone-input';
    this.passwordInput = '~register-password-input';
    this.confirmPasswordInput = '~register-confirm-password-input';
    this.termsCheckbox = '~terms-checkbox';
    this.submitBtn = '~register-submit-btn';
  }

  async registerUser(userData) {
    console.log(`[RegisterPage] Registering user: ${userData.email}`);
    await this.type(this.nameInput, userData.name || 'Test User');
    await this.type(this.emailInput, userData.email);
    await this.type(this.phoneInput, userData.phone || '9876543210');
    await this.type(this.passwordInput, userData.password || 'Password123!');
    await this.type(this.confirmPasswordInput, userData.password || 'Password123!');
    await this.click(this.termsCheckbox);
    await this.click(this.submitBtn);
    return true;
  }
}
