import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { forgotPasswordService } from '@/services/api';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';


const codeSchema = z.object({
    code: z.string().min(4, 'Le code doit contenir 4 caractères').max(4, 'Le code doit contenir 4 caractères')
});

type CodeFormData = z.infer<typeof codeSchema>;

const CodeVerification: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;
    const [code, setCode] = useState(['', '', '', '']);
    const inputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
    const [isLoading, setIsLoading] = useState(false);
    const [retry, setRetry] = useState(false);
    const [demare, setDemare] = useState(true);
    const [timeLeft, setTimeLeft] = useState(60);

    const { handleSubmit, setValue, formState: { errors } } = useForm<CodeFormData>({
        resolver: zodResolver(codeSchema),
        defaultValues: { code: '' }
    });

    const handleChange = (index: number, value: string) => {
        if (!/^[a-zA-Z0-9]*$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);
        setValue('code', newCode.join(''));

        if (value !== '' && index < 3) {
            inputRefs[index + 1].current?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && index > 0 && code[index] === '') {
            inputRefs[index - 1].current?.focus();
        }
    };

    const handleBackToLogin = () => {
        navigate('/login', { replace: true });
    };

    const onSubmit = async (data: CodeFormData) => {
        setIsLoading(true);

        try {
            const response = await forgotPasswordService.verifyCode({
                email,
                code: data.code
            });

            if (response.success) {
                navigate('/change-password', {
                    replace: true,
                    state: {
                        email,
                        token: response.token,
                        code: data.code
                    }
                });
            }
            else {
                toast.error('Code incorrect ou expiré');
                navigate('/forgot-password', {
                    replace: true,
                });
            }
        } catch (error: unknown) {

            const message =
                typeof error === 'object' &&
                    error !== null &&
                    'message' in error &&
                    typeof (error as { message: unknown }).message === 'string'
                    ? (error as { message: string }).message
                    : 'Code incorrect ou expiré';

            toast.error(message);

            navigate('/forgot-password', {
                replace: true,
            });
        }
        finally {
            setIsLoading(false);
        }
    };

    const resendCode = async () => {
        setIsLoading(true);

        try {
            await forgotPasswordService.sendResetCode({ email });

            setRetry(false);
            setDemare(false);
            setTimeLeft(60);
            setCode(['', '', '', '']);
            setValue('code', '');
            inputRefs[0].current?.focus();
            setTimeout(() => setDemare(true), 100);
        } catch (error: unknown) {

            const message =
                typeof error === 'object' &&
                    error !== null &&
                    'message' in error &&
                    typeof (error as { message: unknown }).message === 'string'
                    ? (error as { message: string }).message
                    : "Erreur lors de l'envoi du code";

            toast.error(message);
        }
        finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;
        let startTime: number;

        if (demare && timeLeft > 0) {
            startTime = Date.now();
            
            interval = setInterval(() => {
                const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
                const remainingTime = Math.max(0, 60 - elapsedSeconds);
                
                setTimeLeft(remainingTime);
                
                if (remainingTime <= 0) {
                    setRetry(true);
                    setDemare(false);
                    clearInterval(interval);
                }
            }, 100);

            const handleVisibilityChange = () => {
                if (!document.hidden) {
                    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
                    const remainingTime = Math.max(0, 60 - elapsedSeconds);
                    
                    setTimeLeft(remainingTime);
                    
                    if (remainingTime <= 0) {
                        setRetry(true);
                        setDemare(false);
                    }
                }
            };

            document.addEventListener('visibilitychange', handleVisibilityChange);

            return () => {
                clearInterval(interval);
                document.removeEventListener('visibilitychange', handleVisibilityChange);
            };
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [demare]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (timeLeft / 60) * circumference;

    if (!email) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-red-600 text-xl font-semibold">
                    Erreur : aucun e-mail fourni.
                </p>
            </div>
        );
    }
    return (
        <>
            {email && <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">

                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-4xl w-full grid md:grid-cols-2 min-h-[600px]">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center p-8 md:flex">
                        <div className="text-center">
                            <img
                                src="/code_verification.svg"
                                alt="Vérification du code"
                                className="w-80 h-80 mx-auto mb-6 opacity-90"
                            />
                            <h3 className="text-white text-xl font-semibold mb-2">
                                Vérification sécurisée
                            </h3>
                            <p className="text-gray-300 text-sm">
                                Votre sécurité est notre priorité
                            </p>
                        </div>
                    </div>

                    <div className="p-8 flex flex-col justify-center">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">
                                Vérification de votre compte
                            </h2>
                            {demare && (
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    Entrez le code reçu par votre e-mail{' '}
                                    <span className="font-semibold text-gray-900">{email}</span> pour confirmer votre identité.
                                </p>
                            )}
                            {retry && (
                                <p className="text-red-600 text-sm leading-relaxed">
                                    Le code a expiré. Veuillez demander un nouveau code envoyé à votre adresse e-mail :{' '}
                                    <span className="font-semibold">{email}</span>
                                </p>
                            )}
                        </div>

                        {demare && (
                            <div className="flex justify-center mb-8">
                                <div className="relative w-24 h-24">
                                    <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r={radius}
                                            stroke="#e5e7eb"
                                            strokeWidth="4"
                                            fill="none"
                                        />
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r={radius}
                                            stroke="#FF8C00"
                                            strokeWidth="4"
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeDasharray={circumference}
                                            strokeDashoffset={strokeDashoffset}
                                            className="transition-all duration-1000 ease-linear"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-lg font-bold text-gray-900">
                                            {formatTime(timeLeft)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!retry && (
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                <div className="flex justify-center space-x-4">
                                    {code.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={inputRefs[index]}
                                            type="text"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleChange(index, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(index, e)}
                                            className="w-14 h-14 text-center text-2xl font-bold border-1 rounded-xl text-gray-900 focus:outline-none focus:ring-2 transition-all duration-200 border-gray-300 focus:ring-[#FF7F00] focus:border-[#FF7F00] hover:border-gray-400"
                                        />
                                    ))}
                                </div>

                                {errors.code && (
                                    <p className="text-red-600 text-sm text-center">{errors.code.message}</p>
                                )}

                                <div className="flex flex-col space-y-4">
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
                                            'Vérifier le code'
                                        )}
                                    </Button>

                                    <div className="text-center">
                                        <button
                                            type="button"
                                            onClick={handleBackToLogin}
                                            className="mt-2 text-sm font-semibold text-gray-700 hover:underline cursor-pointer transition-all duration-200"
                                        >
                                            ← Retour à la connexion
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}

                        {retry && (
                            <div className="text-center space-y-4">
                                <Button
                                    onClick={resendCode}
                                    disabled={isLoading}
                                    className="h-12 text-base text-white cursor-pointer bg-[#FF8C00] hover:bg-[#FF7F00] border-none rounded-[8px] font-medium transition-all duration-200 disabled:opacity-50 shadow-sm py-3 px-6"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center justify-center">
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Envoi en cours...
                                        </div>
                                    ) : (
                                        'Renvoyer le code'
                                    )}
                                </Button>

                                <div className="text-center">
                                    <button
                                        type="button"
                                        onClick={handleBackToLogin}
                                        className="mt-2 text-sm font-semibold cursor-pointer text-gray-700 hover:underline transition-all duration-200"
                                    >
                                        ← Retour à la connexion
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>}
            {!email && (
                <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-center px-4">
                    <h1 className="text-6xl font-bold text-red-600 mb-2">403</h1>
                    <p className="text-gray-600 text-lg">Tu n'as pas la permission d'accéder à cette page.</p>
                </div>
            )}
        </>
    );
};

export default CodeVerification;