"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password/confirm`,
    });

    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-xl font-bold text-neutral-900">パスワードリセット</h1>

      {sent ? (
        <p className="mt-4 text-sm text-neutral-600">
          {email} 宛にパスワード再設定用のメールを送信しました。
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-neutral-700" htmlFor="email">
              登録済みのメールアドレス
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-amber-600 px-4 py-2 font-bold text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {loading ? "送信中..." : "再設定メールを送信"}
          </button>
        </form>
      )}
    </div>
  );
}
