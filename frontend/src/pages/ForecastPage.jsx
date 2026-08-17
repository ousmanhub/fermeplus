import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.jsx'
import { Button } from '../components/ui/Button.jsx'
import { CloudRain, MapPin, Thermometer, Droplets } from 'lucide-react'

const API = '/api'

export default function ForecastPage() {
  const [location, setLocation] = useState('Ndjamena')
  const [forecast, setForecast] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchForecast = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/weather/forecast/${encodeURIComponent(location)}`)
      if (!res.ok) throw new Error('Clé OpenWeather non configurée ou ville introuvable')
      setForecast(await res.json())
    } catch (err) {
      setError(err.message)
      setForecast([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchForecast()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CloudRain className="w-5 h-5 text-blue-600" />
            <CardTitle>Prévisions météo 5 jours</CardTitle>
          </div>
          <CardDescription>Anticipez semis, irrigation et protection des cultures.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 border rounded-lg px-3 py-2 flex-1">
              <MapPin className="w-4 h-4 text-gray-400" />
              <input className="outline-none w-full" value={location} onChange={e => setLocation(e.target.value)} />
            </div>
            <Button onClick={fetchForecast} disabled={loading}>
              {loading ? 'Chargement...' : 'Actualiser'}
            </Button>
          </div>
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {forecast.map((day) => (
          <Card key={day.date} className="text-center">
            <CardContent className="pt-6 space-y-3">
              <p className="font-semibold text-gray-900">
                {new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
              </p>
              <img
                src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`}
                alt={day.description}
                className="w-16 h-16 mx-auto"
              />
              <p className="text-sm text-gray-600 capitalize">{day.description}</p>
              <div className="flex items-center justify-center gap-1 text-sm">
                <Thermometer className="w-4 h-4 text-red-500" />
                <span>{day.temp_min}° / {day.temp_max}°</span>
              </div>
              <div className="flex items-center justify-center gap-1 text-sm">
                <Droplets className="w-4 h-4 text-blue-500" />
                <span>{day.rainfall} mm</span>
              </div>
              <p className="text-xs text-gray-500">Humidité {day.humidity}%</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
