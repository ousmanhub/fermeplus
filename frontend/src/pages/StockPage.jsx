import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { Package, Plus, Minus, Trash2, ShoppingCart } from 'lucide-react'

const API = '/api'

const categoryColors = {
  engrais: 'bg-green-100 text-green-800',
  semence: 'bg-yellow-100 text-yellow-800',
  pesticide: 'bg-red-100 text-red-800',
  outil: 'bg-gray-100 text-gray-800',
  autre: 'bg-blue-100 text-blue-800',
}

export default function StockPage() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({
    name: '',
    category: 'engrais',
    quantity: '',
    unit: 'kg',
    parcelle_id: '',
    cost_per_unit: '',
    supplier: '',
    notes: '',
  })

  const fetchItems = async () => {
    const res = await fetch(`${API}/stock/`)
    setItems(res.ok ? await res.json() : [])
  }

  useEffect(() => { fetchItems() }, [])

  const submit = async (e) => {
    e.preventDefault()
    const body = {
      ...form,
      quantity: parseFloat(form.quantity),
      cost_per_unit: form.cost_per_unit ? parseFloat(form.cost_per_unit) : null,
      parcelle_id: form.parcelle_id || null,
    }
    const res = await fetch(`${API}/stock/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      setForm({ name: '', category: 'engrais', quantity: '', unit: 'kg', parcelle_id: '', cost_per_unit: '', supplier: '', notes: '' })
      fetchItems()
    }
  }

  const consume = async (id) => {
    const qty = parseFloat(prompt('Quantité à consommer ?'))
    if (!qty) return
    const res = await fetch(`${API}/stock/${id}/consume?quantity=${qty}`, { method: 'POST' })
    if (res.ok) fetchItems()
  }

  const remove = async (id) => {
    if (!confirm('Supprimer cet article ?')) return
    await fetch(`${API}/stock/${id}`, { method: 'DELETE' })
    fetchItems()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" />
            <CardTitle>Gestion des stocks</CardTitle>
          </div>
          <CardDescription>Suivez engrais, semences, pesticides et outils.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input className="border rounded-lg px-3 py-2" placeholder="Nom" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            <select className="border rounded-lg px-3 py-2" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              <option value="engrais">Engrais</option>
              <option value="semence">Semence</option>
              <option value="pesticide">Pesticide</option>
              <option value="outil">Outil</option>
              <option value="autre">Autre</option>
            </select>
            <div className="flex gap-2">
              <input type="number" step="0.1" className="border rounded-lg px-3 py-2 flex-1" placeholder="Qté" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required />
              <select className="border rounded-lg px-3 py-2 w-24" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                <option value="kg">kg</option>
                <option value="L">L</option>
                <option value="unité">unité</option>
                <option value="sac">sac</option>
              </select>
            </div>
            <select className="border rounded-lg px-3 py-2" value={form.parcelle_id} onChange={e => setForm({ ...form, parcelle_id: e.target.value })}>
              <option value="">Toutes parcelles</option>
              {['P1','P2','P3','P4'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <input type="number" step="0.01" className="border rounded-lg px-3 py-2" placeholder="Coût/unité (€/FCFA)" value={form.cost_per_unit} onChange={e => setForm({ ...form, cost_per_unit: e.target.value })} />
            <input className="border rounded-lg px-3 py-2" placeholder="Fournisseur" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} />
            <input className="border rounded-lg px-3 py-2 md:col-span-2" placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            <Button type="submit" className="md:col-span-2"><Plus className="w-4 h-4" /> Ajouter au stock</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inventaire actuel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 && <p className="text-gray-500">Stock vide.</p>}
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="bg-gray-100 p-2 rounded-lg">
                  <ShoppingCart className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.quantity} {item.unit} • {item.parcelle_id || 'Toutes parcelles'}</p>
                  {item.supplier && <p className="text-xs text-gray-400">Fournisseur : {item.supplier}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={categoryColors[item.category] || categoryColors.autre}>{item.category}</Badge>
                <button onClick={() => consume(item.id)} className="p-2 hover:bg-gray-100 rounded-lg" title="Consommer">
                  <Minus className="w-4 h-4 text-amber-600" />
                </button>
                <button onClick={() => remove(item.id)} className="p-2 hover:bg-red-50 rounded-lg" title="Supprimer">
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
