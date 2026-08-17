import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { Calendar as CalendarIcon, Plus, Check, Clock, Sprout } from 'lucide-react'

const API = '/api'

const eventColors = {
  semis: 'bg-green-100 text-green-800',
  fertilisation: 'bg-yellow-100 text-yellow-800',
  irrigation: 'bg-blue-100 text-blue-800',
  recolte: 'bg-purple-100 text-purple-800',
  traitement: 'bg-red-100 text-red-800',
  autre: 'bg-gray-100 text-gray-800',
}

export default function CalendarPage() {
  const [events, setEvents] = useState([])
  const [form, setForm] = useState({
    title: '',
    event_type: 'semis',
    parcelle_id: 'P1',
    event_date: new Date().toISOString().split('T')[0],
    status: 'planifié',
    notes: '',
  })

  const fetchEvents = async () => {
    const res = await fetch(`${API}/calendar/`)
    setEvents(res.ok ? await res.json() : [])
  }

  useEffect(() => { fetchEvents() }, [])

  const submit = async (e) => {
    e.preventDefault()
    const res = await fetch(`${API}/calendar/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        event_date: new Date(form.event_date + 'T00:00:00').toISOString(),
      }),
    })
    if (res.ok) {
      setForm({ ...form, title: '', notes: '' })
      fetchEvents()
    }
  }

  const toggleStatus = async (id, current) => {
    const next = current === 'planifié' ? 'terminé' : 'planifié'
    const res = await fetch(`${API}/calendar/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    if (res.ok) fetchEvents()
  }

  const deleteEvent = async (id) => {
    if (!confirm('Supprimer cet événement ?')) return
    await fetch(`${API}/calendar/${id}`, { method: 'DELETE' })
    fetchEvents()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-green-600" />
            <CardTitle>Calendrier agricole</CardTitle>
          </div>
          <CardDescription>Planifiez semis, fertilisation, irrigation, récolte et traitements.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <input className="border rounded-lg px-3 py-2" placeholder="Titre" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            <select className="border rounded-lg px-3 py-2" value={form.event_type} onChange={e => setForm({ ...form, event_type: e.target.value })}>
              <option value="semis">Semis</option>
              <option value="fertilisation">Fertilisation</option>
              <option value="irrigation">Irrigation</option>
              <option value="recolte">Récolte</option>
              <option value="traitement">Traitement</option>
              <option value="autre">Autre</option>
            </select>
            <select className="border rounded-lg px-3 py-2" value={form.parcelle_id} onChange={e => setForm({ ...form, parcelle_id: e.target.value })}>
              {['P1','P2','P3','P4'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <input type="date" className="border rounded-lg px-3 py-2" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} required />
            <input className="border rounded-lg px-3 py-2" placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            <Button type="submit"><Plus className="w-4 h-4" /> Ajouter</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Événements à venir</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {events.length === 0 && <p className="text-gray-500">Aucun événement planifié.</p>}
          {events.map((e) => (
            <div key={e.id} className="flex items-center justify-between border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="bg-gray-100 p-2 rounded-lg">
                  <CalendarIcon className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium">{e.title}</p>
                  <p className="text-sm text-gray-500">{new Date(e.event_date).toLocaleDateString('fr-FR')} • {e.parcelle_id}</p>
                  {e.notes && <p className="text-sm text-gray-600 mt-1">{e.notes}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={eventColors[e.event_type] || eventColors.autre}>{e.event_type}</Badge>
                <button onClick={() => toggleStatus(e.id, e.status)} className="p-2 hover:bg-gray-100 rounded-lg">
                  {e.status === 'terminé' ? <Check className="w-4 h-4 text-green-600" /> : <Clock className="w-4 h-4 text-amber-600" />}
                </button>
                <button onClick={() => deleteEvent(e.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg">×</button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
