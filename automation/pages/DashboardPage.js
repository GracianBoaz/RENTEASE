import { BasePage } from './BasePage.js';

export class DashboardPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.searchBar = '~home-search-input';
    this.allCategoriesBtn = '~all-categories-btn';
    this.featuredSection = '~featured-items-list';
    this.nearYouSection = '~near-you-list';
    this.addListingFab = '~add-listing-fab';
  }

  async searchItem(query) {
    console.log(`[DashboardPage] Searching gear: ${query}`);
    await this.type(this.searchBar, query);
    return true;
  }

  async openAllCategories() {
    console.log('[DashboardPage] Opening All Categories');
    await this.click(this.allCategoriesBtn);
    return true;
  }

  async clickAddListing() {
    console.log('[DashboardPage] Clicking Add Listing FAB');
    await this.click(this.addListingFab);
    return true;
  }
}
