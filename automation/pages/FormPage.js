import { BasePage } from './BasePage.js';

export class FormPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.titleInput = '~form-title-input';
    this.categoryPicker = '~form-category-picker';
    this.conditionChip = '~form-condition-good';
    this.priceInput = '~form-price-input';
    this.depositInput = '~form-deposit-input';
    this.nextBtn = '~form-next-step-btn';
  }

  async fillStep1(title, category, condition) {
    console.log(`[FormPage] Filling step 1: ${title}`);
    await this.type(this.titleInput, title);
    await this.click(this.categoryPicker);
    await this.click(this.conditionChip);
    await this.click(this.nextBtn);
    return true;
  }
}
