"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-xl font-bold text-neutral-900">エラーが発生しました</h1>
      <p className="mt-3 text-sm text-neutral-600">
        予期しない問題が発生しました。もう一度お試しいただくか、しばらくしてからアクセスしてください。
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded bg-amber-600 px-5 py-2 font-bold text-white hover:bg-amber-700"
      >
        再試行する
      </button>
    </div>
  );
}
