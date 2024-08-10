import { useState } from "react";
import type { EVMObject } from "../../types/10tance/EVMObject.d.ts";
import { Icon } from "leaflet";

export default function useErc20Icons(data: EVMObject[]): Record<string, Icon> {
  const [icons, setIcons] = useState<Record<string, Icon>>({});
  // update the icons store if needed
  const missing = data
    .filter(d => !(d.id in icons))
    .map(d => [
      d.id,
      new Icon({
        iconUrl: d.icon_url,
        iconSize: [29, 29],
        iconAnchor: [15, 15],
      }),
    ]);
  if (missing.length) {
    setIcons({ ...icons, ...Object.fromEntries(missing) });
  }
  return icons;
}
