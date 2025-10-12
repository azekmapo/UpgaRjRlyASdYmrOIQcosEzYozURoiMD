import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { forgotPasswordService } from '@/services/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, AlertCircle } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Veuillez fournir une adresse email.')
    .email('Veuillez fournir une adresse email valide.')
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const handleBackToLogin = () => {
    navigate('/login', { replace: true });
  };

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);

    try {
      const response = await forgotPasswordService.sendResetCode(data);

      if (response.success) {
        toast.success("Code de vérification envoyé avec succès !");
        navigate('/code-verification', {
          replace: true,
          state: { email: data.email }
        });
      }
      else {
        toast.error(response.message || "Une erreur s'est produite");
      }
    } catch (error: unknown) {

      if (
        typeof error === 'object' &&
        error !== null &&
        'errors' in error &&
        typeof (error as { errors: unknown }).errors === 'object' &&
        (error as { errors: unknown }).errors !== null &&
        'email' in (error as { errors: Record<string, unknown> }).errors &&
        Array.isArray((error as { errors: Record<string, unknown> }).errors.email) &&
        typeof (error as { errors: { email: unknown[] } }).errors.email[0] === 'string'
      ) {
        const emailError = (error as { errors: { email: string[] } }).errors.email[0];

        setError('email', {
          type: 'server',
          message: emailError
        });
      } else {
        const message =
          typeof error === 'object' &&
            error !== null &&
            'message' in error &&
            typeof (error as { message: unknown }).message === 'string'
            ? (error as { message: string }).message
            : "Une erreur s'est produite";

        toast.error(message);
      }
    }
    finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 relative">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-4xl w-full grid md:grid-cols-2 min-h-[600px]">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center p-8 hidden md:flex">
          <div className="text-center">
            <img
              src="/forgot_password.svg"
              alt="Illustration"
              className="w-64 h-64 mx-auto mb-6 opacity-90"
            />
            <h3 className="text-white text-xl font-semibold mb-2">
              Besoin d'accéder à votre compte ?
            </h3>
            <p className="text-gray-300 text-sm">
              Suivez les étapes simples pour réinitialiser votre mot de passe en toute sécurité.
            </p>
          </div>
        </div>

        <div className="p-8 flex flex-col justify-center md:col-span-1 col-span-2">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Mot de passe oublié ?
            </h2>
            <h5 className="text-xl font-semibold text-gray-700 mb-4">
              Récupérez votre compte
            </h5>
            <p className="text-gray-600 leading-relaxed">
              Entrez votre adresse e-mail pour recevoir un code de vérification.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                Entrer votre adresse e-mail
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
                  className={`w-full pl-10 pr-4 h-12 border rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-200 ${errors.email
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400'
                    }`}
                />
              </div>
              {errors.email && (
                <div className="flex items-center gap-1 mt-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{errors.email.message}</span>
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-base cursor-pointer text-white bg-[#FF8C00] hover:bg-[#FF7F00] border-none rounded-[8px] font-medium transition-all duration-200 disabled:opacity-50 shadow-sm"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi en cours...
                </div>
              ) : (
                'Envoyer un code de vérification'
              )}
            </Button>
          </form>

          <div className="text-center mt-6">
            <button
              type="button"
              onClick={handleBackToLogin}
              className="mt-2 text-sm font-semibold cursor-pointer text-gray-700 hover:underline cursor-pointer transition-all duration-200"
            >
              ← Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;