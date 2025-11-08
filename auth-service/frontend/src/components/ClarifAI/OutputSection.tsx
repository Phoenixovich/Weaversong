import React from 'react';
import ReactMarkdown from 'react-markdown';
import './OutputSection.css';

interface OutputSectionProps {
  result?: string;
  operation: 'medical' | 'legal';
}

export const OutputSection: React.FC<OutputSectionProps> = ({
  result,
  operation,
}) => {
  if (!result) {
    return null;
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>
        {operation === 'medical' ? 'Simplified Medical Instructions' : 'Simplified Legal Document'}
      </h3>

      <div style={styles.section}>
        <div style={styles.markdownBox} className="markdown-box">
          <ReactMarkdown>{result}</ReactMarkdown>
        </div>
      </div>

      <button
        onClick={() => {
          if (result) {
            navigator.clipboard.writeText(result);
            alert('Copied to clipboard!');
          }
        }}
        style={styles.copyButton}
      >
        📋 Copy Result
      </button>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '800px',
    margin: '2rem auto',
    padding: '2rem',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  },
  title: {
    color: '#333',
    marginBottom: '1.5rem',
    textAlign: 'center',
  },
  section: {
    marginBottom: '1.5rem',
  },
  markdownBox: {
    padding: '1.5rem',
    backgroundColor: '#f9f9f9',
    border: '1px solid #ddd',
    borderRadius: '4px',
    lineHeight: '1.8',
    minHeight: '100px',
    maxHeight: '600px',
    overflowY: 'auto',
  },
  copyButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    marginTop: '1rem',
  },
};

