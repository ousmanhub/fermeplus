import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { Bell, AlertTriangle, Droplets, Bug, Wifi } from 'lucide-react'

const API = '/api'

const categoryIcons = {
  sol: Droplets,
  maladie: Bug,
  iot: Wifi,
}

const levelColors = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  warning: 'bg-amber-100 text-amber-800 border-amber-200',
  medium: 'bg-orange-100 text-orange-800 border-orange-200',
  low: 'bg-blue-100 text-blue-800 border-blue-200',
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/alerts/`)
      .then((res) => res.json())
      .then((data) => {
        setAlerts(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const counts = alerts.reduce((acc, a) => {
    acc[a.level] = (acc[a.level] || 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-red-600">{counts.critical || 0}</p>
            <p className="text-sm text-gray-500">Critiques</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-amber-600">{counts.warning || 0}</p>
            <p className="text-sm text-gray-500">Avertissements</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-orange-600">{counts.medium || 0}</p>
            <p className="text-sm text-gray-500">Moyennes</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-blue-600">{counts.low || 0}</p>
            <p className="text-sm text-gray-500">Infos</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-red-600" />
            <CardTitle>Alertes actives</CardTitle>
          </div>
          <CardDescription>{loading ? 'Chargement...' : `${alerts.length} alerte${alerts.length > 1 ? 's' : ''}`}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {alerts.map((alert) => {
            const Icon = categoryIcons[alert.category] || AlertTriangle
            return (
              <div key={`${alert.category}-${alert.parcelle_id}-${alert.created_at}`} className={`flex items-start gap-3 border rounded-lg p-4 ${levelColors[alert.level] || 'bg-gray-50'}`}>
                <div className="bg-white/60 p-2 rounded-lg">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{alert.message}</p>
                  <p className="text-xs mt-1 opacity-80">
                    {new Date(alert.created_at).toLocaleString('fr-FR')} • {alert.parcelle_id}
                  </p>
                </div>
                <Badge variant="outline" className="uppercase text-xs">{alert.level}</Badge>
              </div>
            )
          })}
          {alerts.length === 0 && !loading && <p className="text-gray-500">Aucune alerte active. Tout va bien ! 🌱</p>}
        </CardContent>
      </Card>
    </div>
  )
}
