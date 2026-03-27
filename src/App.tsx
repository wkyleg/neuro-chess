import { BrowserRouter, Route, Routes } from 'react-router';
import { AnalysisPage } from './pages/AnalysisPage';
import { HomePage } from './pages/HomePage';
import { PlayPage } from './pages/PlayPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/play" element={<PlayPage />} />
        <Route path="/analysis" element={<AnalysisPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
