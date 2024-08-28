"use client";

import { FormEvent, FunctionComponent, MouseEvent, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import defaultIcon from "../public/question-mark-circle.svg";
import "leaflet/dist/leaflet.css";
import type { NextPage } from "next";
import Map from "~~/components/leaflet/Map";
import { AddressInput } from "~~/components/scaffold-eth";
import useRetrieveSelectedObject from "~~/hooks/10tance/useRetrieveSelectedObject";
import { useGlobalState } from "~~/services/store/store";
import { EvmLonLat } from "~~/utils/leaflet/evmWorld";

const Home: NextPage = () => {
  const mapBounds = useGlobalState(state => state.map.bounds);
  const selectedObject = useGlobalState(state => state.selectedObject);
  const setSelectedObject = useGlobalState(state => state.setSelectedObject);

  const unselectObjectHandler = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      console.log(event);
      setSelectedObject(null);
    },
    [setSelectedObject],
  );

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
          <GoToUserControl />
        </div>
      </div>

      <div className="drawer">
        <input id="my-drawer" type="checkbox" className="drawer-toggle" checked={selectedObject != null} readOnly />
        <div className="drawer-content">
          <div className="hero min-h-[calc(100vh-15rem)] w-full">
            <Map />
          </div>
        </div>
        <div className="drawer-side w-[30rem] absolute">
          <div className="min-h-full bg-base-200">
            <button className="btn btn-circle btn-outline float-end m-4" onClick={unselectObjectHandler}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <ObjectDetails />
          </div>
        </div>
      </div>
    </>
  );
};

const GoToUserControl: FunctionComponent = () => {
  const [localGoTo, setLocalGoTo] = useState("");
  const goingTo = useGlobalState(state => state.map.goingTo);
  const setMapToGoTo = useGlobalState(state => state.setMapToGoTo);
  // reset the control here only after the global has reseted (not on all changes)
  useEffect(() => {
    if (goingTo === null) {
      setLocalGoTo("");
    }
  }, [goingTo, setLocalGoTo]);

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
  return (
    <form onSubmit={handleGoToAction}>
      <AddressInput placeholder="Go to" name="address" value={localGoTo} onChange={setLocalGoTo} />
      <button className="btn btn-sm">Go to address</button>
    </form>
  );
};

const ObjectDetails: FunctionComponent = () => {
  const { isLoading, data } = useRetrieveSelectedObject();
  console.log(data);
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

export default Home;
