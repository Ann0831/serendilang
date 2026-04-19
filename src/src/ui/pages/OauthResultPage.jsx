import React from "react";
import { useSubscribedState } from "../StateViewBase.jsx";
import AvatarImage from "../common/AvatarImage.jsx";
import { toAvatarSrc } from "../common/avatarSrc.js";

export default function OauthResultPage() {
  const state = useSubscribedState("OauthResultPage", {
    scene: "general",
    reason: "UNKNOWN",
    title: "OAuth Error",
    message: "Unable to continue OAuth flow. Please try again.",
    isProcessing: false,
    oauth: {
      loading: false,
      email: "",
      name: "",
      picture: "",
      hasIdentity: false,
    },
  });

  const oauth = state?.oauth || {};
  const isProcessing = !!state?.isProcessing;
  const showRegisterAction = state?.scene === "login" && state?.reason === "EMAIL_NOT_FOUND";
  const showUseAnotherEmailLabel = state?.scene === "register" && state?.reason === "EMAIL_ALREADY_REGISTERED";

  return (
    <section className="min-h-screen px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-lg p-6 md:p-7">
        <h1 className="text-2xl font-semibold text-slate-900">{state?.title || "OAuth Error"}</h1>
        <p className="mt-3 text-slate-700 leading-7">{state?.message || "Please go back and try again."}</p>

        {oauth.loading ? (
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-3 py-3 text-sm text-blue-800">
            Checking current Google account...
          </div>
        ) : null}

        {!oauth.loading && oauth.hasIdentity ? (
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-3 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">Current Google account</div>
            <div className="mt-2 flex items-center gap-3">
              <AvatarImage
                src={toAvatarSrc(oauth.picture)}
                alt="Google account avatar"
                className="w-10 h-10 rounded-full border border-blue-200 bg-white object-cover"
              />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900 truncate">{oauth.name || "Google account"}</div>
                <div className="text-sm text-slate-700 break-all">{oauth.email || ""}</div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={isProcessing}
            data-action-list='[{"type":"click","action":"oauthResultRetry","eventParameter":{}}]'
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Please wait..." : "Retry"}
          </button>

          <button
            type="button"
            disabled={isProcessing}
            data-action-list={showRegisterAction
              ? '[{"type":"click","action":"oauthResultGoRegister","eventParameter":{}}]'
              : '[{"type":"click","action":"oauthResultUseAnotherAccount","eventParameter":{}}]'}
            className="px-4 py-2 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {showRegisterAction
              ? "Register"
              : (showUseAnotherEmailLabel ? "Use another Google Account" : "Use another Google Account")}
          </button>
        </div>

        <a href="/" className="inline-block mt-4 text-sm text-blue-600 hover:underline">
          Back to home
        </a>
      </div>
    </section>
  );
}
