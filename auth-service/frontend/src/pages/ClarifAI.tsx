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

  const headerClassName = mode === 'medical'
    ? 'header medicalHeader'
    : 'header legalHeader';

  const contentClassName = mode === 'medical'
    ? 'content medicalContent'
    : 'content legalContent';

  return (
    <div className="clarifai-page">
      <div className={headerClassName}>
        <h1 className="headerTitle">ClarifAI</h1>
        <p className="headerSubtitle">
          {mode === 'medical' 
            ? 'Turn complex medical instructions into clear, simple steps'
            : 'Turn complex legal documents into clear, simple steps'}
        </p>
        <div className="controlsRow">
          <div className="tabSelector">
            <button
              className={`tabButton ${mode === 'medical' ? 'tabButtonActiveMedical' : ''}`}
              onClick={() => {
                setMode('medical');
                setResult('');
                setError('');
              }}
            >
              🏥 Medical
            </button>
            <button
              className={`tabButton ${mode === 'legal' ? 'tabButtonActiveLegal' : ''}`}
              onClick={() => {
                setMode('legal');
                setResult('');
                setError('');
              }}
            >
              ⚖️ Legal
            </button>
          </div>
          
          <div className="modelSelector">
            <label htmlFor="model-select" className="modelLabel">
              Model:
            </label>
            <select
              id="model-select"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="modelSelect"
            >
              <option value="gemini-2.5-flash">gemini-2.5-flash</option>
              <option value="gemini-2.5-pro">gemini-2.5-pro</option>
              <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite</option>
            </select>
          </div>
          
          <div className="styleSelector">
            <label htmlFor="style-select" className="styleLabel">
              Style:
            </label>
            <select
              id="style-select"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="styleSelect"
            >
              <option value="default">Default</option>
              <option value="shorter">Shorter</option>
              <option value="explain like im 5">Explain Like I'm 5</option>
            </select>
          </div>
        </div>
      </div>

      <div className={contentClassName}>
        <InputSection
          onMedical={handleMedical}
          onLegal={handleLegal}
          loading={loading}
          mode={mode}
          model={model}
          style={style}
        />

        {error && (
          <div className="error">
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


