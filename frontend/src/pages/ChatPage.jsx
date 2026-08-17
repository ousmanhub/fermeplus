import { useState, useEffect, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Send, Sprout, User, Bot } from 'lucide-react'

const API = '/api'

const DEMO_REPLIES = {
  'humidité': 'En saison sèche au Sahel, l\'irrigation goutte-à-goutte est la plus efficace. Visez une humidité du sol entre 30 et 60 %.',
  'pH': 'Pour un sol au Tchad, un pH entre 6.0 et 7.5 convient à la plupart des cultures. Chaulage si pH < 5.5, soufre agricole si pH > 8.0.',
  'semis': 'Le semis au Sahel dépend de la pluie : mil et sorgho dès les premières pluies (juin), niébé un peu plus tard.',
  'engrais': 'Privilégiez un apport équilibré NPK. Analysez le sol d\'abord pour éviter le gaspillage.',
  'maladie': 'En cas de symptômes graves (taches, nécroses, flétrissement), prenez une photo nette et consultez un agronome.',
}

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Bonjour ! Je suis votre assistant Ferme+ (mode démo). Posez-moi une question sur les sols, l\'irrigation, le semis ou les maladies.' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    const userMsg = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const res = await fetch(`${API}/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      })
      const data = res.ok ? await res.json() : { reply: 'Erreur de connexion.' }

      // Fallback démo si le backend retourne le message démo standard
      if (data.reply.includes('mode démo')) {
        const lower = userMsg.toLowerCase()
        let reply = 'Je peux vous aider sur les sols, l\'irrigation, le semis, les engrais ou les maladies. Précisez votre question.'
        for (const [key, value] of Object.entries(DEMO_REPLIES)) {
          if (lower.includes(key)) { reply = value; break }
        }
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Erreur réseau. Vérifiez le backend.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="h-[calc(100vh-220px)] flex flex-col">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-green-600" />
            <CardTitle>Assistant agricole Ferme+</CardTitle>
          </div>
          <CardDescription>Conseils agricoles pour le Sahel (mode démo).</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
              {m.role === 'assistant' && <div className="bg-green-100 p-2 rounded-full h-fit"><Sprout className="w-4 h-4 text-green-700" /></div>}
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${m.role === 'user' ? 'bg-green-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                {m.content}
              </div>
              {m.role === 'user' && <div className="bg-blue-100 p-2 rounded-full h-fit"><User className="w-4 h-4 text-blue-700" /></div>}
            </div>
          ))}
          <div ref={bottomRef} />
        </CardContent>
        <form onSubmit={send} className="p-4 border-t flex gap-2">
          <input
            className="flex-1 border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Posez votre question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <Button type="submit" disabled={loading}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </Card>
    </div>
  )
}
