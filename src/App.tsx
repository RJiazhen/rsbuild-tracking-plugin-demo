import { Routes, Route, Link } from 'react-router-dom';
import OriginalPage from './OriginalPage';
import TrackedPage from './TrackedPage';
import './App.css';

const Home = () => (
  <div className="content">
    <h1>Rsbuild with React</h1>
    <p>Start building amazing things with Rsbuild.</p>
    <div style={{ display: 'flex', gap: '10px' }}>
      <Link to="/original">Go to Original Page</Link>
      <Link to="/tracked">Go to Tracked Page</Link>
    </div>
  </div>
);

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/original" element={<OriginalPage />} />
      <Route path="/tracked" element={<TrackedPage />} />
    </Routes>
  );
};

export default App;
