import { useState } from 'react'
import { Leaf, Bug, CloudRain, Wifi, Sprout, LayoutDashboard, Bell, Droplets, Calendar } from 'lucide-react'
import DashboardPage from './pages/DashboardPage.jsx'
import SoilPage from './pages/SoilPage.jsx'
import DiseasePage from './pages/DiseasePage.jsx'
import WeatherPage from './pages/WeatherPage.jsx'
import IoTPage from './pages/IoTPage.jsx'
import ForecastPage from './pages/ForecastPage.jsx'
import AlertsPage from './pages/AlertsPage.jsx'
import IrrigationPage from './pages/IrrigationPage.jsx'

const tabs = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, color: 'text-gray-700' },
  { id: 'soil', label: 'Sols', icon: Leaf, color: 'text-green-600' },
  { id: 'disease', label: 'Maladies', icon: Bug, color: 'text-red-600' },
  { id: 'weather', label: 'Météo', icon: CloudRain, color: 'text-blue-600' },
  { id: 'forecast', label: 'Prévisions', icon: Calendar, color: 'text-indigo-600' },
  { id: 'iot', label: 'IoT', icon: Wifi, color: 'text-purple-600' },
  { id: 'irrigation', label: 'Irrigation', icon: Droplets, color: 'text-cyan-600' },
  { id: 'alerts', label: 'Alertes', icon: Bell, color: 'text-amber-600' },
]

function App() {
  const [active, setActive] = useState('dashboard')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="bg-green-100 p-2 rounded-lg">
            <Sprout className="w-6 h-6 text-green-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Ferme+</h1>
            <p className="text-xs text-gray-500">Agriculture connectée</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4">
        <nav className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActive(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                  active === tab.id
                    ? 'bg-white shadow text-gray-900 ring-1 ring-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className={`w-4 h-4 ${tab.color}`} />
                {tab.label}
              </button>
            )
          })}
        </nav>

        {active === 'dashboard' && <DashboardPage onTabChange={setActive} />}
        {active === 'soil' && <SoilPage />}
        {active === 'disease' && <DiseasePage />}
        {active === 'weather' && <WeatherPage />}
        {active === 'forecast' && <ForecastPage />}
        {active === 'iot' && <IoTPage />}
        {active === 'irrigation' && <IrrigationPage />}
        {active === 'alerts' && <AlertsPage />}
      </main>
    </div>
  )
}

export default App
