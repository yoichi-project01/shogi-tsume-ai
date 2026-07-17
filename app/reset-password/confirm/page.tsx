"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordConfirmPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-neutral-900">パスワードを再設定しました</h1>
        <p className="mt-3 text-sm text-neutral-600">新しいパスワードでログインできます。</p>
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="mt-4 inline-block rounded bg-amber-600 px-5 py-2 font-bold text-white hover:bg-amber-700"
        >
          ログインページへ
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-xl font-bold text-neutral-900">新しいパスワードを設定</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-bold text-neutral-700" htmlFor="password">
            新しいパスワード
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-amber-600 px-4 py-2 font-bold text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {loading ? "更新中..." : "パスワードを更新する"}
        </button>
      </form>
    </div>
  );
}
