import React from "react";
import { eventBus } from "../../utils/eventBus.js";
import { useSubscribedState } from "../StateViewBase.jsx";

export default function SystemNotificationsPage() {
  const s = useSubscribedState("SystemNotificationsPage", {
    visible: false,
    loading: false,
    notification: null,
    text: { title: "System Notification", ok: "OK", fallbackMessage: "Welcome" },
  });

  if (!s?.visible || !s?.notification) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] backdrop-blur-sm">
      <div className="bg-white w-[90%] max-w-md rounded-2xl shadow-lg p-6 relative text-gray-800">
        <button
          type="button"
          aria-label="Close system notification"
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl"
          onClick={() => eventBus.emit("dismissSystemNotification", { from: "ui/systemNotification/close" })}
        >
          ×
        </button>
        <h2 className="text-xl font-semibold text-indigo-700 mb-2">
          {s.notification?.title || s.text?.title || "System Notification"}
        </h2>
        <p className="text-gray-600 mb-4 whitespace-pre-line break-words">
          {s.notification?.message || s.text?.fallbackMessage || "Welcome"}
        </p>
        <div className="flex justify-end">
          <button
            type="button"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg transition"
            onClick={() => eventBus.emit("dismissSystemNotification", { from: "ui/systemNotification/ok" })}
          >
            {s.text?.ok || "OK"}
          </button>
        </div>
      </div>
    </div>
  );
}
