import React from 'react';
import { useNavigate } from 'react-router-dom';
import './UpgradeModal.css';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleUpgrade = () => {
    onClose();
    // Navigate to pricing/upgrade page or handle upgrade logic
    navigate('/pricing');
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="overlay" onClick={handleBackdropClick}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="header">
          <h2 className="title">Upgrade to Premium</h2>
          <button className="closeButton" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="content">
          <div className="iconContainer">
            <span className="icon">⭐</span>
          </div>
          <p className="message">
            This feature is available for Premium users only.
          </p>
          <div className="features">
            <h3 className="featuresTitle">Premium Features:</h3>
            <ul className="featuresList">
              <li className="featureItem">Create promoted events</li>
              <li className="featureItem">Highlight or boost visibility of content</li>
              <li className="featureItem">Access advanced stats and dashboards</li>
              <li className="featureItem">Additional premium-only UI sections</li>
            </ul>
          </div>
          <div className="actions">
            <button className="upgradeButton" onClick={handleUpgrade}>
              View Pricing & Upgrade
            </button>
            <button className="cancelButton" onClick={onClose}>
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


