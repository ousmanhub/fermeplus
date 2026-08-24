import { useState, useEffect } from 'react'
import { Leaf, Bug, CloudRain, Wifi, Sprout, LayoutDashboard, Bell, Droplets, Calendar, Package, MessageSquare, History, MapPin, ChevronLeft, ChevronRight, LogOut, TrendingUp, Radio } from 'lucide-react'
import LoginPage from './pages/LoginPage.jsx'
import { useAuth } from './lib/auth.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import SoilPage from './pages/SoilPage.jsx'
import DiseasePage from './pages/DiseasePage.jsx'
import WeatherPage from './pages/WeatherPage.jsx'
import IoTPage from './pages/IoTPage.jsx'
import ForecastPage from './pages/ForecastPage.jsx'
import AlertsPage from './pages/AlertsPage.jsx'
import IrrigationPage from './pages/IrrigationPage.jsx'
import CalendarPage from './pages/CalendarPage.jsx'
import StockPage from './pages/StockPage.jsx'
import ChatPage from './pages/ChatPage.jsx'
import ActivityPage from './pages/ActivityPage.jsx'
import MapPage from './pages/MapPage.jsx'
import AnalyticsPage from './pages/AnalyticsPage.jsx'
import MeshPage from './pages/MeshPage.jsx'

const tabs = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, color: 'text-gray-700', group: 'Vue d\'ensemble' },
  { id: 'map', label: 'Carte des parcelles', icon: MapPin, color: 'text-emerald-600', group: 'Vue d\'ensemble' },
  { id: 'analytics', label: 'Analyses', icon: TrendingUp, color: 'text-indigo-600', group: 'Vue d\'ensemble' },
  { id: 'soil', label: 'Sols', icon: Leaf, color: 'text-green-600', group: 'Terrain' },
  { id: 'disease', label: 'Maladies', icon: Bug, color: 'text-red-600', group: 'Terrain' },
  { id: 'iot', label: 'Capteurs IoT', icon: Wifi, color: 'text-purple-600', group: 'Terrain' },
  { id: 'mesh', label: 'Mesh off-grid', icon: Radio, color: 'text-teal-600', group: 'Terrain' },
  { id: 'weather', label: 'Météo actuelle', icon: CloudRain, color: 'text-blue-600', group: 'Décisions' },
  { id: 'forecast', label: 'Prévisions 5 jours', icon: Calendar, color: 'text-indigo-600', group: 'Décisions' },
  { id: 'irrigation', label: 'Plan irrigation', icon: Droplets, color: 'text-cyan-600', group: 'Décisions' },
  { id: 'alerts', label: 'Alertes', icon: Bell, color: 'text-amber-600', group: 'Décisions' },
  { id: 'calendar', label: 'Calendrier', icon: Calendar, color: 'text-emerald-600', group: 'Gestion' },
  { id: 'stock', label: 'Stocks', icon: Package, color: 'text-orange-600', group: 'Gestion' },
  { id: 'activity', label: 'Journal', icon: History, color: 'text-slate-600', group: 'Gestion' },
  { id: 'chat', label: 'Assistant', icon: MessageSquare, color: 'text-pink-600', group: 'Aide' },
]

function App() {
  const { user, loading, logout } = useAuth()
  const [active, setActive] = useState('dashboard')
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      // déjà géré par le render conditionnel
    }
  }, [user, loading])

  if (loading) return null
  if (!user) return <LoginPage />

  const grouped = tabs.reduce((acc, tab) => {
    if (!acc[tab.group]) acc[tab.group] = []
    acc[tab.group].push(tab)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className={`bg-white border-r flex flex-col transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
        <div className="p-4 border-b flex items-center gap-3">
          <div className="bg-green-100 p-2 rounded-lg shrink-0">
            <Sprout className="w-6 h-6 text-green-700" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-lg font-bold text-gray-900 truncate">Ferme+</h1>
              <p className="text-xs text-gray-500 truncate">Agriculture connectée</p>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-6">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              {!collapsed && <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">{group}</p>}
              <div className="space-y-1">
                {items.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActive(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                        active === tab.id
                          ? 'bg-green-50 text-green-800 shadow-sm ring-1 ring-green-100'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                      title={collapsed ? tab.label : ''}
                    >
                      <Icon className={`w-5 h-5 shrink-0 ${tab.color}`} />
                      {!collapsed && <span className="truncate">{tab.label}</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition"
            title={collapsed ? 'Déconnexion' : ''}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="mt-2 w-full p-2 border rounded-lg hover:bg-gray-50 flex items-center justify-center text-gray-500"
            title={collapsed ? 'Étendre' : 'Réduire'}
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-4 md:p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{tabs.find((t) => t.id === active)?.label}</h2>
            <p className="text-sm text-gray-500">{tabs.find((t) => t.id === active)?.group}</p>
          </div>

          {active === 'dashboard' && <DashboardPage onTabChange={setActive} />}
          {active === 'map' && <MapPage />}
          {active === 'analytics' && <AnalyticsPage />}
          {active === 'soil' && <SoilPage />}
          {active === 'disease' && <DiseasePage />}
          {active === 'weather' && <WeatherPage />}
          {active === 'forecast' && <ForecastPage />}
          {active === 'iot' && <IoTPage />}
          {active === 'mesh' && <MeshPage />}
          {active === 'irrigation' && <IrrigationPage />}
          {active === 'alerts' && <AlertsPage />}
          {active === 'calendar' && <CalendarPage />}
          {active === 'stock' && <StockPage />}
          {active === 'chat' && <ChatPage />}
          {active === 'activity' && <ActivityPage />}
        </div>
      </main>
    </div>
  )
}

export default App
