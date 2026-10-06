import { cookies } from 'next/headers';
import { verifyToken, JWTPayload } from './jwt';

const COOKIE_NAME = 'auth-token';

/**
 * Get current user session from cookie
 */
export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

/**
 * Require authenticated session (throws if not authenticated)
 */
export async function requireAuth(): Promise<JWTPayload> {
  const session = await getSession();
  
  if (!session) {
    throw new Error('Unauthorized');
  }

  return session;
}

/**
 * Require specific role (throws if not authorized)
 */
export async function requireRole(roles: string | string[]): Promise<JWTPayload> {
  const session = await requireAuth();
  
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  if (!allowedRoles.includes(session.role)) {
    throw new Error('Forbidden');
  }

  return session;
}

/**
 * Set auth cookie
 */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

/**
 * Clear auth cookie
 */
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
