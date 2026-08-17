import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { Bug, Upload, AlertTriangle } from 'lucide-react'

const API = '/api'

export default function DiseasePage() {
  const [detections, setDetections] = useState([])
  const [parcelle, setParcelle] = useState('')
  const [notes, setNotes] = useState('')

  const fetchDetections = async () => {
    const res = await fetch(`${API}/diseases/`)
    if (res.ok) setDetections(await res.json())
  }

  useEffect(() => { fetchDetections() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const res = await fetch(`${API}/diseases/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parcelle_id: parcelle, notes }),
    })
    if (res.ok) {
      setParcelle('')
      setNotes('')
      fetchDetections()
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-red-600" />
            <CardTitle>Signalement de maladie</CardTitle>
          </div>
          <CardDescription>Photographiez la feuille ou la plante (V2) et notez les symptômes.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input required placeholder="Parcelle" className="w-full border rounded-lg px-3 py-2" value={parcelle} onChange={e => setParcelle(e.target.value)} />
            <textarea placeholder="Notes (symptômes, zone touchée...)" className="w-full border rounded-lg px-3 py-2" value={notes} onChange={e => setNotes(e.target.value)} />
            <Button type="submit" variant="destructive">
              <Upload className="w-4 h-4" /> Enregistrer (upload image V2)
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Détections signalées</CardTitle>
          <CardDescription>{detections.length} signalement{detections.length > 1 ? 's' : ''}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {detections.map((d) => (
            <div key={d.id} className="flex items-start justify-between border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="bg-red-50 p-2 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="font-medium">{d.parcelle_id}</p>
                  <p className="text-sm text-gray-600">{d.predicted_disease ? `${d.predicted_disease} (${(d.confidence * 100).toFixed(1)}%)` : 'Analyse en attente'}</p>
                  {d.notes && <p className="text-sm text-gray-500 mt-1">{d.notes}</p>}
                </div>
              </div>
              <Badge variant={d.predicted_disease ? 'destructive' : 'secondary'}>
                {d.predicted_disease ? 'Confirmé' : 'En attente'}
              </Badge>
            </div>
          ))}
          {detections.length === 0 && <p className="text-gray-500">Aucune détection.</p>}
        </CardContent>
      </Card>
    </div>
  )
}
