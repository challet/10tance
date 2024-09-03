"use client";

import { FunctionComponent } from "react";
import Image from "next/image";
import useRetrieveSelectedObject from "~~/hooks/10tance/useRetrieveSelectedObject";
import defaultIcon from "~~/public/question-mark-circle.svg";

const ObjectDetails: FunctionComponent = () => {
  const { isLoading, data } = useRetrieveSelectedObject();
  if (data === null) {
    if (!isLoading) {
      return "no data";
    } else {
      return "loading";
    }
  } else {
    return (
      <>
        <ul className="text-base-content w-[30rem] p-4">
          <li className="content-center">
            <Image
              className="aspect-square size-20 p-0"
              src={data.icon_url ?? defaultIcon.src}
              alt={data.symbol}
              width={80}
              height={80}
            />
          </li>
          <li>
            <h2 className="text-lg font-semibold">{data.symbol}</h2>
          </li>
          <li>Address : {data.id} </li>
          <li>Latitude : {data.lat} </li>
          <li>Longitude : {data.lng} </li>
          {isLoading ? ( // it is partially loaded
            <li>loading</li>
          ) : (
            <>
              <li>Full name : {data.name}</li>
              <li>Circulating market cap : {data.circulating_market_cap}</li>
              <li>Holders : {data.holders}</li>
              <li>Exchange rate : {data.exchange_rate}</li>
              <li>Total supply : {data.total_supply}</li>
            </>
          )}
          <li>
            See more on &nbsp;
            <a href={`https://optimism.blockscout.com/address/${data.id}`} target="_blank" className="underline">
              Blockscout explorer
            </a>
          </li>
        </ul>
      </>
    );
  }
};

export default ObjectDetails;
