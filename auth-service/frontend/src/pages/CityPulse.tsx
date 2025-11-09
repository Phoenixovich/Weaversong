import React, { useState } from 'react'
import AlertInput from '../components/CityPulse/AlertInput'
import AlertList from '../components/CityPulse/AlertList'

export const CityPulse: React.FC = () => {
  const [view, setView] = useState<'list' | 'map'>('list')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            CityPulse
          </h1>
          <p className="text-gray-600">
            Community incident reporting platform for Bucharest
          </p>
        </header>

        <AlertInput />
        <AlertList view={view} onViewChange={setView} />
      </div>
    </div>
  )
}

export default CityPulse
