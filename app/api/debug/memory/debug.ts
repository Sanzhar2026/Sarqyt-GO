// app/api/debug/memory/route.ts (для App Router)
// или pages/api/debug/memory.js (для Pages Router)

import { NextResponse } from 'next/server';
import os from 'os';

export async function GET() {
  const memoryUsage = process.memoryUsage();
  
  return NextResponse.json({
    // Память процесса Node.js
    nodejs: {
      rss_mb: Math.round(memoryUsage.rss / 1024 / 1024),
      heap_total_mb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heap_used_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external_mb: Math.round(memoryUsage.external / 1024 / 1024),
    },
    // Системная память
    system: {
      total_mb: Math.round(os.totalmem() / 1024 / 1024),
      free_mb: Math.round(os.freemem() / 1024 / 1024),
      used_mb: Math.round((os.totalmem() - os.freemem()) / 1024 / 1024),
      percent_used: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100),
    },
    // Лимит Render (обычно 512 MB)
    render_limit_mb: 512
  });
}