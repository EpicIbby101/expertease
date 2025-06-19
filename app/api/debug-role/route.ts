import { getUserRole } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const role = await getUserRole();
  return NextResponse.json({ 
    role,
    timestamp: new Date().toISOString()
  });
} 