export default function computeEvmLocation(address: string, downScale: boolean = true): [bigint, bigint] {
  const addr = BigInt(address);
  const size = downScale ? 50 : 80;
  const shift = downScale ? 30 : 0;
  const lng = BigInt.asIntN(size, addr >> BigInt(shift)); // downscale the 80 bits to 50
  const lat = BigInt.asIntN(size, addr >> BigInt(80 + shift)); // shift 80 and downscale to 50

  return [lat, lng];
}
