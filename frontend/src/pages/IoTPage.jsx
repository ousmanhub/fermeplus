import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Wifi, Activity, Download } from 'lucide-react'

const API = '/api'

export default function IoTPage() {
  const [parcelle, setParcelle] = useState('P1')
  const [history, setHistory] = useState([])
  const [form, setForm] = useState({ sensor_id: '', sensor_type: '', value: '', unit: '' })

  const fetchHistory = async () => {
    const res = await fetch(`${API}/iot/history/${parcelle}?hours=48`)
    if (res.ok) setHistory(await res.json())
  }

  useEffect(() => { fetchHistory() }, [parcelle])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const body = {
      sensor_id: form.sensor_id,
      parcelle_id: parcelle,
      sensor_type: form.sensor_type,
      value: parseFloat(form.value),
      unit: form.unit,
    }
    const res = await fetch(`${API}/iot/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      setForm({ sensor_id: '', sensor_type: '', value: '', unit: '' })
      fetchHistory()
    }
  }

  // Préparer données pour graphique : grouper par timestamp
  const chartData = history.reduce((acc, item) => {
    const time = new Date(item.timestamp).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    const existing = acc.find((d) => d.time === time)
    if (existing) {
      existing[item.sensor_type] = item.value
    } else {
      acc.push({ time, [item.sensor_type]: item.value })
    }
    return acc
  }, [])
  .slice()
  .reverse()

  // Regrouper par type
  const grouped = history.reduce((acc, item) => {
    if (!acc[item.sensor_type]) acc[item.sensor_type] = []
    acc[item.sensor_type].push(item)
    return acc
  }, {})

  const sensorTypes = Object.keys(grouped)
  const colors = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444']

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wifi className="w-5 h-5 text-purple-600" />
            <CardTitle>Ingestion capteur</CardTitle>
          </div>
          <CardDescription>Simulez ou envoyez une mesure depuis un capteur connecté.</CardDescription>
        </CardHeader>
        <CardContent>
          <input className="border rounded-lg px-3 py-2 mb-4 w-full md:w-64" placeholder="Parcelle" value={parcelle} onChange={e => setParcelle(e.target.value)} />
          <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <input required placeholder="Sensor ID" className="border rounded-lg px-3 py-2" value={form.sensor_id} onChange={e => setForm({ ...form, sensor_id: e.target.value })} />
            <input required placeholder="Type (temp, hum...)" className="border rounded-lg px-3 py-2" value={form.sensor_type} onChange={e => setForm({ ...form, sensor_type: e.target.value })} />
            <input required type="number" step="0.1" placeholder="Valeur" className="border rounded-lg px-3 py-2" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} />
            <input required placeholder="Unité" className="border rounded-lg px-3 py-2" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
            <Button type="submit" className="col-span-2 md:col-span-4">Envoyer</Button>
          </form>
        </CardContent>
      </Card>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" />
              <CardTitle>Courbes 48h — {parcelle}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {sensorTypes.map((type, i) => (
                    <Line
                      key={type}
                      type="monotone"
                      dataKey={type}
                      stroke={colors[i % colors.length]}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Historique détaillé — {parcelle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {sensorTypes.length > 0 ? sensorTypes.map((type, idx) => (
            <div key={type}>
              <div className="flex items-center gap-2 mb-2">
                <Badge style={{ backgroundColor: colors[idx % colors.length] + '20', color: colors[idx % colors.length] }}>{type}</Badge>
                <span className="text-sm text-gray-500">{grouped[type].length} valeur{grouped[type].length > 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-2">
                {grouped[type].slice(0, 5).map((h) => (
                  <div key={h.id} className="flex justify-between border rounded-lg p-3">
                    <span className="text-sm text-gray-600">{h.sensor_id}</span>
                    <span className="font-medium">{h.value} {h.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )) : (
            <p className="text-gray-500">Aucune donnée.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
