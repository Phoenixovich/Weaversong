import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PedestrianControl from './pages/PedestrianControl';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Routes>
      <Route path="/" element={<PedestrianControl />} />
      <Route path="/pedestrian" element={<PedestrianControl />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;


