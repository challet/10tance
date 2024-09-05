"use client";

import computeLocation from "./EvmLocation";
import {
  Bounds,
  CRS,
  DomUtil,
  GridLayer,
  LatLng,
  LatLngBounds,
  Point,
  Projection,
  Util,
  transformation,
} from "leaflet";
import type { Coords, GridLayerOptions } from "leaflet";

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
const BASE_SCALE = 1 / Math.pow(2, ISO_ZOOM);

// Bounds in "geographical" coordinates
const WORLD_BOUNDS = new LatLngBounds(
  new LatLng(MIN_SAFE_COORDINATES, MIN_SAFE_COORDINATES),
  new LatLng(MAX_SAFE_COORDINATES, MAX_SAFE_COORDINATES),
);

// Coordinates from the EVM world are between -(2^79 - 1) and (2^79 - 1)
// Coordinates should be down-scaled by 2^(79-50)
// Or we need to rewrite the leaflet objects to handle BigInts
export const EvmLonLat = Util.extend({}, Projection.LonLat, {
  // Bounds in CRS coordinates (~ pixels at scale 1)
  bounds: new Bounds([MIN_SAFE_COORDINATES, MIN_SAFE_COORDINATES], [MAX_SAFE_COORDINATES, MAX_SAFE_COORDINATES]),
  project(latlng: LatLng) {
    return new Point(latlng.lng + MAX_SAFE_COORDINATES, MAX_SAFE_COORDINATES - latlng.lat);
  },
  unproject(point: Point) {
    return new LatLng(MAX_SAFE_COORDINATES - point.y, point.x - MAX_SAFE_COORDINATES);
  },
  fromEvmAddress(address: string): LatLng {
    const [lat, lng] = computeLocation(address.replace("Ox", "0x"));
    return new LatLng(lat, lng);
  },
});

export const EvmTorus: CRS & { 
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

const intFormat = new Intl.NumberFormat("nu", { useGrouping: true, signDisplay: "always" });

const coordinateFormatter = (nb: number, mode: CoordinatesLayerMode) => {
  // Upscale to fit the actual EVM resolution
  const evm_nb = BigInt(nb) * BigInt(Math.pow(2, 30));

  if (mode == "int") {
    return intFormat.format(evm_nb);
  } else {
    // hex
    // Bigint doesn't natively use signed representation
    const signed_evm_nb = evm_nb >= 0 ? evm_nb : -evm_nb | BigInt("0x80000000000000000000");
    return "Ox ".concat(
      signed_evm_nb
        .toString(16) // hexa display
        .replace(/^\-?([0-9a-f]+)$/, "$1") // remove the potential "-" at the start
        .padStart(20, "0") // pad with zeros
        .replace(/([0-9a-f]{4})/g, "$1 "), // display by group of 4
    );
  }
};

export type CoordinatesLayerType = GridLayer & {
  createTile: (coords: Coords) => HTMLElement;
  keyToBounds(tile: tileKey): LatLngBounds;
  tileCoordsToBounds(coords: Coords): LatLngBounds;
  tileCoordsToBoundsWithoutAMap(coords: Coords): LatLngBounds;
  pixelInTileToLatLng(tileCoords: Coords, pixel: Point): LatLng;
};
export type tileKey = ReturnType<CoordinatesLayerType["_tileCoordsToKey"]>;
export type CoordinatesLayerMode = "int" | "hex";
export type CoordinatesLayerOptions = GridLayerOptions & {
  classNames?: {
    layer?: string;
    tile?: string;
    latAxis?: string;
    lngAxis?: string;
  };
};

export const CoordinatesLayer: new (
  crs: CRS,
  mode: CoordinatesLayerMode,
  options: CoordinatesLayerOptions | void,
) => CoordinatesLayerType = GridLayer.extend({
  initialize: function (crs: CRS, mode: CoordinatesLayerMode, options: CoordinatesLayerOptions | void = {}) {
    this._crs = crs;
    this._mode = mode;

    if (options?.classNames?.layer) {
      options.className = options?.classNames?.layer;
    }
    // TODO forced options to be used only with the "VirtualTileLayer" hack
    options = {
      ...options,
      updateWhenZooming: false,
      updateInterval: 1000,
      noWrap: true,
    };
    // TODO it would be better to call the super "GridLayer.initialize" but this custom leaflet "extend" function seems to break it
    Util.setOptions(this, options);
  },
  createTile: function (coords: Coords): HTMLElement {
    // TODO move some css classes up to the pane container
    const tile = DomUtil.create("div", this.options.classNames.tile);
    const size = this.getTileSize();
    // TODO could use this.tileCoordsToBounds instead
    const northwest = this._crs.pointToLatLng(new Point(coords.x * size.x, coords.y * size.y), coords.z);

    DomUtil.create("span", this.options.classNames.latAxis, tile).textContent = coordinateFormatter(
      northwest.lat,
      this._mode,
    );
    DomUtil.create("span", this.options.classNames.lngAxis, tile).textContent = coordinateFormatter(
      northwest.lng,
      this._mode,
    );

    return tile;
  },
  // TODO following methods are used only for the "VirtualTileLayer" hack
  _retainChildren: function (): void {
    return undefined; // retain no child
  },
  _retainParent: function (): void {
    return undefined; // retain no parent
  },
  // expose private methods that can be used externally
  keyToBounds: function (tile: tileKey): LatLngBounds {
    return this._keyToBounds(tile);
  },
  tileCoordsToBounds: function (coords: Coords): LatLngBounds {
    return this._tileCoordsToBounds(coords);
  },
  // special version of the function to be used outside a browser where the map object annot be initialised
  tileCoordsToBoundsWithoutAMap: function (coords: Coords): LatLngBounds {
    const tileSize = this.getTileSize(),
      nwPoint = coords.scaleBy(tileSize),
      sePoint = nwPoint.add(tileSize),
      nw = this._crs.pointToLatLng(nwPoint, coords.z),
      se = this._crs.pointToLatLng(sePoint, coords.z);

    let bounds = new LatLngBounds(nw, se);
    if (!this.options.noWrap) {
      bounds = this._crs.wrapLatLngBounds(bounds);
    }
    return bounds;
  },
  pixelInTileToLatLng: function (tileCoords: Coords, pixel: Point): LatLng {
    const nwPoint = tileCoords.scaleBy(this.getTileSize()),
      pixelInTile = nwPoint.add(pixel);

    let latlng = this._crs.pointToLatLng(pixelInTile, tileCoords.z);
    if (!this.options.noWrap) {
      latlng = this._crs.wrapLatLng(latlng);
    }
    return latlng;
  },
});
