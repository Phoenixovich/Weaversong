import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AccessibilityContextType {
  isAccessibilityMode: boolean;
  toggleAccessibility: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [isAccessibilityMode, setIsAccessibilityMode] = useState<boolean>(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem('accessibilityMode');
    return saved === 'true';
  });

  useEffect(() => {
    // Save to localStorage whenever it changes
    localStorage.setItem('accessibilityMode', isAccessibilityMode.toString());
    
    // Apply accessibility class to body for global styles
    if (isAccessibilityMode) {
      document.body.classList.add('accessibility-mode');
    } else {
      document.body.classList.remove('accessibility-mode');
    }
  }, [isAccessibilityMode]);

  const toggleAccessibility = () => {
    setIsAccessibilityMode(prev => !prev);
  };

  return (
    <AccessibilityContext.Provider value={{ isAccessibilityMode, toggleAccessibility }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

