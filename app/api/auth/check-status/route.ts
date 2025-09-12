import { NextResponse } from 'next/server';
import { checkUserActive } from '@/lib/auth-check';

export async function GET() {
  try {
    const { isActive, error } = await checkUserActive();
    
    if (!isActive) {
      return NextResponse.json({ 
        isActive: false, 
        error: error || 'Account deactivated' 
      }, { status: 403 });
    }

    return NextResponse.json({ isActive: true });
  } catch (error) {
    console.error('Error checking user status:', error);
    return NextResponse.json({ 
      isActive: false, 
      error: 'Failed to check account status' 
    }, { status: 500 });
  }
}
