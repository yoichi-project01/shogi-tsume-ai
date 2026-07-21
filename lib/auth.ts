// Supabase Auth requires an email internally, but this app only exposes a
// username + password to users. We map each username to a deterministic,
// unreachable placeholder address so Supabase's email/password auth can be
// reused without ever sending real mail.
const USERNAME_EMAIL_DOMAIN = "users.shogi-tsume-ai.invalid";

export const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{3,20}$/;

export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${USERNAME_EMAIL_DOMAIN}`;
}
