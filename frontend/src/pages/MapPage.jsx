import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { MapPin, Droplets, Leaf, Bug, Check } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const API = '/api'

const NDJAMENA = [12.1348, 15.0557]

const statusConfig = {
  ok: { color: 'bg-green-500', label: 'Bon', icon: Check },
  dry: { color: 'bg-amber-500', label: 'Sec', icon: Droplets },
  acid: { color: 'bg-yellow-500', label: 'Acide', icon: Leaf },
  disease: { color: 'bg-red-500', label: 'Maladie', icon: Bug },
}

// Créer une icône Leaflet simple avec couleur
function createIcon(status) {
  const color = statusConfig[status]?.color.replace('bg-', '') || 'bg-green-500'
  const hexMap = { green: '#22c55e', amber: '#f59e0b', yellow: '#eab308', red: '#ef4444' }
  return new L.DivIcon({
    className: 'custom-div-icon',
    html: `<div style="background:${hexMap[color]};width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

export default function MapPage() {
  const [parcels, setParcels] = useState([])

  useEffect(() => {
    fetch(`${API}/parcels/`)
      .then((res) => res.json())
      .then((data) => setParcels(data))
  }, [])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-600" />
            <CardTitle>Carte des parcelles</CardTitle>
          </div>
          <CardDescription>Visualisez l'état de vos parcelles autour de Ndjamena.</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(statusConfig).map(([key, cfg]) => {
          const Icon = cfg.icon
          return (
            <div key={key} className="flex items-center gap-2 bg-white rounded-lg p-3 shadow-sm">
              <span className={`w-3 h-3 rounded-full ${cfg.color}`} />
              <Icon className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">{cfg.label}</span>
            </div>
          )
        })}
      </div>

      <Card className="overflow-hidden">
        <div className="h-[500px] w-full">
          <MapContainer center={NDJAMENA} zoom={12} scrollWheelZoom={true} className="h-full w-full">
            <TileLayer
              attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {parcels.map((p) => (
              <Marker key={p.id} position={[p.lat, p.lng]} icon={createIcon(p.soil_status)}>
                <Popup>
                  <div className="min-w-[200px]">
                    <p className="font-bold text-gray-900">{p.name} ({p.parcelle_id})</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={statusConfig[p.soil_status]?.color.replace('bg-', 'bg-opacity-20 bg-') || 'bg-gray-100'}>
                        {statusConfig[p.soil_status]?.label || p.soil_status}
                      </Badge>
                    </div>
                    {p.crop && <p className="text-sm mt-2">🌾 Culture : {p.crop}</p>}
                    {p.area_ha && <p className="text-sm">📐 Superficie : {p.area_ha} ha</p>}
                    {p.notes && <p className="text-xs text-gray-500 mt-2">{p.notes}</p>}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </Card>
    </div>
  )
}
