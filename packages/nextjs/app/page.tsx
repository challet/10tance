"use client";

import { FunctionComponent, useLayoutEffect, useMemo, useState } from "react";
import { EvmTorus } from "../utils/leaflet/evmWorld";
import { LatLngBounds, LeafletEvent } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { NextPage } from "next";
import { MapContainer, Marker, ScaleControl, TileLayer, useMap, useMapEvent } from "react-leaflet";
import useSWR, { Fetcher } from "swr";
import useErc20Icons from "~~/hooks/10tance/useErc20Icons";
import type { EVMObject } from "~~/types/10tance/EVMObject";

const Home: NextPage = () => {
  const [mapBounds, setMapBounds] = useState<LatLngBounds | null>(null);
  const [selectedObject, setSelectedObject] = useState<object | null>(null);

  return (
    <>
      <div className="stats shadow">
        <div className="stat">
          <div className="stat-title">West</div>
          <div className="stat-value">{mapBounds ? mapBounds.getWest() : null}</div>
        </div>
        <div className="stat">
          <div className="stat-title">South</div>
          <div className="stat-value">{mapBounds ? mapBounds.getSouth() : null}</div>
        </div>
        <div className="stat">
          <div className="stat-title">East</div>
          <div className="stat-value">{mapBounds ? mapBounds.getEast() : null}</div>
        </div>
        <div className="stat">
          <div className="stat-title">North</div>
          <div className="stat-value">{mapBounds ? mapBounds.getNorth() : null}</div>
        </div>
      </div>

      <div className="drawer">
        <input id="my-drawer" type="checkbox" className="drawer-toggle" checked={selectedObject != null} readOnly />
        <div className="drawer-content">
          <div className="hero min-h-[calc(100vh-15rem)] w-full">
            <MapContainer
              center={[0, 0]}
              zoom={1}
              minZoom={1}
              maxZoom={44}
              scrollWheelZoom={true}
              crs={EvmTorus}
              className="hero-content size-full"
            >
              <TileLayer url="http://localhost:3001/tiles/{z}/{x}/{y}.png" noWrap={false} />
              <ScaleControl />
              <MoveHandler onBoundsChange={setMapBounds} />
              {mapBounds && <Markers bounds={mapBounds} onSelect={setSelectedObject} />}
            </MapContainer>
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
          <img className="aspect-square size-24 p-0" src={initialData.icon_url} alt={initialData.name} />
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

const MoveHandler: FunctionComponent<{ onBoundsChange: (bounds: LatLngBounds) => void }> = ({ onBoundsChange }) => {
  const map = useMap();
  useLayoutEffect(() => onBoundsChange(map.getBounds()), [map, onBoundsChange]);
  useMapEvent("move", event => onBoundsChange(event.target.getBounds()));
  return null;
};

// TODO : better fetch by area batches and throttle sequancial moves
const dataFetch: Fetcher<EVMObject[], [LatLngBounds, string]> = async ([bounds]) => {
  const response = await fetch(`http://localhost:3001/objects?bounds=${bounds.toBBoxString()}`);
  const data = await response.json();
  return data;
};

const Markers: FunctionComponent<{ bounds: LatLngBounds; onSelect: (id: object) => void }> = ({ bounds, onSelect }) => {
  const map = useMap();
  const { data } = useSWR([EvmTorus.constraintsLatLngBounds(map.wrapLatLngBounds(bounds)), "map-data"], dataFetch, {
    fallbackData: [],
  });
  const icons = useErc20Icons(data);
  const eventHandlers = useMemo(
    () => ({
      click(event: LeafletEvent) {
        onSelect(event.target.options["data-data"]);
      },
    }),
    [onSelect],
  );

  return data.map(d => (
    <Marker position={[d.lat, d.lng]} icon={icons[d.id]} key={d.id} data-data={d} eventHandlers={eventHandlers} />
  ));
};

export default Home;
