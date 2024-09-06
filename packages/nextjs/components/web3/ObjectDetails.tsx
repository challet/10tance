import { FunctionComponent } from "react";
import Image from "next/image";
import useRetrieveSelectedObject from "~~/hooks/10tance/useRetrieveSelectedObject";
import defaultIcon from "~~/public/question-mark-circle.svg";
import computeLocation from "~~/utils/leaflet/EvmLocation";
import coordinateFormatter, { CoordinatesFormatterMode } from "~~/utils/leaflet/coordinatesFormatter";

const dollarFormatter = new Intl.NumberFormat(navigator.language, {
  style: "currency",
  currency: "USD",
}).format;

const SMALL_TO_LARGE_THRESHOLD = 9;

const largeNumericFormatter = new Intl.NumberFormat(navigator.language, {
  minimumSignificantDigits: SMALL_TO_LARGE_THRESHOLD,
  roundingPriority: "morePrecision",
  notation: "compact",
  compactDisplay: "long",
}).format;

const smallNumericFormatter = new Intl.NumberFormat(navigator.language, {
  maximumSignificantDigits: SMALL_TO_LARGE_THRESHOLD,
}).format;

const numericFormatter = (nb: number): string => {
  return nb >= 10 ** SMALL_TO_LARGE_THRESHOLD ? largeNumericFormatter(nb) : smallNumericFormatter(nb);
};

const ObjectDetails: FunctionComponent<{ coordinatesMode: CoordinatesFormatterMode }> = ({ coordinatesMode }) => {
  const { isLoading, data } = useRetrieveSelectedObject();

  if (data === null) {
    if (!isLoading) {
      return "no data";
    } else {
      return "loading";
    }
  } else {
    // lat and lng from data are downscaled to fit the map, recompute the actual one
    const [evmLat, evmLng] = computeLocation(data.id, false);
    return (
      <>
        <div className="text-center pt-14">
          <Image
            className="aspect-square size-20 p-0 m-auto"
            src={data.icon_url ?? defaultIcon.src}
            alt={data.symbol}
            width={80}
            height={80}
          />
          <h2 className="text-lg font-semibold mt-6">{data.symbol}</h2>
          <code className="bg-slate-200/60 p-1">{data.id}</code>
        </div>
        <dl className="text-base-content my-10 mx-4 divide-y divide-gray-300 leading-6 border-y border-gray-300">
          <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="font-medium text-gray-900">Latitude</dt>
            <dd className="mt-1 sm:col-span-2 text-gray-700">
              <code className="bg-slate-200/60 p-1 tracking-tighter">
                {coordinateFormatter(evmLat, { mode: coordinatesMode })}
              </code>
            </dd>
          </div>
          <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="font-medium text-gray-900">Longitude</dt>
            <dd className="mt-1 sm:col-span-2 text-gray-700">
              <code className="bg-slate-200/60 p-1 tracking-tighter">
                {coordinateFormatter(evmLng, { mode: coordinatesMode })}
              </code>
            </dd>
          </div>
          {!isLoading && ( // it is partially loaded
            <>
              <div className="py-4  sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="font-medium text-gray-900">Full name</dt>
                <dd className="mt-1 sm:col-span-2 text-gray-700">{data.name}</dd>
              </div>
              <div className="py-4  sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="font-medium text-gray-900">Circulating market cap</dt>
                <dd className="mt-1 sm:col-span-2 text-gray-700">
                  {data.circulating_market_cap ? dollarFormatter(data.circulating_market_cap) : " ⃠"}
                </dd>
              </div>
              <div className="py-4  sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="font-medium text-gray-900">Holders</dt>
                <dd className="mt-1 sm:col-span-2 text-gray-700">
                  {data.holders ? numericFormatter(data.holders) : " ⃠"}
                </dd>
              </div>
              <div className="py-4  sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="font-medium text-gray-900">Exchange rate</dt>
                <dd className="mt-1 sm:col-span-2 text-gray-700">
                  {data.exchange_rate ? dollarFormatter(data.exchange_rate) : " ⃠"}
                </dd>
              </div>
              <div className="py-4  sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="font-medium text-gray-900">Total supply</dt>
                <dd className="mt-1 sm:col-span-2 text-gray-700">
                  {data.total_supply ? numericFormatter(data.total_supply) : " ⃠"}
                </dd>
              </div>
            </>
          )}
        </dl>
        {isLoading && (
          <svg className="animate-spin h-10 w-10 m-auto text-center" viewBox="0 0 24 24">
            <path d="M10.72,19.9a8,8,0,0,1-6.5-9.79A7.77,7.77,0,0,1,10.4,4.16a8,8,0,0,1,9.49,6.52A1.54,1.54,0,0,0,21.38,12h.13a1.37,1.37,0,0,0,1.38-1.54,11,11,0,1,0-12.7,12.39A1.54,1.54,0,0,0,12,21.34h0A1.47,1.47,0,0,0,10.72,19.9Z" />
          </svg>
        )}

        <div className="text-center">
          See more on &nbsp;
          <a href={`https://optimism.blockscout.com/address/${data.id}`} target="_blank" className="underline">
            Blockscout explorer
          </a>
        </div>
      </>
    );
  }
};

export default ObjectDetails;
