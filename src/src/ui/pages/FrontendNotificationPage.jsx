import React from "react";
import { eventBus } from "../../utils/eventBus.js";
import { useSubscribedState } from "../StateViewBase.jsx";

function toneClass(level) {
  if (level === "success") return "border-green-300 bg-green-50 text-green-900";
  if (level === "error") return "border-red-300 bg-red-50 text-red-900";
  if (level === "info") return "border-blue-300 bg-blue-50 text-blue-900";
  return "border-amber-300 bg-amber-50 text-amber-900";
}

export default function FrontendNotificationPage() {
  const s = useSubscribedState("FrontendNotificationPage", { items: [] });
  const items = Array.isArray(s?.items) ? s.items : [];

  return (
    <div className="fixed inset-x-0 top-20 z-[97] flex justify-center px-3 pointer-events-none">
      <div className="w-[min(94vw,34rem)] space-y-2">
        {items.map((item) => (
          <section
            key={item?.id}
            className={`pointer-events-auto rounded-xl border px-4 py-3 shadow-md ${toneClass(item?.level)}`}
          >
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                {item?.title ? <h3 className="text-sm font-semibold">{item.title}</h3> : null}
                <p className="text-sm mt-1 break-words whitespace-pre-line">{item?.message || ""}</p>
              </div>
              <button
                type="button"
                className="px-3 py-1.5 rounded-md bg-black/10 hover:bg-black/15 transition text-sm font-semibold"
                onClick={() => eventBus.emit("dismissFrontendNotification", { id: item?.id, from: "ui/frontendNotification/ok" })}
              >
                {item?.okText || "OK"}
              </button>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

