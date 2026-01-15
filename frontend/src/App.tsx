import { useState } from 'react'
import './App.css'
import EWasteForm from './components/EWasteForm'
import Results from './components/Results'
import type { EWasteData, AnalysisResult } from './types'

function App() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)

  const handleFormSubmit = async (_data: EWasteData) => {
    setIsAnalyzing(true)

    // Simulate API call - Replace this with actual Gemini API integration
    // In real implementation, you would send 'data' to the Gemini API here
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Mock result for demonstration
    const mockResult: AnalysisResult = {
      totalEstimatedValue: "$450 - $850",
      summary: "The analyzed e-waste shows significant economic potential through material recovery and refurbishment opportunities.",
      environmentalImpact: "Proper recycling can prevent 125kg of CO2 emissions and recover valuable materials.",
      opportunities: [
        {
          category: "Precious Metals Recovery",
          estimatedValue: "$200 - $350",
          materials: ["Gold", "Silver", "Copper", "Palladium"],
          recyclingPotential: "High potential for precious metal extraction from circuit boards and connectors.",
          recommendations: [
            "Partner with certified e-waste recyclers specializing in precious metal recovery",
            "Consider bulk processing for better extraction rates",
            "Separate high-value components before processing"
          ]
        },
        {
          category: "Component Refurbishment",
          estimatedValue: "$150 - $300",
          materials: ["RAM", "Storage Drives", "Processors", "Power Supplies"],
          recyclingPotential: "Working components can be tested, cleaned, and resold in secondary markets.",
          recommendations: [
            "Test all components for functionality",
            "Partner with refurbishment facilities",
            "Explore markets for refurbished electronics"
          ]
        },
        {
          category: "Base Materials",
          estimatedValue: "$100 - $200",
          materials: ["Aluminum", "Steel", "Plastic", "Glass"],
          recyclingPotential: "Bulk materials can be recycled through standard metal and plastic recycling streams.",
          recommendations: [
            "Sort materials by type for better recycling rates",
            "Partner with local metal recyclers",
            "Explore plastic recycling programs"
          ]
        }
      ]
    }

    setAnalysisResult(mockResult)
    setIsAnalyzing(false)
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
