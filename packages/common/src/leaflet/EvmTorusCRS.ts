"use client";

import { CRS, LatLng, LatLngBounds, Util, transformation } from "leaflet";
import { BASE_SCALE, MAX_SAFE_COORDINATES, MIN_SAFE_COORDINATES, WORLD_BOUNDS } from "./constants";
import { EvmLonLat } from "./EvmLonLat";

export const EvmTorusCRS: CRS & { 
  wrapLngSize: number | undefined;
  wrapLatSize: number | undefined;
  constraintsLatLngBounds: (bounds: LatLngBounds) => LatLngBounds | null;
} = Util.extend(
  {},
  CRS.Simple,
  {
    /* overriding methods and members */
    wrapLng: [MIN_SAFE_COORDINATES, MAX_SAFE_COORDINATES],
    wrapLat: [MAX_SAFE_COORDINATES, MIN_SAFE_COORDINATES],
    zoom(scale: number) {
      Math.log(scale / BASE_SCALE) / Math.LN2;
    },
    scale(zoom: number) {
      return zoom == 0 ? BASE_SCALE : BASE_SCALE * Math.pow(2, zoom);
    },
    projection: EvmLonLat,
    transformation: transformation(1, 0, 1, 0),
    infinite: false, // it's a torus : east connects with west and north with south
    get wrapLngSize(): number | undefined {
      return this.wrapLng ? this.wrapLng[1] - this.wrapLng[0] : undefined; 
    },
    get wrapLatSize(): number | undefined {
      return this.wrapLat ? this.wrapLat[0] - this.wrapLat[1] : undefined; 
    },
    // distance version that takes into account the wrapping
    distance(latlng1: LatLng, latlng2: LatLng): number {
      let dx = latlng2.lng - latlng1.lng,
        dy = latlng2.lat - latlng1.lat;

      dx = (this.wrapLngSize != undefined && Math.abs(dx) > this.wrapLngSize / 2) ? Math.abs(dx) - this.wrapLngSize : dx;
      dy = (this.wrapLatSize != undefined && Math.abs(dy) > this.wrapLatSize / 2) ? Math.abs(dy) - this.wrapLatSize : dy;

      return Math.sqrt(dx * dx + dy * dy);
    },
    /* custom methods */

    // Same as CRS.wrapLatLngBounds but doesn't keep the same size as the given one
    // Useful for getting the visible bounds constrained into the CRS
    // TODO is it still used somewhere ?
    constraintsLatLngBounds(bounds: LatLngBounds): LatLngBounds | null {
      if (!bounds.intersects(WORLD_BOUNDS)) {
        return null;
      } else if (WORLD_BOUNDS.contains(bounds)) {
        return bounds;
      } else if (bounds.contains(WORLD_BOUNDS)) {
        return WORLD_BOUNDS;
      } else {
        return new LatLngBounds(
          new LatLng(
            Math.max(bounds.getNorth(), MAX_SAFE_COORDINATES),
            Math.max(bounds.getEast(), MAX_SAFE_COORDINATES),
          ),
          new LatLng(
            Math.min(bounds.getSouth(), MIN_SAFE_COORDINATES),
            Math.min(bounds.getWest(), MIN_SAFE_COORDINATES),
          ),
        );
      }
    },
  },
);

export default EvmTorusCRS;
