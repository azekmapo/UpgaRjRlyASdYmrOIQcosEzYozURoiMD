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
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { UpdateEtudiantData } from '@/types/user-management/user-management';
import type { EtudiantProfile } from '@/types/global/etudiant';
import type { OptionItem } from '@/types/options';
import { userManagementService } from '@/services/api';

const etudiantSchema = z.object({
    nom: z.string()
        .min(1, 'Le nom est requis')
        .max(255, 'Le nom ne doit pas dépasser 255 caractères'),
    email: z.string()
        .min(1, 'L\'email est requis')
        .email('Format d\'email invalide')
        .max(255, 'L\'email ne doit pas dépasser 255 caractères'),
    option: z.string().min(1, 'L\'option est requise'),
    moyenne: z.number({
        required_error: 'La moyenne est requise',
        invalid_type_error: 'La moyenne doit être un nombre'
    })
        .min(0, 'La moyenne doit être supérieure ou égale à 0')
        .max(20, 'La moyenne doit être inférieure ou égale à 20')
});

type EtudiantFormData = z.infer<typeof etudiantSchema>;

interface ModifierEtudiantDialogProps {
    children: React.ReactNode;
    etudiant: EtudiantProfile;
    options: OptionItem[];
    onSuccess: () => void;
}

const ModifierEtudiantDialog: React.FC<ModifierEtudiantDialogProps> = ({
    children,
    etudiant,
    options,
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
    } = useForm<EtudiantFormData>({
        resolver: zodResolver(etudiantSchema),
        defaultValues: {
            nom: etudiant.nom,
            email: etudiant.email,
            option: etudiant.option,
            moyenne: etudiant.moyenne || 0
        }
    });

    useEffect(() => {
        if (open) {
            reset({
                nom: etudiant.nom,
                email: etudiant.email,
                option: etudiant.option,
                moyenne: etudiant.moyenne || 0
            });
        }
    }, [open, etudiant, reset]);

    const handleOpenChange = (newOpen: boolean) => {
        reset();
        setOpen(newOpen);
    };

    const onSubmit = async (data: EtudiantFormData) => {
        try {
            setIsLoading(true);

            const submitData: UpdateEtudiantData = {
                id: etudiant.id,
                nom: data.nom.trim(),
                email: data.email.trim(),
                option: data.option,
                moyenne: data.moyenne
            };

            const response = await userManagementService.updateEtudiant(submitData);

            if (response.success) {
                onSuccess();
                toast.success('Étudiant modifié avec succès');
                setOpen(false);
            } else {
                if (response.errors) {
                    Object.entries(response.errors).forEach(([field, messages]) => {
                        setError(field as keyof EtudiantFormData, {
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
                    setError(field as keyof EtudiantFormData, {
                        type: 'server',
                        message: Array.isArray(messages) ? messages[0] : messages
                    });
                });
            }

            toast.error("Erreur lors de la modification de l'étudiant");
        }
        finally {
            setIsLoading(false);
        }
    };

    if (options.length === 0) {
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    {children}
                </DialogTrigger>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-center text-red-600">Options non disponibles</DialogTitle>
                        <DialogDescription className="text-center">
                            Aucune option n'est disponible pour le moment. Veuillez réessayer plus tard.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-center">
                        <Button onClick={() => setOpen(false)} variant="outline">
                            Fermer
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-slate-800 text-center">Modifier l'étudiant</DialogTitle>
                    <DialogDescription className="text-gray-600 text-center">
                        Modifiez les informations de l'étudiant. Cliquez sur "Modifier" pour enregistrer les modifications.
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
                                placeholder="Entrez le nom de l'étudiant"
                            />
                            {errors.nom && (
                                <p className="mt-1 text-sm text-red-600">{errors.nom.message}</p>
                            )}
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
                                placeholder="etudiant@example.com"
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="option" className="block text-sm font-medium text-gray-700 mb-1">
                                Option
                            </label>
                            <select
                                id="option"
                                {...register('option')}
                                className={`w-full px-3 py-2 border rounded-md  transition-colors cursor-pointer ${errors.option
                                    ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500"
                                    : "bg-gray-50 border-gray-200 focus:bg-white"
                                    }`}
                            >
                                {options.map((optionItem) => (
                                    <option key={optionItem.option} value={optionItem.option}>
                                        {optionItem.option}
                                    </option>
                                ))}
                            </select>
                            {errors.option && (
                                <p className="mt-1 text-sm text-red-600">{errors.option.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="moyenne" className="block text-sm font-medium text-gray-700 mb-1">
                                Moyenne
                            </label>
                            <input
                                type="number"
                                id="moyenne"
                                step="0.01"
                                min="0"
                                max="20"
                                {...register('moyenne', { valueAsNumber: true })}
                                className={`w-full px-3 py-2 border rounded-md  transition-colors ${errors.moyenne
                                    ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500"
                                    : "bg-gray-50 border-gray-200 focus:bg-white"
                                    }`}
                                placeholder="0.00"
                            />
                            {errors.moyenne && (
                                <p className="mt-1 text-sm text-red-600">{errors.moyenne.message}</p>
                            )}
                        </div>
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
                                    <span className="mr-2">✏️</span>
                                    Modifier l'étudiant
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ModifierEtudiantDialog;