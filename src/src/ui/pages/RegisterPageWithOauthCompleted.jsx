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

export default function RegisterPageWithOauthCompleted() {
  const state = useSubscribedState("RegisterPageWithOauthCompleted", {
    step: 1,
    isChecking: false,
    isSubmitting: false,
    languages: [],
    oauth: {
      loading: false,
      email: "",
      name: "",
      picture: "",
    },
    form: {
      username: "",
      nativeLanguage: "",
      targetLanguage: "",
      invitationCode: "",
      agree: false,
      profilePicFile: null,
      profilePicUrl: "",
    },
    errors: {
      username: "",
      agree: "",
      general: "",
    },
  });

  const s = state || {};
  const step = Number(s.step || 1);
  const form = s.form || {};
  const oauth = s.oauth || {};
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
              <h1 className="text-2xl font-semibold text-gray-900">Complete your account</h1>
              <p className="text-sm text-gray-600 mt-1">Finish your profile to start language exchange.</p>
            </div>
          </header>

          {errors.general ? (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 text-red-700 text-sm px-3 py-2">
              {errors.general}
            </div>
          ) : null}

          <div className="flex-1 overflow-y-auto flex items-center justify-center">
            <div className="w-full max-w-lg py-2">
              <div className={step === 1 ? "block space-y-4 text-center" : "hidden"}>
                <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-3 text-sm text-indigo-900">
                  {oauth.loading ? (
                    <span>Checking Google account...</span>
                  ) : (
                    <>
                      <div className="mb-2 flex items-center justify-center">
                        <AvatarImage
                          src={toAvatarSrc(oauth.picture)}
                          alt="Google account avatar"
                          className="w-14 h-14 rounded-full object-cover border border-indigo-200 bg-white"
                        />
                      </div>
                      <div className="font-medium">Google Account</div>
                      <div className="mt-1 break-all">{oauth.email || "No Google email found"}</div>
                    </>
                  )}
                </div>
                {!oauth.loading && !oauth.email ? (
                  <div className="text-xs text-red-600">
                    You must use a Google account to continue this flow.
                  </div>
                ) : null}

                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    data-action-list='[{"type":"click","action":"registerOauthCompletedSwitchAccount","eventParameter":{}}]'
                    className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
                  >
                    Use another Google account
                  </button>
                </div>

                <label className="block">
                  <span className="block text-center text-sm font-medium text-gray-700">Username</span>
                  <input
                    id="oauth-completed-username"
                    value={form.username || ""}
                    onChange={(e) => eventBus.emit("registerOauthCompletedFieldChanged", { field: "username", value: e.target.value })}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="Enter username"
                  />
                  {errors.username ? <span className="text-xs text-red-600 mt-1 block">{errors.username}</span> : null}
                </label>
              </div>

              <div className={step === 2 ? "block space-y-4" : "hidden"}>
                <label className="block">
                  <span className="block text-center text-sm font-medium text-gray-700">Native Language</span>
                  <select
                    id="oauth-completed-nativeLanguage"
                    value={form.nativeLanguage || ""}
                    onChange={(e) => eventBus.emit("registerOauthCompletedFieldChanged", { field: "nativeLanguage", value: e.target.value })}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    {languages.map((lang) => (
                      <option key={`n-${lang.lowercase}`} value={lang.lowercase}>{lang.name}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="block text-center text-sm font-medium text-gray-700">Target Language</span>
                  <select
                    id="oauth-completed-targetLanguage"
                    value={form.targetLanguage || ""}
                    onChange={(e) => eventBus.emit("registerOauthCompletedFieldChanged", { field: "targetLanguage", value: e.target.value })}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    {languages.map((lang) => (
                      <option key={`t-${lang.lowercase}`} value={lang.lowercase}>{lang.name}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className={step === 3 ? "block space-y-4 text-center" : "hidden"}>
                <div className="flex items-center justify-center gap-4">
                  <AvatarImage
                    id="oauth-completed-preview"
                    src={toAvatarSrc(form.profilePicUrl)}
                    alt="profile preview"
                    className="w-16 h-16 rounded-full object-cover border border-gray-200"
                  />
                  <label className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-gray-300 cursor-pointer hover:bg-gray-50">
                    <i className="ti ti-camera text-base"></i>
                    Upload Profile Picture
                    <input
                      id="oauth-completed-profilePic"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => eventBus.emit("registerOauthCompletedProfilePicChanged", { file: e.target.files?.[0] || null })}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500">You can skip this step and upload later.</p>
              </div>

              <div className={step === 4 ? "block space-y-4" : "hidden"}>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Invitation Code</span>
                  <input
                    id="oauth-completed-invitationCode"
                    value={form.invitationCode || ""}
                    onChange={(e) => eventBus.emit("registerOauthCompletedFieldChanged", { field: "invitationCode", value: e.target.value })}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="Invitation code"
                  />
                </label>

                <label className="flex items-start gap-2 text-sm text-gray-700">
                  <input
                    id="oauth-completed-agree"
                    type="checkbox"
                    checked={!!form.agree}
                    onChange={(e) => eventBus.emit("registerOauthCompletedFieldChanged", { field: "agree", value: e.target.checked })}
                    className="mt-1"
                  />
                  <span>
                    I agree to the{" "}
                    <a href="/terms" className="text-indigo-600 hover:underline">Terms</a>
                    {" "}and{" "}
                    <a href="/privacy" className="text-indigo-600 hover:underline">Privacy</a>.
                  </span>
                </label>
                {errors.agree ? <span className="text-xs text-red-600 block">{errors.agree}</span> : null}
              </div>
            </div>
          </div>

          <footer className="mt-4 pt-4 border-t border-gray-100">
            <div className="relative flex items-center justify-between">
              <button
                id="oauth-completed-prevStep"
                type="button"
                disabled={step === 1}
                data-action-list='[{"type":"click","action":"registerOauthCompletedPrevStep","eventParameter":{}}]'
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>

              <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 flex items-center justify-center gap-2 min-w-[96px]" aria-label={`step ${step} of 4`}>
                <StepDot active={step === 1} />
                <StepDot active={step === 2} />
                <StepDot active={step === 3} />
                <StepDot active={step === 4} />
              </div>

              <div className="flex items-center gap-2">
                {step === 3 ? (
                  <button
                    id="oauth-completed-skipAvatarStep"
                    type="button"
                    data-action-list='[{"type":"click","action":"registerOauthCompletedSkipAvatarStep","eventParameter":{}}]'
                    className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Skip
                  </button>
                ) : null}

                {step < 4 ? (
                  <button
                    id="oauth-completed-nextStep"
                    type="button"
                    disabled={!!s.isChecking || (step === 1 && !oauth.loading && !oauth.email)}
                    data-action-list='[{"type":"click","action":"registerOauthCompletedNextStep","eventParameter":{}}]'
                    className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {s.isChecking ? "Checking..." : "Next"}
                  </button>
                ) : (
                  <button
                    id="oauth-completed-finishBtn"
                    type="button"
                    disabled={!!s.isSubmitting}
                    data-action-list='[{"type":"click","action":"registerOauthCompletedSubmit","eventParameter":{}}]'
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
