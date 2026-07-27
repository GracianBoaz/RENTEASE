import { BasePage } from './BasePage.js';

export class SearchPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.searchInput = '~search-input-field';
    this.filterBtn = '~open-filter-modal-btn';
    this.priceMinInput = '~price-min-input';
    this.priceMaxInput = '~price-max-input';
    this.applyFilterBtn = '~apply-filters-btn';
    this.itemResultCard = '~search-result-card-0';
  }

  async filterByPrice(min, max) {
    console.log(`[SearchPage] Applying price filter: ₹${min} - ₹${max}`);
    await this.click(this.filterBtn);
    await this.type(this.priceMinInput, String(min));
    await this.type(this.priceMaxInput, String(max));
    await this.click(this.applyFilterBtn);
    return true;
  }
}
