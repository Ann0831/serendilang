import React from "react";
import { eventBus } from "../../utils/eventBus.js";
import { useSubscribedState } from "../StateViewBase.jsx";

function toneClass(level) {
  if (level === "success") return "border-green-300 bg-green-50 text-green-900";
  if (level === "warn") return "border-amber-300 bg-amber-50 text-amber-900";
  if (level === "info") return "border-blue-300 bg-blue-50 text-blue-900";
  return "border-red-300 bg-red-50 text-red-900";
}

export default function ErrorMessagesPage() {
  const s = useSubscribedState("ErrorMessagesPage", { items: [] });
  const items = Array.isArray(s?.items) ? s.items : [];

  return (
    <div className="fixed right-3 top-20 z-[96] w-[min(92vw,25rem)] space-y-2 pointer-events-none">
      {items.map((item) => (
        <section
          key={item?.id}
          className={`pointer-events-auto rounded-xl border shadow-md px-3 py-2 ${toneClass(item?.level)}`}
        >
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold truncate flex items-center gap-1">
                {item?.iconClass ? <i className={item.iconClass} aria-hidden="true"></i> : null}
                <span>{item?.title || "Error"}</span>
              </h3>
              <p className="text-xs mt-1 break-words">{item?.message || ""}</p>
            </div>
            <button
              type="button"
              aria-label="Dismiss error"
              className="w-6 h-6 rounded hover:bg-black/10 transition"
              onClick={() => eventBus.emit("dismissErrorMessage", { id: item?.id, from: "ui/errorMessages/close" })}
            >
              ×
            </button>
          </div>
        </section>
      ))}
    </div>
  );
}
