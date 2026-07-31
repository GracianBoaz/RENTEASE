import { BasePage } from './BasePage.js';

export class LiveLoginPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.emailInput = 'input[type="email"]';
    this.passwordInput = 'input[type="password"]';
    this.submitBtn = 'button[type="submit"]';
  }

  async navigateToLogin() {
    return await this.open('#/login');
  }

  async login(email, password) {
    await this.type(this.emailInput, email);
    await this.type(this.passwordInput, password);
    await this.click(this.submitBtn);
    return true;
  }
}
