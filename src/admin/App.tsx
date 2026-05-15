import { useEffect, useState } from 'preact/hooks';
import { isAuthenticated, restoreSession } from './state/auth.ts';
import { getAuthenticatedUser } from './github/api.ts';
import { LoginScreen } from './components/LoginScreen.tsx';
import { Dashboard } from './components/Dashboard.tsx';

export function App() {
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    restoreSession(getAuthenticatedUser).finally(() => setRestoring(false));
  }, []);

  if (restoring) return null;
  return isAuthenticated.value ? <Dashboard /> : <LoginScreen />;
}
