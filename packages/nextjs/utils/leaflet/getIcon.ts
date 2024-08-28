import defaultIcon from "../../public/question-mark-circle.svg";
import { Icon, PointTuple } from "leaflet";

const DEFAULT_OPTIONS = {
  iconSize: [21, 21] as PointTuple,
  iconAnchor: [11, 11] as PointTuple,
};

const HIGHLIHGTEHD_OPTIONS = {
  iconSize: [49, 49] as PointTuple,
  iconAnchor: [25, 25] as PointTuple,
  className: "bg-purple-600/[.55] border-8 rounded-full border-transparent shadow-md shadow-purple-600/[.55]",
};

// global cache avoiding to recreate the Icon each time
// there are two Records : one for non highlighted version, the second for highlighted
// already init the "defaultIcon" ones
const iconsCache: [Record<string, Icon>, Record<string, Icon>] = [
  {
    [defaultIcon.src]: new Icon({
      ...DEFAULT_OPTIONS,
      iconUrl: defaultIcon.src,
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
