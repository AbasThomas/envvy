export default function OfflinePage() {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-[#D4A574]/20 bg-[#02120e]/80 p-6 text-center shadow-[0_24px_48px_-36px_rgba(0,0,0,0.7)]">
      <p className="text-4xl">Offline</p>
      <h1 className="mt-2 text-2xl font-semibold text-[#f5f5f0]">Connection lost</h1>
      <p className="mt-2 text-sm text-[#a8b3af]">
        envii will sync pending changes automatically once your connection is restored.
      </p>
    </div>
  );
}
