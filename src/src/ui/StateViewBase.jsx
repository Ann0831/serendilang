import React, { useEffect, useMemo, useState } from "react";
import { subscribe, getState } from "../utils/uiStateAdapter.js";
import { ensureUiI18nRuntime } from "./i18n/uiI18nRuntime.js";

export function useSubscribedState(id, fallback = {}) {
  const [state, setState] = useState(() => getState(id) || fallback);

  useEffect(() => {
    ensureUiI18nRuntime();
  }, []);

  useEffect(() => {
    return subscribe(id, (next) => {
      setState(next || fallback);
    });
  }, [id]);

  return state;
}

export function Panel({ title, right, children, className = "" }) {
  return (
    <section className={`rounded-lg border border-gray-200 bg-white p-3 ${className}`}>
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        {right ? <div className="text-xs text-gray-500">{right}</div> : null}
      </header>
      {children}
    </section>
  );
}

export function Stat({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded border border-gray-100 bg-gray-50 px-2 py-1 text-xs">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-900">{String(value ?? "-")}</span>
    </div>
  );
}

export function Chip({ text, tone = "gray" }) {
  const toneClass = useMemo(() => {
    if (tone === "green") return "bg-green-100 text-green-800";
    if (tone === "red") return "bg-red-100 text-red-800";
    if (tone === "blue") return "bg-blue-100 text-blue-800";
    if (tone === "yellow") return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-700";
  }, [tone]);

  return <span className={`rounded px-2 py-0.5 text-[11px] ${toneClass}`}>{text}</span>;
}

export function Empty({ text = "No data" }) {
  return <p className="w-full text-center text-base font-medium text-gray-400">{text}</p>;
}

export function JsonBlock({ value }) {
  return (
    <pre className="max-h-56 overflow-auto rounded bg-gray-900 p-2 text-[11px] text-gray-100">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export default function StateViewBase({ id, title }) {
  const state = useSubscribedState(id, {});

  return (
    <Panel title={title} right={`subscribe: ${id}`}>
      <JsonBlock value={state} />
    </Panel>
  );
}
