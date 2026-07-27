import { BasePage } from './BasePage.js';

export class ItemCrudPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.createBtn = '~create-item-btn';
    this.editBtn = '~edit-item-btn';
    this.deleteBtn = '~delete-item-btn';
    this.confirmDeleteBtn = '~confirm-delete-btn';
  }

  async deleteItem() {
    console.log('[ItemCrudPage] Deleting item');
    await this.click(this.deleteBtn);
    await this.click(this.confirmDeleteBtn);
    return true;
  }
}
