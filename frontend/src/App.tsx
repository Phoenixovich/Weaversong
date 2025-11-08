import AlertInput from './components/AlertInput'
import AlertList from './components/AlertList'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            LocalVoice / KidSafe Alerts
          </h1>
          <p className="text-gray-600">
            Community incident reporting platform for Bucharest
          </p>
        </header>

        <AlertInput />
        <AlertList />
      </div>
    </div>
  )
}

export default App

