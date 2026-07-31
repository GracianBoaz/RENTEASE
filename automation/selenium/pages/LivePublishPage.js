import { BasePage } from './BasePage.js';

export class LivePublishPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.titleInput = 'input[placeholder*="Mavic"]';
    this.priceInput = 'input[placeholder*="700"]';
    this.categorySelect = 'select';
    this.submitBtn = '.btn-submit';
  }

  async navigateToPublish() {
    return await this.open('#/publish');
  }

  async publishItem(title, price, categoryId = 2) {
    await this.type(this.titleInput, title);
    await this.type(this.priceInput, String(price));
    await this.click(this.submitBtn);
    return true;
  }
}
