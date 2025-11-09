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

  return (
    <div className="clarifai-page">
      <div className={`clarifai-header ${mode}`}>
        <h1 className="header-title">ClarifAI</h1>
        <p className="header-subtitle">
          {mode === 'medical' 
            ? 'Turn complex medical instructions into clear, simple steps'
            : 'Turn complex legal documents into clear, simple steps'}
        </p>
        <div className="clarifai-controls">
          <div className="tab-selector">
            <button
              className={`tab-button ${mode === 'medical' ? 'active-medical' : ''}`}
              onClick={() => {
                setMode('medical');
                setResult('');
                setError('');
              }}
            >
              🏥 Medical
            </button>
            <button
              className={`tab-button ${mode === 'legal' ? 'active-legal' : ''}`}
              onClick={() => {
                setMode('legal');
                setResult('');
                setError('');
              }}
            >
              ⚖️ Legal
            </button>
          </div>
          
          <div className="model-selector">
            <label htmlFor="model-select" className="model-label">
              Model:
            </label>
            <select
              id="model-select"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="model-select"
            >
              <option value="gemini-2.5-flash">gemini-2.5-flash</option>
              <option value="gemini-2.5-pro">gemini-2.5-pro</option>
              <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite</option>
            </select>
          </div>
          
          <div className="style-selector">
            <label htmlFor="style-select" className="style-label">
              Style:
            </label>
            <select
              id="style-select"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="style-select"
            >
              <option value="default">Default</option>
              <option value="shorter">Shorter</option>
              <option value="explain like im 5">Explain Like I'm 5</option>
            </select>
          </div>
        </div>
      </div>

      <div className={`clarifai-content ${mode}`}>
        <InputSection
          onMedical={handleMedical}
          onLegal={handleLegal}
          loading={loading}
          mode={mode}
          model={model}
          style={style}
        />

        {error && (
          <div className="clarifai-error">
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
