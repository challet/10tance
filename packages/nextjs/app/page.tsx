"use client";

import { FormEvent, FunctionComponent, useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import Image from "next/image";
import defaultIcon from "../public/question-mark-circle.svg";
import { EvmLonLat, EvmTorus, ISO_ZOOM } from "../utils/leaflet/evmWorld";
import { LatLng, LatLngBounds, LeafletEvent } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { NextPage } from "next";
import { LayersControl, MapContainer, Marker, ScaleControl, TileLayer, useMap, useMapEvent } from "react-leaflet";
import useSWR, { Fetcher } from "swr";
import CoordinatesLayer from "~~/components/leaflet/CoordinatesLayer";
import useErc20Icons from "~~/hooks/10tance/useErc20Icons";
import type { EVMObject } from "~~/types/10tance/EVMObject";

const intialCenter = new LatLng(0, 0);

const Home: NextPage = () => {
  const [mapBounds, setMapBounds] = useState<LatLngBounds | null>(null);

  const [goingTo, goTo] = useState<LatLng>(intialCenter);
  const handleGoToAction = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const target = event.target as typeof event.target & {
      address: { value: string };
    };
    goTo(EvmLonLat.fromEvmAddress(target.address.value));
  }, []);

  const [selectedObject, setSelectedObject] = useState<object | null>(null);

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
            <MapContainer
              center={intialCenter}
              zoom={1}
              minZoom={0}
              maxZoom={ISO_ZOOM}
              scrollWheelZoom={true}
              crs={EvmTorus}
              className="hero-content size-full"
            >
              <TileLayer url="http://localhost:3001/tiles/{z}/{x}/{y}.png" noWrap={false} />
              <LayersControl position="topright">
                <LayersControl.BaseLayer name="Integer coordinates" checked={false}>
                  <CoordinatesLayer crs={EvmTorus} noWrap={false} mode="int" />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Hexadecimal coordinates" checked={true}>
                  <CoordinatesLayer crs={EvmTorus} noWrap={false} mode="hex" />
                </LayersControl.BaseLayer>
              </LayersControl>
              <ScaleControl />
              <MoveHandler onBoundsChange={setMapBounds} />
              <MoveTrigger goto={goingTo} />
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

const MoveHandler: FunctionComponent<{ onBoundsChange: (bounds: LatLngBounds) => void }> = ({ onBoundsChange }) => {
  const map = useMap();
  useLayoutEffect(() => onBoundsChange(map.getBounds()), [map, onBoundsChange]);
  useMapEvent("move", event => onBoundsChange(event.target.getBounds()));
  return null;
};

const MoveTrigger: FunctionComponent<{ goto: LatLng }> = ({ goto }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(goto);
  }, [goto, map]);
  return null;
};

// TODO : better fetch by area batches and throttle sequantial moves
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
