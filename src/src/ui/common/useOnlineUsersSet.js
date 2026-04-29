import { useMemo } from "react";
import { useSubscribedState } from "../StateViewBase.jsx";

export function useOnlineUsersSet() {
  const s = useSubscribedState("OnlineUsersIndex", { ids: [] });
  const ids = Array.isArray(s?.ids) ? s.ids : [];
  return useMemo(() => {
    return new Set(ids.map((id) => String(id || "")).filter(Boolean));
  }, [ids]);
}
