// TODO refine it
export type evmAddress = string;

export interface EVMObject {
  id: evmAddress;
  lat: number;
  lng: number;
  name: string;
  icon_url?: string;
}
