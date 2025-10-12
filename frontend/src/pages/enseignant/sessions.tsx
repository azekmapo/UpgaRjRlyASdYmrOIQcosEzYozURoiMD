"use client"

import { useState, useEffect } from "react"
import { sessionService, type Pfe } from "../../services/sessionService"
import { fetchOptions } from "@/functions/fetchOptions"
import type { OptionItem } from "@/types/options"
import { Button } from "../../components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { toast } from "sonner"
import LoadingSpinner from "@/components/loading-spinner"
import { FileDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu"
import { Menu } from "lucide-react"


const Sessions = () => {
  const [sessions, setSessions] = useState<Pfe[]>([])
  const [pfeOptions, setPfeOptions] = useState<{ value: string; label: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [filteredSession, setFilteredSession] = useState<string | "ALL">("ALL")

  const filterOptions: { value: string | "ALL"; label: string }[] = [
    { value: "ALL", label: "Toutes les sessions" },
    { value: "session 1", label: "Session 1" },
    { value: "session 2", label: "Session 2" },
  ]

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const response = await fetchOptions()
        if (response.success && response.options) {
          const formattedOptions = response.options.map((item: OptionItem) => ({
            value: item.option,
            label: item.option,
          }))
          setPfeOptions(formattedOptions)
        } else {
          console.error("Failed to load options:", response.message)
          toast.error("Erreur lors du chargement des options")
        }
      } catch (err) {
        console.error("Error fetching options:", err)
        toast.error("Erreur lors du chargement des options")
      }
    }

    loadOptions()
  }, [])

  const fetchSessions = async (signal?: AbortSignal) => {
    try {
      setLoading(true)

      const response = await sessionService.getSessions()
      const realData = response.pfes || []

      if (!signal || !signal.aborted) {
        setSessions(realData)
        setError(null)
        console.log("API data loaded:", realData.length, "items")
      }
    } catch (err) {
      if (!signal || !signal.aborted) {
        setError("Failed to load sessions")
        console.error(err)
        toast.error("Erreur lors du chargement des sessions")
      }
    } finally {
      if (!signal || !signal.aborted) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    fetchSessions(controller.signal)

    return () => {
      controller.abort()
    }
  }, [])

  const handleSessionChange = async (pfeId: number, newSession: string) => {
    try {
      setSessions((prevSessions) =>
        prevSessions.map((pfe) => (pfe.id === pfeId ? { ...pfe, session: newSession } : pfe)),
      )

      try {
        const response = await sessionService.updateSession(pfeId, newSession)
        if (response.success) {
          toast.success(response.message || "Mise à jour avec succès")
        } else {
          toast.error(response.message || "Échec de la mise à jour")
          fetchSessions()
        }
      } catch (err) {
        toast.error("Erreur de connexion lors de la mise à jour")
        console.error(err)
        fetchSessions()
      }
    } catch (err) {
      toast.error("Une erreur s'est produite lors de la mise à jour.")
      console.error(err)
      fetchSessions()
    }
  }

  const handleExportExcel = () => {
    try {
      sessionService.downloadExcel()
      toast.success("Export CSV initié")
    } catch (err) {
      toast.error("Erreur lors de l'export CSV")
      console.error(err)
    }
  }

  const filteredPfes = sessions.filter((pfe) => {
    const lowerCaseQuery = searchQuery.toLowerCase()
    const matchesSession = filteredSession === "ALL" || pfe.session === filteredSession
    const matchesSearch =
      pfe.intitule?.toLowerCase().includes(lowerCaseQuery) ||
      pfe.option?.toLowerCase().includes(lowerCaseQuery) ||
      pfe.type_sujet?.toLowerCase().includes(lowerCaseQuery)
    return matchesSession && matchesSearch
  })

  const totalPages = Math.ceil(filteredPfes.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredPfes.slice(indexOfFirstItem, indexOfLastItem)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filteredSession])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleOptionFilter = (session: string | "ALL") => {
    setFilteredSession(session)
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => fetchSessions()}>Réessayer</Button>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="text-center space-y-2 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Gestion des Sessions</h1>
        <p className="text-muted-foreground">Gérez et organisez les sessions des projets de fin d'études</p>
      </div>

      <div className="header flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex flex-row items-center gap-3">
          <h2 className="text-gray-900 dark:text-gray-100 text-xl md:text-2xl font-semibold m-0">
            {filterOptions.find((opt) => opt.value === filteredSession)?.label || "Toutes les sessions"}
          </h2>
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
              {filterOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => handleOptionFilter(option.value as string | "ALL")}
                  className={`cursor-pointer whitespace-normal break-words ${
                    filteredSession === option.value ? "bg-blue-50 dark:bg-blue-900/20 font-medium" : ""
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
              <TableHead className="px-6 py-4 text-white font-semibold border-0 text-center whitespace-nowrap">
                <div className="flex items-center gap-2 text-sm tracking-wide justify-center">Actions</div>
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
                    {pfeOptions.find((opt) => opt.value === pfe.option)?.label || pfe.option}
                  </TableCell>
                  <TableCell className="px-6 py-4 dark:text-gray-400">{pfe.type_sujet}</TableCell>
                  <TableCell className="px-6 py-4 dark:text-gray-400 capitalize">{pfe.session}</TableCell>
                  <TableCell className="px-6 py-4 text-center">
                    <Select value={pfe.session || ""} onValueChange={(value) => handleSessionChange(pfe.id, value)}>
                      <SelectTrigger className="w-full max-w-[160px] mx-auto focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                        <SelectItem value="session 1" className="dark:text-gray-300 dark:focus:bg-gray-700">
                          Session 1
                        </SelectItem>
                        <SelectItem value="session 2" className="dark:text-gray-300 dark:focus:bg-gray-700">
                          Session 2
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="px-6 py-10 text-center dark:bg-gray-900">
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
                  <span className="font-medium text-gray-900 dark:text-gray-200">
                    {pfeOptions.find((opt) => opt.value === pfe.option)?.label || pfe.option}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Type:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-200">{pfe.type_sujet}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Session:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-200 capitalize">{pfe.session}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <Select value={pfe.session || ""} onValueChange={(value) => handleSessionChange(pfe.id, value)}>
                  <SelectTrigger className="w-full focus:ring-orange-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300">
                    <SelectValue placeholder="Changer la session" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    <SelectItem value="session 1" className="dark:text-gray-300 dark:focus:bg-gray-700">
                      Session 1
                    </SelectItem>
                    <SelectItem value="session 2" className="dark:text-gray-300 dark:focus:bg-gray-700">
                      Session 2
                    </SelectItem>
                  </SelectContent>
                </Select>
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
                  let page: number
                  if (totalPages <= 5) {
                    page = i + 1
                  } else if (currentPage <= 3) {
                    page = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i
                  } else {
                    page = currentPage - 2 + i
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
                  )
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
  )
}

export default Sessions
