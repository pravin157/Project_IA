/**
 * Executes a complete logout sequence:
 * 1. Clears authentication cookies.
 * 2. Clears browser localStorage & sessionStorage.
 * 3. Notifies the backend logout API endpoint.
 * 4. Force redirects the browser window to /login, wiping client page cache.
 */
export async function performCompleteLogout() {
  try {
    // 1. Invalidate client-side session cookie
    document.cookie = 'auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0;';

    // 2. Clear browser storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.clear();
      sessionStorage.clear();
    }

    // 3. Trigger server logout endpoint
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => { });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // 4. Force browser navigation to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
}
