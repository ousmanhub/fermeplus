import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { Radio, Battery, Thermometer, Droplets, Wifi, Activity } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const API = '/api'
const NDJAMENA = [12.1348, 15.0557]

function nodeIcon(battery, active) {
  const color = !active ? '#ef4444' : battery > 70 ? '#22c55e' : battery > 30 ? '#f59e0b' : '#ef4444'
  return new L.DivIcon({
    className: 'custom-div-icon',
    html: `<div style="background:${color};width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

export default function MeshPage() {
  const [nodes, setNodes] = useState([])
  const [readings, setReadings] = useState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const [nodeDetail, setNodeDetail] = useState(null)

  const fetchNodes = async () => {
    const res = await fetch(`${API}/meshtastic/nodes`)
    if (res.ok) {
      const data = await res.json()
      setNodes(data.nodes || [])
    }
  }

  const fetchReadings = async () => {
    const res = await fetch(`${API}/meshtastic/readings?hours=24`)
    if (res.ok) {
      const data = await res.json()
      setReadings(data.readings || [])
    }
  }

  const fetchNodeDetail = async (nodeId) => {
    const res = await fetch(`${API}/meshtastic/nodes/${encodeURIComponent(nodeId)}`)
    if (res.ok) {
      const data = await res.json()
      setNodeDetail(data)
    }
  }

  useEffect(() => { fetchNodes(); fetchReadings() }, [])

  useEffect(() => {
    if (selectedNode) fetchNodeDetail(selectedNode)
  }, [selectedNode])

  // Grouper les lectures par métrique pour les graphiques
  const chartData = (() => {
    const byTimestamp = {}
    readings.forEach((r) => {
      const ts = r.timestamp?.slice(11, 16) || ''
      if (!byTimestamp[ts]) byTimestamp[ts] = { time: ts }
      byTimestamp[ts][r.metric] = r.value
    })
    return Object.values(byTimestamp).sort((a, b) => a.time.localeCompare(b.time))
  })()

  const activeCount = nodes.filter((n) => n.active).length
  const avgBattery = nodes.length
    ? Math.round(nodes.reduce((s, n) => s + (n.battery_pct || 0), 0) / nodes.length)
    : 0

  return (
    <div className="space-y-4">
      {/* En-tête + KPIs */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-green-600" />
            <CardTitle>Réseau Mesh — Capteurs off-grid</CardTitle>
          </div>
          <CardDescription>
            Réseau LoRa Meshtastic 868 MHz — {nodes.length} nodes, {activeCount} actifs
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="flex items-center gap-2 bg-white rounded-lg p-3 shadow-sm">
          <Wifi className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-xs text-gray-500">Nodes actifs</p>
            <p className="text-lg font-bold">{activeCount}/{nodes.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-lg p-3 shadow-sm">
          <Battery className="w-5 h-5 text-amber-500" />
          <div>
            <p className="text-xs text-gray-500">Batterie moyenne</p>
            <p className="text-lg font-bold">{avgBattery}%</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-lg p-3 shadow-sm">
          <Thermometer className="w-5 h-5 text-red-500" />
          <div>
            <p className="text-xs text-gray-500">Lectures 24h</p>
            <p className="text-lg font-bold">{readings.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-lg p-3 shadow-sm">
          <Activity className="w-5 h-5 text-blue-500" />
          <div>
            <p className="text-xs text-gray-500">Métriques</p>
            <p className="text-lg font-bold">
              {[...new Set(readings.map((r) => r.metric))].length}
            </p>
          </div>
        </div>
      </div>

      {/* Carte + tableau */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Carte des nodes</CardTitle>
            <CardDescription>Positions GPS autour de N'Djamena</CardDescription>
          </CardHeader>
          <div className="h-[400px] w-full">
            {nodes.length > 0 && (
              <MapContainer center={NDJAMENA} zoom={12} scrollWheelZoom={true} className="h-full w-full">
                <TileLayer
                  attribution='© OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {nodes.filter((n) => n.lat && n.lon).map((n) => (
                  <Marker
                    key={n.node_id}
                    position={[n.lat, n.lon]}
                    icon={nodeIcon(n.battery_pct, n.active)}
                    eventHandlers={{ click: () => setSelectedNode(n.node_id) }}
                  >
                    <Popup>
                      <div className="min-w-[180px]">
                        <p className="font-bold text-gray-900">{n.name}</p>
                        <p className="text-xs text-gray-500">{n.node_id}</p>
                        <p className="text-sm mt-1">Parcelle: {n.parcelle_id}</p>
                        <p className="text-sm">Batterie: {n.battery_pct?.toFixed(1)}%</p>
                        <p className="text-sm">Rôle: {n.role}</p>
                        <p className="text-sm">Hops: {n.hops_away}</p>
                        <p className="text-sm">RSSI: {n.rssi?.toFixed(1)} dBm</p>
                        <Badge className={n.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                          {n.active ? 'Actif' : 'Hors ligne'}
                        </Badge>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nodes du réseau</CardTitle>
            <CardDescription>Cliquez sur une ligne pour les détails</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 pr-2">Nom</th>
                    <th className="pb-2 pr-2">Parcelle</th>
                    <th className="pb-2 pr-2">Batterie</th>
                    <th className="pb-2 pr-2">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {nodes.map((n) => (
                    <tr
                      key={n.node_id}
                      onClick={() => setSelectedNode(n.node_id)}
                      className={`border-b cursor-pointer hover:bg-gray-50 ${selectedNode === n.node_id ? 'bg-green-50' : ''}`}
                    >
                      <td className="py-2 pr-2 font-medium">{n.name}</td>
                      <td className="py-2 pr-2 text-gray-600">{n.parcelle_id}</td>
                      <td className="py-2 pr-2">
                        <span className={n.battery_pct > 50 ? 'text-green-600' : n.battery_pct > 20 ? 'text-amber-600' : 'text-red-600'}>
                          {n.battery_pct?.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2 pr-2">
                        <Badge className={n.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                          {n.active ? 'Actif' : 'Offline'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Détail du node sélectionné */}
      {nodeDetail && (
        <Card>
          <CardHeader>
            <CardTitle>Détails — {nodeDetail.name}</CardTitle>
            <CardDescription>{nodeDetail.node_id} · {nodeDetail.role} · {nodeDetail.parcelle_id}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Batterie</p>
                <p className="text-lg font-bold">{nodeDetail.battery_pct?.toFixed(1)}%</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Position</p>
                <p className="text-sm font-mono">{nodeDetail.lat?.toFixed(4)}, {nodeDetail.lon?.toFixed(4)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Dernier signal</p>
                <p className="text-sm">{nodeDetail.last_seen?.slice(11, 19)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Lectures récentes</p>
                <p className="text-lg font-bold">{nodeDetail.readings?.length || 0}</p>
              </div>
            </div>
            {nodeDetail.readings && nodeDetail.readings.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 pr-2">Capteur</th>
                    <th className="pb-2 pr-2">Métrique</th>
                    <th className="pb-2 pr-2">Valeur</th>
                    <th className="pb-2 pr-2">Heure</th>
                  </tr>
                </thead>
                <tbody>
                  {nodeDetail.readings.map((r, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-1 pr-2 text-gray-600">{r.sensor_id}</td>
                      <td className="py-1 pr-2">{r.metric}</td>
                      <td className="py-1 pr-2 font-mono">{r.value} {r.unit}</td>
                      <td className="py-1 pr-2 text-gray-500">{r.timestamp?.slice(11, 19)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Graphiques */}
      <Card>
        <CardHeader>
          <CardTitle>Lectures capteurs 24h</CardTitle>
          <CardDescription>Température, humidité et humidité du sol par parcelle</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="temperature" stroke="#ef4444" name="Temp (°C)" />
                <Line type="monotone" dataKey="humidity" stroke="#3b82f6" name="Humidité (%)" />
                <Line type="monotone" dataKey="soil_moisture" stroke="#22c55e" name="Sol (%)" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">Pas encore de lectures</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}