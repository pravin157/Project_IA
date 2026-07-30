/**
 * Executes a complete logout sequence:
 * 1. Notifies the backend logout API endpoint (clears httpOnly cookies + revokes refresh tokens).
 * 2. Clears browser localStorage & sessionStorage.
 * 3. Force redirects the browser window to /login, wiping client page cache.
 */
export async function performCompleteLogout() {
  try {
    // 1. Trigger server logout endpoint (clears httpOnly cookies server-side)
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => { });

    // 2. Clear browser storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.clear();
      sessionStorage.clear();
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // 3. Force browser navigation to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
}
