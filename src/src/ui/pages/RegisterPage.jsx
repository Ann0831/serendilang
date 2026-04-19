import React from "react";
import { eventBus } from "../../utils/eventBus.js";
import { useSubscribedState } from "../StateViewBase.jsx";
import { toAvatarSrc } from "../common/avatarSrc.js";
import AvatarImage from "../common/AvatarImage.jsx";

function StepDot({ active }) {
  return (
    <span className={`w-3 h-3 rounded-full ${active ? "bg-indigo-600" : "bg-gray-300"}`} />
  );
}

export default function RegisterPage() {
  const state = useSubscribedState("RegisterPage", {
    step: 1,
    isChecking: false,
    isSubmitting: false,
    languages: [],
    form: {
      username: "",
      password: "",
      confirmPassword: "",
      nativeLanguage: "",
      targetLanguage: "",
      invitationCode: "",
      agree: false,
      profilePicFile: null,
      profilePicUrl: "",
    },
    errors: {
      username: "",
      password: "",
      confirmPassword: "",
      agree: "",
      general: "",
    },
  });

  const s = state || {};
  const step = Number(s.step || 1);
  const form = s.form || {};
  const errors = s.errors || {};
  const languages = Array.isArray(s.languages) ? s.languages : [];

  return (
    <section className="w-full h-full overflow-y-auto px-4">
      <div className="min-h-full w-full flex items-center justify-center py-8">
        <div
          className="w-full shrink-0 bg-white border border-gray-200 shadow rounded-2xl p-6 md:p-8 flex flex-col"
          style={{
            width: "min(100%, 56rem)",
            height: "calc(100vh - 8rem)",
            minHeight: "calc(100vh - 8rem)",
            maxHeight: "calc(100vh - 8rem)",
          }}
        >
          <header className="mb-6">
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-gray-900">Create your account</h1>
              <p className="text-sm text-gray-600 mt-1">Join Serendilang and start language exchange.</p>
            </div>
          </header>

          {errors.general ? (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 text-red-700 text-sm px-3 py-2">
              {errors.general}
            </div>
          ) : null}

          <div className="flex-1 overflow-y-auto flex items-center justify-center">
            <div className="w-full max-w-lg py-2">
            <div className={step === 1 ? "block space-y-4" : "hidden"}>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Username</span>
            <input
              id="username"
              value={form.username || ""}
              onChange={(e) => eventBus.emit("registerPageFieldChanged", { field: "username", value: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="Enter username"
            />
            {errors.username ? <span className="text-xs text-red-600 mt-1 block">{errors.username}</span> : null}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Password</span>
            <input
              id="password"
              type="password"
              value={form.password || ""}
              onChange={(e) => eventBus.emit("registerPageFieldChanged", { field: "password", value: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="At least 8 characters"
            />
            {errors.password ? <span className="text-xs text-red-600 mt-1 block">{errors.password}</span> : null}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Confirm Password</span>
            <input
              id="confirmPassword"
              type="password"
              value={form.confirmPassword || ""}
              onChange={(e) => eventBus.emit("registerPageFieldChanged", { field: "confirmPassword", value: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="Type password again"
            />
            {errors.confirmPassword ? <span className="text-xs text-red-600 mt-1 block">{errors.confirmPassword}</span> : null}
          </label>
            </div>

            <div className={step === 2 ? "block space-y-4" : "hidden"}>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Native Language</span>
            <select
              id="nativeLanguage"
              value={form.nativeLanguage || ""}
              onChange={(e) => eventBus.emit("registerPageFieldChanged", { field: "nativeLanguage", value: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              {languages.map((lang) => (
                <option key={`n-${lang.lowercase}`} value={lang.lowercase}>{lang.name}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Target Language</span>
            <select
              id="targetLanguage"
              value={form.targetLanguage || ""}
              onChange={(e) => eventBus.emit("registerPageFieldChanged", { field: "targetLanguage", value: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              {languages.map((lang) => (
                <option key={`t-${lang.lowercase}`} value={lang.lowercase}>{lang.name}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Invitation Code</span>
            <input
              id="invitationCode"
              value={form.invitationCode || ""}
              onChange={(e) => eventBus.emit("registerPageFieldChanged", { field: "invitationCode", value: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="Invitation code"
            />
          </label>
            </div>

            <div className={step === 3 ? "block space-y-4 text-center" : "hidden"}>
          <div className="flex items-center justify-center gap-4">
            <AvatarImage
              id="preview"
              src={toAvatarSrc(form.profilePicUrl)}
              alt="profile preview"
              className="w-16 h-16 rounded-full object-cover border border-gray-200"
            />
            <label className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-gray-300 cursor-pointer hover:bg-gray-50">
              <i className="ti ti-camera text-base"></i>
              Upload Profile Picture
              <input
                id="profilePic"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => eventBus.emit("registerPageProfilePicChanged", { file: e.target.files?.[0] || null })}
              />
            </label>
          </div>

          <label className="flex items-start justify-center gap-2 text-sm text-gray-700">
            <input
              id="agree"
              type="checkbox"
              checked={!!form.agree}
              onChange={(e) => eventBus.emit("registerPageFieldChanged", { field: "agree", value: e.target.checked })}
              className="mt-1"
            />
            <span>I agree to the Terms and Privacy Policy.</span>
          </label>
          {errors.agree ? <span className="text-xs text-red-600 block">{errors.agree}</span> : null}
            </div>
            </div>
          </div>

          <footer className="mt-4 pt-4 border-t border-gray-100">
            <div className="relative flex items-center justify-between">
          <button
            id="prevStep"
            type="button"
            disabled={step === 1}
            data-action-list='[{"type":"click","action":"registerPagePrevStep","eventParameter":{}}]'
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>

          <div
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 flex items-center justify-center gap-2 min-w-[72px]"
            aria-label={`step ${step} of 3`}
          >
            <StepDot active={step === 1} />
            <StepDot active={step === 2} />
            <StepDot active={step === 3} />
          </div>

          <div className="flex items-center gap-2">
            {step === 2 ? (
              <button
                id="skipToStep3"
                type="button"
                data-action-list='[{"type":"click","action":"registerPageSkipToStep3","eventParameter":{}}]'
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Skip
              </button>
            ) : null}

            {step < 3 ? (
              <button
                id="nextStep"
                type="button"
                disabled={!!s.isChecking}
                data-action-list='[{"type":"click","action":"registerPageNextStep","eventParameter":{}}]'
                className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {s.isChecking ? "Checking..." : "Next"}
              </button>
            ) : (
              <button
                id="finishBtn"
                type="button"
                disabled={!!s.isSubmitting}
                data-action-list='[{"type":"click","action":"registerPageSubmit","eventParameter":{}}]'
                className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {s.isSubmitting ? "Submitting..." : "Finish"}
              </button>
            )}
          </div>
            </div>
          </footer>
        </div>
      </div>
    </section>
  );
}
