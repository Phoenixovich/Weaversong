import React, { useState } from 'react'
import AlertInput from '../components/CityPulse/AlertInput'
import AlertList from '../components/CityPulse/AlertList'

export const CityPulse: React.FC = () => {
  const [view, setView] = useState<'list' | 'map'>('list')

  return (
    <div className="citypulse-page container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">CityPulse</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-3">
          <AlertInput />
          <div className="mt-4">
            <AlertList view={view} onViewChange={(v) => setView(v)} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default CityPulse
