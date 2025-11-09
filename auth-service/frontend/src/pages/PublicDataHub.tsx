import React, { useState, useEffect } from 'react';
import { publicDataAPI, Dataset } from '../services/publicDataApi';
import { useAccessibility } from '../contexts/AccessibilityContext';
import ReactMarkdown from 'react-markdown';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './PublicDataHub.css';

type Tab = 'datastore' | 'social-aid' | 'explorer';

export const PublicDataHub: React.FC = () => {
  const { isAccessibilityMode } = useAccessibility();
  const [activeTab, setActiveTab] = useState<Tab>('datastore');
  const [model, setModel] = useState<string>('gemini-2.5-flash');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Datastore state
  const [resourceId, setResourceId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [resourceSearchQuery, setResourceSearchQuery] = useState('');
  const [predefinedResources, setPredefinedResources] = useState<Array<{
    id: string;
    name: string;
    description: string;
    dataset_title: string;
    dataset_id?: string;
    resource_name?: string;
    format?: string;
    year?: string;
    organization?: string;
  }>>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [resourcesTotal, setResourcesTotal] = useState(0);
  const [resourcesLimit, setResourcesLimit] = useState(100);
  const [resourcesOffset, setResourcesOffset] = useState(0);
  const [loadingResources, setLoadingResources] = useState(false);
  const [filterField, setFilterField] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [datastoreResults, setDatastoreResults] = useState<{
    records: any[];
    total: number;
    fields: Array<{ id: string; type: string }>;
  } | null>(null);
  const [resourceInfo, setResourceInfo] = useState<{
    resource_id: string;
    fields: Array<{ id: string; type: string }>;
    total_records: number;
  } | null>(null);
  const [visualizationAnalysis, setVisualizationAnalysis] = useState<{
    visualizable_fields: string[];
    recommended_limit: number;
    field_recommendations?: Record<string, {
      chart_type: string;
      data_type: string;
      reason: string;
    }>;
  } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [limit, setLimit] = useState(100);
  const [offset, setOffset] = useState(0);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'table'>('bar');
  const [chartField, setChartField] = useState('');
  const [autoVisualize, setAutoVisualize] = useState(true);
  const [maxFields, setMaxFields] = useState<number | undefined>(5);

  // Social Aid state
  const [socialAidQuestion, setSocialAidQuestion] = useState('');
  const [socialAidContext, setSocialAidContext] = useState('');
  const [socialAidExplanation, setSocialAidExplanation] = useState('');

  // Explorer state
  const [searchQuery, setSearchQuery] = useState('');
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [aggregatedView, setAggregatedView] = useState<{
    dataset: { id?: string; title?: string; name?: string; notes?: string };
    resource: { name?: string; format?: string; url?: string };
    structure: any;
    analysis: string;
  } | null>(null);
  const [explorerLoading, setExplorerLoading] = useState(false);

  const loadPredefinedResources = async (category?: string, search?: string, limit: number = 100, offset: number = 0) => {
    setLoadingResources(true);
    try {
      const response = await publicDataAPI.getPredefinedResources(category, search, limit, offset);
      setPredefinedResources(response.resources);
      setCategoryCounts(response.categories || {});
      setResourcesTotal(response.total || 0);
      setResourcesLimit(response.limit || 100);
      setResourcesOffset(response.offset || 0);
    } catch (err: any) {
      console.error('Error loading predefined resources:', err);
      setError(err.response?.data?.detail || 'Failed to load resources');
    } finally {
      setLoadingResources(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'datastore') {
      loadPredefinedResources(selectedCategory === 'All' ? undefined : selectedCategory, resourceSearchQuery || undefined, resourcesLimit, resourcesOffset);
    }
  }, [activeTab, selectedCategory, resourceSearchQuery, resourcesLimit, resourcesOffset]);

  const handleLoadResourceInfo = async () => {
    if (!resourceId.trim()) {
      setError('Please enter a resource ID');
      return;
    }

    setLoading(true);
    setError('');
    setResourceInfo(null);
    setDatastoreResults(null);
    setVisualizationAnalysis(null); // Reset analysis when loading new resource

    try {
      const info = await publicDataAPI.getDatastoreResource(resourceId);
      setResourceInfo(info);
      // Set first field as default chart field
      if (info.fields && Array.isArray(info.fields) && info.fields.length > 0) {
        setChartField(info.fields[0].id);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load resource info');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeResource = async () => {
    if (!resourceId.trim()) {
      setError('Please enter a resource ID');
      return;
    }

    setAnalyzing(true);
    setError('');
    setVisualizationAnalysis(null);

    try {
      const analysis = await publicDataAPI.analyzeDatastoreResource(resourceId, model, maxFields);
      setVisualizationAnalysis(analysis);
      // Update limit with recommended limit
      setLimit(analysis.recommended_limit);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to analyze resource');
      console.error('Error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleVisualizeRecommended = () => {
    if (!visualizationAnalysis || !visualizationAnalysis.visualizable_fields.length) {
      setError('Please analyze the resource first');
      return;
    }

    // Auto-select first visualizable field
    if (Array.isArray(visualizationAnalysis.visualizable_fields) && visualizationAnalysis.visualizable_fields.length > 0) {
      setChartField(visualizationAnalysis.visualizable_fields[0]);
      // Set chart type based on recommendation if available
      const firstField = visualizationAnalysis.visualizable_fields[0];
      const recommendation = visualizationAnalysis.field_recommendations?.[firstField];
      if (recommendation?.chart_type) {
        setChartType(recommendation.chart_type as 'bar' | 'line' | 'pie');
      }
    }
    setAutoVisualize(true); // Enable auto visualization
  };

  const handleSearchDatastore = async () => {
    if (!resourceId.trim()) {
      setError('Please enter a resource ID');
      return;
    }

    setLoading(true);
    setError('');
    setDatastoreResults(null);

    try {
      const filters = filterField && filterValue ? { [filterField]: filterValue } : undefined;
      const result = await publicDataAPI.searchDatastore(resourceId, limit, offset, filters);
      setDatastoreResults(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to search datastore');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate chart data from results
  const getChartData = (fieldName?: string) => {
    const field = fieldName || chartField;
    if (!datastoreResults || !field || !Array.isArray(datastoreResults.records) || !datastoreResults.records.length) return [];

    // Count occurrences or sum values by field
    const fieldData: Record<string, number> = {};
    
    if (!Array.isArray(datastoreResults.records)) return [];
    
    datastoreResults.records.forEach((record) => {
      const value = record[field];
      if (value !== null && value !== undefined) {
        const key = String(value);
        fieldData[key] = (fieldData[key] || 0) + 1;
      }
    });

    return Object.entries(fieldData)
      .map(([name, value]) => ({ name: name.length > 30 ? name.substring(0, 30) + '...' : name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 20); // Top 20 items
  };

  // Get numeric fields that can be visualized
  const getVisualizableFields = () => {
    if (!datastoreResults || !Array.isArray(datastoreResults.fields) || !Array.isArray(datastoreResults.records) || !datastoreResults.records.length) return [];
    
    // Find fields that have numeric or categorical data
    const visualizableFields: Array<{ id: string; type: string; sampleValues: any[] }> = [];
    
    if (!Array.isArray(datastoreResults.fields)) return [];
    
    datastoreResults.fields.forEach((field) => {
      const sampleValues = Array.isArray(datastoreResults.records) ? datastoreResults.records
        .slice(0, 10)
        .map(r => r[field.id])
        .filter(v => v !== null && v !== undefined) : [];
      
      if (sampleValues.length > 0) {
        visualizableFields.push({
          id: field.id,
          type: field.type,
          sampleValues
        });
      }
    });
    
    return visualizableFields;
  };

  // Auto-select first visualizable field when results load
  useEffect(() => {
    if (datastoreResults && Array.isArray(datastoreResults.fields) && datastoreResults.fields.length > 0 && autoVisualize) {
      const visualizableFields = getVisualizableFields();
      if (visualizableFields.length > 0) {
        // Auto-select first field if none selected
        if (!chartField) {
          setChartField(visualizableFields[0].id);
        }
        // Default to bar chart if table is selected
        if (chartType === 'table') {
          setChartType('bar');
        }
      }
    }
  }, [datastoreResults, autoVisualize]);

  const handleExplainSocialAid = async () => {
    if (!socialAidQuestion.trim()) {
      setError('Please enter a question');
      return;
    }

    setLoading(true);
    setError('');
    setSocialAidExplanation('');

    try {
      const response = await publicDataAPI.explainSocialAid(
        socialAidQuestion,
        socialAidContext || undefined,
        model
      );
      setSocialAidExplanation(response.explanation);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to explain social aid');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchDatasets = async () => {
    setExplorerLoading(true);
    setError('');
    setSelectedDataset(null);

    try {
      const response = await publicDataAPI.listDatasets(searchQuery || undefined, 20);
      setDatasets(Array.isArray(response.datasets) ? response.datasets : []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to search datasets');
      console.error('Error:', err);
    } finally {
      setExplorerLoading(false);
    }
  };

  const handleDatasetClick = async (datasetId: string) => {
    setExplorerLoading(true);
    setError('');
    setSelectedDataset(null);
    setAggregatedView(null);

    try {
      // Fetch dataset details first
      const datasetResponse = await publicDataAPI.getDataset(datasetId);
      setSelectedDataset(datasetResponse.dataset);
      
      // Then try to fetch aggregated view (don't fail if this fails)
      try {
        const aggregatedResponse = await publicDataAPI.getDatasetAggregated(datasetId, 0, model);
        setAggregatedView(aggregatedResponse);
      } catch (aggErr: any) {
        // Show a warning but don't prevent dataset details from showing
        const errorMsg = aggErr.response?.data?.detail || 'Could not generate aggregated analysis';
        setError(`Note: ${errorMsg}. Dataset details are still available below.`);
        console.warn('Aggregated view failed:', aggErr);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch dataset details');
      console.error('Error:', err);
    } finally {
      setExplorerLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-background-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className={`mb-8 ${getHeaderClassName()}`}>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 gradient-text">
            Public Data Hub
          </h1>
          <p className="text-xl text-gray-600">
            {activeTab === 'datastore' && 'Query and visualize structured data from data.gov.ro'}
            {activeTab === 'social-aid' && 'Learn about social benefits and eligibility'}
            {activeTab === 'explorer' && 'Explore Romanian open data'}
          </p>
          <div className="controlsRow mt-4">
          <div className="tabSelector">
            <button
              className={`tabButton ${activeTab === 'datastore' ? 'tabButtonActiveDatastore' : ''}`}
              onClick={() => {
                setActiveTab('datastore');
                setError('');
              }}
            >
              💎 Datastore
            </button>
            <button
              className={`tabButton ${activeTab === 'social-aid' ? 'tabButtonActiveSocialAid' : ''}`}
              onClick={() => {
                setActiveTab('social-aid');
                setError('');
              }}
            >
              💰 Social Aid
            </button>
            <button
              className={`tabButton ${activeTab === 'explorer' ? 'tabButtonActiveExplorer' : ''}`}
              onClick={() => {
                setActiveTab('explorer');
                setError('');
              }}
            >
              📊 Explorer
            </button>
          </div>

          {!isAccessibilityMode && (
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
                <option value="gemini-2.5-pro">gemini-2.5-pro</option>
                <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite</option>
                <option value="gemini-2.5-flash">gemini-2.5-flash</option>
              </select>
            </div>
          )}
        </div>
        </header>

        <div className="content">
        {error && (
          <div className="errorBanner">
            ⚠️ {error}
          </div>
        )}

        {/* Datastore Tab */}
        {activeTab === 'datastore' && (
          <div className="tabContent">
            <div className="inputSection">
              <h2 className="sectionTitle">Datastore Search</h2>
              <p className="sectionDescription">
                Query structured data from data.gov.ro datastore. Enter a resource ID to get started.
              </p>
              
              <div className="resourceIdInput">
                <label htmlFor="resource-id" className="label">
                  Resource ID:
                </label>
                
                {/* Category and Search Filters */}
                <div className="filterRow">
                  <div className="filterField">
                    <label className="label">Category:</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setResourcesOffset(0); // Reset to first page
                      }}
                      className="selectField"
                    >
                      <option value="All">All Categories ({resourcesTotal || 0})</option>
                      {categoryCounts && typeof categoryCounts === 'object' ? Object.entries(categoryCounts)
                        .sort((a, b) => b[1] - a[1])
                        .map(([cat, count]) => (
                          <option key={cat} value={cat}>
                            {cat} ({count})
                          </option>
                        )) : null}
                    </select>
                  </div>
                  <div className="filterField">
                    <label className="label">Search:</label>
                    <input
                      type="text"
                      value={resourceSearchQuery}
                      onChange={(e) => {
                        setResourceSearchQuery(e.target.value);
                        setResourcesOffset(0); // Reset to first page
                      }}
                      placeholder="Search by name, title, description..."
                      className="inputField"
                    />
                  </div>
                </div>

                {/* Resource Selection */}
                <div className="resourceSelection">
                  <label className="label">Select Resource:</label>
                  {loadingResources ? (
                    <p className="loadingText">Loading resources...</p>
                  ) : (
                    <>
                      <select
                        value={resourceId}
                        onChange={async (e) => {
                          const selectedId = e.target.value;
                          setResourceId(selectedId);
                          if (selectedId) {
                            await handleLoadResourceInfo();
                          }
                        }}
                        className="resourceIdSelect"
                      >
                        <option value="">Select a resource from the list below...</option>
                        {Array.isArray(predefinedResources) ? predefinedResources.map((resource) => (
                          <option key={resource.id} value={resource.id}>
                            {resource.name} {resource.format ? `(${resource.format})` : ''} {resource.year ? `[${resource.year}]` : ''}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                </div>

                {/* Manual Resource ID Input */}
                <div className="resourceIdRow">
                  <input
                    id="resource-id"
                    type="text"
                    value={resourceId}
                    onChange={(e) => setResourceId(e.target.value)}
                    placeholder="Or enter custom resource ID manually..."
                    className="resourceIdInputField"
                  />
                  <button
                    onClick={handleLoadResourceInfo}
                    disabled={loading || !resourceId.trim()}
                    className={`submitButton datastoreButton ${loading || !resourceId.trim() ? 'submitButtonDisabled' : ''}`}
                  >
                    {loading ? 'Loading...' : 'Load Resource'}
                  </button>
                </div>
              </div>

              {resourceInfo && (
                <div className="resourceInfoBox">
                  <h3 className="resourceInfoTitle">Resource Information</h3>
                  <p><strong>Total Records:</strong> {resourceInfo.total_records.toLocaleString()}</p>
                  <p><strong>Fields ({resourceInfo.fields?.length || 0}):</strong> {Array.isArray(resourceInfo.fields) ? resourceInfo.fields.map(f => f.id).join(', ') : ''}</p>
                  
                  {/* Analysis Section */}
                  <div className="analysisSection">
                    <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#333' }}>
                        <span>Max Fields to Analyze:</span>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={maxFields || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              setMaxFields(undefined);
                            } else {
                              const numValue = parseInt(value, 10);
                              if (!isNaN(numValue) && numValue >= 1 && numValue <= 50) {
                                setMaxFields(numValue);
                              }
                            }
                          }}
                          style={{
                            padding: '0.5rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            width: '80px',
                            fontSize: '0.9rem'
                          }}
                          placeholder="5"
                        />
                      </label>
                      <span style={{ fontSize: '0.85rem', color: '#666' }}>
                        (Gemini will select the most relevant fields)
                      </span>
                    </div>
                    <button
                      onClick={handleAnalyzeResource}
                      disabled={analyzing}
                      className={`analyzeButton ${analyzing ? 'buttonDisabled' : ''}`}
                    >
                      {analyzing ? '🔄 Analyzing...' : '🤖 Analyze with Gemini'}
                    </button>
                    
                    {visualizationAnalysis && (
                      <div className="analysisResults">
                        <h4 className="analysisTitle">📊 Analysis Results</h4>
                        <p><strong>Recommended Limit:</strong> {visualizationAnalysis.recommended_limit} records</p>
                        <p><strong>Visualizable Fields:</strong> {Array.isArray(visualizationAnalysis.visualizable_fields) ? visualizationAnalysis.visualizable_fields.join(', ') : 'N/A'}</p>
                        {visualizationAnalysis.field_recommendations && Object.keys(visualizationAnalysis.field_recommendations).length > 0 && (
                          <div className="recommendationsList">
                            {visualizationAnalysis.field_recommendations && Object.entries(visualizationAnalysis.field_recommendations).map(([field, rec]) => (
                              <div key={field} className="recommendationItem">
                                <strong>{field}:</strong> {rec.chart_type} chart ({rec.data_type}) - {rec.reason}
                              </div>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={handleVisualizeRecommended}
                          className="visualizeButton"
                        >
                          {visualizationAnalysis && visualizationAnalysis.visualizable_fields.length > 0 ? '✅ ' : ''}📈 Visualize Recommended Fields
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <p className="infoHint">
                    ✅ This resource is available in the datastore and can be queried.
                  </p>
                </div>
              )}

              {resourceInfo && (
                <>
                  <div className="filterSection">
                      <div className="filterRow">
                        <div className="filterField">
                          <label className="label">Filter Field:</label>
                          <select
                            value={filterField}
                            onChange={(e) => setFilterField(e.target.value)}
                            className="selectField"
                          >
                            <option value="">Select field...</option>
                            {Array.isArray(resourceInfo.fields) && resourceInfo.fields.map((field) => (
                              <option key={field.id} value={field.id}>
                                {field.id} ({field.type})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="filterField">
                          <label className="label">Filter Value:</label>
                          <input
                            type="text"
                            value={filterValue}
                            onChange={(e) => setFilterValue(e.target.value)}
                            placeholder="Enter value to filter by..."
                            className="inputField"
                          />
                        </div>
                      </div>
                      <div className="paginationRow">
                        <div className="paginationField">
                          <label className="label">Limit:</label>
                          <input
                            type="number"
                            value={limit}
                            onChange={(e) => setLimit(parseInt(e.target.value) || 100)}
                            min="1"
                            max="1000"
                            className="numberInput"
                          />
                        </div>
                        <div className="paginationField">
                          <label className="label">Offset:</label>
                          <input
                            type="number"
                            value={offset}
                            onChange={(e) => setOffset(parseInt(e.target.value) || 0)}
                            min="0"
                            className="numberInput"
                          />
                        </div>
                      </div>
                    </div>

                  <button
                    onClick={handleSearchDatastore}
                    disabled={loading || !resourceId.trim()}
                    className={`submitButton datastoreButton ${loading || !resourceId.trim() ? 'submitButtonDisabled' : ''}`}
                  >
                    {loading ? 'Searching...' : 'Search Datastore'}
                  </button>
                </>
              )}
            </div>

            {datastoreResults && (
              <div className="outputSection">
                <h2 className="sectionTitle">
                  Results ({datastoreResults.total?.toLocaleString() || (Array.isArray(datastoreResults.records) ? datastoreResults.records.length : 0)} records)
                </h2>
                
                {/* Dashboard Controls */}
                <div className="dashboardControls">
                  <div className="chartTypeSelector">
                    <label className="label">View:</label>
                    <select
                      value={chartType}
                      onChange={(e) => setChartType(e.target.value as 'bar' | 'line' | 'pie' | 'table')}
                      className="selectField"
                    >
                      <option value="bar">Bar Chart</option>
                      <option value="line">Line Chart</option>
                      <option value="pie">Pie Chart</option>
                      <option value="table">Table</option>
                    </select>
                  </div>
                  {chartType !== 'table' && (
                    <div className="chartFieldSelector">
                      <label className="label">Chart Field:</label>
                      <select
                        value={chartField}
                        onChange={(e) => setChartField(e.target.value)}
                        className="selectField"
                      >
                        <option value="">Select field...</option>
                        {datastoreResults.fields?.map((field) => (
                          <option key={field.id} value={field.id}>
                            {field.id} ({field.type})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="autoVisualizeToggle">
                    <label className="checkboxLabel">
                      <input
                        type="checkbox"
                        checked={autoVisualize}
                        onChange={(e) => setAutoVisualize(e.target.checked)}
                      />
                      Auto Visualize
                    </label>
                  </div>
                </div>

                {/* Auto Visualizations - Show charts for recommended or all fields */}
                {autoVisualize && chartType !== 'table' && Array.isArray(datastoreResults.fields) && datastoreResults.fields.length > 0 && (
                  <div className="autoChartsContainer">
                    <h3 className="autoChartsTitle">
                      📊 Automatic Visualizations
                      {visualizationAnalysis && (
                        <span className="analysisBadge"> (Using Gemini Recommendations)</span>
                      )}
                    </h3>
                    <div className="chartsGrid">
                      {((Array.isArray(visualizationAnalysis?.visualizable_fields) ? visualizationAnalysis.visualizable_fields : null) || (Array.isArray(datastoreResults.fields) ? datastoreResults.fields.slice(0, 6).map(f => f.id) : [])).map((fieldId) => {
                        const field = datastoreResults.fields?.find(f => f.id === fieldId);
                        if (!field) return null;
                        
                        const chartData = getChartData(fieldId);
                        if (chartData.length === 0 || chartData.length === 1) return null; // Skip if only 1 value
                        
                        // Use recommended chart type if available
                        const recommendation = visualizationAnalysis?.field_recommendations?.[fieldId];
                        const recommendedChartType = recommendation?.chart_type || chartType;
                        
                        return (
                          <div key={fieldId} className="chartCard">
                            <h4 className="chartCardTitle">{fieldId}</h4>
                            {recommendedChartType === 'bar' && (
                              <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={10} />
                                  <YAxis fontSize={10} />
                                  <Tooltip />
                                  <Bar dataKey="value" fill="#7b1fa2" />
                                </BarChart>
                              </ResponsiveContainer>
                            )}
                            {recommendedChartType === 'line' && (
                              <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={chartData}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={10} />
                                  <YAxis fontSize={10} />
                                  <Tooltip />
                                  <Line type="monotone" dataKey="value" stroke="#7b1fa2" strokeWidth={2} />
                                </LineChart>
                              </ResponsiveContainer>
                            )}
                            {recommendedChartType === 'pie' && (
                              <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                  <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name.substring(0, 15)}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                  >
                                    {chartData.map((_, index) => (
                                      <Cell key={`cell-${index}`} fill={`hsl(${index * 360 / chartData.length}, 70%, 50%)`} />
                                    ))}
                                  </Pie>
                                  <Tooltip />
                                </PieChart>
                              </ResponsiveContainer>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Single Chart View */}
                {chartType !== 'table' && chartField && !autoVisualize && (
                  <div className="chartContainer">
                    <h3 className="chartTitle">Chart: {chartField}</h3>
                    {chartType === 'bar' && (
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={getChartData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="value" fill="#7b1fa2" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                    {chartType === 'line' && (
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={getChartData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="value" stroke="#7b1fa2" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                    {chartType === 'pie' && (
                      <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                          <Pie
                            data={getChartData()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {getChartData().map((_, index) => (
                              <Cell key={`cell-${index}`} fill={`hsl(${index * 360 / getChartData().length}, 70%, 50%)`} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                )}

                {/* Table View */}
                {chartType === 'table' && (
                  <div className="resultsTable">
                    <table className="table">
                      <thead>
                        <tr>
                          {datastoreResults.fields?.map((field) => (
                            <th key={field.id} className="tableHeader">
                              {field.id}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(datastoreResults.records) ? datastoreResults.records.map((record, idx) => (
                          <tr key={idx} className="tableRow">
                            {Array.isArray(datastoreResults.fields) ? datastoreResults.fields.map((field) => (
                              <td key={field.id} className="tableCell">
                                {String(record[field.id] ?? '')}
                              </td>
                            )) : null}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Social Aid Tab */}
        {activeTab === 'social-aid' && (
          <div className="tabContent">
            <div className="inputSection">
              <h2 className="sectionTitle">Social Aid Helper</h2>
              <p className="sectionDescription">
                Ask questions about social benefits, eligibility, or how to apply
              </p>
              <textarea
                value={socialAidQuestion}
                onChange={(e) => setSocialAidQuestion(e.target.value)}
                placeholder="e.g., Am I eligible for VMI? How do I apply for social assistance?"
                className="textarea"
                rows={4}
              />
              <textarea
                value={socialAidContext}
                onChange={(e) => setSocialAidContext(e.target.value)}
                placeholder="Optional: Add context about your situation..."
                className="textarea"
                rows={3}
              />
              <button
                onClick={handleExplainSocialAid}
                disabled={loading || !socialAidQuestion.trim()}
                    className={`submitButton socialAidButton ${loading || !socialAidQuestion.trim() ? 'submitButtonDisabled' : ''}`}
              >
                {loading ? 'Getting Answer...' : 'Get Answer'}
              </button>
            </div>

            {socialAidExplanation && (
              <div className="outputSection">
                <h2 className="sectionTitle">Answer</h2>
                <div className="markdown-container markdownContainer">
                  <ReactMarkdown>{socialAidExplanation}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Explorer Tab */}
        {activeTab === 'explorer' && (
          <div className="tabContent">
            <div className="inputSection">
              <h2 className="sectionTitle">Data Explorer</h2>
              <p className="sectionDescription">
                Search and explore datasets from data.gov.ro
              </p>
              <div className="searchContainer">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search datasets (e.g., 'RO-ALERT', 'VMI', 'budget')..."
                  className="searchInput"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchDatasets();
                    }
                  }}
                />
                <button
                  onClick={handleSearchDatasets}
                  disabled={explorerLoading}
                  className={`submitButton explorerButton ${explorerLoading ? 'submitButtonDisabled' : ''}`}
                >
                  {explorerLoading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {datasets.length > 0 && (
              <div className="datasetsList">
                <h2 className="sectionTitle">Found {datasets.length} datasets</h2>
                {datasets.map((dataset, index) => (
                  <div
                    key={dataset.id || index}
                    className="datasetCard"
                    onClick={() => dataset.id && handleDatasetClick(dataset.id)}
                  >
                    <h3 className="datasetTitle">{dataset.title || dataset.name || 'Untitled'}</h3>
                    {dataset.notes && (
                      <p className="datasetNotes">{dataset.notes.substring(0, 200)}...</p>
                    )}
                    {dataset.organization && (
                      <p className="datasetOrg">
                        📁 {dataset.organization.title || dataset.organization.name}
                      </p>
                    )}
                    {dataset.resources && dataset.resources.length > 0 && (
                      <p className="datasetResources">
                        📎 {dataset.resources.length} resource(s) available
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {selectedDataset && (
              <div className="outputSection">
                <button
                  onClick={() => {
                    setSelectedDataset(null);
                    setAggregatedView(null);
                  }}
                  className="backButton"
                >
                  ← Back to results
                </button>
                <h2 className="sectionTitle">{selectedDataset.title || selectedDataset.name}</h2>
                
                {/* Aggregated View */}
                {aggregatedView && (
                  <div className="aggregatedSection">
                    <h3 className="aggregatedTitle">📊 Aggregated Analysis</h3>
                    {aggregatedView.resource && (
                      <p className="resourceInfo">
                        Analyzing: <strong>{aggregatedView.resource.name || 'Resource'}</strong> ({aggregatedView.resource.format})
                      </p>
                    )}
                    {explorerLoading ? (
                      <p className="loadingText">Analyzing dataset...</p>
                    ) : (
                      <div className="markdown-container markdownContainer">
                        <ReactMarkdown>{aggregatedView.analysis}</ReactMarkdown>
                      </div>
                    )}
                    
                    {aggregatedView.structure && typeof aggregatedView.structure === 'object' && Object.keys(aggregatedView.structure).length > 0 && (
                      <div className="structureSection">
                        <h4 className="structureTitle">Data Structure</h4>
                        {aggregatedView.structure.headers && (
                          <div className="structureInfo">
                            <strong>Columns:</strong> {aggregatedView.structure.headers.join(', ')}
                          </div>
                        )}
                        {aggregatedView.structure.row_count !== undefined && (
                          <div className="structureInfo">
                            <strong>Rows analyzed:</strong> {aggregatedView.structure.row_count}
                          </div>
                        )}
                        {aggregatedView.structure.total_estimated_rows && (
                          <div className="structureInfo">
                            <strong>Total rows (estimated):</strong> {aggregatedView.structure.total_estimated_rows}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Dataset Description */}
                {selectedDataset.notes && (
                  <div className="descriptionSection">
                    <h3 className="sectionSubtitle">Description</h3>
                    <div className="markdown-container markdownContainer">
                      <ReactMarkdown>{selectedDataset.notes}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* Resources */}
                {selectedDataset.resources && selectedDataset.resources.length > 0 && (
                  <div className="resourcesSection">
                    <h3 className="sectionSubtitle">Resources</h3>
                    {selectedDataset.resources.map((resource, index) => (
                      <div key={index} className="resourceItem">
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="resourceLink"
                        >
                          📄 {resource.name || resource.url} ({resource.format})
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};


