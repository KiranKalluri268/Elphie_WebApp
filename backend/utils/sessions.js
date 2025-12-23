// In-memory session store (for development - use Redis in production)
export const sessions = new Map();

// Clean up expired sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (session.expiresAt <= now) {
      sessions.delete(token);
    }
  }
}, 60 * 60 * 1000); // Clean up every hour

