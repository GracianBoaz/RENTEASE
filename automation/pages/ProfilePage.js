import { BasePage } from './BasePage.js';

export class ProfilePage extends BasePage {
  constructor(driver) {
    super(driver);
    this.editProfileBtn = '~edit-profile-btn';
    this.nameInput = '~profile-name-input';
    this.phoneInput = '~profile-phone-input';
    this.saveProfileBtn = '~save-profile-btn';
    this.addAddressBtn = '~add-address-btn';
    this.logoutBtn = '~logout-btn';
  }

  async updateProfile(name, phone) {
    console.log(`[ProfilePage] Updating profile details: ${name}`);
    await this.click(this.editProfileBtn);
    await this.type(this.nameInput, name);
    await this.type(this.phoneInput, phone);
    await this.click(this.saveProfileBtn);
    return true;
  }

  async logout() {
    console.log('[ProfilePage] Logging out user');
    await this.click(this.logoutBtn);
    return true;
  }
}
