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
    <div className="container">
      <h3 className="title">
        {operation === 'medical' ? 'Simplified Medical Instructions' : 'Simplified Legal Document'}
      </h3>

      <div className="section">
        <div className="markdownBox markdown-box">
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
        className="copyButton"
      >
        📋 Copy Result
      </button>
    </div>
  );
};


