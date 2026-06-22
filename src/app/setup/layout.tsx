export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return (
    // min-h-dvh: iOSの 100vh ズレを避ける。下部はセーフエリア + 余白で、
    // 最後の操作（次へ等）がスマホのブラウザ下部バーに隠れないようにする。
    <div className="min-h-dvh bg-zinc-50 px-4 pt-10 pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-xl">{children}</div>
    </div>
  );
}
