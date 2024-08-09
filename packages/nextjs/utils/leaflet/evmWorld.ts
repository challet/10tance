"use client";

import { Bounds, CRS, LatLng, Point, Projection, Util, transformation } from "leaflet";

// The native Javascript min and max integers are respectively -(2^53 – 1) and (2^53 – 1)
// None map computations should result in over or underflow
// Keep it as close as possible to the max
export const MAX_SAFE_COORDINATES = Math.pow(2, 49); //  562949953421312
export const MIN_SAFE_COORDINATES = -Math.pow(2, 49); // -562949953421312

// The range of the world is 2^50 (-2^49 to 2^49)
// The range of the tile is 256 (2^8)
// So one coordinate unit will match 1 pixel at zoom 42 (50 - 8)
// And the scale factor for the whole world to be compressed into a tile is 1 / 2^42
export const ISO_ZOOM = 42;
const BASE_SCALE = 1 / Math.pow(2, ISO_ZOOM);

export const EvmLonLat = Util.extend({}, Projection.LonLat, {
  // Coordinates from the EVM world are between -(2^79 - 1) and (2^79 - 1)
  // Coordinates should be down-scaled by 2^(79-50)
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
