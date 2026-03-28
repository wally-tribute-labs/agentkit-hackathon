'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 max-w-md mx-auto text-center">
      <div className="text-5xl mb-4">⛈️</div>
      <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
      <p className="text-gray-500 text-sm mb-6">
        {error.message ?? 'An unexpected error occurred.'}
      </p>
      <button
        onClick={reset}
        className="py-3 px-6 bg-black text-white font-semibold rounded-xl text-sm"
      >
        Try again
      </button>
    </main>
  );
}
