// Browser-only logout action.
export async function performCompleteLogout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => { });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.clear();
      sessionStorage.clear();
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
}
