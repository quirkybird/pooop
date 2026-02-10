import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthGuard } from './components/AuthGuard';
import { Home } from './pages/Home';
import { Record } from './pages/Record';
import { Bind } from './pages/Bind';
import { History } from './pages/History';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* 公开路由 */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* 受保护路由 */}
        <Route
          path="/"
          element={
            <AuthGuard>
              <Home />
            </AuthGuard>
          }
        />
        <Route
          path="/record"
          element={
            <AuthGuard>
              <Record />
            </AuthGuard>
          }
        />
        <Route
          path="/bind"
          element={
            <AuthGuard>
              <Bind />
            </AuthGuard>
          }
        />
        <Route
          path="/history"
          element={
            <AuthGuard>
              <History />
            </AuthGuard>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
