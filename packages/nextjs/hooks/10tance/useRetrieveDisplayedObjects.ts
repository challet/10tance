import { useEffect } from "react";
import { useGlobalState } from "~~/services/store/store";
import { EVMObject, evmAddress } from "~~/types/10tance/EVMObject";

export default function useRetrieveDisplayedObjects(): EVMObject[] {
  const activeTiles = useGlobalState(state => state.map.activeTiles);
  const index = useGlobalState(state => state.map.evmObjectsIndex);
  const objects = useGlobalState(state => state.evmObjects);
  const selectedObjectId = useGlobalState(state =>
    state.selectedObject !== null && state.selectedObject in state.evmObjects ? state.selectedObject : null,
  );
  const fetchBatchEvmObjects = useGlobalState(state => state.fetchBatchEvmObjects);

  // keeps track of missing tiles
  const missingTiles = Array.from(activeTiles.difference(new Set(Object.keys(index))));
  // and fire a fetch for each of them
  useEffect(() => {
    missingTiles.forEach(fetchBatchEvmObjects);
  }, [missingTiles, fetchBatchEvmObjects]);

  const uniqueAddresses = Array.from(activeTiles).reduce(
    // addresses can have duplicates during transitions between zoom levels
    // using a Set union ensure uniqueness
    (current, tileKey) => {
      return tileKey in index ? current.union(index[tileKey].addresses) : current;
    },
    // the selected object may or may not be part of the dispalyed set
    selectedObjectId === null ? new Set<evmAddress>() : new Set([selectedObjectId]),
  );
  return Array.from(uniqueAddresses)
    .filter(address => objects[address].data !== null)
    .map(address => objects[address].data as EVMObject);
}
