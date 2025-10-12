import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, Loader2, AlertCircle } from 'lucide-react';
import { forgotPasswordService } from '@/services/api';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const changePasswordSchema = z.object({
    new_password: z
        .string()
        .min(8, 'Le mot de passe doit contenir au moins 8 caractères.')
        .nonempty('Veuillez entrer un mot de passe.'),
    confirm_password: z
        .string()
        .nonempty('Veuillez confirmer votre mot de passe.'),
}).refine((data) => data.new_password === data.confirm_password, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['confirm_password'],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

const ChangePasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || '';
    const code = location.state?.code || '';
    const token = location.state?.token || '';
    const [isLoading, setIsLoading] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ChangePasswordFormData>({
        resolver: zodResolver(changePasswordSchema),
    });

    const handleBackToLogin = () => {
        navigate('/login', { replace: true });
    };

    const onSubmit = async (data: ChangePasswordFormData) => {
        setIsLoading(true);

        try {
            const response = await forgotPasswordService.changePassword({
                email,
                code,
                token,
                new_password: data.new_password,
                confirm_password: data.confirm_password,
            });

            if (response.success) {
                toast.success('Votre mot de passe a été changé avec succès !');
            } else {
                toast.error(response.message || 'Une erreur s\'est produite');
            }
        } catch (error: unknown) {

            const message =
                typeof error === 'object' &&
                    error !== null &&
                    'message' in error &&
                    typeof (error as { message: unknown }).message === 'string'
                    ? (error as { message: string }).message
                    : "Une erreur s'est produite lors du changement de mot de passe";

            toast.error(message);
        }
        finally {
            setIsLoading(false);
            navigate('/login', { replace: true });
        }
    };

    const loading = isSubmitting || isLoading;

    return (
        <>
            {email && code && token &&
                <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-4xl w-full grid md:grid-cols-2 min-h-[600px]">
                        <div className="hidden md:block bg-gradient-to-br from-slate-800 to-slate-900 p-8 flex items-center justify-center">
                            <div className="text-center">
                                <img
                                    src="/change_password.svg"
                                    alt="Illustration de changement de mot de passe"
                                    className="w-80 h-80 mx-auto mb-6 drop-shadow-2xl"
                                />
                                <h3 className="text-2xl font-bold text-white mb-2">
                                    Nouveau mot de passe
                                </h3>
                                <p className="text-slate-300 text-lg">
                                    Créez un mot de passe sécurisé pour votre compte
                                </p>
                            </div>
                        </div>

                        <div className="p-8 flex flex-col justify-center">
                            <div className="mb-8">
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                    Modifier votre mot de passe
                                </h2>
                                <p className="text-gray-600 text-lg">
                                    Veuillez entrer un nouveau mot de passe et le confirmer.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                <div>
                                    <Label htmlFor="new_password" className="block text-sm font-medium text-gray-900 mb-2">
                                        Nouveau mot de passe
                                    </Label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <Input
                                            id="new_password"
                                            type={showNewPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            {...register('new_password')}
                                            className={`w-full pl-10 pr-12 h-12 border rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-200 ${errors.new_password
                                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50'
                                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400'
                                                }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    {errors.new_password && (
                                        <div className="flex items-center gap-1 mt-2 text-red-600">
                                            <AlertCircle className="w-4 h-4" />
                                            <span className="text-sm">{errors.new_password.message}</span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="confirm_password" className="block text-sm font-medium text-gray-900 mb-2">
                                        Confirmez le mot de passe
                                    </Label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <Input
                                            id="confirm_password"
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            {...register('confirm_password')}
                                            className={`w-full pl-10 pr-12 h-12 border rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-200 ${errors.confirm_password
                                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50'
                                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400'
                                                }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    {errors.confirm_password && (
                                        <div className="flex items-center gap-1 mt-2 text-red-600">
                                            <AlertCircle className="w-4 h-4" />
                                            <span className="text-sm">{errors.confirm_password.message}</span>
                                        </div>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-12 text-base text-white cursor-pointer bg-[#FF8C00] hover:bg-[#FF7F00] border-none rounded-[8px] font-medium transition-all duration-200 disabled:opacity-50 shadow-sm"
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center">
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Enregistrement...
                                        </div>
                                    ) : (
                                        'Enregistrer le mot de passe'
                                    )}
                                </Button>

                                <div className="text-center">
                                    <button
                                        type="button"
                                        onClick={handleBackToLogin}
                                        className="mt-2 text-sm font-semibold cursor-pointer text-gray-700 hover:underline cursor-pointer transition-all duration-200"
                                    >
                                        ← Retour à la connexion
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>}

            {!email && !code && !token &&
                (
                    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-center px-4">
                        <h1 className="text-6xl font-bold text-red-600 mb-2">403</h1>
                        <p className="text-gray-600 text-lg">Tu n'as pas la permission d'accéder à cette page.</p>
                    </div>
                )}
        </>
    );
};

export default ChangePasswordPage;