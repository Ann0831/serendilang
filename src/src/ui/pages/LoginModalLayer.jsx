import React, { useEffect, useRef, useState } from "react";
import { eventBus } from "../../utils/eventBus.js";
import { useSubscribedState } from "../StateViewBase.jsx";

function MakePostModal({ makePost }) {
  const open = !!makePost?.open;
  const submitting = !!makePost?.submitting;
  const result = makePost?.result || "";
  const message = makePost?.message || "";
  const text = makePost?.text || "";
  const previewUrl = makePost?.previewUrl || "";
  const crop = makePost?.crop || null;
  const cropDone = !!makePost?.cropDone;
  const hasImage = !!makePost?.file || !!previewUrl;
  const canSubmit = !submitting && (text.trim().length > 0 || (hasImage && cropDone));
  const canGoStep2 = !submitting && (!hasImage || cropDone);
  const cropFrameRef = useRef(null);
  const dragStateRef = useRef(null);
  const [draggingCrop, setDraggingCrop] = useState(false);
  const [step, setStep] = useState(1);

  const clamp = (num, min, max) => Math.min(max, Math.max(min, num));

  const onCropPointerDown = (e) => {
    if (submitting || !crop || cropDone) return;
    const frame = cropFrameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    e.preventDefault();
    e.stopPropagation();
    dragStateRef.current = {
      mode: "move",
      startClientX: e.clientX,
      startClientY: e.clientY,
      frameWidth: rect.width,
      frameHeight: rect.height,
      crop: { ...crop },
    };
    setDraggingCrop(true);
  };

  const onCropResizePointerDown = (e, mode) => {
    if (submitting || !crop || cropDone) return;
    const frame = cropFrameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    e.preventDefault();
    e.stopPropagation();
    dragStateRef.current = {
      mode,
      startClientX: e.clientX,
      startClientY: e.clientY,
      frameWidth: rect.width,
      frameHeight: rect.height,
      crop: { ...crop },
    };
    setDraggingCrop(true);
  };

  useEffect(() => {
    if (!draggingCrop) return undefined;

    const onPointerMove = (e) => {
      const drag = dragStateRef.current;
      if (!drag) return;
      const dxNorm = (e.clientX - drag.startClientX) / drag.frameWidth;
      const dyNorm = (e.clientY - drag.startClientY) / drag.frameHeight;
      if (drag.mode === "resize-x") {
        const nextW = clamp(drag.crop.w + dxNorm, 0.05, 1 - drag.crop.x);
        eventBus.emit("postModalSetCrop", {
          crop: { ...drag.crop, w: nextW },
          from: "ui/makePost/crop-resize-x",
        });
      } else if (drag.mode === "resize-y") {
        const nextH = clamp(drag.crop.h + dyNorm, 0.05, 1 - drag.crop.y);
        eventBus.emit("postModalSetCrop", {
          crop: { ...drag.crop, h: nextH },
          from: "ui/makePost/crop-resize-y",
        });
      } else {
        const nextX = clamp(drag.crop.x + dxNorm, 0, 1 - drag.crop.w);
        const nextY = clamp(drag.crop.y + dyNorm, 0, 1 - drag.crop.h);
        eventBus.emit("postModalSetCrop", {
          crop: { ...drag.crop, x: nextX, y: nextY },
          from: "ui/makePost/crop-drag",
        });
      }
    };

    const stopDrag = () => {
      dragStateRef.current = null;
      setDraggingCrop(false);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopDrag);
    window.addEventListener("pointercancel", stopDrag);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stopDrag);
      window.removeEventListener("pointercancel", stopDrag);
    };
  }, [draggingCrop]);

  useEffect(() => {
    if (open && result !== "success") {
      setStep(1);
    }
  }, [open, result]);

  if (!open) return null;

  const requestClose = () => {
    if (submitting) return;
    eventBus.emit("closePostModalPage", { from: "ui/makePost/close" });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]" onClick={requestClose}>
      <div
        className="bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-4 w-[92vw] max-w-2xl h-[72vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {result === "success" ? (
          <div className="h-full flex flex-col items-center justify-center gap-5">
            <div className="w-14 h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
              <i className="ti ti-check text-3xl"></i>
            </div>
            <p className="text-lg font-semibold text-green-700">{message || "Submitted successfully!"}</p>
            <button
              type="button"
              className="px-5 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
              onClick={() => eventBus.emit("closePostModalPage", { from: "ui/makePost/done" })}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center">
              <h2 className="text-xl font-semibold text-gray-800 text-center">Create a post</h2>
            </div>

            {step === 1 ? (
              <>
                <p className="text-sm text-gray-600 text-center">Upload image (optional)</p>
                <div className="flex justify-center items-center gap-2">
                  <label className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg cursor-pointer hover:bg-indigo-100 transition border border-indigo-200 font-medium">
                    <i className="ti ti-photo-up text-lg"></i>
                    <span>Upload image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={submitting}
                      onChange={(e) => {
                        const file = e?.target?.files?.[0] || null;
                        eventBus.emit("postModalSelectImage", { file, from: "ui/makePost/file" });
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {hasImage ? (
                    <>
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition text-sm"
                        disabled={submitting || !crop}
                        onClick={() => eventBus.emit("postModalResetCrop", { from: "ui/makePost/crop-reset" })}
                      >
                        Reset crop
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white border border-indigo-700 hover:bg-indigo-700 transition text-sm disabled:opacity-50"
                        disabled={submitting || !crop}
                        onClick={() => eventBus.emit(cropDone ? "postModalReopenCrop" : "postModalConfirmCrop", { from: "ui/makePost/crop-toggle" })}
                      >
                        {cropDone ? "Edit crop" : "Complete crop"}
                      </button>
                    </>
                  ) : null}
                </div>

                <div className="mt-1 flex justify-center min-h-[3rem] flex-1 overflow-auto">
                  {previewUrl ? (
                    <div className="flex flex-col items-center gap-2">
                      <div ref={cropFrameRef} className="relative inline-block select-none touch-none">
                        <img src={previewUrl} alt="Preview" className="max-h-72 w-auto max-w-full rounded-xl border border-gray-300 shadow-sm block" draggable={false} />
                        {crop ? (
                          <div
                            className={`absolute border-2 border-white rounded-md ${cropDone ? "cursor-default" : draggingCrop ? "cursor-grabbing" : "cursor-grab"}`}
                            style={{
                              left: `${crop.x * 100}%`,
                              top: `${crop.y * 100}%`,
                              width: `${crop.w * 100}%`,
                              height: `${crop.h * 100}%`,
                              boxShadow: "0 0 0 9999px rgba(15,23,42,0.38)",
                            }}
                            onPointerDown={cropDone ? undefined : onCropPointerDown}
                          >
                            {!cropDone ? (
                              <>
                                <button
                                  type="button"
                                  aria-label="Resize crop width"
                                  className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-sm bg-indigo-500 border-2 border-white shadow cursor-ew-resize"
                                  onPointerDown={(e) => onCropResizePointerDown(e, "resize-x")}
                                />
                                <button
                                  type="button"
                                  aria-label="Resize crop height"
                                  className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-4 h-4 rounded-sm bg-indigo-500 border-2 border-white shadow cursor-ns-resize"
                                  onPointerDown={(e) => onCropResizePointerDown(e, "resize-y")}
                                />
                              </>
                            ) : null}
                            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] px-2 py-0.5 rounded bg-black/70 text-white whitespace-nowrap">
                              {cropDone ? "Crop locked" : "Drag frame or side handles"}
                            </div>
                          </div>
                        ) : null}
                        <button
                          type="button"
                          className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full text-base flex items-center justify-center hover:bg-red-600 shadow"
                          disabled={submitting}
                          onClick={() => eventBus.emit("postModalClearImage", { from: "ui/makePost/remove-image" })}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 text-center">No image selected. You can skip this step.</div>
                  )}
                </div>

                {hasImage && !cropDone ? <p className="text-xs text-amber-700 text-center">Please click "Complete crop" before next step.</p> : null}
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 text-center">Write article</p>
                <textarea
                  placeholder="What's on your mind?"
                  value={text}
                  disabled={submitting}
                  onChange={(e) => eventBus.emit("postModalInputText", { text: e.target.value, from: "ui/makePost/textarea" })}
                  className="flex-1 min-h-0 w-full border border-gray-300 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-800 placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-500"
                />
                {hasImage ? (
                  <div className="flex items-center justify-between text-xs text-gray-600 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
                    <span>Image attached {cropDone ? "(crop done)" : "(crop pending)"}</span>
                    <button
                      type="button"
                      className="text-indigo-600 hover:text-indigo-700 underline"
                      onClick={() => setStep(1)}
                    >
                      Back to image
                    </button>
                  </div>
                ) : null}
              </>
            )}

            {result === "fail" && message ? <p className="text-sm text-red-600 text-center">{message}</p> : null}

            <div className="flex justify-between items-center pt-3 border-t border-gray-200 mt-1">
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition disabled:opacity-60"
                disabled={submitting}
                onClick={() => eventBus.emit("closePostModalPage", { from: "ui/makePost/cancel" })}
              >
                Cancel
              </button>
              {step === 1 ? (
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!canGoStep2}
                  onClick={() => setStep(2)}
                >
                  Next
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                    disabled={submitting}
                    onClick={() => setStep(1)}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                    disabled={!canSubmit}
                    onClick={() => eventBus.emit("submitPostModalPage", { from: "ui/makePost/submit" })}
                  >
                    {submitting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : null}
                    <span>{submitting ? "Submitting..." : "Post"}</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function UnblockUserModal({ unblockUser, onClose }) {
  const open = !!unblockUser?.open;
  if (!open) return null;

  const targetName = unblockUser?.target_name || "Unknown";
  const submitting = !!unblockUser?.submitting;
  const result = unblockUser?.result || "";

  const requestClose = () => {
    eventBus.emit("closeUnblockUserModal", { from: "unblockUserModal/close" });
    if (typeof onClose === "function") onClose();
  };

  return (
    <div
      id="unBlockUser-modal-overlay"
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[90]"
      onClick={() => {
        if (!submitting) {
          requestClose();
        }
      }}
    >
      <div
        className="bg-white w-[90%] max-w-md rounded-2xl shadow-lg p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-green-600">Unblock User</h2>

        {submitting ? (
          <div className="flex flex-col items-center justify-center p-4">
            <span className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <p className="text-sm text-gray-700">Are you sure you want to unblock {targetName}?</p>
        )}

        {!submitting && result === "success" ? <p className="text-green-600 text-sm inline-flex items-center gap-1"><i className="ti ti-circle-check"></i><span>Unblocked successfully</span></p> : null}
        {!submitting && result === "fail" ? <p className="text-red-600 text-sm inline-flex items-center gap-1"><i className="ti ti-circle-x"></i><span>Unblock failed</span></p> : null}

        {result === "success" || result === "fail" ? (
          <div className="flex justify-end">
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
              onClick={requestClose}
            >
              OK
            </button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition"
              disabled={submitting}
              onClick={requestClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-60"
              disabled={submitting}
              onClick={() => eventBus.emit("submitUnblockUserModal", { from: "unblockUserModal/submit" })}
            >
              Confirm Unblock
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function BlockUserModal({ blockUser }) {
  const open = !!blockUser?.open;
  if (!open) return null;

  const targetName = blockUser?.target_name || "Unknown";
  const submitting = !!blockUser?.submitting;
  const result = blockUser?.result || "";

  const requestClose = () => {
    if (submitting) return;
    eventBus.emit("closeBlockUserModal", { from: "blockUserModal/close" });
  };

  return (
    <div
      id="blockUser-modal-overlay"
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[90]"
      onClick={requestClose}
    >
      <div
        className="bg-white w-[90%] max-w-md rounded-2xl shadow-lg p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-red-600">Block User</h2>

        {submitting ? (
          <div className="flex flex-col items-center justify-center p-4">
            <span className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <p className="text-sm text-gray-700">Are you sure you want to block {targetName}?</p>
        )}

        {!submitting && result === "success" ? <p className="text-green-600 text-sm inline-flex items-center gap-1"><i className="ti ti-circle-check"></i><span>Blocked successfully</span></p> : null}
        {!submitting && result === "fail" ? <p className="text-red-600 text-sm inline-flex items-center gap-1"><i className="ti ti-circle-x"></i><span>Block failed</span></p> : null}

        {result === "success" || result === "fail" ? (
          <div className="flex justify-end">
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
              onClick={requestClose}
            >
              OK
            </button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition"
              disabled={submitting}
              onClick={requestClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-60"
              disabled={submitting}
              onClick={() => eventBus.emit("submitBlockUserModal", { from: "blockUserModal/submit" })}
            >
              Confirm Block
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ReportPostModal({ reportPost }) {
  const open = !!reportPost?.open;
  if (!open) return null;

  const submitting = !!reportPost?.submitting;
  const result = reportPost?.result || "";
  const reason = reportPost?.reason || "";

  const requestClose = () => {
    if (submitting) return;
    eventBus.emit("closeReportPostModal", { from: "reportPostModal/close" });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[90]" onClick={requestClose}>
      <div
        className="bg-white w-[92%] max-w-lg rounded-2xl shadow-lg p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-amber-600">Report Post</h2>
        <p className="text-sm text-gray-700">Please provide a reason for reporting this post:</p>

        {submitting ? (
          <div className="flex flex-col items-center justify-center p-6">
            <span className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : result === "success" ? null : (
          <textarea
            value={reason}
            onChange={(e) => eventBus.emit("reportPostModalInputReason", { reason: e.target.value, from: "ui/reportPost/reason" })}
            placeholder="Describe the issue..."
            className="w-full min-h-28 rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        )}

        {!submitting && result === "success" ? <p className="text-green-600 text-sm inline-flex items-center gap-1"><i className="ti ti-circle-check"></i><span>Reported successfully</span></p> : null}
        {!submitting && result === "fail" ? <p className="text-red-600 text-sm inline-flex items-center gap-1"><i className="ti ti-circle-x"></i><span>Report failed</span></p> : null}

        {result === "success" || result === "fail" ? (
          <div className="flex justify-end">
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
              onClick={requestClose}
            >
              OK
            </button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition"
              disabled={submitting}
              onClick={requestClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition disabled:opacity-60"
              disabled={submitting || !reason.trim()}
              onClick={() => eventBus.emit("submitReportPostModal", { from: "ui/reportPost/submit" })}
            >
              Submit Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function DeletePostModal({ deletePost }) {
  const open = !!deletePost?.open;
  if (!open) return null;

  const submitting = !!deletePost?.submitting;
  const result = deletePost?.result || "";
  const postId = deletePost?.postId || "";

  const requestClose = () => {
    if (submitting) return;
    eventBus.emit("closeDeletePostModal", { from: "deletePostModal/close", post_id: postId });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[90]" onClick={requestClose}>
      <div
        className="bg-white w-[92%] max-w-md rounded-2xl shadow-lg p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-red-600">Delete Post</h2>
        {submitting ? (
          <div className="flex flex-col items-center justify-center p-6">
            <span className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <p className="text-sm text-gray-700">Are you sure you want to delete this post?</p>
        )}

        {!submitting && result === "success" ? <p className="text-green-600 text-sm inline-flex items-center gap-1"><i className="ti ti-circle-check"></i><span>Post deleted</span></p> : null}
        {!submitting && result === "fail" ? <p className="text-red-600 text-sm inline-flex items-center gap-1"><i className="ti ti-circle-x"></i><span>Delete failed</span></p> : null}

        {result === "success" || result === "fail" ? (
          <div className="flex justify-end">
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
              onClick={requestClose}
            >
              OK
            </button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition"
              disabled={submitting}
              onClick={requestClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-60"
              disabled={submitting}
              onClick={() => eventBus.emit("confirmDeletePost", { from: "ui/deletePost/submit", post_id: postId })}
            >
              Confirm Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ReportUserModal({ reportUser }) {
  const open = !!reportUser?.open;
  if (!open) return null;

  const targetName = reportUser?.target_name || "Unknown";
  const submitting = !!reportUser?.submitting;
  const result = reportUser?.result || "";
  const reason = reportUser?.reason || "";

  const requestClose = () => {
    if (submitting) return;
    eventBus.emit("closeReportUserModal", { from: "reportUserModal/close" });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[90]" onClick={requestClose}>
      <div
        className="bg-white w-[92%] max-w-lg rounded-2xl shadow-lg p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-amber-600">Report User</h2>
        <p className="text-sm text-gray-700">Report {targetName}. Please provide a reason:</p>

        {submitting ? (
          <div className="flex flex-col items-center justify-center p-6">
            <span className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : result === "success" ? null : (
          <textarea
            value={reason}
            onChange={(e) => eventBus.emit("reportUserModalInputReason", { reason: e.target.value, from: "ui/reportUser/reason" })}
            placeholder="Describe the issue..."
            className="w-full min-h-28 rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        )}

        {!submitting && result === "success" ? <p className="text-green-600 text-sm inline-flex items-center gap-1"><i className="ti ti-circle-check"></i><span>Reported successfully</span></p> : null}
        {!submitting && result === "fail" ? <p className="text-red-600 text-sm inline-flex items-center gap-1"><i className="ti ti-circle-x"></i><span>Report failed</span></p> : null}

        {result === "success" || result === "fail" ? (
          <div className="flex justify-end">
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
              onClick={requestClose}
            >
              OK
            </button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition"
              disabled={submitting}
              onClick={requestClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition disabled:opacity-60"
              disabled={submitting || !reason.trim()}
              onClick={() => eventBus.emit("submitReportUserModal", { from: "ui/reportUser/submit" })}
            >
              Submit Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginModalLayer({ onCloseUnblockUser }) {
  const s = useSubscribedState("ModalsPage", {});

  return (
    <>
      <MakePostModal makePost={s?.makePost} />
      <DeletePostModal deletePost={s?.deletePost} />
      <ReportPostModal reportPost={s?.reportPost} />
      <ReportUserModal reportUser={s?.reportUser} />
      <BlockUserModal blockUser={s?.blockUser} />
      <UnblockUserModal unblockUser={s?.unblockUser} onClose={onCloseUnblockUser} />
    </>
  );
}
