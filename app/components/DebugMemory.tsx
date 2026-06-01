// components/DebugMemory.tsx
'use client';

import { useEffect, useState } from 'react';

export default function DebugMemory() {
  const [memory, setMemory] = useState(null);

  useEffect(() => {
    // Только для разработки/отладки
    if (process.env.NODE_ENV === 'production') return;

    const checkMemory = async () => {
      const res = await fetch('/api/debug/memory');
      const data = await res.json();
      setMemory(data);
      console.log('📊 Frontend Memory:', data);
    };

    checkMemory();
    const interval = setInterval(checkMemory, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!memory) return null;

  return (
    <div className="fixed bottom-4 left-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono z-50">
      <div>📦 Node.js RSS: {memory.nodejs?.rss_mb} MB</div>
      <div>💾 Heap Used: {memory.nodejs?.heap_used_mb} MB</div>
      <div>🖥️ System Used: {memory.system?.used_mb} MB / {memory.system?.total_mb} MB</div>
      <div className={memory.system?.used_mb > 400 ? 'text-red-400' : 'text-green-400'}>
        📊 Usage: {memory.system?.percent_used}%
      </div>
    </div>
  );
}