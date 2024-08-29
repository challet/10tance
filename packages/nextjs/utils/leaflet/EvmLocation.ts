export default function computeLocation(address: string): [number, number] {
  const addr = BigInt(address);
  const lng = BigInt.asIntN(50, addr >> BigInt(30)); // downscale the 80 bits to 50
  const lat = BigInt.asIntN(50, addr >> BigInt(80 + 30)); // shift 80 and downscale to 50
  return [Number(lat), Number(lng)];
}
