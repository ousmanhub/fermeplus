import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { History, Sprout, Droplets, Bug, CloudRain, Package, Calendar, MessageSquare, Plus, Trash2 } from 'lucide-react'

const API = '/api'

const icons = {
  soil: Sprout,
  disease: Bug,
  weather: CloudRain,
  iot: Droplets,
  calendar: Calendar,
  stock: Package,
  chat: MessageSquare,
}

const actionLabels = {
  create: 'Création',
  update: 'Modification',
  delete: 'Suppression',
  consume: 'Consommation',
}

export default function ActivityPage() {
  const [logs, setLogs] = useState([])
  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetch(`${API}/activity/`)
      .then((res) => res.json())
      .then((data) => setLogs(data))
  }, [])

  const filtered = filter
    ? logs.filter((l) => l.entity_type === filter)
    : logs

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-green-600" />
            <CardTitle>Journal d'activités</CardTitle>
          </div>
          <CardDescription>Historique de toutes les actions sur votre ferme.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setFilter('')} className={`px-3 py-1 rounded-full text-sm ${!filter ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>Tous</button>
            {Object.keys(icons).map((k) => (
              <button key={k} onClick={() => setFilter(k)} className={`px-3 py-1 rounded-full text-sm ${filter === k ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>
                {k}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-6">
          {filtered.length === 0 && <p className="text-gray-500">Aucune activité enregistrée.</p>}
          {filtered.map((log) => {
            const Icon = icons[log.entity_type] || Plus
            return (
              <div key={log.id} className="flex items-start gap-3 border rounded-lg p-4">
                <div className="bg-gray-100 p-2 rounded-lg h-fit">
                  <Icon className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{actionLabels[log.action] || log.action}</span>
                    <Badge variant="secondary">{log.entity_type}</Badge>
                    {log.parcelle_id && <Badge>{log.parcelle_id}</Badge>}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{log.details}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(log.created_at).toLocaleString('fr-FR')}</p>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
