import React, { useState, useEffect } from 'react';
import { publicDataAPI, Dataset } from '../services/publicDataApi';
import ReactMarkdown from 'react-markdown';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './PublicDataHub.css';

type Tab = 'datastore' | 'social-aid' | 'explorer';

export const PublicDataHub: React.FC = () => {
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
  const [queryMode, setQueryMode] = useState<'filter' | 'sql' | 'text'>('filter');
  const [filterField, setFilterField] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [textQuery, setTextQuery] = useState('');
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM "<resource_id>" LIMIT 100');
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
      setSqlQuery(`SELECT * FROM "${resourceId}" LIMIT 100`);
      // Set first field as default chart field
      if (info.fields && info.fields.length > 0) {
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
      const analysis = await publicDataAPI.analyzeDatastoreResource(resourceId, model);
      setVisualizationAnalysis(analysis);
      // Update SQL query with recommended limit
      setSqlQuery(`SELECT * FROM "${resourceId}" LIMIT ${analysis.recommended_limit}`);
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
    if (visualizationAnalysis.visualizable_fields.length > 0) {
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
      if (queryMode === 'sql') {
        const finalQuery = sqlQuery.replace('<resource_id>', resourceId).replace('"<resource_id>"', `"${resourceId}"`);
        const result = await publicDataAPI.searchDatastoreSQL(finalQuery);
        setDatastoreResults({
          ...result,
          total: result.records.length
        });
      } else if (queryMode === 'text') {
        const filters = filterField && filterValue ? { [filterField]: filterValue } : undefined;
        const result = await publicDataAPI.searchDatastore(resourceId, limit, offset, filters, textQuery);
        setDatastoreResults(result);
      } else {
        const filters = filterField && filterValue ? { [filterField]: filterValue } : undefined;
        const result = await publicDataAPI.searchDatastore(resourceId, limit, offset, filters);
        setDatastoreResults(result);
      }
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
    if (!datastoreResults || !field || !datastoreResults.records.length) return [];

    // Count occurrences or sum values by field
    const fieldData: Record<string, number> = {};
    
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
    if (!datastoreResults || !datastoreResults.fields || !datastoreResults.records.length) return [];
    
    // Find fields that have numeric or categorical data
    const visualizableFields: Array<{ id: string; type: string; sampleValues: any[] }> = [];
    
    datastoreResults.fields.forEach((field) => {
      const sampleValues = datastoreResults.records
        .slice(0, 10)
        .map(r => r[field.id])
        .filter(v => v !== null && v !== undefined);
      
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
    if (datastoreResults && datastoreResults.fields && datastoreResults.fields.length > 0 && autoVisualize) {
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
      setDatasets(response.datasets);
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

  const getHeaderStyle = () => {
    switch (activeTab) {
      case 'datastore':
        return { ...styles.header, ...styles.datastoreHeader };
      case 'social-aid':
        return { ...styles.header, ...styles.socialAidHeader };
      case 'explorer':
        return { ...styles.header, ...styles.explorerHeader };
      default:
        return styles.header;
    }
  };

  return (
    <div className="public-data-hub-page">
      <div style={getHeaderStyle()}>
        <h1 style={styles.headerTitle}>Public Data Hub</h1>
        <p style={styles.headerSubtitle}>
          {activeTab === 'datastore' && 'Query and visualize structured data from data.gov.ro'}
          {activeTab === 'social-aid' && 'Learn about social benefits and eligibility'}
          {activeTab === 'explorer' && 'Explore Romanian open data'}
        </p>
        <div style={styles.controlsRow}>
          <div style={styles.tabSelector}>
            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === 'datastore' ? styles.tabButtonActiveDatastore : {}),
              }}
              onClick={() => {
                setActiveTab('datastore');
                setError('');
              }}
            >
              💎 Datastore
            </button>
            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === 'social-aid' ? styles.tabButtonActiveSocialAid : {}),
              }}
              onClick={() => {
                setActiveTab('social-aid');
                setError('');
              }}
            >
              💰 Social Aid
            </button>
            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === 'explorer' ? styles.tabButtonActiveExplorer : {}),
              }}
              onClick={() => {
                setActiveTab('explorer');
                setError('');
              }}
            >
              📊 Explorer
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
              <option value="gemini-2.5-pro">gemini-2.5-pro</option>
              <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite</option>
              <option value="gemini-2.5-flash">gemini-2.5-flash</option>
            </select>
          </div>
        </div>
      </div>

      <div style={styles.content}>
        {error && (
          <div style={styles.errorBanner}>
            ⚠️ {error}
          </div>
        )}

        {/* Datastore Tab */}
        {activeTab === 'datastore' && (
          <div style={styles.tabContent}>
            <div style={styles.inputSection}>
              <h2 style={styles.sectionTitle}>Datastore Search</h2>
              <p style={styles.sectionDescription}>
                Query structured data from data.gov.ro datastore. Enter a resource ID to get started.
              </p>
              
              <div style={styles.resourceIdInput}>
                <label htmlFor="resource-id" style={styles.label}>
                  Resource ID:
                </label>
                
                {/* Category and Search Filters */}
                <div style={styles.filterRow}>
                  <div style={styles.filterField}>
                    <label style={styles.label}>Category:</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setResourcesOffset(0); // Reset to first page
                      }}
                      style={styles.selectField}
                    >
                      <option value="All">All Categories ({resourcesTotal || 0})</option>
                      {Object.entries(categoryCounts)
                        .sort((a, b) => b[1] - a[1])
                        .map(([cat, count]) => (
                          <option key={cat} value={cat}>
                            {cat} ({count})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div style={styles.filterField}>
                    <label style={styles.label}>Search:</label>
                    <input
                      type="text"
                      value={resourceSearchQuery}
                      onChange={(e) => {
                        setResourceSearchQuery(e.target.value);
                        setResourcesOffset(0); // Reset to first page
                      }}
                      placeholder="Search by name, title, description..."
                      style={styles.inputField}
                    />
                  </div>
                </div>

                {/* Resource Selection */}
                <div style={styles.resourceSelection}>
                  <label style={styles.label}>Select Resource:</label>
                  {loadingResources ? (
                    <p style={styles.loadingText}>Loading resources...</p>
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
                        style={styles.resourceIdSelect}
                      >
                        <option value="">Select a resource from the list below...</option>
                        {predefinedResources.map((resource) => (
                          <option key={resource.id} value={resource.id}>
                            {resource.name} {resource.format ? `(${resource.format})` : ''} {resource.year ? `[${resource.year}]` : ''}
                          </option>
                        ))}
                      </select>
                      
                      {/* Pagination */}
                      {resourcesTotal > 0 && (
                        <div style={styles.paginationControls}>
                          <button
                            onClick={() => {
                              const newOffset = Math.max(0, resourcesOffset - resourcesLimit);
                              setResourcesOffset(newOffset);
                            }}
                            disabled={resourcesOffset === 0}
                            style={{
                              ...styles.paginationButton,
                              ...(resourcesOffset === 0 ? styles.paginationButtonDisabled : {}),
                            }}
                          >
                            ← Previous
                          </button>
                          <span style={styles.paginationInfo}>
                            Showing {resourcesOffset + 1}-{Math.min(resourcesOffset + resourcesLimit, resourcesTotal)} of {resourcesTotal.toLocaleString()}
                          </span>
                          <button
                            onClick={() => {
                              const newOffset = resourcesOffset + resourcesLimit;
                              if (newOffset < resourcesTotal) {
                                setResourcesOffset(newOffset);
                              }
                            }}
                            disabled={resourcesOffset + resourcesLimit >= resourcesTotal}
                            style={{
                              ...styles.paginationButton,
                              ...(resourcesOffset + resourcesLimit >= resourcesTotal ? styles.paginationButtonDisabled : {}),
                            }}
                          >
                            Next →
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Manual Resource ID Input */}
                <div style={styles.resourceIdRow}>
                  <input
                    id="resource-id"
                    type="text"
                    value={resourceId}
                    onChange={(e) => setResourceId(e.target.value)}
                    placeholder="Or enter custom resource ID manually..."
                    style={styles.resourceIdInputField}
                  />
                  <button
                    onClick={handleLoadResourceInfo}
                    disabled={loading || !resourceId.trim()}
                    style={{
                      ...styles.submitButton,
                      ...styles.datastoreButton,
                      ...(loading || !resourceId.trim() ? styles.submitButtonDisabled : {}),
                    }}
                  >
                    {loading ? 'Loading...' : 'Load Resource'}
                  </button>
                </div>
              </div>

              {resourceInfo && (
                <div style={styles.resourceInfoBox}>
                  <h3 style={styles.resourceInfoTitle}>Resource Information</h3>
                  <p><strong>Total Records:</strong> {resourceInfo.total_records.toLocaleString()}</p>
                  <p><strong>Fields ({resourceInfo.fields.length}):</strong> {resourceInfo.fields.map(f => f.id).join(', ')}</p>
                  
                  {/* Analysis Section */}
                  <div style={styles.analysisSection}>
                    <button
                      onClick={handleAnalyzeResource}
                      disabled={analyzing}
                      style={{
                        ...styles.analyzeButton,
                        ...(analyzing ? styles.buttonDisabled : {}),
                      }}
                    >
                      {analyzing ? '🔄 Analyzing...' : '🤖 Analyze with Gemini'}
                    </button>
                    
                    {visualizationAnalysis && (
                      <div style={styles.analysisResults}>
                        <h4 style={styles.analysisTitle}>📊 Analysis Results</h4>
                        <p><strong>Recommended Limit:</strong> {visualizationAnalysis.recommended_limit} records</p>
                        <p><strong>Visualizable Fields:</strong> {visualizationAnalysis.visualizable_fields.join(', ')}</p>
                        {visualizationAnalysis.field_recommendations && Object.keys(visualizationAnalysis.field_recommendations).length > 0 && (
                          <div style={styles.recommendationsList}>
                            {Object.entries(visualizationAnalysis.field_recommendations).map(([field, rec]) => (
                              <div key={field} style={styles.recommendationItem}>
                                <strong>{field}:</strong> {rec.chart_type} chart ({rec.data_type}) - {rec.reason}
                              </div>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={handleVisualizeRecommended}
                          style={styles.visualizeButton}
                        >
                          📈 Visualize Recommended Fields
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <p style={styles.infoHint}>
                    ✅ This resource is available in the datastore and can be queried.
                  </p>
                </div>
              )}

              {resourceInfo && (
                <>
                  <div style={styles.queryModeSelector}>
                    <label style={styles.label}>Query Mode:</label>
                    <div style={styles.radioGroup}>
                      <label style={styles.radioLabel}>
                        <input
                          type="radio"
                          value="filter"
                          checked={queryMode === 'filter'}
                          onChange={(e) => setQueryMode(e.target.value as 'filter' | 'sql' | 'text')}
                        />
                        Filter
                      </label>
                      <label style={styles.radioLabel}>
                        <input
                          type="radio"
                          value="text"
                          checked={queryMode === 'text'}
                          onChange={(e) => setQueryMode(e.target.value as 'filter' | 'sql' | 'text')}
                        />
                        Text Search
                      </label>
                      <label style={styles.radioLabel}>
                        <input
                          type="radio"
                          value="sql"
                          checked={queryMode === 'sql'}
                          onChange={(e) => setQueryMode(e.target.value as 'filter' | 'sql' | 'text')}
                        />
                        SQL Query
                      </label>
                    </div>
                  </div>

                  {queryMode === 'filter' ? (
                    <div style={styles.filterSection}>
                      <div style={styles.filterRow}>
                        <div style={styles.filterField}>
                          <label style={styles.label}>Filter Field:</label>
                          <select
                            value={filterField}
                            onChange={(e) => setFilterField(e.target.value)}
                            style={styles.selectField}
                          >
                            <option value="">Select field...</option>
                            {resourceInfo.fields.map((field) => (
                              <option key={field.id} value={field.id}>
                                {field.id} ({field.type})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div style={styles.filterField}>
                          <label style={styles.label}>Filter Value:</label>
                          <input
                            type="text"
                            value={filterValue}
                            onChange={(e) => setFilterValue(e.target.value)}
                            placeholder="Enter value to filter by..."
                            style={styles.inputField}
                          />
                        </div>
                      </div>
                      <div style={styles.paginationRow}>
                        <div style={styles.paginationField}>
                          <label style={styles.label}>Limit:</label>
                          <input
                            type="number"
                            value={limit}
                            onChange={(e) => setLimit(parseInt(e.target.value) || 100)}
                            min="1"
                            max="1000"
                            style={styles.numberInput}
                          />
                        </div>
                        <div style={styles.paginationField}>
                          <label style={styles.label}>Offset:</label>
                          <input
                            type="number"
                            value={offset}
                            onChange={(e) => setOffset(parseInt(e.target.value) || 0)}
                            min="0"
                            style={styles.numberInput}
                          />
                        </div>
                      </div>
                    </div>
                  ) : queryMode === 'text' ? (
                    <div style={styles.textSearchSection}>
                      <label style={styles.label}>Text Search (searches across all fields):</label>
                      <input
                        type="text"
                        value={textQuery}
                        onChange={(e) => setTextQuery(e.target.value)}
                        placeholder="Enter search text..."
                        style={styles.inputField}
                      />
                      <div style={styles.paginationRow}>
                        <div style={styles.paginationField}>
                          <label style={styles.label}>Limit:</label>
                          <input
                            type="number"
                            value={limit}
                            onChange={(e) => setLimit(parseInt(e.target.value) || 100)}
                            min="1"
                            max="1000"
                            style={styles.numberInput}
                          />
                        </div>
                        <div style={styles.paginationField}>
                          <label style={styles.label}>Offset:</label>
                          <input
                            type="number"
                            value={offset}
                            onChange={(e) => setOffset(parseInt(e.target.value) || 0)}
                            min="0"
                            style={styles.numberInput}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={styles.sqlSection}>
                      <label style={styles.label}>SQL Query:</label>
                      <textarea
                        value={sqlQuery}
                        onChange={(e) => setSqlQuery(e.target.value)}
                        placeholder='SELECT * FROM "<resource_id>" WHERE county="Bucuresti" LIMIT 100'
                        style={styles.textarea}
                        rows={4}
                      />
                      <p style={styles.sqlHint}>
                        💡 Tip: Use <code>"{resourceId}"</code> as the table name. Example: <code>SELECT * FROM "{resourceId}" WHERE county='Bucuresti' LIMIT 100</code>
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleSearchDatastore}
                    disabled={loading || !resourceId.trim()}
                    style={{
                      ...styles.submitButton,
                      ...styles.datastoreButton,
                      ...(loading || !resourceId.trim() ? styles.submitButtonDisabled : {}),
                    }}
                  >
                    {loading ? 'Searching...' : 'Search Datastore'}
                  </button>
                </>
              )}
            </div>

            {datastoreResults && (
              <div style={styles.outputSection}>
                <h2 style={styles.sectionTitle}>
                  Results ({datastoreResults.total?.toLocaleString() || datastoreResults.records.length} records)
                </h2>
                
                {/* Dashboard Controls */}
                <div style={styles.dashboardControls}>
                  <div style={styles.chartTypeSelector}>
                    <label style={styles.label}>View:</label>
                    <select
                      value={chartType}
                      onChange={(e) => setChartType(e.target.value as 'bar' | 'line' | 'pie' | 'table')}
                      style={styles.selectField}
                    >
                      <option value="bar">Bar Chart</option>
                      <option value="line">Line Chart</option>
                      <option value="pie">Pie Chart</option>
                      <option value="table">Table</option>
                    </select>
                  </div>
                  {chartType !== 'table' && (
                    <div style={styles.chartFieldSelector}>
                      <label style={styles.label}>Chart Field:</label>
                      <select
                        value={chartField}
                        onChange={(e) => setChartField(e.target.value)}
                        style={styles.selectField}
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
                  <div style={styles.autoVisualizeToggle}>
                    <label style={styles.checkboxLabel}>
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
                {autoVisualize && chartType !== 'table' && datastoreResults.fields && datastoreResults.fields.length > 0 && (
                  <div style={styles.autoChartsContainer}>
                    <h3 style={styles.autoChartsTitle}>
                      📊 Automatic Visualizations
                      {visualizationAnalysis && (
                        <span style={styles.analysisBadge}> (Using Gemini Recommendations)</span>
                      )}
                    </h3>
                    <div style={styles.chartsGrid}>
                      {(visualizationAnalysis?.visualizable_fields || datastoreResults.fields.slice(0, 6).map(f => f.id)).map((fieldId) => {
                        const field = datastoreResults.fields?.find(f => f.id === fieldId);
                        if (!field) return null;
                        
                        const chartData = getChartData(fieldId);
                        if (chartData.length === 0 || chartData.length === 1) return null; // Skip if only 1 value
                        
                        // Use recommended chart type if available
                        const recommendation = visualizationAnalysis?.field_recommendations?.[fieldId];
                        const recommendedChartType = recommendation?.chart_type || chartType;
                        
                        return (
                          <div key={fieldId} style={styles.chartCard}>
                            <h4 style={styles.chartCardTitle}>{fieldId}</h4>
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
                                    {chartData.map((entry, index) => (
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
                  <div style={styles.chartContainer}>
                    <h3 style={styles.chartTitle}>Chart: {chartField}</h3>
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
                            {getChartData().map((entry, index) => (
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
                  <div style={styles.resultsTable}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          {datastoreResults.fields?.map((field) => (
                            <th key={field.id} style={styles.tableHeader}>
                              {field.id}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {datastoreResults.records.map((record, idx) => (
                          <tr key={idx} style={styles.tableRow}>
                            {datastoreResults.fields?.map((field) => (
                              <td key={field.id} style={styles.tableCell}>
                                {String(record[field.id] ?? '')}
                              </td>
                            ))}
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
          <div style={styles.tabContent}>
            <div style={styles.inputSection}>
              <h2 style={styles.sectionTitle}>Social Aid Helper</h2>
              <p style={styles.sectionDescription}>
                Ask questions about social benefits, eligibility, or how to apply
              </p>
              <textarea
                value={socialAidQuestion}
                onChange={(e) => setSocialAidQuestion(e.target.value)}
                placeholder="e.g., Am I eligible for VMI? How do I apply for social assistance?"
                style={styles.textarea}
                rows={4}
              />
              <textarea
                value={socialAidContext}
                onChange={(e) => setSocialAidContext(e.target.value)}
                placeholder="Optional: Add context about your situation..."
                style={styles.textarea}
                rows={3}
              />
              <button
                onClick={handleExplainSocialAid}
                disabled={loading || !socialAidQuestion.trim()}
                style={{
                  ...styles.submitButton,
                  ...styles.socialAidButton,
                  ...(loading || !socialAidQuestion.trim() ? styles.submitButtonDisabled : {}),
                }}
              >
                {loading ? 'Getting Answer...' : 'Get Answer'}
              </button>
            </div>

            {socialAidExplanation && (
              <div style={styles.outputSection}>
                <h2 style={styles.sectionTitle}>Answer</h2>
                <div className="markdown-container" style={styles.markdownContainer}>
                  <ReactMarkdown>{socialAidExplanation}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Explorer Tab */}
        {activeTab === 'explorer' && (
          <div style={styles.tabContent}>
            <div style={styles.inputSection}>
              <h2 style={styles.sectionTitle}>Data Explorer</h2>
              <p style={styles.sectionDescription}>
                Search and explore datasets from data.gov.ro
              </p>
              <div style={styles.searchContainer}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search datasets (e.g., 'RO-ALERT', 'VMI', 'budget')..."
                  style={styles.searchInput}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchDatasets();
                    }
                  }}
                />
                <button
                  onClick={handleSearchDatasets}
                  disabled={explorerLoading}
                  style={{
                    ...styles.submitButton,
                    ...styles.explorerButton,
                    ...(explorerLoading ? styles.submitButtonDisabled : {}),
                  }}
                >
                  {explorerLoading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {datasets.length > 0 && (
              <div style={styles.datasetsList}>
                <h2 style={styles.sectionTitle}>Found {datasets.length} datasets</h2>
                {datasets.map((dataset, index) => (
                  <div
                    key={dataset.id || index}
                    style={styles.datasetCard}
                    onClick={() => dataset.id && handleDatasetClick(dataset.id)}
                  >
                    <h3 style={styles.datasetTitle}>{dataset.title || dataset.name || 'Untitled'}</h3>
                    {dataset.notes && (
                      <p style={styles.datasetNotes}>{dataset.notes.substring(0, 200)}...</p>
                    )}
                    {dataset.organization && (
                      <p style={styles.datasetOrg}>
                        📁 {dataset.organization.title || dataset.organization.name}
                      </p>
                    )}
                    {dataset.resources && dataset.resources.length > 0 && (
                      <p style={styles.datasetResources}>
                        📎 {dataset.resources.length} resource(s) available
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {selectedDataset && (
              <div style={styles.outputSection}>
                <button
                  onClick={() => {
                    setSelectedDataset(null);
                    setAggregatedView(null);
                  }}
                  style={styles.backButton}
                >
                  ← Back to results
                </button>
                <h2 style={styles.sectionTitle}>{selectedDataset.title || selectedDataset.name}</h2>
                
                {/* Aggregated View */}
                {aggregatedView && (
                  <div style={styles.aggregatedSection}>
                    <h3 style={styles.aggregatedTitle}>📊 Aggregated Analysis</h3>
                    {aggregatedView.resource && (
                      <p style={styles.resourceInfo}>
                        Analyzing: <strong>{aggregatedView.resource.name || 'Resource'}</strong> ({aggregatedView.resource.format})
                      </p>
                    )}
                    {explorerLoading ? (
                      <p style={styles.loadingText}>Analyzing dataset...</p>
                    ) : (
                      <div className="markdown-container" style={styles.markdownContainer}>
                        <ReactMarkdown>{aggregatedView.analysis}</ReactMarkdown>
                      </div>
                    )}
                    
                    {aggregatedView.structure && Object.keys(aggregatedView.structure).length > 0 && (
                      <div style={styles.structureSection}>
                        <h4 style={styles.structureTitle}>Data Structure</h4>
                        {aggregatedView.structure.headers && (
                          <div style={styles.structureInfo}>
                            <strong>Columns:</strong> {aggregatedView.structure.headers.join(', ')}
                          </div>
                        )}
                        {aggregatedView.structure.row_count !== undefined && (
                          <div style={styles.structureInfo}>
                            <strong>Rows analyzed:</strong> {aggregatedView.structure.row_count}
                          </div>
                        )}
                        {aggregatedView.structure.total_estimated_rows && (
                          <div style={styles.structureInfo}>
                            <strong>Total rows (estimated):</strong> {aggregatedView.structure.total_estimated_rows}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Dataset Description */}
                {selectedDataset.notes && (
                  <div style={styles.descriptionSection}>
                    <h3 style={styles.sectionSubtitle}>Description</h3>
                    <div className="markdown-container" style={styles.markdownContainer}>
                      <ReactMarkdown>{selectedDataset.notes}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* Resources */}
                {selectedDataset.resources && selectedDataset.resources.length > 0 && (
                  <div style={styles.resourcesSection}>
                    <h3 style={styles.sectionSubtitle}>Resources</h3>
                    {selectedDataset.resources.map((resource, index) => (
                      <div key={index} style={styles.resourceItem}>
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.resourceLink}
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
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  header: {
    padding: '2rem',
    color: 'white',
    textAlign: 'center',
    borderRadius: '8px 8px 0 0',
  },
  datastoreHeader: {
    backgroundColor: '#7b1fa2',
  },
  socialAidHeader: {
    backgroundColor: '#1976d2',
  },
  explorerHeader: {
    backgroundColor: '#388e3c',
  },
  headerTitle: {
    margin: '0 0 0.5rem 0',
    fontSize: '2rem',
    fontWeight: 'bold',
  },
  headerSubtitle: {
    margin: '0 0 1.5rem 0',
    fontSize: '1.1rem',
    opacity: 0.9,
  },
  controlsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  tabSelector: {
    display: 'flex',
    gap: '0.5rem',
  },
  tabButton: {
    padding: '0.5rem 1.5rem',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    transition: 'all 0.3s',
  },
  tabButtonActiveDatastore: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    border: '2px solid white',
  },
  tabButtonActiveSocialAid: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    border: '2px solid white',
  },
  tabButtonActiveExplorer: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    border: '2px solid white',
  },
  modelSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  modelLabel: {
    color: 'white',
    fontWeight: '500',
  },
  modelSelect: {
    padding: '0.5rem',
    borderRadius: '4px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    fontSize: '0.9rem',
  },
  content: {
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  errorBanner: {
    padding: '1rem',
    backgroundColor: '#ffebee',
    color: '#c62828',
    borderRadius: '4px',
    marginBottom: '1.5rem',
    border: '1px solid #ef5350',
  },
  tabContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  inputSection: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  },
  sectionTitle: {
    margin: '0 0 0.5rem 0',
    color: '#333',
    fontSize: '1.5rem',
  },
  sectionDescription: {
    margin: '0 0 1.5rem 0',
    color: '#666',
    fontSize: '1rem',
  },
  textarea: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    fontFamily: 'inherit',
    resize: 'vertical',
    marginBottom: '1rem',
    boxSizing: 'border-box',
  },
  submitButton: {
    padding: '0.75rem 2rem',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  datastoreButton: {
    backgroundColor: '#7b1fa2',
  },
  socialAidButton: {
    backgroundColor: '#1976d2',
  },
  explorerButton: {
    backgroundColor: '#388e3c',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  outputSection: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  },
  markdownContainer: {
    lineHeight: '1.6',
  },
  searchContainer: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
  },
  searchInput: {
    flex: 1,
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    fontFamily: 'inherit',
  },
  datasetsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  datasetCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  datasetTitle: {
    margin: '0 0 0.5rem 0',
    color: '#333',
    fontSize: '1.2rem',
  },
  datasetNotes: {
    margin: '0 0 0.5rem 0',
    color: '#666',
    fontSize: '0.9rem',
  },
  datasetOrg: {
    margin: '0.5rem 0',
    color: '#888',
    fontSize: '0.85rem',
  },
  datasetResources: {
    margin: '0.5rem 0 0 0',
    color: '#888',
    fontSize: '0.85rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    color: '#333',
    fontWeight: '500',
  },
  resourceIdInput: {
    marginBottom: '1.5rem',
  },
  resourceSelection: {
    marginBottom: '1rem',
  },
  resourceIdRow: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-end',
    marginTop: '1rem',
  },
  resourceIdSelect: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    fontFamily: 'inherit',
    backgroundColor: 'white',
    cursor: 'pointer',
    marginBottom: '0.5rem',
  },
  resourceIdInputField: {
    flex: 1,
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    fontFamily: 'inherit',
  },
  paginationControls: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1rem',
    marginTop: '0.5rem',
    padding: '0.5rem',
  },
  paginationButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#7b1fa2',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  paginationButtonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  paginationInfo: {
    fontSize: '0.9rem',
    color: '#666',
  },
  loadingText: {
    color: '#666',
    fontStyle: 'italic',
    padding: '1rem',
    textAlign: 'center',
  },
  resourceInfoBox: {
    marginTop: '1.5rem',
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    border: '1px solid #e9ecef',
  },
  resourceInfoTitle: {
    margin: '0 0 0.5rem 0',
    color: '#333',
    fontSize: '1.1rem',
  },
  infoHint: {
    margin: '0.5rem 0 0 0',
    fontSize: '0.85rem',
    color: '#388e3c',
    fontStyle: 'italic',
  },
  queryModeSelector: {
    marginTop: '1.5rem',
    marginBottom: '1rem',
  },
  radioGroup: {
    display: 'flex',
    gap: '1.5rem',
    marginTop: '0.5rem',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
  },
  filterSection: {
    marginTop: '1rem',
  },
  filterRow: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
  },
  filterField: {
    flex: 1,
  },
  selectField: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    fontFamily: 'inherit',
  },
  inputField: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    fontFamily: 'inherit',
  },
  paginationRow: {
    display: 'flex',
    gap: '1rem',
  },
  paginationField: {
    flex: 1,
  },
  numberInput: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    fontFamily: 'inherit',
  },
  textSearchSection: {
    marginTop: '1rem',
  },
  sqlSection: {
    marginTop: '1rem',
  },
  sqlHint: {
    marginTop: '0.5rem',
    fontSize: '0.9rem',
    color: '#666',
    fontStyle: 'italic',
  },
  dashboardControls: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
  },
  chartTypeSelector: {
    flex: 1,
  },
  chartFieldSelector: {
    flex: 1,
  },
  chartContainer: {
    marginTop: '1.5rem',
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
  },
  chartTitle: {
    margin: '0 0 1rem 0',
    color: '#333',
    fontSize: '1.2rem',
    fontWeight: '600',
  },
  autoChartsContainer: {
    marginTop: '1.5rem',
    padding: '1.5rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '2px solid #7b1fa2',
  },
  autoChartsTitle: {
    margin: '0 0 1.5rem 0',
    color: '#333',
    fontSize: '1.3rem',
    fontWeight: '600',
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '1.5rem',
  },
  chartCard: {
    backgroundColor: 'white',
    padding: '1rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e9ecef',
  },
  chartCardTitle: {
    margin: '0 0 0.75rem 0',
    color: '#333',
    fontSize: '1rem',
    fontWeight: '600',
    textAlign: 'center',
  },
  autoVisualizeToggle: {
    display: 'flex',
    alignItems: 'center',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.9rem',
    color: '#333',
  },
  analysisSection: {
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    border: '1px solid #dee2e6',
  },
  analyzeButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#7b1fa2',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '1rem',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  analysisResults: {
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: '#e8f5e9',
    borderRadius: '4px',
    border: '1px solid #4caf50',
  },
  analysisTitle: {
    margin: '0 0 0.75rem 0',
    color: '#2e7d32',
    fontSize: '1rem',
    fontWeight: '600',
  },
  recommendationsList: {
    marginTop: '0.75rem',
    marginBottom: '0.75rem',
  },
  recommendationItem: {
    margin: '0.5rem 0',
    fontSize: '0.85rem',
    color: '#555',
    padding: '0.5rem',
    backgroundColor: 'white',
    borderRadius: '4px',
  },
  visualizeButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#388e3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '0.5rem',
  },
  analysisBadge: {
    fontSize: '0.85rem',
    color: '#666',
    fontWeight: 'normal',
    fontStyle: 'italic',
  },
  resultsTable: {
    overflowX: 'auto',
    marginTop: '1rem',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.9rem',
  },
  tableHeader: {
    padding: '0.75rem',
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    textAlign: 'left',
    fontWeight: '600',
    color: '#333',
  },
  tableRow: {
    borderBottom: '1px solid #dee2e6',
  },
  tableCell: {
    padding: '0.75rem',
    border: '1px solid #dee2e6',
    maxWidth: '300px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  backButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#f5f5f5',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
    marginBottom: '1rem',
    fontSize: '0.9rem',
  },
  resourcesSection: {
    marginTop: '1.5rem',
  },
  resourceItem: {
    margin: '0.5rem 0',
  },
  resourceLink: {
    color: '#1976d2',
    textDecoration: 'none',
  },
  aggregatedSection: {
    marginBottom: '2rem',
    padding: '1.5rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '2px solid #388e3c',
  },
  aggregatedTitle: {
    margin: '0 0 1rem 0',
    color: '#333',
    fontSize: '1.3rem',
    fontWeight: '600',
  },
  resourceInfo: {
    margin: '0 0 1rem 0',
    color: '#666',
    fontSize: '0.9rem',
  },
  structureSection: {
    marginTop: '1.5rem',
    padding: '1rem',
    backgroundColor: 'white',
    borderRadius: '4px',
    border: '1px solid #ddd',
  },
  structureTitle: {
    margin: '0 0 0.75rem 0',
    color: '#333',
    fontSize: '1.1rem',
    fontWeight: '600',
  },
  structureInfo: {
    margin: '0.5rem 0',
    color: '#555',
    fontSize: '0.9rem',
  },
  descriptionSection: {
    marginTop: '2rem',
    marginBottom: '1.5rem',
  },
  sectionSubtitle: {
    margin: '0 0 1rem 0',
    color: '#333',
    fontSize: '1.2rem',
    fontWeight: '600',
  },
};

