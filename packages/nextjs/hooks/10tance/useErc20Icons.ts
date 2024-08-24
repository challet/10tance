import defaultIcon from "../../public/question-mark-circle.svg";
import { Icon } from "leaflet";

// global cache
const iconsCache: Record<string, Icon> = {
  [defaultIcon.src]: new Icon({
    iconUrl: defaultIcon.src,
    iconSize: [17, 17],
    iconAnchor: [9, 9],
  }),
};

// not really a hook, it just provide a function as global icons cache accessor
export default function useErc20Icons(): (url: string | undefined) => Icon {
  return (url = defaultIcon.src) => {
    url = url ?? defaultIcon.src;
    if (!(url in iconsCache)) {
      iconsCache[url] = new Icon({
        iconUrl: url,
        iconSize: [21, 21],
        iconAnchor: [11, 11],
      });
    }
    return iconsCache[url];
  };
}
