import { useEffect, useState } from "react";
import { getOnlineUsersSnapshot, subscribeOnlineUsersPool } from "../../dataPool/onlineUsersPool.js";

function toOnlineSet(snapshot) {
  const ids = (snapshot?.list || []).map((x) => String(x?.userId || "")).filter(Boolean);
  return new Set(ids);
}

export function useOnlineUsersSet() {
  const [onlineIds, setOnlineIds] = useState(() => toOnlineSet(getOnlineUsersSnapshot()));

  useEffect(() => {
    return subscribeOnlineUsersPool((snapshot) => {
      setOnlineIds(toOnlineSet(snapshot));
    });
  }, []);

  return onlineIds;
}

