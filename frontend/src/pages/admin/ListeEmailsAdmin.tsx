import React, { useState, useEffect } from 'react';
import { Loader2, Menu, Plus, Eye, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { emailService } from '@/services/api';
import ConfirmationDialog from '@/components/custom/confirmation-dialog';
import type { AutomationEmail, EmailAutomationStatusUpdate, EmailAutomationUpdate, Periode, PlanificationEmail } from '@/types/liste-emails-admin/liste-emails-admin';
import EmailSchedulingDialog from '@/components/custom/EmailSchedulingDialog';

const Table: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <table className={className}>{children}</table>
);

const TableHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <thead className={className}>{children}</thead>
);

const TableBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <tbody>{children}</tbody>
);

const TableRow: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <tr className={className}>{children}</tr>
);

const TableHead: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <th className={className}>{children}</th>
);

const TableCell: React.FC<{ children: React.ReactNode; className?: string; colSpan?: number }> = ({ children, className, colSpan }) => (
    <td className={className} colSpan={colSpan}>{children}</td>
);

const ListeEmailsAdmin: React.FC = () => {
    const [automationEmails, setAutomationEmails] = useState<AutomationEmail[]>([]);
    const [emailsPlanifies, setEmailsPlanifies] = useState<PlanificationEmail[]>([]);
    const [periodes, setPeriodes] = useState<Periode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const [selectedPeriode, setSelectedPeriode] = useState<number | string | null>(() => {
        const saved = localStorage.getItem('selectedPeriode');
        return saved ? JSON.parse(saved) : null;
    });

    const [selectedStatus, setSelectedStatus] = useState<string>(() => {
        const saved = localStorage.getItem('selectedStatus');
        return saved ? JSON.parse(saved) : '';
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedAutomationId, setSelectedAutomationId] = useState<string | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [automationToDelete, setAutomationToDelete] = useState<string | null>(null);
    const [showEmailDialog, setShowEmailDialog] = useState(false);

    useEffect(() => {
        localStorage.setItem('selectedPeriode', JSON.stringify(selectedPeriode));
    }, [selectedPeriode]);

    useEffect(() => {
        localStorage.setItem('selectedStatus', JSON.stringify(selectedStatus));
    }, [selectedStatus]);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const handleAutomationUpdate = (event: CustomEvent<EmailAutomationUpdate>) => {
            const update = event.detail;

            setEmailsPlanifies(prev =>
                prev.map(plan =>
                    plan.id === update.planification_id
                        ? { ...plan, status: update.planification_status }
                        : plan
                )
            );
        };

        const handleAutomationStatusUpdate = (event: CustomEvent<EmailAutomationStatusUpdate>) => {
            const update = event.detail;

            setAutomationEmails(prev =>
                prev.map(automation =>
                    automation.id === update.automation_id
                        ? { ...automation, status: update.automation_status }
                        : automation
                )
            );
        };

        window.addEventListener('emailAutomationUpdate', handleAutomationUpdate as EventListener);
        window.addEventListener('emailAutomationStatusUpdate', handleAutomationStatusUpdate as EventListener);

        return () => {
            window.removeEventListener('emailAutomationUpdate', handleAutomationUpdate as EventListener);
            window.removeEventListener('emailAutomationStatusUpdate', handleAutomationStatusUpdate as EventListener);
        };
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);

            const data = await emailService.getListEmails();

            setAutomationEmails(data.automation_emails || []);
            setEmailsPlanifies(data.emails_planifies || []);
            setPeriodes(data.periodes || []);
            setError(null);
        } catch (err) {
            setError('Erreur lors du chargement des données');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteClick = (automationId: string) => {
        setAutomationToDelete(automationId);
        setShowConfirmDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!automationToDelete) return;

        try {
            setDeletingId(automationToDelete);
            setShowConfirmDialog(false);

            await emailService.deleteAutomatisation(automationToDelete);

            toast.success("L'automation a été supprimée avec succès");

            setAutomationEmails(prev =>
                prev.filter(automation => automation.id !== automationToDelete)
            );
        } catch (err) {
            toast.error("Erreur lors de la suppression de l'automation");
        } finally {
            setDeletingId(null);
        }
    };

    const handleAddAutomation = () => {
        setShowEmailDialog(true);
    };

    const handleEmailCreationSuccess = () => {
        fetchData();
    };

    const handleOpenDialog = (automationId: string) => {
        setSelectedAutomationId(automationId);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedAutomationId(null);
    };

    const getStatusColor = (status: string): string => {
        const colors = {
            'en_cours': '#00CCFFFF',
            'en_attente': '#2196F3',
            'termine': '#757575',
            'envoye': '#4CAF50',
            'echoue': '#F44336'
        };
        return colors[status as keyof typeof colors] || '#757575';
    };

    const formatDateTime = (dateTime: string): string => {
        return new Date(dateTime).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusLabel = (status: string): string => {
        const labels = {
            'en_attente': 'Prévu',
            'en_cours': 'En cours',
            'termine': 'Terminé',
            'envoye': 'Envoyé',
            'echoue': 'Échoué'
        };
        return labels[status as keyof typeof labels] || status;
    };

    const filteredAutomations = automationEmails.filter(automation => {
        let matchPeriode = true;
        let matchStatus = true;
        let matchSearch = true;

        if (selectedPeriode === 'email_personnalisé') {
            matchPeriode = automation.template === 'email_personnalisé';
        } else if (selectedPeriode) {
            matchPeriode = String(automation.periode) === String(selectedPeriode);
        }

        if (selectedStatus && selectedStatus !== '' && selectedStatus !== 'all') {
            matchStatus = automation.status === selectedStatus;
        }

        if (searchQuery.trim() !== '') {
            const q = searchQuery.toLowerCase();
            matchSearch =
                (!!automation.email_objet && automation.email_objet.toLowerCase().includes(q)) ||
                (!!automation.description && automation.description.toLowerCase().includes(q));
        }

        return matchPeriode && matchStatus && matchSearch;
    });

    const getSelectedAutomation = (): AutomationEmail | null => {
        if (!selectedAutomationId) return null;
        return automationEmails.find(automation => automation.id === selectedAutomationId) || null;
    };

    const getSelectedAutomationPlanifications = (): PlanificationEmail[] => {
        if (!selectedAutomationId) return [];
        const planifications = emailsPlanifies.filter(plan => plan.automation_id === selectedAutomationId);
        return planifications.sort((a, b) => new Date(a.date_envoi_planifie).getTime() - new Date(b.date_envoi_planifie).getTime());
    };

    const getHeaderTitle = (): string => {
        if (selectedPeriode === 'email_personnalisé') return 'Emails personnalisés';
        if (selectedPeriode === null) return 'Toutes les périodes';
        return `Période n° ${selectedPeriode}`;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Chargement de la page...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <Button
                        onClick={fetchData}
                        className="bg-slate-800 text-white hover:bg-slate-900 cursor-pointer"
                    >
                        Réessayer
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full relative">
            <div className="w-full px-6">
                <div className="header mb-8">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <h2 className="text-gray-900 text-2xl font-semibold m-0">
                                {getHeaderTitle()}
                            </h2>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" title="Filtrer par période" className="cursor-pointer">
                                        <Menu className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="min-w-[200px] max-w-[250px]">
                                    <DropdownMenuItem
                                        onClick={() => setSelectedPeriode(null)}
                                        className={`cursor-pointer whitespace-normal break-words ${selectedPeriode === null ? 'bg-blue-50 font-medium' : ''}`}
                                    >
                                        Toutes les périodes
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => setSelectedPeriode('email_personnalisé')}
                                        className={`cursor-pointer whitespace-normal break-words ${selectedPeriode === 'email_personnalisé' ? 'bg-blue-50 font-medium' : ''}`}
                                    >
                                        Emails personnalisés
                                    </DropdownMenuItem>
                                    {periodes.map((periode) => (
                                        <DropdownMenuItem
                                            key={periode.id}
                                            onClick={() => setSelectedPeriode(periode.id)}
                                            className={`cursor-pointer whitespace-normal break-words ${String(selectedPeriode) === String(periode.id) ? 'bg-blue-50 font-medium' : ''}`}
                                        >
                                            Période n° {periode.id} - {periode.titre}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>


                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger className="cursor-pointer">
                                    <SelectValue placeholder="Tous les statuts" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="cursor-pointer">Tous les statuts</SelectItem>
                                    <SelectItem value="en_attente" className="cursor-pointer">Prévu</SelectItem>
                                    <SelectItem value="en_cours" className="cursor-pointer">En cours</SelectItem>
                                    <SelectItem value="termine" className="cursor-pointer">Terminé</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
                            <input
                                type="search"
                                placeholder="Rechercher..."
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm w-full sm:min-w-64 transition-all duration-200 focus:outline-none focus:border-orange-500 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.1)]"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <Button
                                onClick={handleAddAutomation}
                                className="rounded-md px-4 py-2 shadow-lg bg-white hover:bg-gray-100 border  text-black cursor-pointer z-50"
                                title="Ajouter une automation"
                            >
                                <Plus className="h-5 w-5 mr-2" />
                                Ajouter
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-y-auto max-h-[70vh] overflow-x-auto">
                        <Table className="w-full table-fixed min-w-[800px] lg:min-w-0">
                            <colgroup>
                                <col className="w-[30%] min-w-[200px] lg:min-w-0" />
                                <col className="w-[25%] min-w-[180px] lg:min-w-0" />
                                <col className="w-[15%] min-w-[120px] lg:min-w-0" />
                                <col className="w-[12%] min-w-[100px] lg:min-w-0" />
                                <col className="w-[18%] min-w-[140px] lg:min-w-0" />
                            </colgroup>
                            <TableHeader className="sticky top-0 z-10">
                                <TableRow className="bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-800 hover:to-slate-700">
                                    <TableHead className="px-4 py-4 text-white font-semibold border-0 text-center">
                                        <div className="flex items-center justify-center gap-2 text-sm tracking-wide">
                                            Objet
                                        </div>
                                    </TableHead>
                                    <TableHead className="px-4 py-4 text-white font-semibold border-0 text-center">
                                        <div className="flex items-center justify-center gap-2 text-sm tracking-wide">
                                            Destinataires
                                        </div>
                                    </TableHead>
                                    <TableHead className="px-4 py-4 text-white font-semibold border-0 text-center">
                                        <div className="flex items-center justify-center gap-2 text-sm tracking-wide">
                                            Période
                                        </div>
                                    </TableHead>
                                    <TableHead className="px-4 py-4 text-white font-semibold border-0 text-center">
                                        <div className="flex items-center justify-center gap-2 text-sm tracking-wide">
                                            Status
                                        </div>
                                    </TableHead>
                                    <TableHead className="px-4 py-4 text-white font-semibold border-0 text-center">
                                        <div className="flex items-center justify-center gap-2 text-sm tracking-wide">
                                            Actions
                                        </div>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAutomations.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="px-6 py-12 text-center text-gray-500"
                                        >
                                            Aucune automation trouvée
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredAutomations.map((automation, index) => (
                                        <TableRow
                                            key={automation.id}
                                            className={`transition-all duration-200 border-b border-slate-100 hover:bg-slate-50 hover:-translate-y-0.5 hover:shadow-md ${index % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'
                                                }`}
                                        >
                                            <TableCell className="px-4 py-4 text-center">
                                                <div className="font-medium text-gray-900 text-sm break-words leading-relaxed">
                                                    {automation.email_objet || 'N/A'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-4 py-4 text-center">
                                                <div className="text-gray-700 text-sm break-words leading-relaxed">
                                                    {automation.description || 'N/A'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-4 py-4 text-center">
                                                <span className="text-gray-700 text-sm">
                                                    {automation.periode || 'N/A'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-4 py-4 text-center">
                                                <span
                                                    className="px-2 py-1 rounded-full text-white text-xs font-medium inline-block"
                                                    style={{ backgroundColor: getStatusColor(automation.status) }}
                                                >
                                                    {getStatusLabel(automation.status)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-4 py-4 text-center">
                                                <div className="flex flex-col gap-1 items-center">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleOpenDialog(automation.id)}
                                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs cursor-pointer w-full max-w-[100px]"
                                                    >
                                                        <Eye className="h-3 w-3" />
                                                        Consulter
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleDeleteClick(automation.id)}
                                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs cursor-pointer w-full max-w-[100px]"
                                                        disabled={deletingId === automation.id}
                                                    >
                                                        {deletingId === automation.id ? (
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <Trash2 className="h-3 w-3" />
                                                                Supprimer
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                    <DialogContent className="max-w-6xl w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
                        <DialogHeader>
                            <DialogTitle>Détails de l'automation</DialogTitle>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto">
                            {getSelectedAutomation() && (
                                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-center">
                                        <div>
                                            <span className="font-semibold text-gray-700">Objet:</span>
                                            <br />
                                            <span className="text-gray-600">{getSelectedAutomation() ? getSelectedAutomation()!.email_objet : 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-700">Destinataire:</span>
                                            <br />
                                            <span className="text-gray-600">{getSelectedAutomation() ? getSelectedAutomation()!.description : 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-700">Periode:</span>
                                            <br />
                                            <span className="text-gray-600">{getSelectedAutomation() ? getSelectedAutomation()!.periode : 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-700">Date début:</span>
                                            <br />
                                            <span className="text-gray-600">{getSelectedAutomation() ? formatDateTime(getSelectedAutomation()!.date_debut) : 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-700">Date fin:</span>
                                            <br />
                                            <span className="text-gray-600">{getSelectedAutomation() ? formatDateTime(getSelectedAutomation()!.date_fin) : 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-700">Fréquence:</span>
                                            <br />
                                            <span className="text-gray-600">{getSelectedAutomation()?.frequence || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                                    <Table className="w-full min-w-[600px] lg:min-w-0">
                                        <TableHeader className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-700 z-10">
                                            <TableRow className="bg-gradient-to-r from-slate-800 to-slate-700">
                                                <TableHead className="px-6 py-4 text-white font-semibold border-0 text-center min-w-[300px] lg:min-w-0">
                                                    <div className="flex items-center justify-center gap-2 text-sm tracking-wide">
                                                        <span className="text-base opacity-90">📅</span>
                                                        Date et heure d'envoi planifié
                                                    </div>
                                                </TableHead>
                                                <TableHead className="px-6 py-4 text-white font-semibold border-0 text-center min-w-[150px] lg:min-w-0">
                                                    <div className="flex items-center justify-center gap-2 text-sm tracking-wide">
                                                        <span className="text-base opacity-90">📊</span>
                                                        Status
                                                    </div>
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {getSelectedAutomationPlanifications().length === 0 ? (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={2}
                                                        className="px-6 py-8 text-center text-gray-500"
                                                    >
                                                        Aucune planification trouvée
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                getSelectedAutomationPlanifications().map((planification, index) => (
                                                    <TableRow
                                                        key={planification.id}
                                                        className={`transition-all duration-200 border-b border-slate-100 hover:bg-slate-50 ${index % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'
                                                            }`}
                                                    >
                                                        <TableCell className="px-6 py-4 text-center">
                                                            <span className="text-gray-900 text-sm">
                                                                {formatDateTime(planification.date_envoi_planifie)}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 text-center">
                                                            <span
                                                                className="px-3 py-1 rounded-full text-white text-xs font-medium"
                                                                style={{ backgroundColor: getStatusColor(planification.status) }}
                                                            >
                                                                {getStatusLabel(planification.status)}
                                                            </span>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-center mt-6 pt-4 border-t border-gray-200">
                            <Button onClick={handleCloseDialog} className="px-6 bg-slate-800 hover:bg-slate-900 cursor-pointer">
                                Fermer
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                <ConfirmationDialog
                    isOpen={showConfirmDialog}
                    onClose={() => setShowConfirmDialog(false)}
                    onConfirme={handleConfirmDelete}
                    title="Confirmation de suppression"
                    message="Êtes-vous sûr de vouloir supprimer cette automatisation ?"
                />

                <EmailSchedulingDialog
                    isOpen={showEmailDialog}
                    onClose={() => setShowEmailDialog(false)}
                    onSuccess={handleEmailCreationSuccess}
                />
            </div>
        </div>
    );
};

export default ListeEmailsAdmin;