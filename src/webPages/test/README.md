# backend_context html samples

These sample `.html` files mirror the backend generators under:
- `/backend_context/utils/html`

Mock-style parameters used:
- `currentUserId`: `u1` (tester_one style)
- `targetUserId`: `u2`
- `bannedUserId`: `u9`
- `callExternalId`: `call123abc`
- `turnAuth.username`: `mockTurnUser`
- `turnAuth.credential`: `mockTurnCred`

## Local test entry

- `./index.html` contains links for all `webPages/*.html` counterparts.
- New mirrored files are named exactly the same as their source page:
  - `about.html`, `contact.html`, `loginPage.html`, `login_rootpage.html`, `registerPage.html`, `rootpage.html`, `userprofile.html`, etc.

### Notes

- `userprofile.html` in this folder includes a default context (`userId: u17`) so it can be opened directly.
- `call.html` in this folder auto-fills default query params when missing:
  - `target_id=u2`
  - `use_camera=1`
  - `is_caller=1`
