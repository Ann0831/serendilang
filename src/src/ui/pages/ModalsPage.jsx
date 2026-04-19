import React from "react";
import { eventBus } from "../../utils/eventBus.js";
import { useSubscribedState, Panel, Chip, Empty } from "../StateViewBase.jsx";

function ModalRow({ name, state, openAction, submitAction, closeAction, params = {} }) {
  const open = !!state?.open;
  const submitting = !!state?.submitting;
  const result = state?.result || "-";

  return (
    <div className="rounded border border-gray-100 px-2 py-1 text-xs">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-gray-800">{name}</span>
        <div className="flex gap-1">
          <Chip text={open ? "open" : "closed"} tone={open ? "green" : "gray"} />
          <Chip text={submitting ? "submitting" : "idle"} tone={submitting ? "blue" : "gray"} />
          <Chip text={result} tone={result === "success" ? "green" : result === "fail" ? "red" : "gray"} />
        </div>
      </div>
      <div className="flex gap-1">
        {openAction ? <button className="rounded border px-2 py-0.5" onClick={() => eventBus.emit(openAction, params)}>open</button> : null}
        {submitAction ? <button className="rounded border px-2 py-0.5" onClick={() => eventBus.emit(submitAction, params)}>submit</button> : null}
        {closeAction ? <button className="rounded border px-2 py-0.5" onClick={() => eventBus.emit(closeAction, params)}>close</button> : null}
      </div>
    </div>
  );
}

export default function ModalsPage() {
  const s = useSubscribedState("ModalsPage", {});
  const blocked = s?.blockedUsersList?.list || [];

  return (
    <Panel title="Modals" right={<Chip text={s?.blockedUsersList?.loading ? "blocked-list loading" : "blocked-list idle"} tone={s?.blockedUsersList?.loading ? "blue" : "gray"} />}>
      <div className="space-y-1">
        <ModalRow name="makePost" state={s.makePost} openAction="openMakePostModal" submitAction="submitPostModalPage" closeAction="closePostModalPage" />
        <ModalRow name="deletePost" state={s.deletePost} openAction="openDeletePostModal" submitAction="confirmDeletePost" closeAction="closeDeletePostModal" params={{ post_id: s?.deletePost?.postId }} />
        <ModalRow name="reportPost" state={s.reportPost} openAction="openReportPostModal" submitAction="submitReportPostModal" closeAction="closeReportPostModal" params={{ post_id: s?.reportPost?.postId }} />
        <ModalRow name="reportUser" state={s.reportUser} openAction="openReportUserModal" submitAction="submitReportUserModal" closeAction="closeReportUserModal" params={{ target_id: s?.reportUser?.target_id, target_name: s?.reportUser?.target_name }} />
        <ModalRow name="blockUser" state={s.blockUser} openAction="openBlockUserModal" submitAction="submitBlockUserModal" closeAction="closeBlockUserModal" params={{ target_id: s?.blockUser?.target_id, target_name: s?.blockUser?.target_name }} />
        <ModalRow name="unblockUser" state={s.unblockUser} openAction="openUnblockUserModal" submitAction="submitUnblockUserModal" closeAction="closeUnblockUserModal" params={{ target_id: s?.unblockUser?.target_id, target_name: s?.unblockUser?.target_name }} />
        <ModalRow name="deleteUserAccount" state={s.deleteUserAccount} openAction="openDeleteUserAccountModal" submitAction="submitDeleteUserAccountModal" closeAction="closeDeleteUserAccountModal" />
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between">
          <h4 className="text-xs font-semibold text-gray-700">Blocked Users List</h4>
          <div className="flex gap-1">
            <button className="rounded border px-2 py-0.5 text-xs" onClick={() => eventBus.emit("openBlockedUsersListModal", { filter: "all" })}>open</button>
            <button className="rounded border px-2 py-0.5 text-xs" onClick={() => eventBus.emit("reloadBlockedUsersListModal", {})}>reload</button>
            <button className="rounded border px-2 py-0.5 text-xs" onClick={() => eventBus.emit("closeBlockedUsersListModal", {})}>close</button>
          </div>
        </div>
        {blocked.length === 0 ? <Empty text="No blocked users in state" /> : null}
        <div className="space-y-1">
          {blocked.map((u) => (
            <div key={u.friend_id} className="flex items-center justify-between rounded border border-gray-100 px-2 py-1 text-xs">
              <span className="text-gray-800">{u.friend_name || u.friend_id}</span>
              <div className="flex gap-1">
                <Chip text={u.isBlocked ? "blocked" : "-"} tone={u.isBlocked ? "red" : "gray"} />
                <button className="rounded border px-2 py-0.5" onClick={() => eventBus.emit("openUnblockUserModal", { target_id: u.friend_id, target_name: u.friend_name, from: "ui/modals" })}>unblock</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}
