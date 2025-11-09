import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
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
    <div style={styles.overlay} onClick={handleBackdropClick}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Upgrade to Premium</h2>
          <button style={styles.closeButton} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div style={styles.content}>
          <div style={styles.iconContainer}>
            <span style={styles.icon}>⭐</span>
          </div>
          <p style={styles.message}>
            This feature is available for Premium users only.
          </p>
          <div style={styles.features}>
            <h3 style={styles.featuresTitle}>Premium Features:</h3>
            <ul style={styles.featuresList}>
              <li style={styles.featureItem}>Create promoted events</li>
              <li style={styles.featureItem}>Highlight or boost visibility of content</li>
              <li style={styles.featureItem}>Access advanced stats and dashboards</li>
              <li style={styles.featureItem}>Additional premium-only UI sections</li>
            </ul>
          </div>
          <div style={styles.actions}>
            <button style={styles.upgradeButton} onClick={handleUpgrade}>
              View Pricing & Upgrade
            </button>
            <button style={styles.cancelButton} onClick={onClose}>
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    borderBottom: '1px solid #e0e0e0',
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    color: '#333',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '2rem',
    cursor: 'pointer',
    color: '#666',
    padding: 0,
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  },
  content: {
    padding: '1.5rem',
    textAlign: 'center',
  },
  iconContainer: {
    marginBottom: '1rem',
  },
  icon: {
    fontSize: '3rem',
  },
  message: {
    marginBottom: '1.5rem',
    color: '#666',
    fontSize: '1.1rem',
  },
  features: {
    textAlign: 'left',
    marginBottom: '1.5rem',
    backgroundColor: '#f9f9f9',
    padding: '1rem',
    borderRadius: '4px',
  },
  featuresTitle: {
    margin: '0 0 0.75rem 0',
    fontSize: '1rem',
    color: '#333',
  },
  featuresList: {
    margin: 0,
    paddingLeft: '1.5rem',
    color: '#666',
  },
  featureItem: {
    marginBottom: '0.5rem',
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
  },
  upgradeButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    fontWeight: '500',
  },
  cancelButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: 'transparent',
    color: '#666',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
  },
};

