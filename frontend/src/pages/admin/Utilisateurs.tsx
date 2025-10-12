import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Plus,
    Menu as MenuIcon,
    Upload,
    Edit,
    Trash2,
    Loader2,
} from "lucide-react";
import { toast } from "sonner";
import ConfirmationDialog from "@/components/custom/confirmation-dialog";
import type { EtudiantProfile } from "@/types/global/etudiant";
import type { EnseignantProfile } from "@/types/global/enseignant";
import type { EntrepriseProfile } from "@/types/global/entreprise";
import MyPagination from "@/components/custom/MyPagination";
import { TEACHER_GRADES } from "@/constants/teacherGrades";
import { userManagementService } from "@/services/api";
import type { ImportResponse, PaginatedResponse } from "@/types/user-management/user-management";
import AjouterEtudiantDialog from "@/components/custom/AjouterEtudiantDialog";
import AjouterEnseignantDialog from "@/components/custom/AjouterEnseignantDialog";
import AjouterEntrepriseDialog from "@/components/custom/AjouterEntrepriseDialog";
import ModifierEtudiantDialog from "@/components/custom/ModifierEtudiantDialog";
import ModifierEnseignantDialog from "@/components/custom/ModifierEnseignantDialog";
import ModifierEntrepriseDialog from "@/components/custom/ModifierEntrepriseDialog";
import type { OptionItem } from "@/types/options";
import { fetchOptions } from "@/functions/fetchOptions";

const Table: React.FC<{ children: React.ReactNode; className?: string }> = ({
    children,
    className,
}) => <table className={className}>{children}</table>;
const TableHeader: React.FC<{
    children: React.ReactNode;
    className?: string;
}> = ({ children, className }) => (
    <thead className={className}>{children}</thead>
);
const TableBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <tbody>{children}</tbody>
);
const TableRow: React.FC<{ children: React.ReactNode; className?: string }> = ({
    children,
    className,
}) => <tr className={className}>{children}</tr>;
const TableHead: React.FC<{
    children: React.ReactNode;
    className?: string;
}> = ({ children, className }) => <th className={className}>{children}</th>;
const TableCell: React.FC<{
    children: React.ReactNode;
    className?: string;
    colSpan?: number;
}> = ({ children, className, colSpan }) => (
    <td className={className} colSpan={colSpan}>
        {children}
    </td>
);

