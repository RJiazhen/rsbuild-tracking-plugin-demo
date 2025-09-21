import { Link, Route, Routes } from 'react-router-dom';
import './App.css';
import AutoTrackedPage from './AutoTrackedPage';
import OriginalPage from './OriginalPage';
import TrackedPage from './TrackedPage';

const Home = () => (
  <div className="content">
    <h1>Rsbuild with React</h1>
    <p>Start building amazing things with Rsbuild.</p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <Link to="/original">Go to Original Page</Link>
      <Link to="/tracked">Go to Tracked Page</Link>
      <Link to="/auto-tracked">Go to Auto Tracked Page</Link>
    </div>
  </div>
);

const App = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={<Home />}
      />
      <Route
        path="/original"
        element={<OriginalPage />}
      />
      <Route
        path="/tracked"
        element={<TrackedPage />}
      />
      <Route
        path="/auto-tracked"
        element={<AutoTrackedPage />}
      />
    </Routes>
  );
};

export default App;
