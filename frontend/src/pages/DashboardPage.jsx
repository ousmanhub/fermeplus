import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { Sprout, Leaf, CloudRain, Wifi, Droplets, AlertTriangle, ArrowRight, Download } from 'lucide-react'

const API = '/api'

export default function DashboardPage({ onTabChange }) {
  const [stats, setStats] = useState({
    soilCount: 0,
    diseaseCount: 0,
    weatherCount: 0,
    iotCount: 0,
  })
  const [latestRecommendation, setLatestRecommendation] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [soilRes, diseaseRes, weatherRes, iotRes] = await Promise.all([
          fetch(`${API}/soil/`),
          fetch(`${API}/diseases/`),
          fetch(`${API}/weather/`),
          fetch(`${API}/iot/history/P1`),
        ])
        const soil = soilRes.ok ? await soilRes.json() : []
        const diseases = diseaseRes.ok ? await diseaseRes.json() : []
        const weather = weatherRes.ok ? await weatherRes.json() : []
        const iot = iotRes.ok ? await iotRes.json() : []

        setStats({
          soilCount: soil.length,
          diseaseCount: diseases.length,
          weatherCount: weather.length,
          iotCount: iot.length,
        })

        if (soil.length > 0) {
          setLatestRecommendation(soil[0])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const downloadReport = () => {
    window.open(`${API}/reports/pdf`, '_blank')
  }

  const cards = [
    {
      key: 'soil',
      title: 'Analyses de sol',
      value: stats.soilCount,
      icon: Leaf,
      color: 'text-green-600',
      bg: 'bg-green-50',
      desc: 'pH, NPK, humidité',
    },
    {
      key: 'disease',
      title: 'Détections',
      value: stats.diseaseCount,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      desc: 'Maladies signalées',
    },
    {
      key: 'weather',
      title: 'Points météo',
      value: stats.weatherCount,
      icon: CloudRain,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      desc: 'Température, pluie, vent',
    },
    {
      key: 'iot',
      title: 'Capteurs actifs',
      value: stats.iotCount,
      icon: Wifi,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      desc: 'Données 24h parcelle P1',
    },
  ]

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <Card key={c.key} className="cursor-pointer hover:shadow-md transition" onClick={() => onTabChange(c.key)}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className={`p-2 rounded-lg ${c.bg}`}>
                    <Icon className={`w-5 h-5 ${c.color}`} />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{loading ? '-' : c.value}</span>
                </div>
                <p className="mt-3 font-medium text-gray-900">{c.title}</p>
                <p className="text-sm text-gray-500">{c.desc}</p>
              </CardContent>
            </Card>
          )
        })}
      </section>

      {latestRecommendation && (
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-green-600" />
              <CardTitle>Dernière recommandation</CardTitle>
            </div>
            <CardDescription>
              Parcelle {latestRecommendation.parcelle_id} — {new Date(latestRecommendation.created_at).toLocaleString('fr-FR')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{latestRecommendation.recommendation}</p>
            <div className="mt-4 flex gap-2">
              <Badge>pH {latestRecommendation.ph}</Badge>
              <Badge variant="secondary">N {latestRecommendation.nitrogen}</Badge>
              <Badge variant="secondary">P {latestRecommendation.phosphorus}</Badge>
              <Badge variant="secondary">K {latestRecommendation.potassium}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sprout className="w-5 h-5 text-green-600" />
              <CardTitle>Prochaines étapes</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-between" onClick={() => onTabChange('soil')}>
              Ajouter une analyse de sol <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between" onClick={() => onTabChange('iot')}>
              Connecter un capteur <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between" onClick={() => onTabChange('weather')}>
              Voir la météo <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-gray-700" />
              <CardTitle>Rapports</CardTitle>
            </div>
            <CardDescription>Exportez un PDF récapitulatif de votre ferme.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={downloadReport} className="w-full">
              <Download className="w-4 h-4" /> Télécharger le rapport PDF
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
