import React from 'react';
import PedestrianTracker from '../components/PedestrianTracker';
import './PedestrianControl.css';

const PedestrianControl: React.FC = () => {
  return (
    <div className="min-h-screen bg-background-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 gradient-text">
            Pedestrian Analyzer
          </h1>
          <p className="text-xl text-gray-600">
            Analyze pedestrian traffic patterns and urban mobility data
          </p>
        </header>
        <PedestrianTracker />
      </div>
    </div>
  );
};

export default PedestrianControl;


