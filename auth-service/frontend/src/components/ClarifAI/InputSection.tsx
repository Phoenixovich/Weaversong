import React, { useState, useRef } from 'react';

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
  const [pasteError, setPasteError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setText(''); // Clear text when file is selected
      setPasteError('');
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      setPasteError('');
      const clipboardItems = await navigator.clipboard.read();
      
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/')) {
            const blob = await clipboardItem.getType(type);
            // Determine file extension based on MIME type
            const extension = type.split('/')[1] || 'png';
            const file = new File([blob], `clipboard-image-${Date.now()}.${extension}`, { type });
            setFile(file);
            setText(''); // Clear text when image is pasted
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
            return;
          }
        }
      }
      
      setPasteError('No image found in clipboard. Please copy an image first.');
    } catch (error: any) {
      console.error('Error pasting from clipboard:', error);
      if (error.name === 'NotAllowedError') {
        setPasteError('Clipboard access denied. Please allow clipboard permissions.');
      } else if (error.name === 'NotFoundError') {
        setPasteError('No image found in clipboard. Please copy an image first.');
      } else {
        setPasteError('Failed to paste from clipboard. Please try uploading a file instead.');
      }
    }
  };

  const clearFile = () => {
    setFile(null);
    setPasteError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
          <div style={styles.fileInputHeader}>
            <label htmlFor="file-upload" style={styles.fileLabel}>
              📄 Upload PDF or Image
            </label>
            <button
              type="button"
              onClick={handlePasteFromClipboard}
              style={styles.pasteButton}
              title="Paste image from clipboard (Ctrl+V or Cmd+V)"
            >
              📋 Paste Image
            </button>
          </div>
          <input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.webp"
            onChange={handleFileChange}
            style={styles.fileInputField}
          />
          {file && (
            <div style={styles.fileInfo}>
              <p style={styles.fileName}>Selected: {file.name}</p>
              <button
                type="button"
                onClick={clearFile}
                style={styles.clearFileButton}
              >
                ✕ Clear
              </button>
            </div>
          )}
          {pasteError && (
            <p style={styles.errorMessage}>{pasteError}</p>
          )}
        </div>

        <div style={styles.textAreaContainer}>
          <label htmlFor="text-input" style={styles.label}>
            Or enter text:
          </label>
          <textarea
            id="text-input"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (e.target.value.trim()) {
                setFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }
            }}
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
  fileInputHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  fileLabel: {
    display: 'block',
    color: '#333',
    fontWeight: '500',
    cursor: 'pointer',
  },
  pasteButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '0.9rem',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'background-color 0.3s',
  },
  pasteButtonHover: {
    backgroundColor: '#5a6268',
  },
  fileInputField: {
    width: '100%',
    padding: '0.5rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
  },
  fileInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '0.5rem',
  },
  fileName: {
    color: '#666',
    fontSize: '0.9rem',
    margin: 0,
    flex: 1,
  },
  clearFileButton: {
    padding: '0.25rem 0.75rem',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '0.85rem',
    cursor: 'pointer',
    marginLeft: '0.5rem',
  },
  errorMessage: {
    marginTop: '0.5rem',
    color: '#dc3545',
    fontSize: '0.85rem',
    margin: 0,
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

