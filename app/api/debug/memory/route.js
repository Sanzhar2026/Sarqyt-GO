// app/api/debug/memory/route.js
import { NextResponse } from 'next/server';

export async function GET() {
  const memory = process.memoryUsage();
  
  return NextResponse.json({
    "nodejs_process": {
      "rss_mb": Math.round(memory.rss / 1024 / 1024),      // Только Node.js
      "heap_used_mb": Math.round(memory.heapUsed / 1024 / 1024),
      "heap_total_mb": Math.round(memory.heapTotal / 1024 / 1024)
    },
    "container": {
      "total_mb": 512
    },
    "explanation": "Node.js process takes approximately 80-150 MB, the rest is the base Linux image"
  });
}