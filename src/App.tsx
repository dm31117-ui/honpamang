import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Home } from './pages/Home';
import { Museum } from './pages/Museum';
import { Arcade } from './pages/Arcade';
import { TestPicker } from './pages/Arcade/TestPicker';
import { TypeTest } from './pages/Arcade/TypeTest';
import { BalanceGame } from './pages/Arcade/BalanceGame';

/** 라우트 전환 시 항상 페이지 최상단부터 (프로토타입 shell의 scrollTo(0,0) 대체). */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/museum" element={<Museum />} />
        <Route path="/playground" element={<Arcade />}>
          <Route index element={<Navigate to="test" replace />} />
          <Route path="test" element={<TestPicker />} />
          <Route path="test/:testId" element={<TypeTest />} />
          <Route path="balance" element={<BalanceGame />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
