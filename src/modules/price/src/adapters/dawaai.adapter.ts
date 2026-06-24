import { BasePharmacyAdapter } from "./base-pharmacy.adapter";

export class DawaaiAdapter extends BasePharmacyAdapter {
  readonly providerCode = "dawaai";
  readonly providerName = "Dawaai.pk";
  readonly baseUrl = "https://dawaai.pk";

  async fetchProducts(): Promise<any[]> {
    this.logger.info(`[${this.providerCode}] Fetching products...`);
    return [];
  }

  async fetchProductDetails(product: any): Promise<any> {
    this.logger.info(`[${this.providerCode}] Fetching product details: ${product.externalProductId}`);
    return product;
  }

  async fetchPrices(product: any): Promise<any[]> {
    this.logger.info(`[${this.providerCode}] Fetching prices for: ${product.externalProductId}`);
    return [];
  }
}