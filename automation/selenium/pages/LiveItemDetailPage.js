import { BasePage } from './BasePage.js';

export class LiveItemDetailPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.bookNowBtn = '.btn-book-now';
    this.reviewTextarea = 'textarea';
    this.submitReviewBtn = '.btn-submit-review';
  }

  async openItem(itemId) {
    return await this.open(`#/item/${itemId}`);
  }

  async clickBookNow() {
    return await this.click(this.bookNowBtn);
  }
}
