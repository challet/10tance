"use client";

import { FormEvent, FunctionComponent, useCallback, useEffect, useState } from "react";
import { AddressInput } from "../scaffold-eth";
import { useGlobalState } from "~~/services/store/store";

const GoToUserControl: FunctionComponent<{ className: string }> = ({ className = "" }) => {
  const [localGoTo, setLocalGoTo] = useState("");
  const goingTo = useGlobalState(state => state.map.goingTo);
  const setMapToGoTo = useGlobalState(state => state.setMapToGoTo);
  const setSelectedObject = useGlobalState(state => state.setSelectedObject);
  // reset the control here only after the global has reseted (not on all changes)
  useEffect(() => {
    if (goingTo === null) {
      setLocalGoTo("");
    }
  }, [goingTo, setLocalGoTo]);

  const handleGoToAction = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const target = event.target as typeof event.target & {
        address: { value: string };
      };
      setMapToGoTo((await import("common/src/leaflet")).EvmLonLat.fromEvmAddress(target.address.value));
      setSelectedObject(target.address.value);
    },
    [setMapToGoTo, setSelectedObject],
  );
  return (
    <form onSubmit={handleGoToAction} className={className}>
      <AddressInput placeholder="Go to" name="address" value={localGoTo} onChange={setLocalGoTo} />
      <button className="btn btn-sm">Go to address</button>
    </form>
  );
};

export default GoToUserControl;
