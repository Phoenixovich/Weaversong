import React, { useState } from 'react';
import { InputSection } from '../components/ClarifAI/InputSection';
import { OutputSection } from '../components/ClarifAI/OutputSection';
import { ReminderList } from '../components/ClarifAI/ReminderList';
import { clarifyAPI } from '../services/clarifyApi';
import './ClarifAI.css';

export const ClarifAI: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [mode, setMode] = useState<'medical' | 'legal'>('medical');
  const [model, setModel] = useState<string>('gemini-2.5-flash');
  const [style, setStyle] = useState<string>('default');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleMedical = async (text?: string, file?: File, selectedModel?: string, selectedStyle?: string) => {
    setLoading(true);
    setError('');
    setMode('medical');

    try {
      const response = await clarifyAPI.simplify(text, file, selectedModel || model, selectedStyle || style);
      setResult(response.simplified);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to simplify medical text');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLegal = async (text?: string, file?: File, selectedModel?: string, selectedStyle?: string) => {
    setLoading(true);
    setError('');
    setMode('legal');

    try {
      const response = await clarifyAPI.legal(text, file, selectedModel || model, selectedStyle || style);
      setResult(response.simplified);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to simplify legal document');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const headerStyle = mode === 'medical'
    ? { ...styles.header, ...styles.medicalHeader }
    : { ...styles.header, ...styles.legalHeader };

  const contentStyle = mode === 'medical'
    ? { ...styles.content, ...styles.medicalContent }
    : { ...styles.content, ...styles.legalContent };

  return (
    <div className="clarifai-page">
      <div style={headerStyle}>
        <h1 style={styles.headerTitle}>ClarifAI</h1>
        <p style={styles.headerSubtitle}>
          {mode === 'medical' 
            ? 'Turn complex medical instructions into clear, simple steps'
            : 'Turn complex legal documents into clear, simple steps'}
        </p>
        <div style={styles.controlsRow}>
          <div style={styles.tabSelector}>
            <button
              style={{
                ...styles.tabButton,
                ...(mode === 'medical' ? styles.tabButtonActiveMedical : {}),
              }}
              onClick={() => {
                setMode('medical');
                setResult('');
                setError('');
              }}
            >
              🏥 Medical
            </button>
            <button
              style={{
                ...styles.tabButton,
                ...(mode === 'legal' ? styles.tabButtonActiveLegal : {}),
              }}
              onClick={() => {
                setMode('legal');
                setResult('');
                setError('');
              }}
            >
              ⚖️ Legal
            </button>
          </div>
          
          <div style={styles.modelSelector}>
            <label htmlFor="model-select" style={styles.modelLabel}>
              Model:
            </label>
            <select
              id="model-select"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              style={styles.modelSelect}
            >
              <option value="gemini-2.5-flash">gemini-2.5-flash</option>
              <option value="gemini-2.5-pro">gemini-2.5-pro</option>
              <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite</option>
            </select>
          </div>
          
          <div style={styles.styleSelector}>
            <label htmlFor="style-select" style={styles.styleLabel}>
              Style:
            </label>
            <select
              id="style-select"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              style={styles.styleSelect}
            >
              <option value="default">Default</option>
              <option value="shorter">Shorter</option>
              <option value="explain like im 5">Explain Like I'm 5</option>
            </select>
          </div>
        </div>
      </div>

      <div style={contentStyle}>
        <InputSection
          onMedical={handleMedical}
          onLegal={handleLegal}
          loading={loading}
          mode={mode}
          model={model}
          style={style}
        />

        {error && (
          <div style={styles.error}>
            ⚠️ {error}
          </div>
        )}

        {result && (
          <OutputSection
            result={result}
            operation={mode}
          />
        )}

        <ReminderList />
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  header: {
    color: 'white',
    padding: '2rem',
    textAlign: 'center',
  },
  medicalHeader: {
    backgroundColor: '#2196f3',
  },
  legalHeader: {
    backgroundColor: '#ff9800',
  },
  headerTitle: {
    margin: 0,
    fontSize: '2.5rem',
    fontWeight: 'bold',
  },
  headerSubtitle: {
    margin: '0.5rem 0 1rem 0',
    fontSize: '1.1rem',
    opacity: 0.9,
  },
  controlsRow: {
    display: 'flex',
    gap: '2rem',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '1rem',
    flexWrap: 'wrap',
  },
  tabSelector: {
    display: 'flex',
    gap: '1rem',
  },
  modelSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  modelLabel: {
    color: 'white',
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  modelSelect: {
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    border: '2px solid white',
    backgroundColor: 'white',
    color: '#333',
    fontSize: '0.9rem',
    cursor: 'pointer',
    fontWeight: '500',
  },
  styleSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  styleLabel: {
    color: 'white',
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  styleSelect: {
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    border: '2px solid white',
    backgroundColor: 'white',
    color: '#333',
    fontSize: '0.9rem',
    cursor: 'pointer',
    fontWeight: '500',
  },
  tabButton: {
    padding: '0.75rem 2rem',
    border: '2px solid white',
    backgroundColor: 'transparent',
    color: 'white',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'all 0.3s',
  },
  tabButtonActiveMedical: {
    backgroundColor: 'white',
    color: '#2196f3',
  },
  tabButtonActiveLegal: {
    backgroundColor: 'white',
    color: '#ff9800',
  },
  content: {
    minHeight: 'calc(100vh - 200px)',
    padding: '2rem 1rem',
  },
  medicalContent: {
    backgroundColor: '#f5f9ff',
  },
  legalContent: {
    backgroundColor: '#fffaf5',
  },
  error: {
    maxWidth: '800px',
    margin: '1rem auto',
    padding: '1rem',
    backgroundColor: '#fee',
    color: '#c33',
    borderRadius: '4px',
    border: '1px solid #fcc',
  },
};

