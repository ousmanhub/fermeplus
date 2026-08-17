import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table.jsx'
import { Sprout, Plus } from 'lucide-react'

const API = '/api'

export default function SoilPage() {
  const [analyses, setAnalyses] = useState([])
  const [form, setForm] = useState({
    parcelle_id: '', ph: '', nitrogen: '', phosphorus: '', potassium: '', humidity: '', texture: '',
  })

  const fetchAnalyses = async () => {
    const res = await fetch(`${API}/soil/`)
    if (res.ok) setAnalyses(await res.json())
  }

  useEffect(() => { fetchAnalyses() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const body = {
      parcelle_id: form.parcelle_id,
      ph: parseFloat(form.ph),
      nitrogen: parseFloat(form.nitrogen),
      phosphorus: parseFloat(form.phosphorus),
      potassium: parseFloat(form.potassium),
      humidity: parseFloat(form.humidity),
      texture: form.texture,
    }
    const res = await fetch(`${API}/soil/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      setForm({ parcelle_id: '', ph: '', nitrogen: '', phosphorus: '', potassium: '', humidity: '', texture: '' })
      fetchAnalyses()
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sprout className="w-5 h-5 text-green-600" />
            <CardTitle>Nouvelle analyse de sol</CardTitle>
          </div>
          <CardDescription>Saisissez les mesures pH, NPK et humidité pour obtenir une recommandation.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <input required placeholder="Parcelle" className="border rounded-lg px-3 py-2" value={form.parcelle_id} onChange={e => setForm({ ...form, parcelle_id: e.target.value })} />
            <input required type="number" step="0.1" placeholder="pH" className="border rounded-lg px-3 py-2" value={form.ph} onChange={e => setForm({ ...form, ph: e.target.value })} />
            <input required type="number" step="0.1" placeholder="Azote (N)" className="border rounded-lg px-3 py-2" value={form.nitrogen} onChange={e => setForm({ ...form, nitrogen: e.target.value })} />
            <input required type="number" step="0.1" placeholder="Phosphore (P)" className="border rounded-lg px-3 py-2" value={form.phosphorus} onChange={e => setForm({ ...form, phosphorus: e.target.value })} />
            <input required type="number" step="0.1" placeholder="Potassium (K)" className="border rounded-lg px-3 py-2" value={form.potassium} onChange={e => setForm({ ...form, potassium: e.target.value })} />
            <input required type="number" step="0.1" placeholder="Humidité %" className="border rounded-lg px-3 py-2" value={form.humidity} onChange={e => setForm({ ...form, humidity: e.target.value })} />
            <input placeholder="Texture" className="border rounded-lg px-3 py-2" value={form.texture} onChange={e => setForm({ ...form, texture: e.target.value })} />
            <Button type="submit" className="col-span-2 md:col-span-3">
              <Plus className="w-4 h-4" /> Enregistrer
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historique des analyses</CardTitle>
          <CardDescription>{analyses.length} analyse{analyses.length > 1 ? 's' : ''} enregistrée{analyses.length > 1 ? 's' : ''}</CardDescription>
        </CardHeader>
        <CardContent>
          {analyses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parcelle</TableHead>
                  <TableHead>pH</TableHead>
                  <TableHead>N</TableHead>
                  <TableHead>P</TableHead>
                  <TableHead>K</TableHead>
                  <TableHead>Recommandation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyses.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.parcelle_id}</TableCell>
                    <TableCell>{a.ph}</TableCell>
                    <TableCell>{a.nitrogen}</TableCell>
                    <TableCell>{a.phosphorus}</TableCell>
                    <TableCell>{a.potassium}</TableCell>
                    <TableCell className="text-green-700 max-w-md">{a.recommendation}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-gray-500">Aucune analyse enregistrée.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
