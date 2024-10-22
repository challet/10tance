import type { PointTuple } from "leaflet";
import { Icon } from "leaflet";
import defaultIcon from "~~/public/icons/question-mark-circle.svg";

const DEFAULT_OPTIONS = {
  iconSize: [23, 23] as PointTuple,
  iconAnchor: [12, 12] as PointTuple,
  className: "bg-slate-300/[.55] rounded-full",
};

const HIGHLIHGTEHD_OPTIONS = {
  iconSize: [49, 49] as PointTuple,
  iconAnchor: [25, 25] as PointTuple,
  className: "bg-slate-300/[.7] border-8 rounded-full border-transparent shadow-md shadow-slate-300/[.7]",
};

// global cache avoiding to recreate the Icon each time
// there are two Records : one for non highlighted version, the second for highlighted
// already init the "defaultIcon" ones
const iconsCache: [Record<string, Icon>, Record<string, Icon>] = [
  {
    [defaultIcon.src]: new Icon({
      ...DEFAULT_OPTIONS,
      iconUrl: defaultIcon.src,
      iconSize: [19, 19],
      iconAnchor: [10, 10],
    }),
  },
  {
    [defaultIcon.src]: new Icon({
      ...HIGHLIHGTEHD_OPTIONS,
      iconUrl: defaultIcon.src,
    }),
  },
];

const getIcon = (url: string | undefined = defaultIcon.src, highlighted = false): Icon => {
  const cachePart = highlighted ? iconsCache[1] : iconsCache[0];
  url = url ?? defaultIcon.src;
  if (!(url in cachePart)) {
    cachePart[url] = new Icon({
      ...(highlighted ? HIGHLIHGTEHD_OPTIONS : DEFAULT_OPTIONS),
      iconUrl: url,
    });
  }
  return cachePart[url];
};

export default getIcon;
