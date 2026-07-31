import { BasePage } from './BasePage.js';

export class LiveExplorePage extends BasePage {
  constructor(driver) {
    super(driver);
    this.searchInput = '.explore-controls input';
    this.categoryPills = '.category-pill';
    this.listingCards = '.listing-card';
  }

  async navigateToExplore() {
    return await this.open('#/explore');
  }

  async searchItem(keyword) {
    await this.type(this.searchInput, keyword);
    return true;
  }
}
