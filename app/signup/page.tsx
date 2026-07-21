"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { USERNAME_PATTERN, usernameToEmail } from "@/lib/auth";

export default function SignupPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!USERNAME_PATTERN.test(username)) {
      setLoading(false);
      setError("ユーザー名は半角英数字・アンダースコア・ハイフンで1〜20文字にしてください。");
      return;
    }

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email: usernameToEmail(username),
      password,
      options: {
        data: { username },
      },
    });

    setLoading(false);
    if (signUpError) {
      if (/already registered|already exists/i.test(signUpError.message)) {
        setError("このユーザー名は既に使用されています。");
      } else {
        setError(signUpError.message);
      }
      return;
    }
    router.push("/mypage");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-xl font-bold text-neutral-900">新規登録</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-bold text-neutral-700" htmlFor="username">
            ユーザー名
          </label>
          <input
            id="username"
            type="text"
            required
            pattern="[a-zA-Z0-9_-]{1,20}"
            title="半角英数字・アンダースコア・ハイフンで1〜20文字"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
          />
          <p className="mt-1 text-xs text-neutral-500">半角英数字・アンダースコア・ハイフンで1〜20文字</p>
        </div>

        <div>
          <label className="block text-sm font-bold text-neutral-700" htmlFor="password">
            パスワード
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
          {loading ? "登録中..." : "登録する"}
        </button>
      </form>

      <div className="mt-4 text-sm">
        <Link href="/login" className="text-amber-700 hover:underline">
          すでにアカウントをお持ちの方はこちら
        </Link>
      </div>
    </div>
  );
}
