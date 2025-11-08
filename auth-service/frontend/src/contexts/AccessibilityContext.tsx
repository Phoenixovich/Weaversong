import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AccessibilityContextType {
  isAccessibilityMode: boolean;
  toggleAccessibilityMode: () => void;
  getAccessibilityStyles: () => {
    fontSize: string;
    buttonFontSize: string;
    titleFontSize: string;
    contrastColors: {
      primary: string;
      secondary: string;
      background: string;
      text: string;
      border: string;
      button: string;
      buttonHover: string;
      buttonText: string;
    };
  };
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAccessibilityMode, setIsAccessibilityMode] = useState(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem('accessibilityMode');
    return saved === 'true';
  });

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('accessibilityMode', String(isAccessibilityMode));
    
    // Apply accessibility class to body for global styles
    if (isAccessibilityMode) {
      document.body.classList.add('accessibility-mode');
    } else {
      document.body.classList.remove('accessibility-mode');
    }
  }, [isAccessibilityMode]);

  const toggleAccessibilityMode = () => {
    setIsAccessibilityMode(prev => !prev);
  };

  const getAccessibilityStyles = () => {
    if (!isAccessibilityMode) {
      return {
        fontSize: '1rem',
        buttonFontSize: '1rem',
        titleFontSize: '1.5rem',
        contrastColors: {
          primary: '#2196f3',
          secondary: '#7b1fa2',
          background: '#ffffff',
          text: '#333333',
          border: '#dddddd',
          button: '#2196f3',
          buttonHover: '#1976d2',
          buttonText: '#ffffff',
        },
      };
    }

    // Accessibility mode styles
    return {
      fontSize: '1.25rem', // 25% larger
      buttonFontSize: '1.15rem', // 15% larger buttons
      titleFontSize: '2rem', // Larger titles
      contrastColors: {
        primary: '#0056b3', // Darker blue for better contrast
        secondary: '#5a0f7a', // Darker purple
        background: '#ffffff',
        text: '#000000', // Pure black for maximum contrast
        border: '#000000', // Black borders for visibility
        button: '#0056b3', // High contrast blue
        buttonHover: '#004085', // Even darker on hover
        buttonText: '#ffffff', // White text on buttons
      },
    };
  };

  return (
    <AccessibilityContext.Provider
      value={{
        isAccessibilityMode,
        toggleAccessibilityMode,
        getAccessibilityStyles,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

