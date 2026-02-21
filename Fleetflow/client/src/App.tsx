import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Signup from './pages/signup';
import Dashboard from './pages/Dashboard';
import VehicleRegistry from './pages/VehicleRegistry';
import TripDispatcher from './pages/TripDispatcher';
import MaintenanceLogs from './pages/MaintenanceLogs';
import ExpenseLogging from './pages/ExpenseLogging';
import DriverProfiles from './pages/DriverProfiles';
import Analytics from './pages/Analytics';
import Layout from './components/Layout';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return user ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"  element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index           element={<Dashboard />} />
          <Route path="vehicles"   element={<VehicleRegistry />} />
          <Route path="trips"      element={<TripDispatcher />} />
          <Route path="maintenance" element={<MaintenanceLogs />} />
          <Route path="expenses"   element={<ExpenseLogging />} />
          <Route path="drivers"    element={<DriverProfiles />} />
          <Route path="analytics"  element={<Analytics />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;