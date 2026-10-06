import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth/session';

export async function POST() {
  try {
    await clearAuthCookie();

    return NextResponse.json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
