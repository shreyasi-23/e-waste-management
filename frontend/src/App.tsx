import { useState } from 'react'
import './App.css'
import EWasteForm from './components/EWasteForm'
import Results from './components/Results'
import type { EWasteData, AnalysisResult } from './types'
import { analyzeEWaste } from './services/api'

function App() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)

  const handleFormSubmit = async (data: EWasteData) => {
    setIsAnalyzing(true)

    try {
      const result = await analyzeEWaste(data)
      setAnalysisResult(result)
    } catch (error) {
      console.error('Failed to analyze e-waste:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleNewAnalysis = () => {
    setAnalysisResult(null)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo-container">
            <svg className="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            <h1>E-Waste Valuation Platform</h1>
          </div>
          <p className="tagline">Discover Economic Opportunities in Electronic Waste</p>
        </div>
      </header>

      <main className="app-main">
        {!analysisResult ? (
          <EWasteForm onSubmit={handleFormSubmit} isAnalyzing={isAnalyzing} />
        ) : (
          <Results result={analysisResult} onNewAnalysis={handleNewAnalysis} />
        )}
      </main>

      <footer className="app-footer">
        <p>Powered by AI Analysis | Supporting Sustainable E-Waste Management</p>
      </footer>
    </div>
  )
}

export default App
