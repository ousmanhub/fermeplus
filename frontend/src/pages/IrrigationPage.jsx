import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { Droplets, MapPin, Clock, CloudRain } from 'lucide-react'

const API = '/api'

const priorityColors = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  low: 'bg-green-100 text-green-800 border-green-200',
}

export default function IrrigationPage() {
  const [location, setLocation] = useState('Ndjamena')
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchPlan = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/irrigation/plan/${encodeURIComponent(location)}`)
      if (!res.ok) throw new Error('Erreur de calcul du plan')
      setPlans(await res.json())
    } catch (err) {
      setError(err.message)
      setPlans([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlan()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-blue-600" />
            <CardTitle>Plan d'irrigation intelligent</CardTitle>
          </div>
          <CardDescription>Basé sur l'humidité du sol et les prévisions de pluie.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 border rounded-lg px-3 py-2 flex-1">
              <MapPin className="w-4 h-4 text-gray-400" />
              <input className="outline-none w-full" value={location} onChange={e => setLocation(e.target.value)} />
            </div>
            <button onClick={fetchPlan} disabled={loading} className="bg-green-600 text-white rounded-lg px-4 py-2 disabled:opacity-50">
              {loading ? 'Calcul...' : 'Calculer'}
            </button>
          </div>
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.map((plan) => (
          <Card key={plan.parcelle_id} className={`border-l-4 ${priorityColors[plan.priority].replace('bg-', 'border-').split(' ')[0]}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-blue-600" />
                  <CardTitle>Parcelle {plan.parcelle_id}</CardTitle>
                </div>
                <Badge className={priorityColors[plan.priority]}>{plan.priority}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-700">{plan.recommendation}</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500">Humidité sol</p>
                  <p className="text-lg font-semibold">{plan.soil_humidity}%</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-1 text-gray-500">
                    <CloudRain className="w-3 h-3" /> Pluie 3j
                  </div>
                  <p className="text-lg font-semibold">{plan.rain_next_3_days} mm</p>
                </div>
              </div>
              {plan.suggested_duration_minutes > 0 && (
                <div className="flex items-center gap-2 bg-blue-50 text-blue-800 rounded-lg p-3">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">Durée suggérée : {plan.suggested_duration_minutes} minutes</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
