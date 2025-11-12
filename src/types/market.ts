export interface MarketTag {
  id: number;
  name: string;
}

export interface MarketCatalog {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  market_id: number;
  name: string;
  image: string;
  active: boolean;
  tags: MarketTag[];
}

export interface MarketResponse {
  unique_tags: MarketTag[];
  catalogs: MarketCatalog[];
}

export interface GroupedCatalogs {
  [tagName: string]: {
    tag: MarketTag;
    catalogs: MarketCatalog[];
  };
}

export interface MarketProduct {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  MarketID: number;
  catalog_id: number;
  name: string;
  price: number;
  real_price: number;
  description: string;
  images: string[];
  active: boolean;
  from_time: string;
  to_time: string;
  tags: MarketTag[];
}

export interface ProductsResponse {
  products: MarketProduct[];
  unique_tags: MarketTag[];
}

export interface CartItem {
  product: MarketProduct;
  quantity: number;
}
