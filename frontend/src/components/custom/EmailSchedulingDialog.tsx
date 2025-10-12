import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { emailService } from '@/services/api';

import type { Periode, TemplatesPeriode, AvailableTemplate } from '@/types/liste-emails-admin/liste-emails-admin';

const emailSchema = z.object({
    periode: z.number().min(1, 'Veuillez sélectionner une période'),
    frequence: z.number().min(1, 'La fréquence doit être supérieure à 0'),
    template_selectionne: z.string().min(1, 'Veuillez sélectionner un template'),
    email_objet: z.string().min(1, 'L\'objet de l\'email est requis'),
    email_contenu: z.string().min(1, 'Le contenu de l\'email est requis'),
    destinataires: z.string().optional(),
    date_debut: z.string().optional(),
    date_fin: z.string().optional(),
}).refine((data) => {
    if (data.template_selectionne === 'email_personnalisé') {
        return data.date_debut;
    }
    return true;
}, {
    message: 'Date de début requise pour un email personnalisé',
    path: ['date_debut'],
}).refine((data) => {
    if (data.template_selectionne === 'email_personnalisé') {
        return data.date_fin;
    }
    return true;
}, {
    message: 'Date de fin requise pour un email personnalisé',
    path: ['date_fin'],
});

type EmailFormData = z.infer<typeof emailSchema>;

