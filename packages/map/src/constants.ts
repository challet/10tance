

import { LatLng, LatLngBounds } from "leaflet";

// The native Javascript min and max integers are respectively -(2^53 – 1) and (2^53 – 1)
// None map computations should result in over or underflow
// Keep it as close as possible to the max
export const EVM_BITS = 80;
export const DOWNSCALE_BITS = 30;

export const MAX_SAFE_COORDINATES = Math.pow(2, EVM_BITS - DOWNSCALE_BITS - 1);
export const MIN_SAFE_COORDINATES = -Math.pow(2, EVM_BITS - DOWNSCALE_BITS - 1);

// The range of the world is 2^50 (-2^49 to 2^49)
// The range of the tile is 256 (2^8)
// So one coordinate unit will match 1 pixel at zoom 42 (50 - 8)
// And the scale factor for the whole world to be compressed into a tile is 1 / 2^42
export const ISO_ZOOM = 42;
export const BASE_SCALE = 1 / Math.pow(2, ISO_ZOOM);

// Bounds in "geographical" coordinates
export const WORLD_BOUNDS = new LatLngBounds(
  new LatLng(MIN_SAFE_COORDINATES, MIN_SAFE_COORDINATES),
  new LatLng(MAX_SAFE_COORDINATES, MAX_SAFE_COORDINATES),
);