function Utilisateurs() {
    const [selectedEtudiant, setSelectedEtudiant] = useState(false);
    const [selectedEnseignant, setSelectedEnseignant] = useState(false);
    const [selectedEntreprise, setSelectedEntreprise] = useState(false);
    const [selectedOption, setSelectedOption] = useState("Tous");
    const [selectedGrade, setSelectedGrade] = useState("Tous");
    const [isLoading, setIsLoading] = useState(false);
    const [isServerLoadingEtudiants, setIsServerLoadingEtudiants] = useState(false);
    const [isServerLoadingEnseignants, setIsServerLoadingEnseignants] = useState(false);
    const [isServerLoadingEntreprises, setIsServerLoadingEntreprises] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedUserName, setSelectedUserName] = useState<string | null>(null);
    const [selectedUserRole, setSelectedUserRole] = useState<string | null>(null);
    const [currentEnseignantPage, setCurrentEnseignantPage] = useState(1);
    const [currentEntreprisePage, setCurrentEntreprisePage] = useState(1);
    const [enseignants, setEnseignants] = useState<EnseignantProfile[]>([]);
    const [entreprises, setEntreprises] = useState<EntrepriseProfile[]>([]);
    const [etudiants, setEtudiants] = useState<
        PaginatedResponse<EtudiantProfile>
    >({
        data: [],
        current_page: 1,
        last_page: 1,
    });
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const itemsPerPage = 10;
    const [searchTermEtudiant, setSearchTermEtudiant] = useState("");
    const [searchTermEnseignant, setSearchTermEnseignant] = useState("");
    const [searchTermEntreprise, setSearchTermEntreprise] = useState("");
    const [searchDebounceTimerEtudiant, setSearchDebounceTimerEtudiant] =
        useState<NodeJS.Timeout | null>(null);
    const [errorEtudiant, setErrorEtudiant] = useState<string | null>(null);
    const [errorEnseignant, setErrorEnseignant] = useState<string | null>(null);
    const [errorEntreprise, setErrorEntreprise] = useState<string | null>(null);
    const scrollTargetRef = useRef<HTMLTableRowElement>(null);
    const [options, setOptions] = useState<OptionItem[]>([]);
    const [isLoadingOptions, setIsLoadingOptions] = useState(false);
    const [errorOptions, setErrorOptions] = useState<string | null>(null);

    useEffect(() => {
        const savedTab = localStorage.getItem("selectedTab") || "etudiant";
        if (savedTab === "etudiant") {
            setSelectedEtudiant(true);
            setSelectedEnseignant(false);
            setSelectedEntreprise(false);
            fetchAllOptions();
            fetchEtudiants();
        } else if (savedTab === "enseignant") {
            setSelectedEtudiant(false);
            setSelectedEnseignant(true);
            setSelectedEntreprise(false);
            fetchEnseignants();
        } else if (savedTab === "entreprise") {
            setSelectedEtudiant(false);
            setSelectedEnseignant(false);
            setSelectedEntreprise(true);
            fetchEntreprises();
        }
    }, []);

    const fetchEtudiants = async (search = "", option = "Tous", page = 1) => {
        try {
            setIsServerLoadingEtudiants(true);
            setErrorEtudiant(null);
            const response = await userManagementService.getEtudiants(
                search,
                option,
                page
            );
            setEtudiants(response);
            console.log("Étudiants récupérés:", response);
        } catch (error) {
            console.error("Erreur étudiants:", error);
            setErrorEtudiant("Impossible de charger la liste des étudiants");
            toast.error("Erreur lors du chargement des étudiants");
        } finally {
            setIsServerLoadingEtudiants(false);
        }
    };

    const fetchAllOptions = async () => {
        try {
            setIsLoadingOptions(true);
            setErrorOptions(null);
            const response = await fetchOptions();
            console.log("Options récupérées:", response);
            if (response.success) {
                setOptions(response.options);
            }
        } catch (error) {
            console.error("Erreur lors du chargement des options:", error);
            setErrorOptions("Impossible de charger la liste des options");
            toast.error("Erreur lors du chargement des options");
        } finally {
            setIsLoadingOptions(false);
        }
    };

    const fetchEnseignants = async () => {
        try {
            setIsServerLoadingEnseignants(true);
            setErrorEnseignant(null);
            const response = await userManagementService.getEnseignants();
            setEnseignants(response);
            console.log("Enseignants récupérés:", response);
        } catch (error) {
            console.error("Erreur enseignants:", error);
            setErrorEnseignant("Impossible de charger la liste des enseignants");
            toast.error("Erreur lors du chargement des enseignants");
        } finally {
            setIsServerLoadingEnseignants(false);
        }
    };

    const fetchEntreprises = async () => {
        try {
            setIsServerLoadingEntreprises(true);
            setErrorEntreprise(null);
            const response = await userManagementService.getEntreprises();
            setEntreprises(response);
            console.log("Entreprises récupérées:", response);
        } catch (error) {
            console.error("Erreur entreprises:", error);
            setErrorEntreprise("Impossible de charger la liste des entreprises");
            toast.error("Erreur lors du chargement des entreprises");
        } finally {
            setIsServerLoadingEntreprises(false);
        }
    };

    const filteredEnseignants = useMemo(() => {
        if (!selectedEnseignant) return [];
        const searchLower = searchTermEnseignant.toLowerCase();
        return enseignants
            .filter((user) => user.role.toLowerCase() === "enseignant")
            .filter(
                (user) =>
                    user.nom.toLowerCase().includes(searchLower) ||
                    user.email.toLowerCase().includes(searchLower)
            )
            .filter(
                (user) => selectedGrade === "Tous" || user.grade === selectedGrade
            );
    }, [enseignants, searchTermEnseignant, selectedGrade, selectedEnseignant]);

    const filteredEntreprises = useMemo(() => {
        if (!selectedEntreprise) return [];
        const searchLower = searchTermEntreprise.toLowerCase();
        return entreprises
            .filter((user) => user.role.toLowerCase() === "entreprise")
            .filter(
                (user) =>
                    user.nom.toLowerCase().includes(searchLower) ||
                    user.email.toLowerCase().includes(searchLower) ||
                    user.denomination?.toLowerCase().includes(searchLower)
            );
    }, [entreprises, searchTermEntreprise, selectedEntreprise]);

    const handleRefreshEtudiants = () => {
        fetchEtudiants(searchTermEtudiant.toLowerCase(), selectedOption, etudiants.current_page);
    }

    const handleRefreshEnseignants = () => {
        fetchEnseignants();
    }

    const handleRefreshEntreprises = () => {
        fetchEntreprises();
    };

    const debouncedSearchEtudiant = useCallback(
        (searchValue: string, optionValue: string) => {
            if (searchDebounceTimerEtudiant) {
                clearTimeout(searchDebounceTimerEtudiant);
            }
            const timer = setTimeout(() => {
                fetchEtudiants(searchValue, optionValue, 1);
            }, 3000);
            setSearchDebounceTimerEtudiant(timer);
        },
        [searchDebounceTimerEtudiant]
    );

    const handleSearchEtudiant = (event: React.ChangeEvent<HTMLInputElement>) => {
        const searchValue = event.target.value;
        setSearchTermEtudiant(searchValue);
        debouncedSearchEtudiant(searchValue.toLowerCase(), selectedOption);
    };

    const handleSearchEnseignant = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const searchValue = event.target.value;
        setSearchTermEnseignant(searchValue);
        setCurrentEnseignantPage(1);
    };

    const handleSearchEntreprise = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const searchValue = event.target.value;
        setSearchTermEntreprise(searchValue);
        setCurrentEntreprisePage(1);
    };

    const handleOptionChange = (optionValue: string) => {
        setSelectedOption(optionValue);
        if (selectedEtudiant) {
            fetchEtudiants(searchTermEtudiant.toLowerCase(), optionValue, 1);
        }
    };

    const handleGradeChange = (gradeValue: string) => {
        setSelectedGrade(gradeValue);
        setCurrentEnseignantPage(1);
    };

    const handleEtudiant = async () => {
        localStorage.setItem("selectedTab", "etudiant");
        setSelectedEtudiant(true);
        setSelectedEnseignant(false);
        setSelectedEntreprise(false);

        if (options.length === 0) {
            fetchAllOptions();
        }

        if (etudiants.data.length === 0) {
            fetchEtudiants();
        }
    };

    const handleEnseignant = () => {
        localStorage.setItem("selectedTab", "enseignant");
        setSelectedEtudiant(false);
        setSelectedEnseignant(true);
        setSelectedEntreprise(false);
        if (enseignants.length === 0) {
            fetchEnseignants();
        }
    };

    const handleEntreprise = () => {
        localStorage.setItem("selectedTab", "entreprise");
        setSelectedEtudiant(false);
        setSelectedEnseignant(false);
        setSelectedEntreprise(true);
        if (entreprises.length === 0) {
            fetchEntreprises();
        }
    };

    const selectionerIdUser = (
        userId: string,
        userName: string,
        userRole: string
    ) => {
        setSelectedUserId(userId);
        setSelectedUserName(userName);
        setSelectedUserRole(userRole);
        setShowConfirmDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedUserId) return;
        try {
            setShowConfirmDialog(false);
            setDeletingId(selectedUserId);
            await userManagementService.deleteUser(selectedUserId);
            toast.success("Utilisateur supprimé avec succès");
            if (selectedEtudiant) {
                setEtudiants(prev => ({
                    ...prev,
                    data: prev.data.filter(user => user.id !== selectedUserId)
                }));
            } else if (selectedEnseignant) {
                setEnseignants(prev =>
                    prev.filter(user => user.id !== selectedUserId)
                );
            } else if (selectedEntreprise) {
                setEntreprises(prev =>
                    prev.filter(user => user.id !== selectedUserId)
                );
            }
        } catch (error) {
            console.error("Erreur suppression:", error);
            toast.error("Erreur lors de la suppression");
        } finally {
            setDeletingId(null);
        }
    };

    const getPaginatedEnseignants = (data: EnseignantProfile[], currentPage: number): EnseignantProfile[] => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return data.slice(startIndex, endIndex);
    };

    const getPaginatedEntreprises = (data: EntrepriseProfile[], currentPage: number): EntrepriseProfile[] => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return data.slice(startIndex, endIndex);
    };

    const getTotalPages = (dataLength: number) => {
        return Math.ceil(dataLength / itemsPerPage);
    };

    const handleEtudiantPageChange = (newPage: number) => {
        fetchEtudiants(searchTermEtudiant.toLowerCase(), selectedOption, newPage);
        scrollTargetRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleFileUpload = async (
        event: React.ChangeEvent<HTMLInputElement>,
        userType: 'etudiant' | 'enseignant' | 'entreprise'
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsLoading(true);

        try {
            let response: ImportResponse;

            switch (userType) {
                case 'etudiant':
                    response = await userManagementService.importEtudiants(file);
                    break;
                case 'enseignant':
                    response = await userManagementService.importEnseignants(file);
                    break;
                case 'entreprise':
                    response = await userManagementService.importEntreprises(file);
                    break;
                default:
                    throw new Error('Type d\'utilisateur non reconnu');
            }

            if (response.success) {
                toast.success(response.message);
                if (selectedEtudiant) {
                    fetchEtudiants(searchTermEtudiant.toLowerCase(), selectedOption, etudiants.current_page);
                } else if (selectedEnseignant) {
                    fetchEnseignants();
                } else if (selectedEntreprise) {
                    fetchEntreprises();
                }
            } else {
                toast.error(response.message);
            }
        } catch (error: unknown) {
            if (
                typeof error === 'object' &&
                error !== null &&
                'status' in error &&
                (error as { status: unknown }).status === 400 &&
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

                toast.error(message || "Erreur lors de l'analyse du fichier CSV.");
            } else {
                const errorMessage = "Veuillez vérifier le format du fichier CSV ainsi que la validité des types de données dans chaque champ.";
                toast.error(errorMessage);
            }
        }
        finally {
            setIsLoading(false);
            if (event.target) {
                event.target.value = '';
            }
        }
    };

    const getHeaderTitle = (): string => {
        if (selectedEtudiant) return "Étudiants";
        if (selectedEnseignant) return "Enseignants";
        if (selectedEntreprise) return "Entreprises";
        return "Utilisateurs";
    };

    if (isServerLoadingEtudiants || isServerLoadingEnseignants || isServerLoadingEntreprises || isLoading || isLoadingOptions) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Chargement de la page...</span>
                </div>
            </div>
        );
    }

    if (errorEtudiant || errorEnseignant || errorEntreprise || errorOptions) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    {errorEtudiant && <p className="text-red-600 mb-4">{errorEtudiant}</p>}
                    {errorEnseignant && <p className="text-red-600 mb-4">{errorEnseignant}</p>}
                    {errorEntreprise && <p className="text-red-600 mb-4">{errorEntreprise}</p>}
                    {errorOptions && <p className="text-red-600 mb-4">{errorOptions}</p>}
                    <Button
                        onClick={() => {
                            if (errorEtudiant) {
                                setSelectedOption("Tous");
                                setSearchTermEtudiant("");
                                fetchEtudiants();
                            } if (errorEnseignant) {
                                fetchEnseignants();
                            } if (errorEntreprise) {
                                fetchEntreprises();
                            } if (errorOptions) {
                                fetchAllOptions();
                            }
                        }}
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
            <div ref={scrollTargetRef}></div>
            <ConfirmationDialog
                isOpen={showConfirmDialog}
                onClose={() => setShowConfirmDialog(false)}
                onConfirme={handleConfirmDelete}
                title="Confirmation de suppression"
                message={`Êtes-vous sûr de vouloir supprimer l'${selectedUserRole} ${selectedUserName} ?`}
            />
            <div className="w-full px-6">
                <div className="header mb-8">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <h2 className="text-gray-900 text-2xl font-semibold m-0">
                                {getHeaderTitle()}
                            </h2>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        title="Filtrer les utilisateurs"
                                        className="cursor-pointer"
                                    >
                                        <MenuIcon className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="min-w-[200px] max-w-[250px]">
                                    <DropdownMenuItem
                                        onClick={handleEtudiant}
                                        className={`cursor-pointer whitespace-normal break-words ${selectedEtudiant ? "bg-blue-50 font-medium" : ""
                                            }`}
                                    >
                                        Étudiants
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={handleEnseignant}
                                        className={`cursor-pointer whitespace-normal break-words ${selectedEnseignant ? "bg-blue-50 font-medium" : ""
                                            }`}
                                    >
                                        Enseignants
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={handleEntreprise}
                                        className={`cursor-pointer whitespace-normal break-words ${selectedEntreprise ? "bg-blue-50 font-medium" : ""
                                            }`}
                                    >
                                        Entreprises
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
                            {selectedEtudiant && (
                                <Select value={selectedOption} onValueChange={handleOptionChange}>
                                    <SelectTrigger className="w-full sm:w-48 cursor-pointer">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Tous" className="cursor-pointer">
                                            Tous
                                        </SelectItem>
                                        {options.map((optionItem) => (
                                            <SelectItem
                                                key={optionItem.option}
                                                value={optionItem.option}
                                                className="cursor-pointer"
                                            >
                                                {optionItem.option}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            {selectedEnseignant && (
                                <Select value={selectedGrade} onValueChange={handleGradeChange}>
                                    <SelectTrigger className="w-full sm:w-48 cursor-pointer">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Tous" className="cursor-pointer">
                                            Tous
                                        </SelectItem>
                                        {TEACHER_GRADES.map((grade: string) => (
                                            <SelectItem
                                                key={grade}
                                                value={grade}
                                                className="cursor-pointer"
                                            >
                                                {grade}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            <input
                                type="search"
                                placeholder={
                                    selectedEtudiant
                                        ? "Rechercher un étudiant..."
                                        : selectedEnseignant
                                            ? "Rechercher un enseignant..."
                                            : "Rechercher une entreprise..."
                                }
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm w-full sm:min-w-64 transition-all duration-200 focus:outline-none focus:border-orange-500 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.1)]"
                                value={
                                    selectedEtudiant
                                        ? searchTermEtudiant
                                        : selectedEnseignant
                                            ? searchTermEnseignant
                                            : searchTermEntreprise
                                }
                                onChange={
                                    selectedEtudiant
                                        ? handleSearchEtudiant
                                        : selectedEnseignant
                                            ? handleSearchEnseignant
                                            : handleSearchEntreprise
                                }
                            />
                            {selectedEtudiant && (
                                <AjouterEtudiantDialog
                                    options={options}
                                    onSuccess={handleRefreshEtudiants}
                                >
                                    <Button
                                        className="rounded-md px-4 py-2 shadow-lg bg-white hover:bg-gray-100 border  text-black cursor-pointer z-50"
                                        title="Ajouter un étudiant"
                                    >
                                        <Plus className="h-5 w-5 mr-2" />
                                        Ajouter
                                    </Button>
                                </AjouterEtudiantDialog>
                            )}

                            {selectedEnseignant && (
                                <AjouterEnseignantDialog onSuccess={handleRefreshEnseignants}>
                                    <Button
                                        className="rounded-md px-4 py-2 shadow-lg bg-white hover:bg-gray-100 border  text-black cursor-pointer z-50"
                                        title="Ajouter un enseignant"
                                    >
                                        <Plus className="h-5 w-5 mr-2" />
                                        Ajouter
                                    </Button>
                                </AjouterEnseignantDialog>
                            )}

                            {selectedEntreprise && (
                                <AjouterEntrepriseDialog onSuccess={handleRefreshEntreprises}>
                                    <Button
                                        className="rounded-md px-4 py-2 shadow-lg bg-white hover:bg-gray-100 border  text-black cursor-pointer z-50"
                                        title="Ajouter une entreprise"
                                    >
                                        <Plus className="h-5 w-5 mr-2" />
                                        Ajouter
                                    </Button>
                                </AjouterEntrepriseDialog>
                            )}

                            <Button
                                onClick={() =>
                                    document
                                        .getElementById(
                                            selectedEtudiant
                                                ? "file-upload-etudiants"
                                                : selectedEnseignant
                                                    ? "file-upload-enseignants"
                                                    : "file-upload-entreprises"
                                        )
                                        ?.click()
                                }
                                className="rounded-md px-4 py-2 shadow-lg bg-white hover:bg-gray-100 border  text-black cursor-pointer z-50"
                                title="Importer des utilisateurs"
                            >
                                <Upload className="h-5 w-5 mr-2" />
                                Importer
                            </Button>

                            <input
                                type="file"
                                id="file-upload-etudiants"
                                style={{ display: "none" }}
                                accept=".csv"
                                onChange={(e) => handleFileUpload(e, 'etudiant')}
                            />
                            <input
                                type="file"
                                id="file-upload-enseignants"
                                style={{ display: "none" }}
                                accept=".csv"
                                onChange={(e) => handleFileUpload(e, 'enseignant')}
                            />
                            <input
                                type="file"
                                id="file-upload-entreprises"
                                style={{ display: "none" }}
                                accept=".csv"
                                onChange={(e) => handleFileUpload(e, 'entreprise')}
                            />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-y-auto max-h-[70vh] overflow-x-auto">
                        <Table className="w-full table-fixed min-w-[800px] lg:min-w-0">
                            <colgroup>
                                {selectedEtudiant && (
                                    <>
                                        <col className="w-[20%] min-w-[150px] lg:min-w-0" />
                                        <col className="w-[15%] min-w-[100px] lg:min-w-0" />
                                        <col className="w-[25%] min-w-[200px] lg:min-w-0" />
                                        <col className="w-[12%] min-w-[80px] lg:min-w-0" />
                                        <col className="w-[12%] min-w-[80px] lg:min-w-0" />
                                        <col className="w-[16%] min-w-[140px] lg:min-w-0" />
                                    </>
                                )}
                                {selectedEnseignant && (
                                    <>
                                        <col className="w-[20%] min-w-[140px] lg:min-w-0" />
                                        <col className="w-[15%] min-w-[80px] lg:min-w-0" />
                                        <col className="w-[25%] min-w-[200px] lg:min-w-0" />
                                        <col className="w-[15%] min-w-[100px] lg:min-w-0" />
                                        <col className="w-[20%] min-w-[120px] lg:min-w-0" />
                                        <col className="w-[20%] min-w-[140px] lg:min-w-0" />
                                    </>
                                )}
                                {selectedEntreprise && (
                                    <>
                                        <col className="w-[20%] min-w-[150px] lg:min-w-0" />
                                        <col className="w-[20%] min-w-[150px] lg:min-w-0" />
                                        <col className="w-[15%] min-w-[100px] lg:min-w-0" />
                                        <col className="w-[25%] min-w-[200px] lg:min-w-0" />
                                        <col className="w-[20%] min-w-[140px] lg:min-w-0" />
                                    </>
                                )}
                            </colgroup>
                            <TableHeader className="sticky top-0 z-10">
                                <TableRow className="bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-800 hover:to-slate-700">
                                    <TableHead className="px-4 py-4 text-white font-semibold border-0 text-center">
                                        <div className="flex items-center justify-center gap-2 text-sm tracking-wide">
                                            <span className="text-base opacity-90"></span>
                                            Nom
                                        </div>
                                    </TableHead>
                                    {selectedEntreprise && (
                                        <TableHead className="px-4 py-4 text-white font-semibold border-0 text-center">
                                            <div className="flex items-center justify-center gap-2 text-sm tracking-wide">
                                                <span className="text-base opacity-90">🏢</span>
                                                Dénomination
                                            </div>
                                        </TableHead>
                                    )}
                                    <TableHead className="px-4 py-4 text-white font-semibold border-0 text-center">
                                        <div className="flex items-center justify-center gap-2 text-sm tracking-wide">
                                            <span className="text-base opacity-90"></span>
                                            Rôle
                                        </div>
                                    </TableHead>
                                    <TableHead className="px-4 py-4 text-white font-semibold border-0 text-center">
                                        <div className="flex items-center justify-center gap-2 text-sm tracking-wide">
                                            <span className="text-base opacity-90"></span>
                                            Email
                                        </div>
                                    </TableHead>
                                    {selectedEtudiant && (
                                        <>
                                            <TableHead className="px-4 py-4 text-white font-semibold border-0 text-center">
                                                <div className="flex items-center justify-center gap-2 text-sm tracking-wide">
                                                    <span className="text-base opacity-90"></span>
                                                    Option
                                                </div>
                                            </TableHead>
                                            <TableHead className="px-4 py-4 text-white font-semibold border-0 text-center">
                                                <div className="flex items-center justify-center gap-2 text-sm tracking-wide">
                                                    <span className="text-base opacity-90"></span>
                                                    Moyenne
                                                </div>
                                            </TableHead>
                                        </>
                                    )}
                                    {selectedEnseignant && (
                                        <>
                                            <TableHead className="px-4 py-4 text-white font-semibold border-0 text-center">
                                                <div className="flex items-center justify-center gap-2 text-sm tracking-wide">
                                                    <span className="text-base opacity-90"></span>
                                                    Grade
                                                </div>
                                            </TableHead>
                                            <TableHead className="px-4 py-4 text-white font-semibold border-0 text-center">
                                                <div className="flex items-center justify-center gap-2 text-sm tracking-wide">
                                                    <span className="text-base opacity-90"></span>
                                                    Date de Recrutement
                                                </div>
                                            </TableHead>
                                        </>
                                    )}
                                    <TableHead className="px-4 py-4 text-white font-semibold border-0 text-center">
                                        <div className="flex items-center justify-center gap-2 text-sm tracking-wide">
                                            <span className="text-base opacity-90"></span>
                                            Actions
                                        </div>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {selectedEtudiant &&
                                    (etudiants.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="px-6 py-12 text-center text-gray-500"
                                            >
                                                Aucun étudiant trouvé
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        etudiants.data.map((user, index) => (
                                            <TableRow
                                                key={user.id}
                                                className={`transition-all duration-200 border-b border-slate-100 hover:bg-slate-50 hover:-translate-y-0.5 hover:shadow-md ${index % 2 === 0 ? "bg-gray-50/50" : "bg-white"
                                                    }`}
                                            >
                                                <TableCell className="px-4 py-4 text-center">
                                                    <div className="font-medium text-gray-900 text-sm break-words leading-relaxed">
                                                        {user.nom}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-4 py-4 text-center">
                                                    <div className="text-gray-700 text-sm break-words leading-relaxed">
                                                        {user.role}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-4 py-4 text-center">
                                                    <div className="text-gray-700 text-sm break-words leading-relaxed">
                                                        {user.email}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-4 py-4 text-center">
                                                    <span className="text-gray-700 text-sm">
                                                        {user.option || "-"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="px-4 py-4 text-center">
                                                    <span className="text-gray-700 text-sm">
                                                        {user.moyenne || "-"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="px-4 py-4 text-center">
                                                    <div className="flex flex-col gap-1 items-center">
                                                        <ModifierEtudiantDialog
                                                            etudiant={user}
                                                            options={options}
                                                            onSuccess={handleRefreshEtudiants}
                                                        >
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="inline-flex items-center gap-1 px-2 py-1 text-xs cursor-pointer w-full max-w-[100px]"
                                                            >
                                                                <Edit className="h-3 w-3" />
                                                                Modifier
                                                            </Button>
                                                        </ModifierEtudiantDialog>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() =>
                                                                selectionerIdUser(user.id, user.nom, user.role)
                                                            }
                                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs cursor-pointer w-full max-w-[100px]"
                                                            disabled={deletingId === user.id}
                                                        >
                                                            {deletingId === user.id ? (
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
                                    ))}
                                {selectedEnseignant &&
                                    (getPaginatedEnseignants(filteredEnseignants, currentEnseignantPage)
                                        .length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="px-6 py-12 text-center text-gray-500"
                                            >
                                                Aucun enseignant trouvé
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        getPaginatedEnseignants(
                                            filteredEnseignants,
                                            currentEnseignantPage
                                        ).map((user, index) => (
                                            <TableRow
                                                key={user.id}
                                                className={`transition-all duration-200 border-b border-slate-100 hover:bg-slate-50 hover:-translate-y-0.5 hover:shadow-md ${index % 2 === 0 ? "bg-gray-50/50" : "bg-white"
                                                    }`}
                                            >
                                                <TableCell className="px-4 py-4 text-center">
                                                    <div className="font-medium text-gray-900 text-sm break-words leading-relaxed">
                                                        {user.nom}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-4 py-4 text-center">
                                                    <div className="text-gray-700 text-sm break-words leading-relaxed">
                                                        {user.role}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-4 py-4 text-center">
                                                    <div className="text-gray-700 text-sm break-words leading-relaxed">
                                                        {user.email}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-4 py-4 text-center">
                                                    <span className="text-gray-700 text-sm">
                                                        {user.grade || "-"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="px-4 py-4 text-center">
                                                    <span className="text-gray-700 text-sm">
                                                        {user.date_recrutement || "-"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="px-4 py-4 text-center">
                                                    <div className="flex flex-col gap-1 items-center">
                                                        <ModifierEnseignantDialog
                                                            enseignant={user}
                                                            onSuccess={handleRefreshEnseignants}
                                                        >
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="inline-flex items-center gap-1 px-2 py-1 text-xs cursor-pointer w-full max-w-[100px]"
                                                            >
                                                                <Edit className="h-3 w-3" />
                                                                Modifier
                                                            </Button>
                                                        </ModifierEnseignantDialog>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() =>
                                                                selectionerIdUser(user.id, user.nom, user.role)
                                                            }
                                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs cursor-pointer w-full max-w-[100px]"
                                                            disabled={deletingId === user.id}
                                                        >
                                                            {deletingId === user.id ? (
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
                                    ))}
                                {selectedEntreprise &&
                                    (getPaginatedEntreprises(filteredEntreprises, currentEntreprisePage)
                                        .length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                className="px-6 py-12 text-center text-gray-500"
                                            >
                                                Aucune entreprise trouvée
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        getPaginatedEntreprises(
                                            filteredEntreprises,
                                            currentEntreprisePage
                                        ).map((user, index) => (
                                            <TableRow
                                                key={user.id}
                                                className={`transition-all duration-200 border-b border-slate-100 hover:bg-slate-50 hover:-translate-y-0.5 hover:shadow-md ${index % 2 === 0 ? "bg-gray-50/50" : "bg-white"
                                                    }`}
                                            >
                                                <TableCell className="px-4 py-4 text-center">
                                                    <div className="font-medium text-gray-900 text-sm break-words leading-relaxed">
                                                        {user.nom}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-4 py-4 text-center">
                                                    <div className="text-gray-700 text-sm break-words leading-relaxed">
                                                        {user.denomination || "-"}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-4 py-4 text-center">
                                                    <div className="text-gray-700 text-sm break-words leading-relaxed">
                                                        {user.role}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-4 py-4 text-center">
                                                    <div className="text-gray-700 text-sm break-words leading-relaxed">
                                                        {user.email}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-4 py-4 text-center">
                                                    <div className="flex flex-col gap-1 items-center">
                                                        <ModifierEntrepriseDialog
                                                            entreprise={user}
                                                            onSuccess={handleRefreshEntreprises}
                                                        >
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="inline-flex items-center gap-1 px-2 py-1 text-xs cursor-pointer w-full max-w-[100px]"
                                                            >
                                                                <Edit className="h-3 w-3" />
                                                                Modifier
                                                            </Button>
                                                        </ModifierEntrepriseDialog>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() =>
                                                                selectionerIdUser(user.id, user.nom, user.role)
                                                            }
                                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs cursor-pointer w-full max-w-[100px]"
                                                            disabled={deletingId === user.id}
                                                        >
                                                            {deletingId === user.id ? (
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
                                    ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
                {selectedEtudiant && etudiants.last_page > 1 && (
                    <div className="mt-6 flex justify-center">
                        <MyPagination
                            currentPage={etudiants.current_page}
                            totalPages={etudiants.last_page}
                            onPageChange={handleEtudiantPageChange}
                        />
                    </div>
                )}
                {selectedEnseignant &&
                    getTotalPages(filteredEnseignants.length) > 1 && (
                        <div className="mt-6 flex justify-center">
                            <MyPagination
                                currentPage={currentEnseignantPage}
                                totalPages={getTotalPages(filteredEnseignants.length)}
                                onPageChange={(newPage) => {
                                    setCurrentEnseignantPage(newPage);
                                    setTimeout(() => {
                                        const tableContainer = document.querySelector('.overflow-y-auto.max-h-\\[70vh\\]');
                                        if (tableContainer) {
                                            tableContainer.scrollTop = 0;
                                        }
                                    }, 100);
                                    scrollTargetRef.current?.scrollIntoView({ behavior: "smooth" });
                                }}
                            />
                        </div>
                    )}
                {selectedEntreprise &&
                    getTotalPages(filteredEntreprises.length) > 1 && (
                        <div className="mt-6 flex justify-center">
                            <MyPagination
                                currentPage={currentEntreprisePage}
                                totalPages={getTotalPages(filteredEntreprises.length)}
                                onPageChange={(newPage) => {
                                    setCurrentEntreprisePage(newPage);
                                    setTimeout(() => {
                                        const tableContainer = document.querySelector('.overflow-y-auto.max-h-\\[70vh\\]');
                                        if (tableContainer) {
                                            tableContainer.scrollTop = 0;
                                        }
                                    }, 100);
                                    scrollTargetRef.current?.scrollIntoView({ behavior: "smooth" });
                                }}
                            />
                        </div>
                    )}
            </div>
        </div>
    );
}
export default Utilisateurs;
