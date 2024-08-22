"use client";

import { FormEvent, FunctionComponent, useCallback } from "react";
import Image from "next/image";
import defaultIcon from "../public/question-mark-circle.svg";
import "leaflet/dist/leaflet.css";
import type { NextPage } from "next";
import useSWR, { Fetcher } from "swr";
import Map from "~~/components/leaflet/Map";
import { useGlobalState } from "~~/services/store/store";
import { EvmLonLat } from "~~/utils/leaflet/evmWorld";

const Home: NextPage = () => {
  const setMapToGoTo = useGlobalState(state => state.setMapToGoTo);
  const handleGoToAction = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const target = event.target as typeof event.target & {
        address: { value: string };
      };
      setMapToGoTo(EvmLonLat.fromEvmAddress(target.address.value));
    },
    [setMapToGoTo],
  );

  const mapBounds = useGlobalState(state => state.map.bounds);
  const selectedObject = useGlobalState(state => state.map.selectedObject);

  return (
    <>
      <div className="stats shadow text-sm">
        <div className="stat ">
          <div className="stat-title">West</div>
          <div className="stat-value text-sm">{mapBounds ? mapBounds.getWest() : null}</div>
        </div>
        <div className="stat">
          <div className="stat-title">South</div>
          <div className="stat-value text-sm">{mapBounds ? mapBounds.getSouth() : null}</div>
        </div>
        <div className="stat">
          <div className="stat-title">East</div>
          <div className="stat-value text-sm">{mapBounds ? mapBounds.getEast() : null}</div>
        </div>
        <div className="stat">
          <div className="stat-title">North</div>
          <div className="stat-value text-sm">{mapBounds ? mapBounds.getNorth() : null}</div>
        </div>
        <div className="stat">
          <form onSubmit={handleGoToAction}>
            <input
              type="text"
              placeholder="Goto"
              name="address"
              className="input input-bordered w-full max-w-xs"
              pattern="^0x[0-9a-fA-F]{40}$"
            />
            <button className="btn btn-sm">Go to address</button>
          </form>
        </div>
      </div>

      <div className="drawer">
        <input id="my-drawer" type="checkbox" className="drawer-toggle" checked={selectedObject != null} readOnly />
        <div className="drawer-content">
          <div className="hero min-h-[calc(100vh-15rem)] w-full">
            <Map />
          </div>
        </div>
        <div className="drawer-side w-[30rem] absolute h-full">
          {selectedObject != null && <ObjectDetails initialData={selectedObject} />}
        </div>
      </div>
    </>
  );
};

const tokenFetch: Fetcher<any, [string, string]> = async ([id]) => {
  const response = await fetch(`https://optimism.blockscout.com/api/v2/tokens/${id}`);
  const data = await response.json();
  return data;
};

const ObjectDetails: FunctionComponent<{ initialData: any }> = ({ initialData }) => {
  const { data, isLoading } = useSWR([initialData.id, "token-data"], tokenFetch);
  return (
    <>
      <ul className="bg-base-200 text-base-content min-h-full w-[30rem] p-4">
        <li className="content-center">
          <Image
            className="aspect-square size-20 p-0"
            src={initialData.icon_url ?? defaultIcon.src}
            alt={initialData.name}
            width={80}
            height={80}
          />
        </li>
        <li>
          <h2 className="text-lg font-semibold">{initialData.name}</h2>
        </li>
        <li>Address : {initialData.id} </li>
        <li>Latitude : {initialData.lat} </li>
        <li>Longitude : {initialData.lng} </li>
        {isLoading ? (
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
          <a href={`https://optimism.blockscout.com/address/${initialData.id}`} target="_blank" className="underline">
            Blockscout explorer
          </a>
        </li>
      </ul>
    </>
  );
};

export default Home;
