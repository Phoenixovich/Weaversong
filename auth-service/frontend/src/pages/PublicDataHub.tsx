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
  const [predefinedResources, setPredefinedResources] = useState<Array<{
    id: string;
    name: string;
    description: string;
    dataset_title: string;
  }>>([]);
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
  const [limit, setLimit] = useState(100);
  const [offset, setOffset] = useState(0);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'table'>('table');
  const [chartField, setChartField] = useState('');

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

  const loadPredefinedResources = async () => {
    try {
      const response = await publicDataAPI.getPredefinedResources();
      setPredefinedResources(response.resources);
    } catch (err: any) {
      console.error('Error loading predefined resources:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'datastore') {
      loadPredefinedResources();
    }
  }, [activeTab]);

  const handleLoadResourceInfo = async () => {
    if (!resourceId.trim()) {
      setError('Please enter a resource ID');
      return;
    }

    setLoading(true);
    setError('');
    setResourceInfo(null);
    setDatastoreResults(null);

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
        setDatastoreResults(result);
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
  const getChartData = () => {
    if (!datastoreResults || !chartField || !datastoreResults.records.length) return [];

    // Count occurrences or sum values by field
    const fieldData: Record<string, number> = {};
    
    datastoreResults.records.forEach((record) => {
      const value = record[chartField];
      if (value !== null && value !== undefined) {
        const key = String(value);
        fieldData[key] = (fieldData[key] || 0) + 1;
      }
    });

    return Object.entries(fieldData)
      .map(([name, value]) => ({ name: name.length > 20 ? name.substring(0, 20) + '...' : name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 20); // Top 20 items
  };

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
                <div style={styles.resourceIdRow}>
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
                    <option value="">Select a predefined resource...</option>
                    {predefinedResources.length > 0 ? (
                      predefinedResources.map((resource) => (
                        <option key={resource.id} value={resource.id}>
                          {resource.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>Loading resources...</option>
                    )}
                  </select>
                  <input
                    id="resource-id"
                    type="text"
                    value={resourceId}
                    onChange={(e) => setResourceId(e.target.value)}
                    placeholder="Or enter custom resource ID..."
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
                      <option value="table">Table</option>
                      <option value="bar">Bar Chart</option>
                      <option value="line">Line Chart</option>
                      <option value="pie">Pie Chart</option>
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
                </div>

                {/* Charts */}
                {chartType !== 'table' && chartField && (
                  <div style={styles.chartContainer}>
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
  resourceIdRow: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-end',
    marginBottom: '0.5rem',
  },
  resourceIdSelect: {
    flex: 1,
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    fontFamily: 'inherit',
    backgroundColor: 'white',
    cursor: 'pointer',
  },
  resourceIdInputField: {
    flex: 1,
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    fontFamily: 'inherit',
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
  loadingText: {
    color: '#666',
    fontStyle: 'italic',
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

