"use client";

import computeLocation from "../../../common/leaflet/EvmLocation";
import {
  Bounds,
  CRS,
  Coords,
  DomUtil,
  GridLayer,
  GridLayerOptions,
  LatLng,
  LatLngBounds,
  Point,
  Projection,
  Util,
  transformation,
} from "leaflet";
import { tileKey } from "~~/services/store/store";

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

export const EvmTorus: CRS & { constraintsLatLngBounds: (bounds: LatLngBounds) => LatLngBounds | null } = Util.extend(
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

    /* custom methods */

    // Same as CRS.wrapLatLngBounds but doesn't keep the same size as the given one
    // Useful for getting the visible bounds constrained into the CRS
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

const intFormat = new Intl.NumberFormat("nu", { useGrouping: "always", signDisplay: "always" });

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
        .replaceAll(/([0-9a-f]{4})/g, "$1 "), // display by group of 4
    );
  }
};

export type CoordinatesLayerType = GridLayer & {
  createTile: (coords: Coords) => HTMLElement;
  keyToBounds(tile: tileKey): LatLngBounds;
};
export type CoordinatesLayerMode = "int" | "hex";

export const CoordinatesLayer: new (
  crs: CRS,
  mode: CoordinatesLayerMode,
  options: GridLayerOptions | void,
) => CoordinatesLayerType = GridLayer.extend({
  initialize: function (crs: CRS, mode: CoordinatesLayerMode, options: GridLayerOptions | void = {}) {
    this._crs = crs;
    this._mode = mode;
    // TODO force options to be used only with the "VirtualTileLayer" hack
    options = {
      ...options,
      updateWhenZooming: false,
      updateInterval: 1000,
      noWrap: true,
    };
    // TODO it would be better to call the super GridLayer.initialize but this custom extension system seems to break it
    Util.setOptions(this, options);
  },
  createTile: function (coords: Coords): HTMLElement {
    // TODO move the css classes up to the pane container
    const tile = DomUtil.create(
      "div",
      "border-t border-l border-slate-400/50 text-slate-400/50 text-center text-[0.75em]/[1.2em] tabular-nums font-mono select-none",
    );
    const size = this.getTileSize();
    const northwest = this._crs.pointToLatLng(new Point(coords.x * size.x, coords.y * size.y), coords.z);

    DomUtil.create("span", "absolute inset-x-0 top-0", tile).textContent = coordinateFormatter(
      northwest.lat,
      this._mode,
    );
    DomUtil.create("span", "absolute inset-y-0 left-0 [writing-mode:sideways-lr]", tile).textContent =
      coordinateFormatter(northwest.lng, this._mode);

    return tile;
  },
  // TODO following methods are used only for the "VirtualTileLayer" hack
  _retainChildren: function (): void {
    return undefined; // retain no child
  },
  _retainParent: function (): void {
    return undefined; // retain no parent
  },
  keyToBounds: function (tile: tileKey): LatLngBounds {
    return this._keyToBounds(tile);
  },
});
