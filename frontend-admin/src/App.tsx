import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { TenantList } from './pages/Tenants/TenantList';
import { TenantForm } from './pages/Tenants/TenantForm';
import { BotList } from './pages/Bots/BotList';
import { BotForm } from './pages/Bots/BotForm';
import { AutomationList } from './pages/Automations/AutomationList';
import { AutomationForm } from './pages/Automations/AutomationForm';
import { MetricsDashboard } from './pages/Metrics/MetricsDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tenants"
            element={
              <ProtectedRoute>
                <TenantList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tenants/new"
            element={
              <ProtectedRoute>
                <TenantForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tenants/:id"
            element={
              <ProtectedRoute>
                <TenantForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bots"
            element={
              <ProtectedRoute>
                <BotList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bots/new"
            element={
              <ProtectedRoute>
                <BotForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bots/:id"
            element={
              <ProtectedRoute>
                <BotForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/automations"
            element={
              <ProtectedRoute>
                <AutomationList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/automations/new"
            element={
              <ProtectedRoute>
                <AutomationForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/automations/:id"
            element={
              <ProtectedRoute>
                <AutomationForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/metrics"
            element={
              <ProtectedRoute>
                <MetricsDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
