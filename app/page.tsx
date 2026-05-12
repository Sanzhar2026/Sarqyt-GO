// app/page.tsx
'use client';

import dynamic from 'next/dynamic';

// Dynamically import HomeClient with SSR disabled
const HomeClient = dynamic(() => import('./HomeClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin h-12 w-12 border-b-2 border-emerald-600 rounded-full"></div>
    </div>
  ),
});

export default function Page() {
  return <HomeClient />;
}