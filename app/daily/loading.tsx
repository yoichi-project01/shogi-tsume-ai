export default function DailyLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4 h-7 w-64 animate-pulse rounded bg-neutral-200" />
      <p className="text-sm text-neutral-500">
        本日の問題を準備しています…初回アクセス時は生成に数秒かかることがあります。
      </p>
      <div className="mt-6 flex flex-col items-center gap-3">
        <div className="h-10 w-full max-w-xs animate-pulse rounded bg-neutral-200" />
        <div className="aspect-square w-full max-w-md animate-pulse rounded bg-neutral-200" />
        <div className="h-10 w-full max-w-xs animate-pulse rounded bg-neutral-200" />
      </div>
    </div>
  );
}
