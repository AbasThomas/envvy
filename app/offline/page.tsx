export default function OfflinePage() {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-center">
      <p className="text-4xl">📡</p>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-100">You are offline</h1>
      <p className="mt-2 text-sm text-zinc-400">
        envii will sync pending changes automatically once your connection is restored.
      </p>
    </div>
  );
}
