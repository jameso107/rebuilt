import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import SignIn from './pages/SignIn';
import MatchSetup from './pages/MatchSetup';
import AllianceScout from './pages/AllianceScout';
import RobotScout from './pages/RobotScout';
import Admin from './pages/Admin';
import './App.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = JSON.parse(localStorage.getItem('rebuilt_user') || 'null');
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SignIn />} />
          <Route
            path="/match-setup"
            element={
              <ProtectedRoute>
                <MatchSetup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scout-alliance"
            element={
              <ProtectedRoute>
                <AllianceScout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scout-robot"
            element={
              <ProtectedRoute>
                <RobotScout />
              </ProtectedRoute>
            }
          />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
