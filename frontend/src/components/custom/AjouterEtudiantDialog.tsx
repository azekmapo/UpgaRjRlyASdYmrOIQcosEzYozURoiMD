import React, { useState } from 'react';
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
import type { AddEtudiantData } from '@/types/user-management/user-management';
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

interface AjouterEtudiantDialogProps {
    options: OptionItem[];
    onSuccess?: () => void;
    children: React.ReactNode;
}

const AjouterEtudiantDialog: React.FC<AjouterEtudiantDialogProps> = ({
    options,
    onSuccess,
    children,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setError,
        reset
    } = useForm<EtudiantFormData>({
        resolver: zodResolver(etudiantSchema),
        defaultValues: {
            nom: '',
            email: '',
            option: options.length > 0 ? options[0].option : ''
        }
    });

    const onSubmit = async (data: EtudiantFormData) => {
        try {
            setIsLoading(true);

            const submitData: AddEtudiantData = {
                nom: data.nom.trim(),
                email: data.email.trim(),
                option: data.option,
                moyenne: data.moyenne
            };

            const response = await userManagementService.addEtudiant(submitData);

            if (response.success) {
                toast.success('Étudiant ajouté avec succès');
                reset();
                setOpen(false);
                onSuccess?.();
            } else {
                if (response.errors) {
                    Object.entries(response.errors).forEach(([field, messages]) => {
                        setError(field as keyof EtudiantFormData, {
                            type: 'server',
                            message: messages[0]
                        });
                    });
                }
                toast.error(response.message || 'Erreur lors de l\'ajout');
            }
        } catch (error: unknown) {
            if (
                typeof error === 'object' &&
                error !== null &&
                'errors' in error
            ) {
                const maybeErrors = (error as { errors: unknown }).errors;

                if (
                    typeof maybeErrors === 'object' &&
                    maybeErrors !== null
                ) {
                    Object.entries(maybeErrors as Record<string, string[] | string>).forEach(([field, messages]) => {
                        setError(field as keyof EtudiantFormData, {
                            type: 'server',
                            message: Array.isArray(messages) ? messages[0] : messages
                        });
                    });
                }
            }

            toast.error("Erreur lors de l'ajout de l'étudiant");
        }
        finally {
            setIsLoading(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (newOpen && options.length > 0) {
            reset({
                nom: '',
                email: '',
                option: options[0].option
            });
        } else {
            reset();
        }
        setOpen(newOpen);
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
                    <DialogTitle className="text-2xl font-bold text-slate-800 text-center">
                        Ajouter un étudiant
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 text-center">
                        Remplissez les informations pour ajouter un nouvel étudiant. Cliquez sur "Ajouter" pour enregistrer.
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
                                className={`w-full px-3 py-2 border rounded-md transition-colors ${errors.nom
                                    ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500'
                                    : 'bg-gray-50 border-gray-200 focus:bg-white'
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
                                className={`w-full px-3 py-2 border rounded-md transition-colors ${errors.email
                                    ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500'
                                    : 'bg-gray-50 border-gray-200 focus:bg-white'
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
                                className={`w-full px-3 py-2 border rounded-md transition-colors cursor-pointer ${errors.option
                                    ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500'
                                    : 'bg-gray-50 border-gray-200 focus:bg-white'
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
                                className={`w-full px-3 py-2 border rounded-md transition-colors ${errors.moyenne
                                    ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500'
                                    : 'bg-gray-50 border-gray-200 focus:bg-white'
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
                                    Ajout en cours...
                                </>
                            ) : (
                                <>
                                    <span className="mr-2">👨‍🎓</span>
                                    Ajouter l'étudiant
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AjouterEtudiantDialog;