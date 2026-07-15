import { NextResponse } from 'next/server';

export async function GET() {
  // Get all environment variables that start with NEXT_PUBLIC_
  const publicEnv = Object.keys(process.env)
    .filter(key => key.startsWith('NEXT_PUBLIC_'))
    .reduce((obj, key) => {
      obj[key] = process.env[key] || 'NOT SET';
      return obj;
    }, {} as Record<string, string>);

  // Also get Vercel-specific variables
  const vercelEnv = {
    VERCEL: process.env.VERCEL || 'NOT SET',
    VERCEL_ENV: process.env.VERCEL_ENV || 'NOT SET',
    VERCEL_URL: process.env.VERCEL_URL || 'NOT SET',
    VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA || 'NOT SET',
    VERCEL_GIT_REPO_OWNER: process.env.VERCEL_GIT_REPO_OWNER || 'NOT SET',
    VERCEL_GIT_REPO_SLUG: process.env.VERCEL_GIT_REPO_SLUG || 'NOT SET',
  };

  return NextResponse.json({
    publicEnv,
    vercelEnv,
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    hasApiUrl: !!process.env.NEXT_PUBLIC_API_URL,
    apiUrlValue: process.env.NEXT_PUBLIC_API_URL ? 'SET (encrypted)' : 'NOT SET',
  });
}
