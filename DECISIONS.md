# Decisions

## Assumptions

- This is an internal tool for a small team, so staff accounts are seeded instead of having a sign-up page.
- A "way to contact" the customer means an email or a phone number. At least one is required, both are allowed.
- Whoever records an inquiry owns it. The schema has an `assigned_to` column, but for now it is just set to the creator. There is no screen for reassigning yet.
- Anyone who can see an inquiry can change its status.

## Design choices

**1. Access rule: staff see their own inquiries, admins see everything.**
A staff member can only see inquiries they created or are assigned to. The rule lives in one SQL helper inside the service layer, so the list, the detail view and the status update all go through the same check. If someone opens a link to an inquiry they're not allowed to see, the API returns 404, not 403. That way it doesn't confirm the record exists. Hiding things in the UI was never the security layer. I checked this by calling the API directly with REST Client.

**2. Status rules: no skipping, but reopening is allowed.**
Allowed moves: New → In Progress, In Progress → Resolved, In Progress → New, Resolved → In Progress (reopen). Going straight from New to Resolved is rejected with a 422 and the list of allowed moves. I didn't want something marked resolved without anyone actually working on it, but I also didn't want resolved to be a dead end, because customers come back. The UI only shows buttons for the moves that are allowed, and the API still enforces the rule on its own.

**3. Stale data: optimistic locking with a `version` column.**
Every status update sends the version the user last saw. The update only goes through `WHERE id = $1 AND version = $2`. If another tab changed the inquiry first, the API returns 409. The detail page then reloads the latest data and tells the user someone else updated it, so nothing gets silently overwritten.

**4. Validation in two places, and errors in one shape.**
The form checks fields before sending, so users get quick feedback. The API validates everything again with Zod, and the database has CHECK constraints as a last line of defense. Every error comes back as `{ error: { code, message, details } }`. Because of that, the frontend can show a server-side validation error next to the right field, not just as a generic message.

**5. Duplicates: a simple time window.**
If the same user submits the same subject and contact details within 5 minutes, the API returns 409 and the UI links to the existing inquiry. The submit button also disables while saving. The brief asked not to build a dedupe engine, and this catches the realistic case of a double click or a resubmitted form.

## Trade-off I accepted

There are no real-time updates. The detail page doesn't refresh on its own. Stale data is caught when the user tries to save (the 409 above), not the moment it changes. The list does refresh when you come back to the tab. WebSockets felt like too much for this scope, and this way the data is never wrong, even if it can be briefly out of date on screen. For the same reason, the list has no pagination, just a `LIMIT 200`.

## What I'd improve next

- Pagination and sorting on the list
- A separate test database (the API tests currently run against the seeded dev database and clean up after themselves)
- Assigning inquiries to other staff, and a short history/notes log on each inquiry
- Rate limiting on the login endpoint

## Testing

- **Backend (Jest + Supertest):** status transition rules (unit), a missing session returns 401, bad input returns 400 even when the UI is bypassed, staff can't open another person's inquiry by direct link while an admin can, and a stale update returns 409.
- **Frontend (Vitest + Testing Library):** the new inquiry form shows field errors and doesn't call the API, shows API validation errors on the right field, and keeps what the user typed when saving fails.
- **Gaps:** no frontend test for the 409 flow on the detail page or for login (both checked manually), and no end-to-end browser tests.

## Use of AI

I used Claude throughout the project as a step-by-step guide. It suggested the overall structure, explained each piece, and drafted much of the code, this README, and this document. I built and ran everything myself one step at a time, tested each part before moving on, and asked about anything I didn't understand.

- **Accepted:** optimistic locking with a `version` column for the two-tabs problem. I hadn't used it before. It made sense once I tested it by sending the same old version twice and getting a 409 the second time.
- **Changed:** the first version of the API client showed "Something went wrong" when the backend was down. I found this by stopping the server during testing. The message didn't tell the user anything useful, so it was changed to detect that case and say the server isn't responding.
- **Questioned:** at first `.env` and `.env.example` had the same values. When I asked why both were needed, I replaced the JWT secret in my local `.env` with a randomly generated one and kept a placeholder in the example file.