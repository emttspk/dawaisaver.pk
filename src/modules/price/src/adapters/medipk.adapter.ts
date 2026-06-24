import { BasePharmacyAdapter } from "./base-pharmacy.adapter";

export class MediPKAdapter extends BasePharmacyAdapter {
  readonly providerCode = "medipk";
  readonly providerName = "MediPK";
  readonly baseUrl = "https://medipk.com";

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