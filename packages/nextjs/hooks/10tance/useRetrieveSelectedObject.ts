import { useEffect } from "react";
import { useGlobalState } from "~~/services/store/store";
import { EVMObject } from "~~/types/10tance/EVMObject";

export default function useRetrieveSelectedObject(): { isLoading: boolean; data: EVMObject | null } {
  const fetchExtraEvmObject = useGlobalState(state => state.fetchExtraEvmObject);
  const [selectedObjectId, selectedObject, needFetch, isLoading] = useGlobalState(
    (state): [EVMObject["id"] | null, EVMObject | null, boolean, boolean] => {
      const requestedId = state.map.selectedObject;
      const existingEntry =
        state.map.selectedObject !== null && state.map.selectedObject in state.evmObjects
          ? state.evmObjects[state.map.selectedObject]
          : null;

      return [
        requestedId,
        existingEntry ? existingEntry.data : null,
        requestedId !== null && (existingEntry === null || !existingEntry.status.isLoaded),
        existingEntry ? existingEntry.status.isLoading : false,
      ];
    },
  );

  // fire a fetch if needed
  useEffect(() => {
    if (needFetch && selectedObjectId !== null) {
      fetchExtraEvmObject(selectedObjectId);
    }
  }, [selectedObjectId, selectedObject, needFetch, fetchExtraEvmObject]);

  return { isLoading, data: selectedObject };
}
