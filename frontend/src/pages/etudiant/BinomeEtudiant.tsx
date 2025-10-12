"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { groupService } from "@/services/group.service"
import type { EtudiantWithOption, optionType } from "@/types/db-types"
import LoadingSpinner from "@/components/loading-spinner"
import { toast } from "sonner"
import { Menu } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function BinomeEtudiant() {
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true)
  const [etudiants, setEtudiants] = useState<EtudiantWithOption[]>([])
  const [hasGroup, setHasGroup] = useState<boolean>(false)
  const [binomeName, setBinomeName] = useState<string | undefined>(undefined)
  const [userId, setUserId] = useState<string | null>(null)
  const [pendingUserIds, setPendingUserIds] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [itemsPerPage] = useState<number>(10)
  const [selectedOption, setSelectedOption] = useState<optionType | "ALL">("ALL")

  const options: { value: optionType | "ALL"; label: string }[] = [
    { value: "ALL", label: "Toutes les options" },
    { value: "GL", label: "GL" },
    { value: "IA", label: "IA" },
    { value: "SIC", label: "SIC" },
    { value: "RSD", label: "RSD" },
  ]

  useEffect(() => {
    const initializeData = async () => {
      setIsInitialLoading(true)
      try {
        const user = JSON.parse(sessionStorage.getItem("cached_user") || "{}")
        if (!user || !user.id) {
          console.error("No user found in sessionStorage")
          return
        }

        setUserId(user.id)

        try {
          const pendingResponse = await groupService.getPendingInvitations()
          if (pendingResponse.success) {
            setPendingUserIds(new Set(pendingResponse.data))
          }
        } catch (error) {
          console.error("Error fetching pending invitations:", error)
        }
        try {
          const groupResponse = await groupService.getUserGroupInfo()
          if (groupResponse.success) {
            setHasGroup(groupResponse.data.hasGroup)
            setBinomeName(groupResponse.data.binomeName || undefined)

            if (!groupResponse.data.hasGroup) {
              try {
                const studentsResponse = await groupService.getAvailableStudents()
                if (studentsResponse.success) {
                  setEtudiants(studentsResponse.data)
                }
              } catch (error) {
                console.error("Error fetching students:", error)
                toast.error("Erreur lors du chargement des étudiants")
              }
            }
          }
        } catch (error) {
          console.error("Error checking user group info:", error)
          setHasGroup(false)
          setBinomeName(undefined)

          try {
            const studentsResponse = await groupService.getAvailableStudents()
            if (studentsResponse.success) {
              setEtudiants(studentsResponse.data)
            }
          } catch (studentsError) {
            console.error("Error fetching students after group check failure:", studentsError)
            toast.error("Erreur lors du chargement des étudiants")
          }
        }
      } catch (error) {
        console.error("Failed to parse user data from SessionStorage:", error)
      } finally {
        setIsInitialLoading(false)
      }
    }

    initializeData()
  }, [])

  const refreshStudents = async () => {
    try {
      const pendingResponse = await groupService.getPendingInvitations()
      if (pendingResponse.success) {
        setPendingUserIds(new Set(pendingResponse.data))
      }

      const studentsResponse = await groupService.getAvailableStudents()
      if (studentsResponse.success) {
        setEtudiants(studentsResponse.data)
      }
    } catch (error) {
      console.error("Error refreshing data:", error)
      toast.error("Erreur lors du rafraîchissement des données")
    }
  }

  const handleInvite = async (studentId: string) => {
    if (!userId) {
      toast.error("Utilisateur non authentifié")
      return
    }

    setLoading((prev) => ({ ...prev, [studentId]: true }))

    try {
      const response = await groupService.sendGroupInvitation(studentId)
      if (response.success) {
        toast.success("Invitation envoyée avec succès!")
        await refreshStudents()
      } else {
        toast.error(response.message || "Erreur lors de l'envoi de l'invitation")
      }
    } catch (error) {
      console.error("Error sending invitation:", error)
      toast.error("Erreur lors de l'envoi de l'invitation")
    } finally {
      setLoading((prev) => ({ ...prev, [studentId]: false }))
    }
  }

  const filteredEtudiants = etudiants.filter((etudiant) => {
    const matchesSearch = etudiant.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesOption = selectedOption === "ALL" || etudiant.option === selectedOption
    return matchesSearch && matchesOption
  })

  const totalPages = Math.ceil(filteredEtudiants.length / itemsPerPage)
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage
  const indexOfLastItem = indexOfFirstItem + itemsPerPage
  const currentEtudiants = filteredEtudiants.slice(indexOfFirstItem, indexOfLastItem)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedOption])

  const getButtonText = (etudiant: EtudiantWithOption) => {
    if (loading[etudiant.id_user]) return "Chargement..."
    if (pendingUserIds.has(etudiant.id_user)) return "En attente"
    return "Inviter"
  }

  const getButtonStyles = (etudiant: EtudiantWithOption) => {
    if (pendingUserIds.has(etudiant.id_user)) {
      return "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700"
    }
    return "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
  }

  const getMoyenneColor = (moyenne: number) => {
    return moyenne < 10 ? "from-red-400 to-red-500" : "from-green-400 to-green-500"
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleOptionFilter = (option: optionType | "ALL") => {
    setSelectedOption(option)
  }

  if (isInitialLoading) {
    return <LoadingSpinner />
  }

   if (hasGroup) {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-4 md:p-6 lg:p-8">
        <div className="bg-white rounded-lg shadow-lg p-6 border border-orange-200 dark:bg-gray-900 dark:border-orange-800 max-w-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4 dark:text-gray-100">Vous avez déjà un binôme</h2>
          <p className="text-gray-700 mb-2 dark:text-gray-300">
            Vous êtes en binôme avec <strong className="text-orange-600">{binomeName || "votre partenaire"}</strong>.
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Vous ne pouvez pas envoyer d'autres invitations car vous faites déjà partie d'un groupe.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="text-center space-y-2 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Rechercher un Binôme</h1>
        <p className="text-muted-foreground">Trouvez et invitez des étudiants pour former votre binôme</p>
      </div>

      <div className="header flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex flex-row items-center gap-3">
          <h2 className="text-gray-900 dark:text-gray-100 text-xl md:text-2xl font-semibold m-0">
            {options.find((opt) => opt.value === selectedOption)?.label || "Toutes les options"}
          </h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" title="Filtrer par option" className="cursor-pointer bg-transparent">
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-[200px] max-w-[250px]">
              {options.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => handleOptionFilter(option.value)}
                  className={`cursor-pointer whitespace-normal break-words ${
                    selectedOption === option.value ? "bg-blue-50 dark:bg-blue-900/20 font-medium" : ""
                  }`}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="w-full md:w-auto">
          <input
            type="search"
            placeholder="Rechercher"
            className="w-full search-bar px-4 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block bg-white rounded-xl shadow-lg border border-gray-200 overflow-x-auto dark:bg-gray-900 dark:border-gray-700">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-800 hover:to-slate-700 dark:from-slate-900 dark:to-slate-800">
              <TableHead className="px-6 py-4 text-white font-semibold border-0 whitespace-nowrap text-left">
                <div className="flex items-center gap-2 text-sm tracking-wide">Nom Complet</div>
              </TableHead>
              <TableHead className="px-6 py-4 text-white font-semibold border-0 whitespace-nowrap text-center">
                <div className="flex items-center justify-center gap-2 text-sm tracking-wide">Option</div>
              </TableHead>
              <TableHead className="px-6 py-4 text-white font-semibold border-0 whitespace-nowrap text-center">
                <div className="flex items-center justify-center gap-2 text-sm tracking-wide">Moyenne générale</div>
              </TableHead>
              <TableHead className="px-6 py-4 text-white font-semibold border-0 text-center whitespace-nowrap">
                <div className="flex items-center gap-2 text-sm tracking-wide justify-center">Action</div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentEtudiants.length > 0 ? (
              currentEtudiants.map((etudiant, index) => (
                <TableRow
                  key={etudiant.id_user}
                  className={`transition-all duration-200 border-b border-slate-100 hover:bg-slate-50 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:hover:bg-slate-800/50 ${
                    index % 2 === 0 ? "bg-gray-50/50 dark:bg-gray-800/50" : "bg-white dark:bg-gray-900"
                  }`}
                >
                  <TableCell className="px-6 py-4 text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold text-base shadow-lg shadow-orange-200">
                        {etudiant.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900 text-sm dark:text-gray-300">{etudiant.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center dark:text-gray-400">{etudiant.option || "N/A"}</TableCell>
                  <TableCell className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className="font-semibold text-gray-900 text-base dark:text-gray-300">
                        {Number(etudiant.moyenne).toFixed(2)}
                      </span>
                      <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
                        <div
                          className={`h-full bg-gradient-to-r ${getMoyenneColor(Number(etudiant.moyenne))} rounded-full transition-all duration-300`}
                          style={{ width: `${Math.min(Number(etudiant.moyenne) * 5, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center">
                    <Button
                      className={`inline-flex items-center gap-2 transition-all duration-200 ${getButtonStyles(etudiant)} ${
                        loading[etudiant.id_user] || pendingUserIds.has(etudiant.id_user) ? "opacity-75" : ""
                      } ${pendingUserIds.has(etudiant.id_user) ? "cursor-not-allowed" : "hover:-translate-y-0.5"}`}
                      onClick={() => handleInvite(etudiant.id_user)}
                      disabled={loading[etudiant.id_user] || pendingUserIds.has(etudiant.id_user)}
                      size="sm"
                    >
                      {getButtonText(etudiant)}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="px-6 py-10 text-center dark:bg-gray-900">
                  <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-gray-400">
                    <span className="text-3xl opacity-70">👥</span>
                    <span className="font-medium">Aucun étudiant disponible</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-200 bg-gray-50 dark:bg-gray-900/50 dark:border-gray-700">
            <div className="text-sm text-gray-700 dark:text-gray-400">
              Affichage de {indexOfFirstItem + 1} à {Math.min(indexOfLastItem, filteredEtudiants.length)} sur{" "}
              {filteredEtudiants.length} étudiants
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
        {currentEtudiants.length > 0 ? (
          currentEtudiants.map((etudiant) => (
            <div
              key={etudiant.id_user}
              className="bg-white rounded-lg shadow-md border border-gray-200 p-4 space-y-3 dark:bg-gray-900 dark:border-gray-700"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold text-base shadow-lg shadow-orange-200 flex-shrink-0">
                  {etudiant.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base leading-tight">
                    {etudiant.name}
                  </h3>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Option:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-200">{etudiant.option || "N/A"}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Moyenne:</span>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-semibold text-gray-900 dark:text-gray-200">
                      {Number(etudiant.moyenne).toFixed(2)}
                    </span>
                    <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
                      <div
                        className={`h-full bg-gradient-to-r ${getMoyenneColor(Number(etudiant.moyenne))} rounded-full transition-all duration-300`}
                        style={{ width: `${Math.min(Number(etudiant.moyenne) * 5, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <Button
                  className={`w-full inline-flex items-center justify-center gap-2 transition-all duration-200 ${getButtonStyles(etudiant)} ${
                    loading[etudiant.id_user] || pendingUserIds.has(etudiant.id_user) ? "opacity-75" : ""
                  }`}
                  onClick={() => handleInvite(etudiant.id_user)}
                  disabled={loading[etudiant.id_user] || pendingUserIds.has(etudiant.id_user)}
                  size="sm"
                >
                  {getButtonText(etudiant)}
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center dark:bg-gray-900 dark:border-gray-700">
            <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-gray-400">
              <span className="text-3xl opacity-70">👥</span>
              <span className="font-medium">Aucun étudiant disponible</span>
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="space-y-3 pt-4">
            <div className="text-sm text-center text-gray-700 dark:text-gray-400">
              Page {currentPage} sur {totalPages} ({filteredEtudiants.length} étudiants)
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

export default BinomeEtudiant
