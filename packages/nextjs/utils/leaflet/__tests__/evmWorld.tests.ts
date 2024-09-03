import L, { Coords, Map, Point } from "leaflet";
import {
  CoordinatesLayer,
  CoordinatesLayerType,
  EvmLonLat,
  EvmTorus,
  ISO_ZOOM,
  MAX_SAFE_COORDINATES,
  MIN_SAFE_COORDINATES,
} from "~~/utils/leaflet/evmWorld";

describe("EvmLonLat projection", () => {
  it.each([
    ["0x0000000000000000000000000000000000000000", 0, 0],
    ["0x8000000000000000000080000000000000000000", -562949953421312, -562949953421312],
    ["0x7fffffffffffffffffff7fffffffffffffffffff", 562949953421311, 562949953421311],
  ])("Converts the EVM address '%s' into a location", (address, lng, lat) => {
    expect(EvmLonLat.fromEvmAddress(address)).toEqual(
      expect.objectContaining({
        lat,
        lng,
      }),
    );
  });
});

describe("EVM World Coordinated Reference System (EvmTorus)", () => {
  let map: Map;

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
    [ISO_ZOOM, MIN_SAFE_COORDINATES, MAX_SAFE_COORDINATES],
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
    [0, MAX_SAFE_COORDINATES, MAX_SAFE_COORDINATES, 256, 0],
    [0, MIN_SAFE_COORDINATES, MIN_SAFE_COORDINATES, 0, 256],
    [10, 0, 0, Math.pow(2, 17), Math.pow(2, 17)],
  ])("Projects at zoom %s the coordinate (%s,%s) to the pixel (%s,%s). And unproject", (zoom, lat, lng, x, y) => {
    expect(map.project([lat, lng], zoom)).toEqual(expect.objectContaining({ x, y }));
    const bound = map.wrapLatLng([lat, lng]);
    expect(map.unproject([x, y], zoom)).toEqual(expect.objectContaining({ lat: bound.lat, lng: bound.lng }));
  });
});

