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
import type { AddEnseignantData } from '@/types/user-management/user-management';
import { userManagementService } from '@/services/api';
import { TEACHER_GRADES } from '@/constants/teacherGrades';

const enseignantSchema = z.object({
    nom: z.string()
        .min(1, 'Le nom est requis')
        .max(255, 'Le nom ne doit pas dépasser 255 caractères'),
    email: z.string()
        .min(1, 'L\'email est requis')
        .email('Format d\'email invalide')
        .max(255, 'L\'email ne doit pas dépasser 255 caractères'),
    grade: z.enum(TEACHER_GRADES, {
        required_error: 'Le grade est requis',
        invalid_type_error: 'Grade invalide'
    }),
    date_recrutement: z.string()
        .min(1, 'La date de recrutement est requise')
        .refine((date) => !isNaN(Date.parse(date)), {
            message: 'Format de date invalide'
        })
});

type EnseignantFormData = z.infer<typeof enseignantSchema>;

interface AjouterEnseignantDialogProps {
    children: React.ReactNode;
    onSuccess?: () => void;
}

const AjouterEnseignantDialog: React.FC<AjouterEnseignantDialogProps> = ({ children, onSuccess }) => {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setError,
        reset
    } = useForm<EnseignantFormData>({
        resolver: zodResolver(enseignantSchema),
        defaultValues: {
            nom: '',
            email: '',
            grade: TEACHER_GRADES[0],
            date_recrutement: ''
        }
    });

    const onSubmit = async (data: EnseignantFormData) => {
        try {
            setIsLoading(true);

            const submitData: AddEnseignantData = {
                nom: data.nom.trim(),
                email: data.email.trim(),
                grade: data.grade,
                date_recrutement: data.date_recrutement
            };

            const response = await userManagementService.addEnseignant(submitData);

            if (response.success) {
                toast.success('Enseignant ajouté avec succès');
                reset();
                setOpen(false);
                onSuccess?.();
            } else {
                if (response.errors) {
                    Object.entries(response.errors).forEach(([field, messages]) => {
                        setError(field as keyof EnseignantFormData, {
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
                        setError(field as keyof EnseignantFormData, {
                            type: 'server',
                            message: Array.isArray(messages) ? messages[0] : messages
                        });
                    });
                }
            }

            toast.error("Erreur lors de l'ajout de l'enseignant");
        }
        finally {
            setIsLoading(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        reset();
        setOpen(newOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-slate-800 text-center">
                        Ajouter un enseignant
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 text-center">
                        Remplissez les informations pour ajouter un nouvel enseignant. Cliquez sur "Ajouter" pour enregistrer.
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
                                        ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500"
                                        : "bg-gray-50 border-gray-200 focus:bg-white"
                                    }`}
                                placeholder="Entrez le nom de l'enseignant"
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
                                        ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500"
                                        : "bg-gray-50 border-gray-200 focus:bg-white"
                                    }`}
                                placeholder="enseignant@example.com"
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">
                                Grade
                            </label>
                            <select
                                id="grade"
                                {...register('grade')}
                                className={`w-full px-3 py-2 border rounded-md transition-colors cursor-pointer ${errors.grade
                                        ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500"
                                        : "bg-gray-50 border-gray-200 focus:bg-white"
                                    }`}
                            >
                                {TEACHER_GRADES.map((grade) => (
                                    <option key={grade} value={grade}>{grade}</option>
                                ))}
                            </select>
                            {errors.grade && (
                                <p className="mt-1 text-sm text-red-600">{errors.grade.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="date_recrutement" className="block text-sm font-medium text-gray-700 mb-1">
                                Date de Recrutement
                            </label>
                            <input
                                type="date"
                                id="date_recrutement"
                                {...register('date_recrutement')}
                                className={`w-full px-3 py-2 border rounded-md transition-colors ${errors.date_recrutement
                                        ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500"
                                        : "bg-gray-50 border-gray-200 focus:bg-white"
                                    }`}
                            />
                            {errors.date_recrutement && (
                                <p className="mt-1 text-sm text-red-600">{errors.date_recrutement.message}</p>
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
                                    <span className="mr-2">👨‍🏫</span>
                                    Ajouter l'enseignant
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AjouterEnseignantDialog;