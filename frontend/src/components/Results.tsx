import type { AnalysisResult } from '../types';
import './Results.css';

interface ResultsProps {
  result: AnalysisResult;
  onNewAnalysis: () => void;
}

function Results({ result, onNewAnalysis }: ResultsProps) {
  return (
    <div className="results-container">
      <div className="results-header">
        <h2>Economic Opportunity Analysis</h2>
        <button onClick={onNewAnalysis} className="new-analysis-button">
          New Analysis
        </button>
      </div>

      <div className="results-summary">
        <div className="summary-card total-value">
          <div className="card-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="card-content">
            <h3>Total Estimated Value</h3>
            <p className="value-amount">{result.totalEstimatedValue}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="card-content">
            <h3>Summary</h3>
            <p>{result.summary}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="card-content">
            <h3>Environmental Impact</h3>
            <p>{result.environmentalImpact}</p>
          </div>
        </div>
      </div>

      <div className="opportunities-section">
        <h3>Economic Opportunities</h3>
        <div className="opportunities-grid">
          {result.opportunities.map((opportunity, index) => (
            <div key={index} className="opportunity-card">
              <div className="opportunity-header">
                <h4>{opportunity.category}</h4>
                <span className="opportunity-value">{opportunity.estimatedValue}</span>
              </div>

              <div className="opportunity-section">
                <h5>Recoverable Materials</h5>
                <div className="materials-list">
                  {opportunity.materials.map((material, idx) => (
                    <span key={idx} className="material-tag">{material}</span>
                  ))}
                </div>
              </div>

              <div className="opportunity-section">
                <h5>Recycling Potential</h5>
                <p className="recycling-potential">{opportunity.recyclingPotential}</p>
              </div>

              <div className="opportunity-section">
                <h5>Recommendations</h5>
                <ul className="recommendations-list">
                  {opportunity.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Results;
