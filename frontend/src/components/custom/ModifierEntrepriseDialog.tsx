import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { UpdateEntrepriseData } from '@/types/user-management/user-management';
import type { EntrepriseProfile } from '@/types/global/entreprise';
import { userManagementService } from '@/services/api';

const entrepriseSchema = z.object({
    nom: z.string()
        .min(1, 'Le nom est requis')
        .max(255, 'Le nom ne doit pas dépasser 255 caractères'),
    email: z.string()
        .min(1, 'L\'email est requis')
        .email('Format d\'email invalide')
        .max(255, 'L\'email ne doit pas dépasser 255 caractères'),
    denomination: z.string()
        .min(1, 'La dénomination est requise')
        .max(255, 'La dénomination ne doit pas dépasser 255 caractères')
});

type EntrepriseFormData = z.infer<typeof entrepriseSchema>;

interface ModifierEntrepriseDialogProps {
    children: React.ReactNode;
    entreprise: EntrepriseProfile;
    onSuccess?: () => void;
}

const ModifierEntrepriseDialog: React.FC<ModifierEntrepriseDialogProps> = ({
    children,
    entreprise,
    onSuccess
}) => {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setError,
        reset
    } = useForm<EntrepriseFormData>({
        resolver: zodResolver(entrepriseSchema),
        defaultValues: {
            nom: entreprise.nom || '',
            email: entreprise.email || '',
            denomination: entreprise.denomination || ''
        }
    });

    const handleOpenChange = (newOpen: boolean) => {
        reset();
        setOpen(newOpen);
    };

    useEffect(() => {
        if (open) {
            reset({
                nom: entreprise.nom || '',
                email: entreprise.email || '',
                denomination: entreprise.denomination || ''
            });
        }
    }, [open, entreprise, reset]);

    const onSubmit = async (data: EntrepriseFormData) => {
        try {
            setIsLoading(true);

            const submitData: UpdateEntrepriseData = {
                id: entreprise.id,
                nom: data.nom.trim(),
                email: data.email.trim(),
                denomination: data.denomination.trim()
            };

            const response = await userManagementService.updateEntreprise(submitData);

            if (response.success) {
                toast.success('Entreprise modifiée avec succès');
                setOpen(false);
                onSuccess?.();
            } else {
                if (response.errors) {
                    Object.entries(response.errors).forEach(([field, messages]) => {
                        setError(field as keyof EntrepriseFormData, {
                            type: 'server',
                            message: messages[0]
                        });
                    });
                }
                toast.error(response.message || 'Erreur lors de la modification');
            }
        } catch (error: unknown) {
            if (
                typeof error === 'object' &&
                error !== null &&
                'errors' in error &&
                typeof (error as { errors: unknown }).errors === 'object' &&
                (error as { errors: unknown }).errors !== null
            ) {
                const errors = (error as { errors: Record<string, string[] | string> }).errors;

                Object.entries(errors).forEach(([field, messages]) => {
                    setError(field as keyof EntrepriseFormData, {
                        type: 'server',
                        message: Array.isArray(messages) ? messages[0] : messages
                    });
                });
            }

            toast.error("Erreur lors de la modification de l'entreprise");
        }
        finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-slate-800 text-center">Modifier l'entreprise</DialogTitle>
                    <DialogDescription className="text-gray-600 text-center">
                        Modifiez les informations de l'entreprise. Cliquez sur "Modifier" pour enregistrer les modifications.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1">
                                Nom
                            </label>
                            <input
                                type="text"
                                id="nom"
                                {...register('nom')}
                                className={`w-full px-3 py-2 border rounded-md  transition-colors ${errors.nom
                                    ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500"
                                    : "bg-gray-50 border-gray-200 focus:bg-white"
                                    }`}
                                placeholder="Entrez le nom de l'entreprise"
                            />
                            {errors.nom && (
                                <p className="mt-1 text-sm text-red-600">{errors.nom.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="denomination" className="block text-sm font-medium text-gray-700 mb-1">
                                Dénomination
                            </label>
                            <input
                                type="text"
                                id="denomination"
                                {...register('denomination')}
                                className={`w-full px-3 py-2 border rounded-md  transition-colors ${errors.denomination
                                    ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500"
                                    : "bg-gray-50 border-gray-200 focus:bg-white"
                                    }`}
                                placeholder="Entrez la dénomination de l'entreprise"
                            />
                            {errors.denomination && (
                                <p className="mt-1 text-sm text-red-600">{errors.denomination.message}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Adresse e-mail
                        </label>
                        <input
                            type="email"
                            id="email"
                            {...register('email')}
                            className={`w-full px-3 py-2 border rounded-md  transition-colors ${errors.email
                                ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500"
                                : "bg-gray-50 border-gray-200 focus:bg-white"
                                }`}
                            placeholder="entreprise@example.com"
                        />
                        {errors.email && (
                            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="flex justify-center">
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="inline-flex items-center cursor-pointer gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg shadow-lg shadow-orange-200 hover:from-orange-600 hover:to-orange-700 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Modification...
                                </>
                            ) : (
                                <>
                                    <span className="mr-2">🏢</span>
                                    Modifier l'entreprise
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ModifierEntrepriseDialog;