import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 max-w-md mx-auto text-center">
      <div className="text-5xl mb-4">🌫️</div>
      <h1 className="text-2xl font-bold mb-2">Page not found</h1>
      <p className="text-gray-500 text-sm mb-6">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link
        href="/"
        className="py-3 px-6 bg-black text-white font-semibold rounded-xl text-sm"
      >
        Back to Weather Oracle
      </Link>
    </main>
  );
}
