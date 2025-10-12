import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { Menu, Loader2 } from "lucide-react";
import { toast } from "sonner";
import MyPagination from "@/components/custom/MyPagination";
import { validationPropositionsService } from '@/services/api';
import type { PaginatedPropositions, PropositionEnseignant, PropositionEntreprise, PropositionEtudiant } from '@/types/validation-proposals/validation-proposals';
import PropoResponsableEtudiantDialog from '@/components/custom/PropoResponsableEtudiantDialog';
import PropoResponsableEnseignantDialog from '@/components/custom/PropoResponsableEnseignantDialog';
import PropoResponsableEntrepriseDialog from '@/components/custom/PropoResponsableEntrepriseDialog';
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
function ProposResponsable() {
  const [selectedRole, setSelectedRole] = useState<string>(() => {
    return localStorage.getItem('selectedRole') || 'etudiants';
  });
  const [searchTermEtudiants, setSearchTermEtudiants] = useState<string>('');
  const [searchTermEnseignants, setSearchTermEnseignants] = useState<string>('');
  const [searchTermEntreprises, setSearchTermEntreprises] = useState<string>('');
  const [selectedStatusEtudiants, setSelectedStatusEtudiants] = useState<string>('all');
  const [selectedStatusEnseignants, setSelectedStatusEnseignants] = useState<string>('all');
  const [selectedStatusEntreprises, setSelectedStatusEntreprises] = useState<string>('all');
  const [isLoading] = useState<boolean>(false);
  const [isServerLoadingEtudiants, setIsServerLoadingEtudiants] = useState<boolean>(false);
  const [isServerLoadingEnseignants, setIsServerLoadingEnseignants] = useState<boolean>(false);
  const [isServerLoadingEntreprises, setIsServerLoadingEntreprises] = useState<boolean>(false);
  const [propositionsEtudiant, setPropositionsEtudiant] = useState<PaginatedPropositions<PropositionEtudiant>>({
    data: [],
    current_page: 1,
    last_page: 1,
    total: 0
  });
  const [propositionsEnseignant, setPropositionsEnseignant] = useState<PaginatedPropositions<PropositionEnseignant>>({
    data: [],
    current_page: 1,
    last_page: 1,
    total: 0
  });
  const [propositionsEntreprise, setPropositionsEntreprise] = useState<PropositionEntreprise[]>([]);
  const [currentEtudiantPage, setCurrentEtudiantPage] = useState<number>(1);
  const [currentEnseignantPage, setCurrentEnseignantPage] = useState<number>(1);
  const [currentEntreprisePage, setCurrentEntreprisePage] = useState<number>(1);
  const itemsPerPage = 10;
  const [searchTimeoutEtudiants, setSearchTimeoutEtudiants] = useState<NodeJS.Timeout | null>(null);
  const [searchTimeoutEnseignants, setSearchTimeoutEnseignants] = useState<NodeJS.Timeout | null>(null);
  const scrollTargetRef = useRef<HTMLTableRowElement>(null);
  const [errorEtudiants, setErrorEtudiants] = useState<string | null>(null);
  const [errorEnseignants, setErrorEnseignants] = useState<string | null>(null);
  const [errorEntreprises, setErrorEntreprises] = useState<string | null>(null);
  const [selectedPropositionEtudiants, setSelectedPropositionEtudiants] = useState<PropositionEtudiant | null>(null);
  const [isDialogOpenEtudiants, setIsDialogOpenEtudiants] = useState(false);
  const [selectedPropositionEnseignants, setSelectedPropositionEnseignants] = useState<PropositionEnseignant | null>(null);
  const [isDialogOpenEnseignants, setIsDialogOpenEnseignants] = useState(false);
  const [selectedPropositionEntreprises, setSelectedPropositionEntreprises] = useState<PropositionEntreprise | null>(null);
  const [isDialogOpenEntreprises, setIsDialogOpenEntreprises] = useState(false);
  useEffect(() => {
    const savedRole = localStorage.getItem("selectedRole") || "etudiants";
    setSelectedRole(savedRole);
    if (savedRole === 'etudiants') {
      fetchPropositionsEtudiants("", selectedStatusEtudiants, 1);
    } else if (savedRole === 'enseignants') {
      fetchPropositionsEnseignants("", selectedStatusEnseignants, 1);
    } else if (savedRole === 'entreprises') {
      fetchPropositionsEntreprises();
    }
  }, []);
  const fetchPropositionsEtudiants = useCallback(async (searchValue: string, statusValue: string, page: number) => {
    setIsServerLoadingEtudiants(true);
    try {
      setErrorEtudiants(null);
      const response = await validationPropositionsService.getPropositionsEtudiants(
        page,
        statusValue,
        searchValue
      );
      setPropositionsEtudiant(response);
      setCurrentEtudiantPage(page);
    } catch (error) {
      setErrorEtudiants("Impossible de charger les propositions étudiants");
      toast.error('Erreur lors de la récupération des propositions étudiants');
    } finally {
      setIsServerLoadingEtudiants(false);
    }
  }, []);
  const fetchPropositionsEnseignants = useCallback(async (searchValue: string, statusValue: string, page: number) => {
    setIsServerLoadingEnseignants(true);
    try {
      setErrorEnseignants(null);
      const response = await validationPropositionsService.getPropositionsEnseignants(
        page,
        statusValue,
        searchValue
      );
      setPropositionsEnseignant(response);
      setCurrentEnseignantPage(page);
    } catch (error) {
      setErrorEnseignants("Impossible de charger les propositions enseignants");
      toast.error('Erreur lors de la récupération des propositions enseignants');
    } finally {
      setIsServerLoadingEnseignants(false);
    }
  }, []);
  const fetchPropositionsEntreprises = useCallback(async () => {
    setIsServerLoadingEntreprises(true);
    try {
      setErrorEntreprises(null);
      const response = await validationPropositionsService.getPropositionsEntreprises();
      setPropositionsEntreprise(response);
    } catch (error) {
      setErrorEntreprises("Impossible de charger les propositions entreprises");
      toast.error('Erreur lors de la récupération des propositions entreprises');
    } finally {
      setIsServerLoadingEntreprises(false);
    }
  }, []);
  const debouncedSearchEtudiants = useCallback(
    (searchValue: string, statusValue: string) => {
      if (searchTimeoutEtudiants) {
        clearTimeout(searchTimeoutEtudiants);
      }
      const timer = setTimeout(() => {
        fetchPropositionsEtudiants(searchValue, statusValue, 1);
      }, 3000);
      setSearchTimeoutEtudiants(timer);
    },
    [searchTimeoutEtudiants, fetchPropositionsEtudiants]
  );
  const debouncedSearchEnseignants = useCallback(
    (searchValue: string, statusValue: string) => {
      if (searchTimeoutEnseignants) {
        clearTimeout(searchTimeoutEnseignants);
      }
      const timer = setTimeout(() => {
        fetchPropositionsEnseignants(searchValue, statusValue, 1);
      }, 3000);
      setSearchTimeoutEnseignants(timer);
    },
    [searchTimeoutEnseignants, fetchPropositionsEnseignants]
  );
  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    localStorage.setItem('selectedRole', role);
    if (role === 'etudiants' && propositionsEtudiant.data.length === 0) {
      fetchPropositionsEtudiants("", selectedStatusEtudiants, 1);
    } else if (role === 'enseignants' && propositionsEnseignant.data.length === 0) {
      fetchPropositionsEnseignants("", selectedStatusEnseignants, 1);
    } else if (role === 'entreprises' && propositionsEntreprise.length === 0) {
      fetchPropositionsEntreprises();
    }
  };
  const handleEtudiantPageChange = (newPage: number) => {
    fetchPropositionsEtudiants(searchTermEtudiants.toLowerCase(), selectedStatusEtudiants, newPage);
    scrollTargetRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const handleEnseignantPageChange = (newPage: number) => {
    fetchPropositionsEnseignants(searchTermEnseignants.toLowerCase(), selectedStatusEnseignants, newPage);
    scrollTargetRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const handleEntreprisePageChange = (newPage: number) => {
    setCurrentEntreprisePage(newPage);
    setTimeout(() => {
      const tableContainer = document.querySelector('.overflow-y-auto.max-h-\\[70vh\\]');
      if (tableContainer) {
        tableContainer.scrollTop = 0;
      }
    }, 100);
    scrollTargetRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const handleSearchEtudiants = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = event.target.value;
    setSearchTermEtudiants(searchValue);
    debouncedSearchEtudiants(searchValue.toLowerCase(), selectedStatusEtudiants);
  };
  const handleSearchEnseignants = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = event.target.value;
    setSearchTermEnseignants(searchValue);
    debouncedSearchEnseignants(searchValue.toLowerCase(), selectedStatusEnseignants);
  };
  const handleSearchEntreprises = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = event.target.value;
    setSearchTermEntreprises(searchValue);
    setCurrentEntreprisePage(1);
  };
  const handleStatusEtudiantsChange = (statusValue: string) => {
    setSelectedStatusEtudiants(statusValue);
    fetchPropositionsEtudiants(searchTermEtudiants.toLowerCase(), statusValue, 1);
  };
  const handleStatusEnseignantsChange = (statusValue: string) => {
    setSelectedStatusEnseignants(statusValue);
    fetchPropositionsEnseignants(searchTermEnseignants.toLowerCase(), statusValue, 1);
  };
  const handleStatusEntreprisesChange = (statusValue: string) => {
    setSelectedStatusEntreprises(statusValue);
    setCurrentEntreprisePage(1);
  };
  const getPaginatedData = (data: PropositionEntreprise[], currentPage: number): PropositionEntreprise[] => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };
  const getTotalPages = (data: PropositionEntreprise[]): number => {
    return Math.ceil(data.length / itemsPerPage);
  };
  const getFilteredPropositionsEntreprises = () => {
    return propositionsEntreprise.filter(prop => {
      const matchesStatus = selectedStatusEntreprises === 'all' || prop.status === selectedStatusEntreprises;
      if (!matchesStatus) return false;
      if (!searchTermEntreprises) return true;
      const searchLower = searchTermEntreprises.toLowerCase();
      return (
        prop.entreprise.name.toLowerCase().includes(searchLower) ||
        prop.entreprise.entreprise.denomination.toLowerCase().includes(searchLower) ||
        prop.intitule.toLowerCase().includes(searchLower)
      );
    });
  };
  const filteredEntreprisePropositions = selectedRole === 'entreprises' ? getFilteredPropositionsEntreprises() : [];
  const paginatedEntreprisePropositions = selectedRole === 'entreprises' ?
    getPaginatedData(filteredEntreprisePropositions, currentEntreprisePage) : [];
  const totalEntreprisePages = selectedRole === 'entreprises' ?
    getTotalPages(filteredEntreprisePropositions) : 1;
  const handleConsulterClick = (proposition: unknown) => {
    const params = new URLSearchParams();
    Object.keys(proposition as Record<string, unknown>).forEach(key => {
      const prop = proposition as Record<string, unknown>;
      if (prop[key] !== null && prop[key] !== undefined) {
        if (typeof prop[key] === 'object') {
          params.append(key, JSON.stringify(prop[key]));
        } else {
          params.append(key, String(prop[key]));
        }
      }
    });
    if (selectedRole === 'etudiants') {
      setSelectedPropositionEtudiants(proposition as PropositionEtudiant);
      setIsDialogOpenEtudiants(true);
    } else if (selectedRole === 'enseignants') {
      setSelectedPropositionEnseignants(proposition as PropositionEnseignant);
      setIsDialogOpenEnseignants(true);
    } else if (selectedRole === 'entreprises') {
      setSelectedPropositionEntreprises(proposition as PropositionEntreprise);
      setIsDialogOpenEntreprises(true);
    }
  };
  const handleDialogEtudiantsClose = () => {
    setIsDialogOpenEtudiants(false);
    setSelectedPropositionEtudiants(null);
  };
  const handleActionEtudiantsCompleted = () => {
    fetchPropositionsEtudiants(searchTermEtudiants.toLowerCase(), selectedStatusEtudiants, currentEtudiantPage);
  }
  const handleDialogEnseignantsClose = () => {
    setIsDialogOpenEnseignants(false);
    setSelectedPropositionEnseignants(null);
  };
  const handleActionEnseignantsCompleted = () => {
    fetchPropositionsEnseignants(searchTermEnseignants.toLowerCase(), selectedStatusEnseignants, currentEnseignantPage);
  }
  const handleDialogEntreprisesClose = () => {
    setIsDialogOpenEntreprises(false);
    setSelectedPropositionEntreprises(null);
  };
  const handleActionEntreprisesCompleted = () => {
    fetchPropositionsEntreprises();
  };
  const getHeaderTitle = (): string => {
    if (selectedRole === 'etudiants') return "Propositions Étudiants";
    if (selectedRole === 'enseignants') return "Propositions Enseignants";
    if (selectedRole === 'entreprises') return "Propositions Entreprises";
    return "Propositions";
  };
  const getCurrentSearchTerm = () => {
    if (selectedRole === 'etudiants') return searchTermEtudiants;
    if (selectedRole === 'enseignants') return searchTermEnseignants;
    if (selectedRole === 'entreprises') return searchTermEntreprises;
    return '';
  };
  const getCurrentStatus = () => {
    if (selectedRole === 'etudiants') return selectedStatusEtudiants;
    if (selectedRole === 'enseignants') return selectedStatusEnseignants;
    if (selectedRole === 'entreprises') return selectedStatusEntreprises;
    return 'all';
  };
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedRole === 'etudiants') {
      handleSearchEtudiants(event);
    } else if (selectedRole === 'enseignants') {
      handleSearchEnseignants(event);
    } else if (selectedRole === 'entreprises') {
      handleSearchEntreprises(event);
    }
  };
  const handleStatusChange = (status: string) => {
    if (selectedRole === 'etudiants') {
      handleStatusEtudiantsChange(status);
    } else if (selectedRole === 'enseignants') {
      handleStatusEnseignantsChange(status);
    } else if (selectedRole === 'entreprises') {
      handleStatusEntreprisesChange(status);
    }
  };
  const getSearchPlaceholder = () => {
    if (selectedRole === 'etudiants') return "Rechercher...";
    if (selectedRole === 'enseignants') return "Rechercher...";
    if (selectedRole === 'entreprises') return "Rechercher...";
    return "Rechercher...";
  };
  if (isServerLoadingEtudiants || isServerLoadingEnseignants || isServerLoadingEntreprises || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Chargement de la page...</span>
        </div>
      </div>
    );
  }
  if (errorEtudiants || errorEnseignants || errorEntreprises) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          {errorEtudiants && <p className="text-red-600 mb-4">{errorEtudiants}</p>}
          {errorEnseignants && <p className="text-red-600 mb-4">{errorEnseignants}</p>}
          {errorEntreprises && <p className="text-red-600 mb-4">{errorEntreprises}</p>}
          <Button
            onClick={() => {
              if (errorEtudiants) {
                setSearchTermEtudiants("");
                setSelectedStatusEtudiants("all");
                fetchPropositionsEtudiants("", "all", 1);
              }
              if (errorEnseignants) {
                setSearchTermEnseignants("");
                setSelectedStatusEnseignants("all");
                fetchPropositionsEnseignants("", "all", 1);
              }
              if (errorEntreprises) {
                setSearchTermEntreprises("");
                setSelectedStatusEntreprises("all");
                fetchPropositionsEntreprises();
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
      <div className="w-full px-6">
        <div className="header mb-8">
          <div className="text-center space-y-2 mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {getHeaderTitle()}
            </h1>
            <p className="text-muted-foreground">
              Consultez et validez les propositions soumises
            </p>
          </div>
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
                    title="Filtrer les propositions"
                    className="cursor-pointer"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="min-w-[200px] max-w-[250px]">
                  <DropdownMenuItem
                    onClick={() => handleRoleSelect('etudiants')}
                    className={`cursor-pointer whitespace-normal break-words ${selectedRole === 'etudiants' ? "bg-blue-50 font-medium" : ""}`}
                  >
                    Étudiants
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleRoleSelect('enseignants')}
                    className={`cursor-pointer whitespace-normal break-words ${selectedRole === 'enseignants' ? "bg-blue-50 font-medium" : ""}`}
                  >
                    Enseignants
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleRoleSelect('entreprises')}
                    className={`cursor-pointer whitespace-normal break-words ${selectedRole === 'entreprises' ? "bg-blue-50 font-medium" : ""}`}
                  >
                    Entreprises
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
              <Select value={getCurrentStatus()} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full sm:w-48 cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">
                    Tous les statuts
                  </SelectItem>
                  <SelectItem value="pending" className="cursor-pointer">
                    En attente
                  </SelectItem>
                  <SelectItem value="accepted" className="cursor-pointer">
                    Accepté
                  </SelectItem>
                  <SelectItem value="declined" className="cursor-pointer">
                    Refusé
                  </SelectItem>
                </SelectContent>
              </Select>
              <input
                type="search"
                placeholder={getSearchPlaceholder()}
                className="w-full sm:min-w-64 px-4 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
                value={getCurrentSearchTerm()}
                onChange={handleSearchChange}
              />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-y-auto max-h-[70vh] overflow-x-auto">
            <Table className="w-full table-fixed min-w-[800px] lg:min-w-0">
              <colgroup>
                {selectedRole === 'entreprises' && (
                  <>
                    <col className="w-[20%] min-w-[150px] lg:min-w-0" />
                    <col className="w-[20%] min-w-[150px] lg:min-w-0" />
                    <col className="w-[25%] min-w-[200px] lg:min-w-0" />
                    <col className="w-[15%] min-w-[100px] lg:min-w-0" />
                    <col className="w-[12%] min-w-[80px] lg:min-w-0" />
                    <col className="w-[16%] min-w-[140px] lg:min-w-0" />
                  </>
                )}
                {selectedRole === 'enseignants' && (
                  <>
                    <col className="w-[20%] min-w-[150px] lg:min-w-0" />
                    <col className="w-[20%] min-w-[150px] lg:min-w-0" />
                    <col className="w-[25%] min-w-[200px] lg:min-w-0" />
                    <col className="w-[15%] min-w-[100px] lg:min-w-0" />
                    <col className="w-[12%] min-w-[80px] lg:min-w-0" />
                    <col className="w-[16%] min-w-[140px] lg:min-w-0" />
                  </>
                )}
                {selectedRole === 'etudiants' && (
                  <>
                    <col className="w-[20%] min-w-[150px] lg:min-w-0" />
                    <col className="w-[20%] min-w-[150px] lg:min-w-0" />
                    <col className="w-[25%] min-w-[200px] lg:min-w-0" />
                    <col className="w-[15%] min-w-[100px] lg:min-w-0" />
                    <col className="w-[12%] min-w-[80px] lg:min-w-0" />
                    <col className="w-[16%] min-w-[140px] lg:min-w-0" />
                  </>
                )}
              </colgroup>
              <TableHeader className="sticky top-0 z-10">
                <TableRow className="bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-800 hover:to-slate-700">
                  {selectedRole === 'entreprises' && (
                    <>
                      <TableHead className="px-4 py-4 text-white font-semibold border-0 text-center">
                        <div className="flex items-center justify-center gap-2 text-sm tracking-wide">
                          Nom
                        </div>
                      </TableHead>
                      <TableHead className="px-4 py-4 text-white font-semibold border-0 text-center">
                        <div className="flex items-center justify-center gap-2 text-sm tracking-wide">
                          Dénomination
                        </div>
                      </TableHead>
                    </>
                  )}
                  {selectedRole === 'enseignants' && (
                    <>
                      <TableHead className="px-4 py-4 text-white font-semibold border-0 text-center">
                        <div className="flex items-center justify-center gap-2 text-sm tracking-wide">
                          Encadreur
                        </div>
                      </TableHead>
                      <TableHead className="px-4 py-4 text-white font-semibold border-0 text-center">
                        <div className="flex items-center justify-center gap-2 text-sm tracking-wide">
                          Co-Encadreur
                        </div>
                      </TableHead>
                    </>
                  )}
                  {selectedRole === 'etudiants' && (
                    <>
                      <TableHead className="px-4 py-4 text-white font-semibold border-0 text-center">
                        <div className="flex items-center justify-center gap-2 text-sm tracking-wide">
                          Étudiant n°1
                        </div>
                      </TableHead>
                      <TableHead className="px-4 py-4 text-white font-semibold border-0 text-center">
                        <div className="flex items-center justify-center gap-2 text-sm tracking-wide">
                          Étudiant n°2
                        </div>
                      </TableHead>
                    </>
                  )}
                  <TableHead className="px-4 py-4 text-white font-semibold border-0 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm tracking-wide">
                      Intitulé
                    </div>
                  </TableHead>
                  <TableHead className="px-4 py-4 text-white font-semibold border-0 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm tracking-wide">
                      Option
                    </div>
                  </TableHead>
                  <TableHead className="px-4 py-4 text-white font-semibold border-0 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm tracking-wide">
                      Statut
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
                {selectedRole === 'entreprises' &&
                  (paginatedEntreprisePropositions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        Aucune proposition entreprise trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    (paginatedEntreprisePropositions as PropositionEntreprise[]).map((proposition: PropositionEntreprise, index: number) => (
                      <TableRow
                        key={index}
                        className={`transition-all duration-200 border-b border-slate-100 hover:bg-slate-50 hover:-translate-y-0.5 hover:shadow-md ${index % 2 === 0 ? "bg-gray-50/50" : "bg-white"}`}
                      >
                        <TableCell className="px-4 py-4 text-center">
                          <div className="font-medium text-gray-900 text-sm break-words leading-relaxed">
                            {proposition.entreprise.name}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-center">
                          <div className="font-medium text-gray-900 text-sm break-words leading-relaxed">
                            {proposition.entreprise.entreprise.denomination}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-center">
                          <div className="font-medium text-gray-900 text-sm break-words leading-relaxed">
                            {proposition.intitule}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-center">
                          <div className="font-medium text-gray-900 text-sm break-words leading-relaxed">
                            {proposition.option}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${proposition.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            proposition.status === 'accepted' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'}`}>
                            {proposition.status === 'pending' && 'En attente'}
                            {proposition.status === 'accepted' && 'Accepté'}
                            {proposition.status === 'declined' && 'Refusé'}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-center">
                          <div className="flex flex-col gap-1 items-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleConsulterClick(proposition)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs cursor-pointer w-full max-w-[100px]"
                            >
                              Consulter
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ))}
                {selectedRole === 'enseignants' &&
                  (propositionsEnseignant.data.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        Aucune proposition enseignant trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    propositionsEnseignant.data.map((proposition: PropositionEnseignant, index: number) => (
                      <TableRow
                        key={index}
                        className={`transition-all duration-200 border-b border-slate-100 hover:bg-slate-50 hover:-translate-y-0.5 hover:shadow-md ${index % 2 === 0 ? "bg-gray-50/50" : "bg-white"}`}
                      >
                        <TableCell className="px-4 py-4 text-center">
                          <div className="font-medium text-gray-900 text-sm break-words leading-relaxed">
                            {proposition.encadrant.name}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-center">
                          <div className="font-medium text-gray-900 text-sm break-words leading-relaxed">
                            {proposition.co_encadrant?.name || '\\'}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-center">
                          <div className="font-medium text-gray-900 text-sm break-words leading-relaxed">
                            {proposition.intitule}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-center">
                          <div className="font-medium text-gray-900 text-sm break-words leading-relaxed">
                            {proposition.option}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${proposition.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            proposition.status === 'accepted' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'}`}>
                            {proposition.status === 'pending' && 'En attente'}
                            {proposition.status === 'accepted' && 'Accepté'}
                            {proposition.status === 'declined' && 'Refusé'}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-center">
                          <div className="flex flex-col gap-1 items-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleConsulterClick(proposition)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs cursor-pointer w-full max-w-[100px]"
                            >
                              Consulter
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ))}
                {selectedRole === 'etudiants' &&
                  (propositionsEtudiant.data.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        Aucune proposition étudiant trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    propositionsEtudiant.data.map((proposition: PropositionEtudiant, index: number) => (
                      <TableRow
                        key={index}
                        className={`transition-all duration-200 border-b border-slate-100 hover:bg-slate-50 hover:-translate-y-0.5 hover:shadow-md ${index % 2 === 0 ? "bg-gray-50/50" : "bg-white"}`}
                      >
                        <TableCell className="px-4 py-4 text-center">
                          <div className="font-medium text-gray-900 text-sm break-words leading-relaxed">
                            {proposition.group?.student1?.user?.name || '\\'}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-center">
                          <div className="font-medium text-gray-900 text-sm break-words leading-relaxed">
                            {proposition.group?.student2?.user?.name || '\\'}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-center">
                          <div className="font-medium text-gray-900 text-sm break-words leading-relaxed">
                            {proposition.intitule}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-center">
                          <div className="font-medium text-gray-900 text-sm break-words leading-relaxed">
                            {proposition.option}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${proposition.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            proposition.status === 'accepted' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'}`}>
                            {proposition.status === 'pending' && 'En attente'}
                            {proposition.status === 'accepted' && 'Accepté'}
                            {proposition.status === 'declined' && 'Refusé'}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-center">
                          <div className="flex flex-col gap-1 items-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleConsulterClick(proposition)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs cursor-pointer w-full max-w-[100px]"
                            >
                              Consulter
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
        {selectedRole === 'etudiants' && propositionsEtudiant.last_page > 1 && (
          <div className="mt-6 flex justify-center">
            <MyPagination
              currentPage={currentEtudiantPage}
              totalPages={propositionsEtudiant.last_page}
              onPageChange={handleEtudiantPageChange}
            />
          </div>
        )}
        {selectedRole === 'enseignants' && propositionsEnseignant.last_page > 1 && (
          <div className="mt-6 flex justify-center">
            <MyPagination
              currentPage={currentEnseignantPage}
              totalPages={propositionsEnseignant.last_page}
              onPageChange={handleEnseignantPageChange}
            />
          </div>
        )}
        {selectedRole === 'entreprises' && totalEntreprisePages > 1 && (
          <div className="mt-6 flex justify-center">
            <MyPagination
              currentPage={currentEntreprisePage}
              totalPages={totalEntreprisePages}
              onPageChange={handleEntreprisePageChange}
            />
          </div>
        )}
      </div>
      {selectedPropositionEtudiants && (
        <PropoResponsableEtudiantDialog
          proposition={selectedPropositionEtudiants}
          isOpen={isDialogOpenEtudiants}
          onClose={handleDialogEtudiantsClose}
          onActionCompleted={handleActionEtudiantsCompleted}
        />
      )}
      {selectedPropositionEnseignants && (
        <PropoResponsableEnseignantDialog
          proposition={selectedPropositionEnseignants}
          isOpen={isDialogOpenEnseignants}
          onClose={handleDialogEnseignantsClose}
          onActionCompleted={handleActionEnseignantsCompleted}
        />
      )}
      {selectedPropositionEntreprises && (
        <PropoResponsableEntrepriseDialog
          proposition={selectedPropositionEntreprises}
          isOpen={isDialogOpenEntreprises}
          onClose={handleDialogEntreprisesClose}
          onActionCompleted={handleActionEntreprisesCompleted}
        />
      )}
    </div>
  );
}
export default ProposResponsable;