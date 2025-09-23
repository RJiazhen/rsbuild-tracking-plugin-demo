import {
  Suspense, lazy,
} from "react";
import {
  Link, Route, Routes,
} from "react-router-dom";
import "./App.css";

// 动态引入页面组件
const AutoTrackedPage = lazy(() => import("./AutoTrackedPage"));
const OriginalPage = lazy(() => import("./OriginalPage"));
const TrackedPage = lazy(() => import("./TrackedPage"));

const Home = () => (
  <div className="content">
    <h1>Rsbuild with React</h1>
    <p>Start building amazing things with Rsbuild.</p>
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    }}
    >
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
        element={
          <Suspense fallback={<div>Loading...</div>}>
            <OriginalPage />
          </Suspense>
        }
      />
      <Route
        path="/tracked"
        element={
          <Suspense fallback={<div>Loading...</div>}>
            <TrackedPage />
          </Suspense>
        }
      />
      <Route
        path="/auto-tracked"
        element={
          <Suspense fallback={<div>Loading...</div>}>
            <AutoTrackedPage />
          </Suspense>
        }
      />
    </Routes>
  );
};

export default App;
