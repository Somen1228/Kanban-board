import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import KandooLoader from './KandooLoader';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <KandooLoader fullscreen message="Loading your workspace..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