interface EmailSchedulingDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const EmailSchedulingDialog: React.FC<EmailSchedulingDialogProps> = ({ isOpen, onClose, onSuccess }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [periodes, setPeriodes] = useState<Periode[]>([]);
    const [templatesPeriodes, setTemplatesPeriodes] = useState<TemplatesPeriode[]>([]);
    const [availableTemplates, setAvailableTemplates] = useState<AvailableTemplate[]>([]);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
        reset,
    } = useForm<EmailFormData>({
        resolver: zodResolver(emailSchema),
        defaultValues: {
            periode: 1,
            frequence: 1,
            template_selectionne: 'email_personnalisé',
            email_objet: '',
            email_contenu: '',
            destinataires: 'etudiants',
            date_debut: '',
            date_fin: '',
        },
    });

    const watchedValues = watch();
    const selectedTemplate = watchedValues.template_selectionne;
    const selectedPeriode = watchedValues.periode;

    const emailPersonalise: AvailableTemplate = {
        id: 'email_personnalisé',
        objet: '',
        contenu: '',
        nom: 'Email personnalisé'
    };

    const fetchInitialData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await emailService.getEnvoiEmails();

            setPeriodes(response.periodes);
            setTemplatesPeriodes(response.templatesPeriodes);

            if (response.periodes.length > 0) {
                setValue('periode', response.periodes[0].id);
            }

        } catch (error) {
            setError('Impossible de charger la liste des périodes et des templates');
            toast.error('Erreur lors du chargement des données');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchInitialData();
        }
    }, [isOpen]);

    useEffect(() => {
        setValue('template_selectionne', 'email_personnalisé');
        setValue('email_objet', '');
        setValue('email_contenu', '');

        if (selectedPeriode) {
            const templatesForPeriode = templatesPeriodes
                .filter(template => template.id_periode === parseInt(selectedPeriode.toString()))
                .map(template => ({
                    id: template.id.toString(),
                    objet: template.objet,
                    contenu: template.contenu,
                    nom: template.objet,
                    distinataires: template.distinataires
                }));

            setAvailableTemplates([emailPersonalise, ...templatesForPeriode]);
        } else {
            setAvailableTemplates([emailPersonalise]);
        }
    }, [selectedPeriode, templatesPeriodes, setValue]);

    const handleTemplateChange = (templateId: string) => {
        const selectedTemplateData = availableTemplates.find(t => t.id === templateId);
        if (selectedTemplateData) {
            setValue('email_objet', selectedTemplateData.objet, { shouldValidate: true });
            setValue('email_contenu', selectedTemplateData.contenu, { shouldValidate: true });
        }

        setValue('template_selectionne', templateId);

        if (templateId !== 'email_personnalisé') {
            setValue('destinataires', '');
            setValue('date_debut', '');
            setValue('date_fin', '');
        } else {
            setValue('destinataires', 'etudiants');
        }
    };

    const onSubmit = async (data: EmailFormData) => {
        try {
            setIsSubmitting(true);

            await emailService.createAutomation(data);

            toast.success('L\'automation a été créée avec succès');
            reset();
            onSuccess?.();
            onClose();

        } catch (error: unknown) {
            if (
                typeof error === 'object' &&
                error !== null &&
                'status' in error &&
                (error as { status: unknown }).status === 422 &&
                'response' in error &&
                typeof (error as { response: unknown }).response === 'object'
            ) {
                const message = (error as {
                    response?: {
                        data?: {
                            message?: string;
                        };
                    };
                }).response?.data?.message;

                toast.error(message || 'Erreur de validation des données');
            } else {
                toast.error("Erreur lors de la création de l'automation");
            }
        }
        finally {
            setIsSubmitting(false);
        }
    };

    const getDestinatairesDisplay = () => {
        if (selectedTemplate === 'email_personnalisé') {
            const dest = watchedValues.destinataires;
            if (dest === 'tous') return 'Tous les utilisateurs';
            return dest ? dest.charAt(0).toUpperCase() + dest.slice(1) : '';
        }
        const template = availableTemplates.find(t => t.id === selectedTemplate);
        return template?.distinataires || 'Tous les destinataires';
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-6xl w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className='text-center'>Planification d'emails automatisés</DialogTitle>
                    <DialogDescription className='text-center'>
                        Configurez ici les règles de planification des emails envoyés automatiquement.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center min-h-[400px]">
                            <div className="flex items-center gap-3">
                                <Loader2 className="h-6 w-6 animate-spin text-gray-700" />
                                <span className="text-lg font-medium text-gray-700">Chargement des données...</span>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center min-h-[400px]">
                            <div className="text-center">
                                <p className="text-red-600 mb-4">{error}</p>
                                <button
                                    onClick={fetchInitialData}
                                    className="px-4 py-2 cursor-pointer bg-slate-800 text-white rounded hover:bg-slate-900"
                                >
                                    Réessayer
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="periode" className="text-sm font-semibold text-gray-700">
                                        Périodes
                                    </Label>
                                    <Select
                                        value={watchedValues.periode?.toString()}
                                        onValueChange={(value) => setValue('periode', parseInt(value))}
                                    >
                                        <SelectTrigger className="w-full px-4 py-3 cursor-pointer bg-gray-50 border-2 border-gray-200 rounded-lg transition-all duration-200 min-h-[48px]">
                                            <SelectValue placeholder="Sélectionner une période" className="text-left truncate" />
                                        </SelectTrigger>
                                        <SelectContent className="max-w-[calc(100vw-2rem)]">
                                            {periodes.map(p => (
                                                <SelectItem key={p.id} value={p.id.toString()} className="whitespace-normal break-words py-3">
                                                    {p.id} : {p.titre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.periode && (
                                        <p className="text-sm text-red-600">{errors.periode.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="template" className="text-sm font-semibold text-gray-700">
                                        Template d'email
                                    </Label>
                                    <Select
                                        value={selectedTemplate}
                                        onValueChange={handleTemplateChange}
                                    >
                                        <SelectTrigger className="w-full px-4 py-3 cursor-pointer bg-gray-50 border-2 border-gray-200 rounded-lg transition-all duration-200 min-h-[48px]">
                                            <SelectValue placeholder="Sélectionner un template" className="text-left truncate" />
                                        </SelectTrigger>
                                        <SelectContent className="max-w-[calc(100vw-2rem)]">
                                            {availableTemplates.map(template => (
                                                <SelectItem key={template.id} value={template.id} className="whitespace-normal break-words py-3">
                                                    {template.nom} {template.distinataires ? `: ${template.distinataires}` : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {selectedTemplate === 'email_personnalisé' && (<>
                                    <div className="space-y-2">
                                        <Label htmlFor="date_debut" className="text-sm font-semibold text-gray-700">
                                            Date de début
                                        </Label>
                                        <Input
                                            id="date_debut"
                                            type="datetime-local"
                                            {...register('date_debut')}
                                            className={`w-full px-4 py-3 min-h-[48px] bg-gray-50 border-2 border-gray-200 rounded-lg transition-all duration-200 ${errors.date_debut ? 'border-red-500' : ''}`}
                                        />
                                        {errors.date_debut && (
                                            <p className="text-sm text-red-600">{errors.date_debut.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="date_fin" className="text-sm font-semibold text-gray-700">
                                            Date de fin
                                        </Label>
                                        <Input
                                            id="date_fin"
                                            type="datetime-local"
                                            {...register('date_fin')}
                                            className={`w-full px-4 py-3 min-h-[48px] bg-gray-50 border-2 border-gray-200 rounded-lg transition-all duration-200 ${errors.date_fin ? 'border-red-500' : ''}`}
                                        />
                                        {errors.date_fin && (
                                            <p className="text-sm text-red-600">{errors.date_fin.message}</p>
                                        )}
                                    </div>
                                </>
                                )}

                                {selectedTemplate !== 'email_personnalisé' && (
                                    <div className="p-4 bg-gray-50 border border-blue-50 rounded-lg md:col-span-2 lg:col-span-2">
                                        <p className="text-gray-700 font-medium">
                                            Les dates correspondent à celles de la période sélectionnée :
                                        </p>

                                        {(() => {
                                            const selected = periodes.find(p => p.id == selectedPeriode);
                                            const dateDebut = selected?.date_debut;
                                            const dateFin = selected?.date_fin;

                                            const now = new Date();
                                            const debutDate = dateDebut ? new Date(dateDebut) : null;
                                            const showNowNotice = debutDate && debutDate < now;

                                            return (
                                                <>
                                                    <p className="text-gray-700 font-medium">
                                                        Date de début : {dateDebut || 'Non définie'}
                                                    </p>
                                                    <p className="text-gray-700 font-medium">
                                                        Date de fin : {dateFin || 'Non définie'}
                                                    </p>
                                                    {showNowNotice && (
                                                        <p className="text-sm text-yellow-500 mt-2">
                                                            ⚠️ La date de début est passée. L'automatisation commencera à partir de maintenant.
                                                        </p>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="frequence" className="text-sm font-semibold text-gray-700">
                                        Fréquence de répétition
                                    </Label>
                                    <Input
                                        id="frequence"
                                        type="number"
                                        min="1"
                                        {...register('frequence', { valueAsNumber: true })}
                                        className={`w-full px-4 py-3 min-h-[48px] bg-gray-50 border-2 border-gray-200 rounded-lg transition-all duration-200 ${errors.frequence ? 'border-red-500' : ''}`}
                                    />
                                    {errors.frequence && (
                                        <p className="text-sm text-red-600">{errors.frequence.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    {selectedTemplate === 'email_personnalisé' && (<>


                                        <Label htmlFor="destinataires" className="text-sm font-semibold text-gray-700">
                                            Destinataires
                                        </Label>
                                        <Select
                                            value={watchedValues.destinataires || 'etudiants'}
                                            onValueChange={(value) => setValue('destinataires', value)}
                                        >
                                            <SelectTrigger className={`w-full px-4 py-3 cursor-pointer bg-gray-50 border-2 border-gray-200 rounded-lg transition-all duration-200 min-h-[48px] ${errors.destinataires ? 'border-red-500' : ''}`}>
                                                <SelectValue placeholder="Sélectionner les destinataires" className="text-left truncate" />
                                            </SelectTrigger>
                                            <SelectContent className="max-w-[calc(100vw-2rem)]">
                                                <SelectItem value="etudiants" className="whitespace-normal break-words py-3">Étudiants</SelectItem>
                                                <SelectItem value="enseignants" className="whitespace-normal break-words py-3">Enseignants</SelectItem>
                                                <SelectItem value="entreprises" className="whitespace-normal break-words py-3">Entreprises</SelectItem>
                                                <SelectItem value="tous" className="whitespace-normal break-words py-3">Tous les utilisateurs</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.destinataires && (
                                            <p className="text-sm text-red-600">{errors.destinataires.message}</p>
                                        )}
                                    </>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-sm font-semibold text-gray-700">
                                    Aperçu du template
                                </Label>
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="bg-gray-50 p-4 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-medium text-gray-600 w-12">De :</span>
                                            <span className="text-sm text-gray-800">administration</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-medium text-gray-600 w-12">À :</span>
                                            <span className="text-sm text-gray-800">{getDestinatairesDisplay()}</span>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <span className="text-sm font-medium text-gray-600 w-12 pt-2">Objet :</span>
                                            <div className="flex-1 whitespace-pre-wrap">
                                                <Input
                                                    {...register('email_objet')}
                                                    className={`w-full px-3 py-2 text-sm ${errors.email_objet ? 'border-red-500' : ''}`}
                                                    placeholder="Saisir l'objet de l'email"
                                                />
                                                {errors.email_objet && (
                                                    <p className="text-sm text-red-600 mt-1">{errors.email_objet.message}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <Textarea
                                            {...register('email_contenu')}
                                            className={`w-full min-h-[200px] resize-none ${errors.email_contenu ? 'border-red-500' : ''}`}
                                            placeholder="Saisir le contenu de l'email"
                                        />
                                        {errors.email_contenu && (
                                            <p className="text-sm text-red-600 mt-1">{errors.email_contenu.message}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-center">
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="inline-flex items-center cursor-pointer gap-2 px-6 py-3 mb-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg shadow-lg shadow-orange-200 hover:from-orange-600 hover:to-orange-700 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            Création en cours...
                                        </>
                                    ) : (
                                        <>
                                            <span>📧</span>
                                            Planifier les mails
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default EmailSchedulingDialog;