describe.each(["int", "hex"])("CoordinatesLayer in '%s' mode", mode => {
  let layer: CoordinatesLayerType;
  beforeAll(() => {
    layer = new CoordinatesLayer(EvmTorus, mode as "int" | "hex");
  });

  describe("Puts the (0,0) tile as the most northwest one", () => {
    it.each([...Array(ISO_ZOOM + 1).keys()])("On zoom %s", z => {
      const coords: Point | Coords = new Point(0, 0);
      (coords as Coords).z = z;
      const tile = layer.createTile(coords as Coords);

      if (mode == "int") {
        expect(tile.childNodes[0].textContent?.replaceAll(" ", "")).toBe("+604462909807314587353088"); // - 2^79
        expect(tile.childNodes[1].textContent?.replaceAll(" ", "")).toBe("-604462909807314587353088"); // - 2^79
      } else {
        // hex
        expect(tile.childNodes[0].textContent?.replaceAll(" ", "")).toBe("Ox80000000000000000000");
        expect(tile.childNodes[1].textContent?.replaceAll(" ", "")).toBe("Ox80000000000000000000");
      }
    });
  });

  describe("Puts the (2^(zoom-1),2^(zoom-1)) tile directly southeast adjacent to the (0,0) point", () => {
    it.each([...Array(ISO_ZOOM + 1).keys()])("On zoom %s", z => {
      const coord = Math.pow(2, z - 1);
      const coords: Point | Coords = new Point(coord, coord);
      (coords as Coords).z = z;
      const tile = layer.createTile(coords as Coords);

      if (mode == "int") {
        expect(tile.childNodes[0].textContent?.replaceAll(" ", "")).toBe("+0");
        expect(tile.childNodes[1].textContent?.replaceAll(" ", "")).toBe("+0");
      } else {
        // hex
        expect(tile.childNodes[0].textContent?.replaceAll(" ", "")).toBe("Ox00000000000000000000");
        expect(tile.childNodes[1].textContent?.replaceAll(" ", "")).toBe("Ox00000000000000000000");
      }
    });
  });

  describe("Equally divides the grid", () => {
    it.each([
      // test each tile on zoom 2
      [2, 2, 0, ["0x80000000000000000000", "0x00000000000000000000"], [604462909807314587353088n, 0n]], // x becomes lng, y becomes lat
      [2, 2, 1, ["0x40000000000000000000", "0x00000000000000000000"], [302231454903657293676544n, 0n]],
      [2, 2, 2, ["0x00000000000000000000", "0x00000000000000000000"], [0n, 0n]],
      [2, 2, 3, ["0xc0000000000000000000", "0x00000000000000000000"], [-302231454903657293676544n, 0n]],
      // test coordinates are divided by two on each new zoom level
      // applied on the center adjacent northwest tile
      [
        2,
        1,
        1,
        ["0x40000000000000000000", "0xc0000000000000000000"],
        [302231454903657293676544n, -302231454903657293676544n],
      ],
      [
        3,
        3,
        3,
        ["0x20000000000000000000", "0xa0000000000000000000"],
        [151115727451828646838272n, -151115727451828646838272n],
      ],
      [
        4,
        7,
        7,
        ["0x10000000000000000000", "0x90000000000000000000"],
        [75557863725914323419136n, -75557863725914323419136n],
      ],
      [
        5,
        15,
        15,
        ["0x08000000000000000000", "0x88000000000000000000"],
        [37778931862957161709568n, -37778931862957161709568n],
      ],
      [
        6,
        31,
        31,
        ["0x04000000000000000000", "0x84000000000000000000"],
        [18889465931478580854784n, -18889465931478580854784n],
      ],
      [
        7,
        63,
        63,
        ["0x02000000000000000000", "0x82000000000000000000"],
        [9444732965739290427392n, -9444732965739290427392n],
      ],
      [
        8,
        127,
        127,
        ["0x01000000000000000000", "0x81000000000000000000"],
        [4722366482869645213696n, -4722366482869645213696n],
      ],
      [
        9,
        255,
        255,
        ["0x00800000000000000000", "0x80800000000000000000"],
        [2361183241434822606848n, -2361183241434822606848n],
      ],
      [
        ISO_ZOOM,
        Math.pow(2, ISO_ZOOM - 1) - 1,
        Math.pow(2, ISO_ZOOM - 1) - 1,
        ["0x00000000004000000000", "0x80000000004000000000"],
        [274877906944n, -274877906944n],
      ], // -2^(30 + 8) 30 downscale + 8 tile
    ])("At zoom %s, shows the tile (%s,%s) ", (z, x, y, hex, int) => {
      const coords: Point | Coords = new Point(x, y);
      (coords as Coords).z = z;
      const tile = layer.createTile(coords as Coords);

      if (mode == "int") {
        expect(BigInt(tile.childNodes[0].textContent?.replaceAll(" ", "") as string)).toBe(int[0]);
        expect(BigInt(tile.childNodes[1].textContent?.replaceAll(" ", "") as string)).toBe(int[1]);
      } else {
        // hex
        expect(tile.childNodes[0].textContent?.replaceAll(" ", "")).toBe(hex[0].replace("0x", "Ox"));
        expect(tile.childNodes[1].textContent?.replaceAll(" ", "")).toBe(hex[1].replace("0x", "Ox"));
      }
    });
  });
});

describe("CoordinatesLayer utility methods", () => {
  let layer: CoordinatesLayerType;
  beforeAll(() => {
    layer = new CoordinatesLayer(EvmTorus, "hex");
  });

  describe("pixelInTileToLatLng", () => {
    it("Projects the location of each pixel from the outermost tile", () => {
      const tile: Coords = new Point(0, 0) as Coords;
      tile.z = 0;

      const pixelStep = (MAX_SAFE_COORDINATES - MIN_SAFE_COORDINATES) / 256;
      for (let x = 0; x < 256; x++) {
        for (let y = 0; y < 256; y++) {
          const latlng = layer.pixelInTileToLatLng(tile, new Point(x, y));
          expect(latlng.lat).toBe(MAX_SAFE_COORDINATES - y * pixelStep);
          expect(latlng.lng).toBe(MIN_SAFE_COORDINATES + x * pixelStep);
        }
      }
    });

    it("Projects the location of the pixel from one of the innermost tiles", () => {
      const tile: Coords = new Point(0, 0) as Coords;
      tile.z = ISO_ZOOM;

      const pixelStep = 1;
      for (let x = 0; x < 256; x++) {
        for (let y = 0; y < 256; y++) {
          const latlng = layer.pixelInTileToLatLng(tile, new Point(x, y));
          expect(latlng.lat).toBe(MAX_SAFE_COORDINATES - y * pixelStep);
          expect(latlng.lng).toBe(MIN_SAFE_COORDINATES + x * pixelStep);
        }
      }
    });
  });
});
