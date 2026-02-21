import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Signup from './pages/signup';
import Dashboard from './pages/Dashboard';

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
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

