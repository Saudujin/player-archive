/**
 * Simple in-memory session store for admin authentication
 * This avoids the need for JWT_SECRET environment variable
 */

interface AdminSession {
  adminId: number;
  username: string;
  createdAt: Date;
}

// In-memory session storage
const sessions = new Map<string, AdminSession>();

// Generate random session ID
function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Create a new admin session
export function createAdminSession(adminId: number, username: string): string {
  const sessionId = generateSessionId();
  sessions.set(sessionId, {
    adminId,
    username,
    createdAt: new Date(),
  });
  return sessionId;
}

// Get admin session by ID
export function getAdminSession(sessionId: string): AdminSession | null {
  return sessions.get(sessionId) || null;
}

// Delete admin session
export function deleteAdminSession(sessionId: string): void {
  sessions.delete(sessionId);
}

// Clean up old sessions (older than 30 days)
setInterval(() => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  for (const [sessionId, session] of sessions.entries()) {
    if (session.createdAt < thirtyDaysAgo) {
      sessions.delete(sessionId);
    }
  }
}, 24 * 60 * 60 * 1000); // Run daily
