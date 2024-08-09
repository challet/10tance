"use client";

import { Bounds, CRS, LatLng, Point, Projection, Util, transformation } from "leaflet";

// The native Javascript min and max integers are respectively -(2^53 – 1) and (2^53 – 1)
// None map computations should result in over or underflow
// Keep it as close as possible to the max
export const MAX_SAFE_COORDINATES = Math.pow(2, 51);
export const MIN_SAFE_COORDINATES = -Math.pow(2, 51);

// The range of the world is 2^52 (-2^51 to 2^51)
// The range of the tile is 256 (2^8)
// So the scale factor of the whole world compressed into a tile is 2^8 / 2^52
const BASE_SCALE = 1 / Math.pow(2, 44);

export const EvmLonLat = Util.extend({}, Projection.LonLat, {
  // Coordinates from the EVM world are between -(2^79 - 1) and (2^79 - 1)
  // Coordinates should be down-scaled by 2^(79-52)
  // Or we need to rewrite the leaflet objects to handle BigInts
  bounds: new Bounds([MIN_SAFE_COORDINATES, MIN_SAFE_COORDINATES], [MAX_SAFE_COORDINATES, MAX_SAFE_COORDINATES]),
  project(latlng: LatLng) {
    return new Point(latlng.lng - MIN_SAFE_COORDINATES, latlng.lat - MIN_SAFE_COORDINATES);
  },
  unproject(point: Point) {
    return new LatLng(point.y + MIN_SAFE_COORDINATES, point.x + MIN_SAFE_COORDINATES);
  },
});

export const EvmTorus = Util.extend({}, CRS.Simple, {
  wrapLng: [MIN_SAFE_COORDINATES, MAX_SAFE_COORDINATES],
  wrapLat: [MIN_SAFE_COORDINATES, MAX_SAFE_COORDINATES],
  zoom(scale: number) {
    Math.log(scale / BASE_SCALE) / Math.LN2;
  },
  scale(zoom: number) {
    return BASE_SCALE * Math.pow(2, zoom);
  },
  projection: EvmLonLat,
  transformation: transformation(1, 0, 1, 0),
  infinite: false, // it's a torus
});
