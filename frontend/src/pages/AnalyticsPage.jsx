import { useEffect, useState } from 'react'
import { TrendingUp, AlertTriangle, Package, Sprout } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import Card from '../components/ui/Card'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

function KPICard({ title, value, icon: Icon, color, subtext }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
      </div>
    </Card>
  )
}

export default function AnalyticsPage() {
  const [overview, setOverview] = useState(null)
  const [soilTrends, setSoilTrends] = useState(null)
  const [stockValue, setStockValue] = useState(null)
  const [activitySummary, setActivitySummary] = useState(null)
  const [parcelleKpi, setParcelleKpi] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [overviewRes, soilRes, stockRes, activityRes, parcelleRes] = await Promise.all([
          fetch('/api/analytics/overview'),
          fetch('/api/analytics/soil-trends?days=30'),
          fetch('/api/analytics/stock-value'),
          fetch('/api/analytics/activity-summary?days=7'),
          fetch('/api/analytics/parcelle-kpi'),
        ])
        setOverview(await overviewRes.json())
        setSoilTrends(await soilRes.json())
        setStockValue(await stockRes.json())
        setActivitySummary(await activityRes.json())
        setParcelleKpi(await parcelleRes.json())
      } catch (err) {
        console.error('Erreur analytics:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  // Préparer données pour graphiques
  const soilChartData = soilTrends?.data?.slice(-10).map(d => ({
    date: d.date.slice(5),
    pH: d.ph,
    Azote: d.nitrogen,
    'Phosphore': d.phosphorus,
    'Potassium': d.potassium,
    Humidité: d.humidity,
  })) || []

  const stockChartData = stockValue?.categories?.map(c => ({
    name: c.category,
    valeur: c.total_value,
    quantité: c.total_quantity,
  })) || []

  const activityChartData = activitySummary?.by_action?.map(a => ({
    name: a.action,
    count: a.count,
  })) || []

  const parcelleChartData = parcelleKpi?.parcelles?.slice(0, 5).map(p => ({
    name: p.name || p.parcelle_id,
    analyses: p.soil_analysis_count,
    activités: p.activity_count,
  })) || []

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Parcelles"
          value={overview?.total_parcelles || 0}
          icon={Sprout}
          color="bg-green-600"
          subtext={`${overview?.alert_parcels || 0} avec alertes`}
        />
        <KPICard
          title="Analyses de sol"
          value={overview?.total_soil_analyses || 0}
          icon={TrendingUp}
          color="bg-blue-600"
        />
        <KPICard
          title="Valeur du stock"
          value={`${(overview?.total_stock_value || 0).toFixed(0)} FCFA`}
          icon={Package}
          color="bg-amber-600"
        />
        <KPICard
          title="Activités (7j)"
          value={overview?.recent_activities || 0}
          icon={AlertTriangle}
          color="bg-purple-600"
        />
      </div>

      {/* Graphique évolution sols */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution des analyses de sol (30 jours)</h3>
        <div className="h-80">
          {soilChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={soilChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="pH" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="Azote" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="Phosphore" stroke="#f59e0b" strokeWidth={2} />
                <Line type="monotone" dataKey="Potassium" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="Humidité" stroke="#8b5cf6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Aucune donnée d'analyse de sol
            </div>
          )}
        </div>
      </Card>

      {/* Graphique stocks par catégorie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Valeur du stock par catégorie</h3>
          <div className="h-64">
            {stockChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="valeur" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Aucune donnée de stock
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activités récentes (7 jours)</h3>
          <div className="h-64">
            {activityChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activityChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, count }) => `${name}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {activityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Aucune activité récente
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Tableau KPI parcelles */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance par parcelle</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parcelle</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Culture</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Surface (ha)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Analyses</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activités</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">pH</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {parcelleKpi?.parcelles?.map((p, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.name || p.parcelle_id}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.crop || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.area_ha || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.soil_analysis_count}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.activity_count}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.last_ph?.toFixed(1) || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      p.soil_status === 'ok' ? 'bg-green-100 text-green-800' :
                      p.soil_status === 'dry' ? 'bg-amber-100 text-amber-800' :
                      p.soil_status === 'acid' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {p.soil_status}
                    </span>
                  </td>
                </tr>
              ))}
              {(!parcelleKpi?.parcelles || parcelleKpi.parcelles.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Aucune parcelle enregistrée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
