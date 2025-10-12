import { useState, useEffect } from "react";
import { sessionService, type Pfe } from "../../services/sessionService";
import { fetchOptions } from "@/functions/fetchOptions";
import type { OptionItem } from "@/types/options";
import { Button } from "../../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { toast } from "sonner";
import LoadingSpinner from "@/components/loading-spinner";
import { FileDown, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";


const sessionBadgeConfig: { value: string; label: string; color: string }[] = [
  {
    value: "session 1",
    label: "Session 1",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  },
  {
    value: "session 2",
    label: "Session 2",
    color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  },
];

const getSessionBadge = (session?: string) => {
  if (!session) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
        Non assignée
      </span>
    );
  }

  const sessionConfig = sessionBadgeConfig.find((s) => s.value === session);
  if (!sessionConfig) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
        {session}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sessionConfig.color}`}>
      {sessionConfig.label}
    </span>
  );
};

const AdminSessions = () => {
  const [sessions, setSessions] = useState<Pfe[]>([]);
  const [pfeOptions, setPfeOptions] = useState<{ value: string; label: string; color: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filteredSession, setFilteredSession] = useState<string | "ALL">("ALL");
  const [filteredOption, setFilteredOption] = useState<string | "ALL">("ALL");

  const sessionFilterOptions: { value: string | "ALL"; label: string }[] = [
    { value: "ALL", label: "Toutes les sessions" },
    { value: "session 1", label: "Session 1" },
    { value: "session 2", label: "Session 2" },
    { value: "NONE", label: "Non assignée" },
  ];

  // Color mapping for options
  const optionColors: Record<string, string> = {
    "GL": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    "IA": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    "SIC": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    "RSD": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  };

  const getOptionBadge = (option?: string) => {
    if (!option) return null;

    const optionConfig = pfeOptions.find((opt) => opt.value === option);
    if (!optionConfig) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
          {option}
        </span>
      );
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${optionConfig.color}`}>
        {optionConfig.label}
      </span>
    );
  };

  // Fetch options on mount
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const response = await fetchOptions();
        if (response.success && response.options) {
          const formattedOptions = response.options.map((item: OptionItem) => ({
            value: item.option,
            label: item.option,
            color: optionColors[item.option] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
          }));
          setPfeOptions(formattedOptions);
        } else {
          console.error("Failed to load options:", response.message);
          toast.error("Erreur lors du chargement des options");
        }
      } catch (err) {
        console.error("Error fetching options:", err);
        toast.error("Erreur lors du chargement des options");
      }
    };

    loadOptions();
  }, []);

  const optionFilterOptions: { value: string | "ALL"; label: string }[] = [
    { value: "ALL", label: "Toutes les options" },
    ...pfeOptions.map(opt => ({ value: opt.value, label: opt.label })),
  ];

  const fetchSessions = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const response = await sessionService.getAdminSessions();
      if (!signal || !signal.aborted) {
        setSessions(response.pfes);
        setError(null);
      }
    } catch (err) {
      if (!signal || !signal.aborted) {
        setError("Échec du chargement des sessions");
        console.error(err);
      }
    } finally {
      if (!signal || !signal.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchSessions(controller.signal);

    return () => {
      controller.abort();
    };
  }, []);

  const handleExportExcel = () => {
    try {
      sessionService.downloadExcel();
      toast.success("Export CSV initié");
    } catch (error) {
      toast.error("Erreur lors de l'export CSV");
    }
  };

  const filteredPfes = sessions.filter((pfe) => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    
    const matchesSession =
      filteredSession === "ALL" ||
      (filteredSession === "NONE" && !pfe.session) ||
      pfe.session === filteredSession;
    
    const matchesOption =
      filteredOption === "ALL" || pfe.option === filteredOption;
    
    const matchesSearch =
      pfe.intitule?.toLowerCase().includes(lowerCaseQuery) ||
      pfe.option?.toLowerCase().includes(lowerCaseQuery) ||
      pfe.type_sujet?.toLowerCase().includes(lowerCaseQuery) ||
      pfe.session?.toLowerCase().includes(lowerCaseQuery);
    
    return matchesSession && matchesOption && matchesSearch;
  });

  const totalPages = Math.ceil(filteredPfes.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPfes.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filteredSession, filteredOption]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSessionFilter = (session: string | "ALL") => {
    setFilteredSession(session);
  };

  const handleOptionFilter = (option: string | "ALL") => {
    setFilteredOption(option);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => fetchSessions()}>Réessayer</Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="text-center space-y-2 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Gestion des Sessions
        </h1>
        <p className="text-muted-foreground">
          Visualisez et gérez toutes les sessions des projets de fin d'études
        </p>
      </div>

      <div className="header flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex flex-row items-center gap-3">
          <h2 className="text-gray-900 dark:text-gray-100 text-xl md:text-2xl font-semibold m-0">
            {sessionFilterOptions.find((opt) => opt.value === filteredSession)?.label || "Toutes les sessions"}
          </h2>
          
          {/* Session Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                title="Filtrer les sessions"
                className="cursor-pointer bg-transparent"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-[200px] max-w-[250px]">
              {sessionFilterOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => handleSessionFilter(option.value as string | "ALL")}
                  className={`cursor-pointer whitespace-normal break-words ${
                    filteredSession === option.value ? "bg-blue-50 dark:bg-blue-900/20 font-medium" : ""
                  }`}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Option Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                title="Filtrer les options"
                className="cursor-pointer bg-transparent"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-[200px] max-w-[250px]">
              {optionFilterOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => handleOptionFilter(option.value as string | "ALL")}
                  className={`cursor-pointer whitespace-normal break-words ${
                    filteredOption === option.value ? "bg-blue-50 dark:bg-blue-900/20 font-medium" : ""
                  }`}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="search-container w-full sm:w-auto">
            <input
              type="search"
              placeholder="Rechercher"
              className="w-full search-bar px-4 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            onClick={handleExportExcel}
            variant="outline"
            className="w-full sm:w-auto dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300 bg-transparent"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block bg-white rounded-xl shadow-lg border border-gray-200 overflow-x-auto dark:bg-gray-900 dark:border-gray-700">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-800 hover:to-slate-700 dark:from-slate-900 dark:to-slate-800">
              <TableHead className="px-6 py-4 text-white font-semibold border-0 whitespace-nowrap">
                <div className="flex items-center gap-2 text-sm tracking-wide">Intitulé</div>
              </TableHead>
              <TableHead className="px-6 py-4 text-white font-semibold border-0 whitespace-nowrap">
                <div className="flex items-center gap-2 text-sm tracking-wide">Option</div>
              </TableHead>
              <TableHead className="px-6 py-4 text-white font-semibold border-0 whitespace-nowrap">
                <div className="flex items-center gap-2 text-sm tracking-wide">Type</div>
              </TableHead>
              <TableHead className="px-6 py-4 text-white font-semibold border-0 whitespace-nowrap">
                <div className="flex items-center gap-2 text-sm tracking-wide">Session</div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.length > 0 ? (
              currentItems.map((pfe, index) => (
                <TableRow
                  key={pfe.id}
                  className={`transition-all duration-200 border-b border-slate-100 hover:bg-slate-50 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:hover:bg-slate-800/50 ${
                    index % 2 === 0 ? "bg-gray-50/50 dark:bg-gray-800/50" : "bg-white dark:bg-gray-900"
                  }`}
                >
                  <TableCell className="px-6 py-4 font-medium dark:text-gray-300">{pfe.intitule}</TableCell>
                  <TableCell className="px-6 py-4 dark:text-gray-400">
                    {getOptionBadge(pfe.option)}
                  </TableCell>
                  <TableCell className="px-6 py-4 dark:text-gray-400">{pfe.type_sujet}</TableCell>
                  <TableCell className="px-6 py-4 dark:text-gray-400">
                    {getSessionBadge(pfe.session)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="px-6 py-10 text-center dark:bg-gray-900">
                  <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-gray-400">
                    <span className="text-3xl opacity-70">📚</span>
                    <span className="font-medium">Aucun PFE disponible</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-200 bg-gray-50 dark:bg-gray-900/50 dark:border-gray-700">
            <div className="text-sm text-gray-700 dark:text-gray-400">
              Affichage de {indexOfFirstItem + 1} à {Math.min(indexOfLastItem, filteredPfes.length)} sur{" "}
              {filteredPfes.length} sessions
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
                className="dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300"
              >
                Précédent
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  className={
                    currentPage === page
                      ? "bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 dark:text-white"
                      : "dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300"
                  }
                >
                  {page}
                </Button>
              ))}

              <Button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
                className="dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300"
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {currentItems.length > 0 ? (
          currentItems.map((pfe) => (
            <div
              key={pfe.id}
              className="bg-white rounded-lg shadow-md border border-gray-200 p-4 space-y-3 dark:bg-gray-900 dark:border-gray-700"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base leading-tight flex-1">
                  {pfe.intitule}
                </h3>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Option:</span>
                  {getOptionBadge(pfe.option)}
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Type:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-200">{pfe.type_sujet}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Session:</span>
                  {getSessionBadge(pfe.session)}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center dark:bg-gray-900 dark:border-gray-700">
            <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-gray-400">
              <span className="text-3xl opacity-70">📚</span>
              <span className="font-medium">Aucune session disponible</span>
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="space-y-3 pt-4">
            <div className="text-sm text-center text-gray-700 dark:text-gray-400">
              Page {currentPage} sur {totalPages} ({filteredPfes.length} sessions)
            </div>
            <div className="flex items-center justify-center gap-2">
              <Button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
                className="dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300"
              >
                Précédent
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page: number;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      className={
                        currentPage === page
                          ? "bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 dark:text-white min-w-[36px]"
                          : "dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300 min-w-[36px]"
                      }
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>

              <Button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
                className="dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300"
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSessions;