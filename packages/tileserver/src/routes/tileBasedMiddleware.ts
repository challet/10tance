import type { NextFunction, Request, Response } from "express";
import type { Coords, LatLngBounds, } from "leaflet";
import { ISO_ZOOM } from "../common/index.js";

export type tileData = {
  coords: Coords;
  bounds: LatLngBounds;
  geom: string;
}

// can be not aync anymore and dynamic import removed after [this PR](https://github.com/Leaflet/Leaflet/pull/9385) makes it to a release
const tileBasedMiddlewareFactory = async() => {
  const { Point, LatLng } = await import("leaflet");
  const { CoordinatesLayer, EvmTorus } = await import("../common/leaflet/evmWorld.js");
  
  const layer = new CoordinatesLayer(EvmTorus, "hex");

  return (req: Request, res: Response, next: NextFunction) => {
    const params = [
      parseInt(req.params.x),
      parseInt(req.params.y),
      parseInt(req.params.z)
    ];
    const [x, y, z] = params;
    // validate params
    if(params.find((param) => !Number.isInteger(param)) !== undefined) {
      // not a positive integer
      return res.status(400).end();
    } else if (z > ISO_ZOOM || z < 0) {
      // zoom overflow
      return res.status(404).end();
    } else if (x < 0 || y < 0 || x >= 2 ** z || y >= 2 ** z) {
      // coordinates overflow
      return res.status(404).end();
    }

    // find a matching tile
    const coords: Coords = new Point(x, y) as Coords;
    coords.z = z; 
    const bounds = layer.tileCoordsToBoundsWithoutAMap(coords);
    const e = bounds.getEast(),
      w = bounds.getWest(),
      n = bounds.getNorth(),
      s = bounds.getSouth();
    res.locals.tile = {
      coords,
      bounds,
      geom: `POLYGON((${e} ${s}, ${e} ${n}, ${w} ${n}, ${w} ${s}, ${e} ${s}))`
    };

    next();
  };
};

export default tileBasedMiddlewareFactory;
