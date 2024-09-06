"use client";

import { useCallback, useState } from "react";
import type { CoordinateFormatterMode } from "common/src/leaflet";
import "leaflet/dist/leaflet.css";
import type { NextPage } from "next";
import Map from "~~/components/leaflet/Map";
import ObjectDetails from "~~/components/web3/ObjectDetails";
import { useGlobalState } from "~~/services/store/store";

const Home: NextPage = () => {
  const selectedObject = useGlobalState(state => state.selectedObject);
  const setSelectedObject = useGlobalState(state => state.setSelectedObject);

  const unselectObjectHandler = useCallback(() => {
    setSelectedObject(null);
  }, [setSelectedObject]);

  const [coordinatesMode, setCoordinatesMode] = useState<CoordinateFormatterMode>("hex");

  return (
    <div className="drawer h-[calc(100vh-4rem)]">
      <input id="my-drawer" type="checkbox" className="drawer-toggle" checked={selectedObject != null} readOnly />
      <div className="drawer-content  z-0">
        <Map onChangeCoordinatesMode={setCoordinatesMode} />
      </div>
      <div className="drawer-side w-full sm:w-[30rem] h-full absolute z-1">
        <div className="min-h-full bg-base-200/[.98]">
          <button
            className="btn btn-circle btn-outline m-3 absolute top-0 right-0 size-10 min-h-10"
            onClick={unselectObjectHandler}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <ObjectDetails coordinatesMode={coordinatesMode} />
        </div>
      </div>
    </div>
  );
};

export default Home;
