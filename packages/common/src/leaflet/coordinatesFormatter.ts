export type CoordinatesFormatterMode = "int" | "hex";

export type CoordinatesFormatterOptions = {
  mode?: CoordinatesFormatterMode;
  useGrouping?: boolean;
};

const coordinateFormatter = (nb: bigint | number, options: CoordinatesFormatterOptions = {}): string => {
  options = { mode: "hex", useGrouping: true, ...options }; // default values

  nb = BigInt(nb);
  if (options.mode == "int") {
    const intFormat = new Intl.NumberFormat("nu", { useGrouping: options.useGrouping, signDisplay: "always" });
    return intFormat.format(nb);
  } else {
    // hex
    // Bigint doesn't natively converts to two complement string
    const signed_evm_nb = nb >= 0 ? nb : nb + BigInt("0x100000000000000000000");
    const hex = signed_evm_nb.toString(16).padStart(20, "0");
    return options.useGrouping ? hex.replace(/([0-9a-f]{4}(?!$))/g, "$1 ") : hex;
  }
};

export default coordinateFormatter;
