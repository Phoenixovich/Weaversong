import React from 'react';
import PedestrianTracker from '../components/PedestrianTracker';
import './PedestrianControl.css';

const PedestrianControl: React.FC = () => {
  return (
    <div className="pedestrian-control-page">
      <PedestrianTracker />
    </div>
  );
};

export default PedestrianControl;


