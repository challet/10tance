import { EvmTorus, MAX_SAFE_COORDINATES, MIN_SAFE_COORDINATES } from "../evmWorld";
import L from "leaflet";

describe("EVM World", () => {
  let map: L.Map;

  beforeAll(() => {
    document.body.innerHTML = '<div id="map"></div>';

    map = L.map("map", {
      center: [0, 0],
      zoom: 0,
      crs: EvmTorus,
    });
  });

  it.each([
    [0, 0, 0, 0],
    [MIN_SAFE_COORDINATES, MAX_SAFE_COORDINATES, MIN_SAFE_COORDINATES, MAX_SAFE_COORDINATES],
    [MIN_SAFE_COORDINATES - 1, MAX_SAFE_COORDINATES + 1, MAX_SAFE_COORDINATES - 1, MIN_SAFE_COORDINATES + 1],
  ])("Bounds the location coordinates { %d : %d } to { %d : %d }", (lat_in, lng_in, lat_out, lng_out) => {
    expect(map.wrapLatLng(new L.LatLng(lat_in, lng_in))).toEqual(
      expect.objectContaining({ lat: lat_out, lng: lng_out }),
    );
  });

  it.each([
    [0, -128, 128], // at zoom 0 the whole world is shown on a 256 x 256 tile
    [44, MIN_SAFE_COORDINATES, MAX_SAFE_COORDINATES],
  ])("Bounds the pixel coordinates at zoom %d between %d and %d", (zoom, min, max) => {
    expect(map.getPixelWorldBounds(zoom)).toEqual(
      expect.objectContaining({
        min: expect.objectContaining({ x: min, y: min }),
        max: expect.objectContaining({ x: max, y: max }),
      }),
    );
  });

  it.each([
    [0, 0, 0, 128, 128],
    [0, MAX_SAFE_COORDINATES, MAX_SAFE_COORDINATES, 256, 256],
    [0, MIN_SAFE_COORDINATES, MIN_SAFE_COORDINATES, 0, 0],
    [10, 0, 0, Math.pow(2, 17), Math.pow(2, 17)], // 17 = 10 / 2 + log2(256)
  ])("Projects at zoom %s the coordinate (%s,%s) to the pixel (%s,%s). And unproject", (zoom, lat, lng, x, y) => {
    expect(map.project([lat, lng], zoom)).toEqual(expect.objectContaining({ x, y }));
    const bound = map.wrapLatLng([lat, lng]);
    expect(map.unproject([x, y], zoom)).toEqual(expect.objectContaining({ lat: bound.lat, lng: bound.lng }));
  });
});
