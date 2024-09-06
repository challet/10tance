import { type CoordinateFormatterOptions, coordinateFormatter } from "common/src/leaflet";

describe("coordinateFormatter helper", () => {
  describe("hex representation", () => {
    const options: CoordinateFormatterOptions = { mode: "hex", useGrouping: false };
    it.each([
      [0, "00000000000000000000"],
      [1, "00000000000000000001"],
      [2n ** 79n - 1n, "7fffffffffffffffffff"],
      [-1, "ffffffffffffffffffff"],
      [-2, "fffffffffffffffffffe"],
      [-(2n ** 77n), "e0000000000000000000"],
      [-(2n ** 78n), "c0000000000000000000"],
      [-(2n ** 79n), "80000000000000000000"],
    ])("uses 80 bits two's complement : %s => %s", (input, output) => {
      expect(coordinateFormatter(input, options)).toEqual(output);
    });
  });
});
