import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAccessibility } from '../contexts/AccessibilityContext';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { isAccessibilityMode, getAccessibilityStyles } = useAccessibility();
  const navigate = useNavigate();
  const accStyles = getAccessibilityStyles();

  const cardStyle = isAccessibilityMode
    ? { ...styles.card, border: `3px solid ${accStyles.contrastColors.border}`, padding: '2.5rem' }
    : styles.card;

  const serviceCardStyle = isAccessibilityMode
    ? {
        ...styles.serviceCard,
        border: `3px solid ${accStyles.contrastColors.border}`,
        padding: '2rem',
        fontSize: accStyles.fontSize,
      }
    : styles.serviceCard;

  return (
    <div style={styles.container}>
      <div style={cardStyle}>
        <h1 style={{ ...styles.title, fontSize: accStyles.titleFontSize, color: accStyles.contrastColors.text }}>
          Dashboard
        </h1>
        <div style={{ ...styles.userInfo, fontSize: accStyles.fontSize, border: isAccessibilityMode ? `2px solid ${accStyles.contrastColors.border}` : 'none' }}>
          <p><strong>Welcome, {user?.name}!</strong></p>
          <p>Username: {user?.username}</p>
          <p>Email: {user?.email}</p>
          {!isAccessibilityMode && <p>User ID: {user?.id}</p>}
        </div>
        <div style={isAccessibilityMode ? { ...styles.servicesGrid, gridTemplateColumns: '1fr', gap: '2rem' } : styles.servicesGrid}>
          <Link to="/clarifai" style={serviceCardStyle}>
            {!isAccessibilityMode && <div style={styles.serviceIcon}>📄</div>}
            <h2 style={{ fontSize: isAccessibilityMode ? '1.75rem' : '1.5rem', color: accStyles.contrastColors.text }}>
              ClarifAI
            </h2>
            <p style={{ fontSize: accStyles.fontSize, color: accStyles.contrastColors.text }}>
              Transform complex medical and legal documents into clear, plain-language steps
            </p>
          </Link>
          <Link to="/public-data" style={serviceCardStyle}>
            {!isAccessibilityMode && <div style={styles.serviceIcon}>📊</div>}
            <h2 style={{ fontSize: isAccessibilityMode ? '1.75rem' : '1.5rem', color: accStyles.contrastColors.text }}>
              Public Data Hub
            </h2>
            <p style={{ fontSize: accStyles.fontSize, color: accStyles.contrastColors.text }}>
              Understand government alerts, social benefits, and explore Romanian open data
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '500px',
  },
  title: {
    textAlign: 'center',
    marginBottom: '1.5rem',
    color: '#333',
  },
  userInfo: {
    marginBottom: '1.5rem',
    padding: '1rem',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
  },
  servicesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginTop: '2rem',
  },
  serviceCard: {
    display: 'block',
    padding: '2rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    textDecoration: 'none',
    color: '#333',
    transition: 'transform 0.3s, box-shadow 0.3s',
    border: '2px solid #e9ecef',
  },
  serviceCardHover: {
    transform: 'translateY(-5px)',
    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
  },
  serviceIcon: {
    fontSize: '3rem',
    marginBottom: '1rem',
    textAlign: 'center',
  },
};

