import { useState, useEffect } from 'react'
import { Sprout, Loader2 } from 'lucide-react'
import { Button } from '../components/ui/Button'

export default function LoginPage() {
  const [email, setEmail] = useState('admin@smartstacks.dev')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [login, setLoginFn] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    import('../lib/auth').then(({ useAuth }) => {
      const auth = useAuth()
      setLoginFn(() => auth.login)
      setUser(auth.user)
    })
  }, [])

  useEffect(() => {
    if (user) {
      window.location.replace('/')
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!login) return
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      window.location.replace('/')
    } catch (err) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <Sprout className="h-7 w-7 text-green-700" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Ferme+</h1>
          <p className="text-sm text-gray-500">Connexion sécurisée</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              required
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">Mot de passe</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              required
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Se connecter
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-400">
          Compte admin : admin@smartstacks.dev
        </p>
      </div>
    </div>
  )
}
