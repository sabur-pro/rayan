import { MarketResponse, ProductsResponse } from '../types/market';

const API_BASE_URL = 'https://api.panjakent.shop';
const MARKET_ID = 6;

export const marketService = {
  /**
   * Get market catalogs by market ID
   */
  async getCatalogs(): Promise<MarketResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/catalog/${MARKET_ID}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: MarketResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching market catalogs:', error);
      throw error;
    }
  },

  /**
   * Get products by catalog ID
   */
  async getProductsByCatalog(catalogId: number): Promise<ProductsResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/market-product/${MARKET_ID}/${catalogId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ProductsResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  /**
   * Get full image URL
   */
  getImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    return `${API_BASE_URL}/${imagePath}`;
  },
};
