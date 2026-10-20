import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import type { Session } from 'next-auth'

export async function requireAdmin() {
  const session = await auth()

  if (session?.user?.role !== 'admin' && session?.user?.role !== 'superAdmin') {
    redirect('/unauthorized')
  }

  return session
}

/**
 * For use inside server actions and API routes (NOT pages). Throws a plain
 * Error instead of redirecting, so the caller's try/catch can return a
 * `{ success: false }` result. Server actions are public endpoints, so every
 * privileged action must call this before doing sensitive work.
 */
export async function requireAdminAction(): Promise<Session> {
  const session = await auth()
  const role = session?.user?.role

  if (role !== 'admin' && role !== 'superAdmin') {
    throw new Error('Not authorized')
  }

  return session as Session
}

/** Require any authenticated user inside a server action/API route. */
export async function requireAuthAction(): Promise<Session> {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Not authenticated')
  }

  return session
}
