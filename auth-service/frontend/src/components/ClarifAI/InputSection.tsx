import React, { useState, useRef } from 'react';
import './InputSection.css';

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

  const containerClassName = mode === 'medical' 
    ? 'container medicalContainer'
    : 'container legalContainer';

  const buttonClassName = mode === 'medical'
    ? 'submitButton medicalButton'
    : 'submitButton legalButton';

  return (
    <div className={containerClassName}>
      <form onSubmit={handleSubmit} className="form">
        <div className="fileInput">
          <div className="fileInputHeader">
            <label htmlFor="file-upload" className="fileLabel">
              📄 Upload PDF or Image
            </label>
            <button
              type="button"
              onClick={handlePasteFromClipboard}
              className="pasteButton"
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
            className="fileInputField"
          />
          {file && (
            <div className="fileInfo">
              <p className="fileName">Selected: {file.name}</p>
              <button
                type="button"
                onClick={clearFile}
                className="clearFileButton"
              >
                ✕ Clear
              </button>
            </div>
          )}
          {pasteError && (
            <p className="errorMessage">{pasteError}</p>
          )}
        </div>

        <div className="textAreaContainer">
          <label htmlFor="text-input" className="label">
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
            className="textarea"
            rows={8}
          />
        </div>

        <button
          type="submit"
          disabled={loading || (!text.trim() && !file)}
          className={`${buttonClassName} ${loading || (!text.trim() && !file) ? 'submitButtonDisabled' : ''}`}
        >
          {loading ? 'Processing...' : mode === 'medical' ? 'Simplify Medical Text' : 'Simplify Legal Document'}
        </button>
      </form>
    </div>
  );
};


