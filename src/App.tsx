import { HashRouter, Route, Routes } from 'react-router';
import { NeuroProvider } from './neuro/NeuroProvider';
import { AnalysisPage } from './pages/AnalysisPage';
import { HomePage } from './pages/HomePage';
import { PlayPage } from './pages/PlayPage';
import { SettingsPage } from './pages/SettingsPage';
import { SetupPage } from './pages/SetupPage';

export function App() {
  return (
    <NeuroProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/play" element={<PlayPage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </HashRouter>
    </NeuroProvider>
  );
}
