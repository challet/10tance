import { Bounds, LatLng, Point, Projection, Util } from "leaflet";
import { MAX_SAFE_COORDINATES, MIN_SAFE_COORDINATES } from "./constants";
import computeEvmLocation from "./computeEvmLocation";

// Or we need to rewrite the leaflet objects to handle BigInts
// Coordinates from the EVM world are between -(2^79 - 1) and (2^79 - 1)
// Coordinates should be down-scaled by 2^(79-50)
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
    const [lat, lng] = computeEvmLocation(address.replace("Ox", "0x"), true);
    return new LatLng(Number(lat), Number(lng));
  },
});

export default EvmLonLat;
