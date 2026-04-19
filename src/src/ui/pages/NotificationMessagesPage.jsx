import React from "react";
import { eventBus } from "../../utils/eventBus.js";
import { useSubscribedState } from "../StateViewBase.jsx";

function toneClass(level) {
  if (level === "success") return "border-green-300 bg-green-50 text-green-900";
  if (level === "warn") return "border-amber-300 bg-amber-50 text-amber-900";
  if (level === "error") return "border-red-300 bg-red-50 text-red-900";
  return "border-blue-300 bg-blue-50 text-blue-900";
}

export default function NotificationMessagesPage() {
  const s = useSubscribedState("NotificationMessagesPage", { items: [] });
  const items = Array.isArray(s?.items) ? s.items : [];

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[95] w-[min(92vw,30rem)] space-y-2 pointer-events-none">
      {items.map((item) => (
        <section
          key={item?.id}
          className={`pointer-events-auto rounded-xl border px-4 py-2 shadow-md ${toneClass(item?.level)}`}
        >
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              {item?.title ? <h3 className="text-sm font-semibold truncate">{item.title}</h3> : null}
              <p className="text-sm break-words">{item?.message || ""}</p>
            </div>
            <button
              type="button"
              aria-label="Dismiss notification"
              className="w-6 h-6 rounded hover:bg-black/10 transition"
              onClick={() => eventBus.emit("dismissNotification", { id: item?.id, from: "ui/notification/close" })}
            >
              ×
            </button>
          </div>
        </section>
      ))}
    </div>
  );
}

