import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Loader2, Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '@/components/ui/button'

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Nous avons besoin de votre adresse email !")
    .email("Veuillez fournir une adresse email valide."),
  password: z
    .string()
    .min(1, "Veuillez définir un mot de passe.")
    .min(8, "Saisir au moins 8 caractères"),
})

type LoginFormData = z.infer<typeof loginSchema>

function App() {
  const { login, loading, user } = useAuth()
  const navigate = useNavigate()
  const [apiError, setApiError] = useState<string | null>(null)
  const [initialCheckDone, setInitialCheckDone] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    // If we have a user and we've completed the initial check, redirect to home
    if (user && !loading) {
      navigate('/', { replace: true })
    }
    
    // Mark initial check as done when loading is complete
    if (!loading && !initialCheckDone) {
      setInitialCheckDone(true)
    }
  }, [user, loading, navigate, initialCheckDone])

  const {
    register,
    handleSubmit,
    formState: { errors: formErrors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setApiError(null)

    try {
      await login(data)
      // Wait for login to complete, then navigate
      // The navigate will happen via useEffect when user state updates
    } catch (error) {
      console.error('Login error:', error)
      
      if (error instanceof Error) {
        setApiError(error.message)
      } else {
        setApiError('Erreur de connexion au serveur')
      }
    }
  }

  // If we're still doing the initial authentication check, show a loading state
  if (loading && !initialCheckDone) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  // If user is already logged in, don't render the login form
  if (user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-4xl w-full grid md:grid-cols-2 min-h-[600px]">
        {/* Left Panel - Illustration */}
        <div className="hidden md:flex bg-gradient-to-br from-slate-800 to-slate-900 p-12 flex-col justify-center items-center text-white relative overflow-hidden">
          
          <div className="text-center z-10 flex flex-col items-center">
            {/* Logo with more space */}
            <div className="mb-12">
              <img 
                src="logo.svg" 
                alt="Logo" 
                className="w-40 h-40 mx-auto object-contain"
              />
            </div>
            
            {/* Illustration */}
            <div className="mb-10">
              <img 
                src="26.png" 
                alt="Illustration" 
                className="w-72 h-56 mx-auto rounded-2xl shadow-xl object-cover"
              />
            </div>
            
            <div className="space-y-2">
              <p className="text-lg font-medium">Collaborons ensemble pour donner</p>
              <p className="text-lg font-medium">vie à vos projets</p>
              <p className="text-sm opacity-80 mt-4">Votre espace de travail collaboratif</p>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="p-8 md:p-12 flex flex-col justify-center py-8">
          <div className="max-w-md mx-auto w-full">
            {/* Mobile Logo - Only visible on mobile */}
            <div className="md:hidden -mx-8 -mt-8 mb-8 bg-gradient-to-br from-slate-800 to-slate-900 pt-6 pb-4 flex justify-center">
              <img 
                src="logo.svg" 
                alt="Logo" 
                className="w-24 h-24 object-contain"
              />
            </div>

            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">BIENVENUE ici !</h1>
              <h2 className="text-xl font-semibold text-gray-700 mb-3">dans votre espace personnel</h2>
              <p className="text-gray-600">Veuillez vous connecter pour accéder à vos services.</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Field */}
              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                  Adresse e-mail
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    {...register('email')}
                    className={`w-full pl-10 pr-4 h-12 border rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
                      formErrors.email
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400'
                    }`}
                  />
                </div>
                {formErrors.email && (
                  <div className="flex items-center gap-1 mt-2 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{formErrors.email.message}</span>
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div>
                <Label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
                  Mot de passe
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register('password')}
                    className={`w-full pl-10 pr-12 h-12 border rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
                      formErrors.password
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {formErrors.password && (
                  <div className="flex items-center gap-1 mt-2 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{formErrors.password.message}</span>
                  </div>
                )}
              </div>

              {/* API Error Display */}
              {apiError && (
                <div className="flex items-center gap-1 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{apiError}</span>
                </div>
              )}

              {/* Forgot Password */}
              <div className="text-right">
                <a 
                  href="/forgot-password" 
                  className="text-blue-500 hover:text-blue-600 text-sm font-medium transition-colors hover:underline cursor-pointer"
                >
                  Mot de passe oublié ?
                </a>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base text-white bg-[#FF8C00] hover:bg-[#FF7F00] border-none rounded-[8px] font-medium transition-all duration-200 disabled:opacity-50 shadow-sm cursor-pointer"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion en cours...
                  </div>
                ) : (
                  'Se connecter'
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App