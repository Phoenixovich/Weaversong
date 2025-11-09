import { useState } from 'react'
import AlertInput from './components/AlertInput'
import AlertList from './components/AlertList'

function App() {
  const [view, setView] = useState<'list' | 'map'>('list')

  return (
    <div className="min-h-screen bg-background-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 gradient-text">
            CityPulse
          </h1>
          <p className="text-xl text-gray-600">
            Community incident reporting platform for Bucharest
          </p>
        </header>

        <AlertInput />
        <AlertList view={view} onViewChange={setView} />
      </div>
    </div>
  )
}

export default App

