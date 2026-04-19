import React from "react";

export default function LoginPageHeader({ title, right = null }) {
  return (
    <div className="sticky top-16 z-20 shrink-0 bg-gray-100">
      <div className="flex items-center justify-between px-4 py-2">
        <h2 className="font-semibold text-lg text-gray-800">{title}</h2>
        {right ? <div>{right}</div> : <span />}
      </div>
    </div>
  );
}
