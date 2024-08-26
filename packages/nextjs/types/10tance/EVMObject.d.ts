// TODO refine it
export type evmAddress = string;

export interface EVMObject {
  id: evmAddress;
  lat: number;
  lng: number;
  symbol: string;
  name: string;
  icon_url?: string;
  circulating_market_cap?: number;
  holders?: number;
  exchange_rate?: number;
  total_supply?: number;
}
