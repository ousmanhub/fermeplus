import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table.jsx'
import { CloudRain, MapPin } from 'lucide-react'

const API = '/api'

export default function WeatherPage() {
  const [location, setLocation] = useState('Ndjamena')
  const [weather, setWeather] = useState([])

  const fetchList = async () => {
    const res = await fetch(`${API}/weather/`)
    if (res.ok) setWeather(await res.json())
  }

  useEffect(() => { fetchList() }, [])

  const handleFetch = async () => {
    const res = await fetch(`${API}/weather/${encodeURIComponent(location)}`)
    if (res.ok) {
      fetchList()
    } else {
      alert('Clé OpenWeather non configurée ou ville introuvable')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CloudRain className="w-5 h-5 text-blue-600" />
            <CardTitle>Météo locale</CardTitle>
          </div>
          <CardDescription>Rafraîchissez les données pour la localisation choisie.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 border rounded-lg px-3 py-2 flex-1">
              <MapPin className="w-4 h-4 text-gray-400" />
              <input className="outline-none w-full" value={location} onChange={e => setLocation(e.target.value)} />
            </div>
            <Button onClick={handleFetch}>Rafraîchir</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historique météo</CardTitle>
          <CardDescription>{weather.length} point{weather.length > 1 ? 's' : ''} météo</CardDescription>
        </CardHeader>
        <CardContent>
          {weather.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lieu</TableHead>
                  <TableHead>Température</TableHead>
                  <TableHead>Humidité</TableHead>
                  <TableHead>Vent</TableHead>
                  <TableHead>Pluie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weather.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">{w.location}</TableCell>
                    <TableCell>{w.temperature}°C</TableCell>
                    <TableCell>{w.humidity}%</TableCell>
                    <TableCell>{w.wind_speed} m/s</TableCell>
                    <TableCell>{w.rainfall} mm</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-gray-500">Aucune donnée météo. Configurez OPENWEATHER_API_KEY pour activer.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
