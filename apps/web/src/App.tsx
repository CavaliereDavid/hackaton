import { Link, Route, Routes } from "react-router-dom";
import { AgentPage } from "./pages/AgentPage";
import { InnerCirclePage } from "./pages/InnerCirclePage";

export function App() {
  return (
    <div className="app-shell">
      <nav className="nav" aria-label="Primary">
        <Link to="/">Agent</Link>
        <Link to="/inner-circle">Inner Circle</Link>
      </nav>
      <Routes>
        <Route path="/" element={<AgentPage />} />
        <Route path="/inner-circle" element={<InnerCirclePage />} />
      </Routes>
    </div>
  );
}
