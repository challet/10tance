import { Coords, CRS, DomUtil, GridLayer, LatLng, LatLngBounds, Point, Util } from "leaflet";
import type { GridLayerOptions } from "leaflet";
import type { CoordinateFormatterMode } from "./coordinateFormatter";
import coordinateFormatter from "./coordinateFormatter";

export type CoordinatesLayerType = GridLayer & {
  createTile: (coords: Coords) => HTMLElement;
  keyToBounds(tile: tileKey): LatLngBounds;
  tileCoordsToBounds(coords: Coords): LatLngBounds;
  tileCoordsToBoundsWithoutAMap(coords: Coords): LatLngBounds;
  pixelInTileToLatLng(tileCoords: Coords, pixel: Point): LatLng;
};
export type tileKey = ReturnType<CoordinatesLayerType["_tileCoordsToKey"]>;
export type CoordinatesLayerOptions = GridLayerOptions & {
  classNames?: {
    layer?: string;
    tile?: string;
    latAxis?: string;
    lngAxis?: string;
  };
  mode?: CoordinateFormatterMode;
  useGrouping?: boolean;
};

const CoordinatesLayer: new (
  crs: CRS,
  options: CoordinatesLayerOptions | void,
) => CoordinatesLayerType = GridLayer.extend({
  initialize: function (crs: CRS, options: CoordinatesLayerOptions | undefined = {}) {
    this._crs = crs;
    // default options
    options = {
      mode: "hex",
      useGrouping: true,
      ...options,
      classNames: {
        layer:'', tile: '', latAxis: '', lngAxis: '', ...options.classNames
      },
      className: (options.className ?? '') + (options.classNames?.layer ? (' ' + options.classNames.layer) : '')
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
    const tile = DomUtil.create("div", this.options?.classNames.tile);
    const size = this.getTileSize();
    // TODO could use this.tileCoordsToBounds instead
    const northwest = this._crs.pointToLatLng(new Point(coords.x * size.x, coords.y * size.y), coords.z);
    
    const prepend = `${this.options.mode == "hex" ? '0x' : ''}${this.options.mode == "hex" && this.options.useGrouping ? ' ' : ''}`;
    DomUtil.create("span", this.options?.classNames.latAxis, tile).textContent = prepend
      + coordinateFormatter(
        BigInt(northwest.lat) * BigInt(Math.pow(2, 30)), // Upscale to fit the actual EVM resolution
        { mode: this.options.mode, useGrouping: this.options.useGrouping }
      );
    DomUtil.create("span", this.options?.classNames.lngAxis, tile).textContent = prepend
      + coordinateFormatter(
        BigInt(northwest.lng) * BigInt(Math.pow(2, 30)), // Upscale to fit the actual EVM resolution
        { mode: this.options.mode, useGrouping: this.options.useGrouping }
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

export default CoordinatesLayer;