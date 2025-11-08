import React, { useState } from 'react';

interface InputSectionProps {
  onMedical: (text?: string, file?: File, model?: string, style?: string) => void;
  onLegal: (text?: string, file?: File, model?: string, style?: string) => void;
  loading: boolean;
  mode: 'medical' | 'legal';
  model: string;
  style: string;
}

export const InputSection: React.FC<InputSectionProps> = ({
  onMedical,
  onLegal,
  loading,
  mode,
  model,
  style,
}) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'medical') {
      onMedical(text || undefined, file || undefined, model, style);
    } else {
      onLegal(text || undefined, file || undefined, model, style);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const containerStyle = mode === 'medical' 
    ? { ...styles.container, ...styles.medicalContainer }
    : { ...styles.container, ...styles.legalContainer };

  const buttonStyle = mode === 'medical'
    ? { ...styles.submitButton, ...styles.medicalButton }
    : { ...styles.submitButton, ...styles.legalButton };

  return (
    <div style={containerStyle}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.fileInput}>
          <label htmlFor="file-upload" style={styles.fileLabel}>
            📄 Upload PDF or Image
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.gif"
            onChange={handleFileChange}
            style={styles.fileInputField}
          />
          {file && <p style={styles.fileName}>Selected: {file.name}</p>}
        </div>

        <div style={styles.textAreaContainer}>
          <label htmlFor="text-input" style={styles.label}>
            Or enter text:
          </label>
          <textarea
            id="text-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              mode === 'medical'
                ? 'Paste complex medical instructions or discharge notes here...'
                : 'Paste legal documents, contracts, or government forms here...'
            }
            style={styles.textarea}
            rows={8}
          />
        </div>

        <button
          type="submit"
          disabled={loading || (!text.trim() && !file)}
          style={{
            ...buttonStyle,
            ...(loading || (!text.trim() && !file) ? styles.submitButtonDisabled : {}),
          }}
        >
          {loading ? 'Processing...' : mode === 'medical' ? 'Simplify Medical Text' : 'Simplify Legal Document'}
        </button>
      </form>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  },
  medicalContainer: {
    backgroundColor: '#e3f2fd',
    border: '2px solid #2196f3',
  },
  legalContainer: {
    backgroundColor: '#fff3e0',
    border: '2px solid #ff9800',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  fileInput: {
    marginBottom: '1rem',
  },
  fileLabel: {
    display: 'block',
    marginBottom: '0.5rem',
    color: '#333',
    fontWeight: '500',
    cursor: 'pointer',
  },
  fileInputField: {
    width: '100%',
    padding: '0.5rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
  },
  fileName: {
    marginTop: '0.5rem',
    color: '#666',
    fontSize: '0.9rem',
  },
  textAreaContainer: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    color: '#333',
    fontWeight: '500',
  },
  textarea: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  submitButton: {
    padding: '0.75rem 2rem',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    alignSelf: 'center',
  },
  medicalButton: {
    backgroundColor: '#2196f3',
  },
  legalButton: {
    backgroundColor: '#ff9800',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
};

