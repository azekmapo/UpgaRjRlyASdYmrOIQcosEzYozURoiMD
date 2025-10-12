"use client"

import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { propositionService } from "@/services/propositionService"
import { periodeService } from "@/services/periodeService"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import LoadingSpinner from "@/components/loading-spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, ChevronLeft, ChevronRight, Eye, Pencil, Trash2, Loader2 } from "lucide-react"

interface Proposition {
  id: string
  intitule: string
  type_sujet: string
  option: string
  resume: string
  status: string
  technologies_utilisees?: string
  besoins_materiels?: string
  encadrant_id: number
  co_encadrant_id?: string
  co_encadrant_name?: string
}

interface Enseignant {
  id: string
  name: string
  grade?: string
}

interface Periode {
  id: number
  titre: string
  description: string
  date_debut: string
  date_fin: string
  created_at: string | null
  updated_at: string | null
}

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

interface ApiError {
  message: string
  errors?: Record<string, string[]>
}

const PropositionPage: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [viewingProposition, setViewingProposition] = useState<Proposition | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [editMode, setEditMode] = useState(false)
  const [editingProposition, setEditingProposition] = useState<Proposition | null>(null)

  const [formData, setFormData] = useState({
    intitule: "",
    type_sujet: "",
    option: "",
    resume: "",
    technologies_utilisees: "",
    besoins_materiels: "",
    co_encadrant_id: "" as string,
  })

  const { data: currentPeriods, isLoading: isLoadingPeriods } = useQuery({
    queryKey: ["current-periods"],
    queryFn: async () => {
      try {
        const response = (await periodeService.getCurrentPeriods()) as ApiResponse<Periode[]>
        return response.data || []
      } catch (error) {
        console.error("Error fetching current periods:", error)
        return []
      }
    },
  })

  const isValidationPeriodActive = React.useMemo(() => {
    if (!currentPeriods) return false
    return currentPeriods.some((period) => period.id === 3)
  }, [currentPeriods])

  const { data: enseignantsData, isLoading: isLoadingEnseignants } = useQuery({
    queryKey: ["enseignants"],
    queryFn: async () => {
      try {
        const response = (await propositionService.getAllEnseignants()) as ApiResponse<Enseignant[]>
        console.log("Enseignants response:", response)
        return response.data || []
      } catch (error) {
        console.error("Error fetching enseignants:", error)
        return []
      }
    },
  })

  const { data: propositionData, isLoading: isLoadingPropositions } = useQuery({
    queryKey: ["propositions", currentPage],
    queryFn: async () => {
      const currentEnseignantsData = queryClient.getQueryData(["enseignants"]) as Enseignant[]
      try {
        const response = (await propositionService.getEnseignantPropositions(
          currentPage,
          itemsPerPage,
        )) as ApiResponse<{ data: Proposition[] }>
        console.log("Propositions response:", response)
        const propositionsWithCoEncadrantName = response.data.data.map((prop: Proposition) => ({
          ...prop,
          co_encadrant_name: currentEnseignantsData?.find((e) => e.id === prop.co_encadrant_id)?.name || "N/A",
        }))
        return propositionsWithCoEncadrantName || []
      } catch (error) {
        console.error("Error fetching propositions:", error)
        toast.error("Erreur lors du chargement des propositions")
        return []
      }
    },
    enabled: !!enseignantsData,
  })

  const allPropositions = propositionData || []

  const submitPropositionMutation = useMutation({
    mutationFn: (data: typeof formData) => propositionService.submitEnseignantProposition(data),
    onSuccess: (response) => {
      console.log("Submission success:", response)
      queryClient.invalidateQueries({ queryKey: ["propositions"] })
      setIsDialogOpen(false)
      toast.success("Proposition soumise avec succès")
      resetForm()
    },
    onError: (error: ApiError) => {
      console.error("Error submitting proposition:", error)

      let message = "Erreur lors de la soumission de la proposition"
      if (error.errors) {
        const errorMessages = Object.entries(error.errors)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
          .join("; ")
        message = `Validation échouée: ${errorMessages}`
      } else if (error.message) {
        message = error.message
      }

      setErrorMessage(message)
      toast.error(message)
    },
  })

  const updatePropositionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof formData }) =>
      propositionService.updateEnseignantProposition(id, data),
    onSuccess: (response) => {
      console.log("Update success:", response)
      queryClient.invalidateQueries({ queryKey: ["propositions"] })
      setIsDialogOpen(false)
      toast.success("Proposition mise à jour avec succès")
      resetForm()
    },
    onError: (error: ApiError) => {
      console.error("Error updating proposition:", error)

      let message = "Erreur lors de la mise à jour de la proposition"
      if (error.errors) {
        const errorMessages = Object.entries(error.errors)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
          .join("; ")
        message = `Validation échouée: ${errorMessages}`
      } else if (error.message) {
        message = error.message
      }

      setErrorMessage(message)
      toast.error(message)
    },
  })

  const deletePropositionMutation = useMutation({
    mutationFn: (id: string) => propositionService.deleteEnseignantProposition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["propositions"] })
      toast.success("Proposition supprimée avec succès")
    },
    onError: (error: ApiError) => {
      console.error("Error deleting proposition:", error)
      toast.error(error.message || "Erreur lors de la suppression de la proposition")
    },
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    console.log("Submitting form data:", formData)

    if (editMode && editingProposition) {
      updatePropositionMutation.mutate({ id: editingProposition.id, data: formData })
    } else {
      submitPropositionMutation.mutate(formData)
    }
  }

  const handleEdit = (proposition: Proposition) => {
    setEditMode(true)
    setEditingProposition(proposition)
    setFormData({
      intitule: proposition.intitule,
      type_sujet: proposition.type_sujet,
      option: proposition.option,
      resume: proposition.resume,
      technologies_utilisees: proposition.technologies_utilisees || "",
      besoins_materiels: proposition.besoins_materiels || "",
      co_encadrant_id: proposition.co_encadrant_id || "",
    })
    setIsDialogOpen(true)
  }

  const handleView = (proposition: Proposition) => {
    setViewingProposition(proposition)
    setIsViewDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette proposition ?")) {
      deletePropositionMutation.mutate(id)
    }
  }

  const resetForm = () => {
    setFormData({
      intitule: "",
      type_sujet: "",
      option: "",
      resume: "",
      technologies_utilisees: "",
      besoins_materiels: "",
      co_encadrant_id: "",
    })
    setErrorMessage(null)
    setEditMode(false)
    setEditingProposition(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  if (isLoadingPropositions || isLoadingEnseignants || isLoadingPeriods) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="text-center space-y-2 mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Mes Propositions PFE</h1>
        <p className="text-muted-foreground">Gérez et suivez toutes vos propositions de projets de fin d'études</p>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-xl shadow-lg border border-gray-200 mx-2 sm:mx-5 overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-800 hover:to-slate-700">
                <TableHead className="px-3 sm:px-6 py-4 text-white font-semibold border-0 text-center">
                  <div className="text-xs sm:text-sm tracking-wide">Intitulé</div>
                </TableHead>
                <TableHead className="px-3 sm:px-6 py-4 text-white font-semibold border-0 text-center">
                  <div className="text-xs sm:text-sm tracking-wide">Type</div>
                </TableHead>
                <TableHead className="px-3 sm:px-6 py-4 text-white font-semibold border-0 text-center">
                  <div className="text-xs sm:text-sm tracking-wide">Option</div>
                </TableHead>
                <TableHead className="px-3 sm:px-6 py-4 text-white font-semibold border-0 text-center hidden lg:table-cell">
                  <div className="text-xs sm:text-sm tracking-wide">Technologies</div>
                </TableHead>
                <TableHead className="px-3 sm:px-6 py-4 text-white font-semibold border-0 text-center hidden xl:table-cell">
                  <div className="text-xs sm:text-sm tracking-wide">Co-encadrant</div>
                </TableHead>
                {isValidationPeriodActive && (
                  <TableHead className="px-3 sm:px-6 py-4 text-white font-semibold border-0 text-center">
                    <div className="text-xs sm:text-sm tracking-wide">Statut</div>
                  </TableHead>
                )}
                <TableHead className="px-3 sm:px-6 py-4 text-white font-semibold border-0 text-center">
                  <div className="text-xs sm:text-sm tracking-wide">Actions</div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allPropositions && allPropositions.length > 0 ? (
                allPropositions.map((proposition: Proposition, index: number) => (
                  <TableRow
                    key={proposition.id}
                    className={`transition-all duration-200 border-b border-slate-100 hover:bg-slate-50 ${
                      index % 2 === 0 ? "bg-gray-50/50" : "bg-white"
                    }`}
                  >
                    <TableCell className="px-3 sm:px-6 py-4 text-center">
                      <span
                        className="font-medium text-gray-900 text-sm truncate block max-w-[200px] mx-auto"
                        title={proposition.intitule}
                      >
                        {proposition.intitule}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 sm:px-6 py-4 text-center">
                      <span className="text-gray-700 text-sm">{proposition.type_sujet}</span>
                    </TableCell>
                    <TableCell className="px-3 sm:px-6 py-4 text-center">
                      <span className="text-gray-700 text-sm">{proposition.option}</span>
                    </TableCell>
                    <TableCell className="px-3 sm:px-6 py-4 text-center hidden lg:table-cell">
                      <span
                        className="text-gray-700 text-sm truncate block max-w-[200px] mx-auto"
                        title={proposition.technologies_utilisees || "N/A"}
                      >
                        {proposition.technologies_utilisees || "N/A"}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 sm:px-6 py-4 text-center hidden xl:table-cell">
                      <span
                        className="text-gray-700 text-sm truncate block max-w-[200px] mx-auto"
                        title={proposition.co_encadrant_name || "N/A"}
                      >
                        {proposition.co_encadrant_name || "N/A"}
                      </span>
                    </TableCell>
                    {isValidationPeriodActive && (
                      <TableCell className="px-3 sm:px-6 py-4 text-center">
                        <span className="text-gray-700 text-sm">En validation</span>
                      </TableCell>
                    )}
                    <TableCell className="px-3 sm:px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(proposition)}
                          className="h-8 w-8 p-0"
                          title="Voir"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(proposition)}
                          className="h-8 w-8 p-0"
                          title="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(proposition.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={deletePropositionMutation.isPending}
                          title="Supprimer"
                        >
                          {deletePropositionMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={isValidationPeriodActive ? 8 : 7} className="px-6 py-10 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-500">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          ></path>
                        </svg>
                      </div>
                      <span className="font-medium">Aucune proposition trouvée</span>
                      <p className="text-sm">Créez votre première proposition pour commencer.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4 px-2">
        {allPropositions && allPropositions.length > 0 ? (
          allPropositions.map((proposition: Proposition) => (
            <div
              key={proposition.id}
              className="bg-white rounded-lg shadow-md border border-gray-200 p-4 hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold text-lg shadow-lg shadow-orange-200 flex-shrink-0">
                  {proposition.intitule.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-base mb-1 line-clamp-2">{proposition.intitule}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">{proposition.resume}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="text-xs text-gray-700">{proposition.type_sujet}</span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-700">{proposition.option}</span>
                    {isValidationPeriodActive && (
                      <>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-700">En validation</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {proposition.technologies_utilisees && (
                  <div className="flex justify-between items-start">
                    <span className="text-gray-500 font-medium flex-shrink-0">Technologies:</span>
                    <span className="text-gray-700 text-right ml-2 line-clamp-2">
                      {proposition.technologies_utilisees}
                    </span>
                  </div>
                )}

                {proposition.co_encadrant_name && proposition.co_encadrant_name !== "N/A" && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Co-encadrant:</span>
                    <span className="text-gray-700">{proposition.co_encadrant_name}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleView(proposition)}
                  className="flex-1 text-xs sm:text-sm hover:bg-gray-50 min-w-0 px-2"
                >
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(proposition)}
                  className="flex-1 text-xs sm:text-sm hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 min-w-0 px-2"
                >
                  <Pencil className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(proposition.id)}
                  className="flex-1 text-xs sm:text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-300 min-w-0 px-2"
                  disabled={deletePropositionMutation.isPending}
                >
                  {deletePropositionMutation.isPending ? (
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin flex-shrink-0" />
                  ) : (
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                  )}
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center">
            <div className="flex flex-col items-center gap-3 text-gray-500">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  ></path>
                </svg>
              </div>
              <span className="font-medium">Aucune proposition trouvée</span>
              <p className="text-sm">Créez votre première proposition pour commencer.</p>
            </div>
          </div>
        )}
      </div>

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-800">Détails de la Proposition</DialogTitle>
            <div className="flex flex-wrap gap-2 mt-3">
              {viewingProposition && (
                <>
                  <span className="text-xs text-gray-700">{viewingProposition.type_sujet}</span>
                  <span className="text-xs text-gray-700">{viewingProposition.option}</span>
                  {isValidationPeriodActive && <span className="text-xs text-gray-700">En validation</span>}
                </>
              )}
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Intitulé</h4>
              <p className="text-gray-700">{viewingProposition?.intitule}</p>
            </div>
            {viewingProposition?.resume && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Résumé</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{viewingProposition.resume}</p>
              </div>
            )}
            {viewingProposition?.technologies_utilisees && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Technologies utilisées</h4>
                <p className="text-gray-700">{viewingProposition.technologies_utilisees}</p>
              </div>
            )}
            {viewingProposition?.besoins_materiels && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Besoins matériels</h4>
                <p className="text-gray-700">{viewingProposition.besoins_materiels}</p>
              </div>
            )}
            {viewingProposition?.co_encadrant_name && viewingProposition.co_encadrant_name !== "N/A" && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Co-encadrant</h4>
                <p className="text-gray-700">{viewingProposition.co_encadrant_name}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Simple Pagination */}
      <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-2 px-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="flex items-center gap-1 w-full sm:w-auto"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Précédent</span>
          <span className="sm:hidden">Préc.</span>
        </Button>

        <span className="px-3 sm:px-4 py-2 text-sm text-gray-600 whitespace-nowrap">Page {currentPage}</span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((prev) => prev + 1)}
          disabled={!propositionData || propositionData.length < itemsPerPage}
          className="flex items-center gap-1 w-full sm:w-auto"
        >
          <span className="hidden sm:inline">Suivant</span>
          <span className="sm:hidden">Suiv.</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Floating Add Button */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}
      >
        <DialogTrigger asChild>
          <button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 fixed bottom-4 sm:bottom-8 right-4 sm:right-8 rounded-full w-12 h-12 sm:w-14 sm:h-14 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex items-center justify-center text-white shadow-orange-200 z-50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              className="sm:w-6 sm:h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14"></path>
            </svg>
          </button>
        </DialogTrigger>
        <DialogContent className="w-[95vw] max-w-[600px] mx-auto max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {editMode ? "Modifier la Proposition PFE" : "Nouvelle Proposition PFE"}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              {editMode
                ? "Modifiez les informations de votre proposition de PFE."
                : "Créez une nouvelle proposition de PFE. Remplissez tous les champs obligatoires."}
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <Alert variant="destructive" className="my-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{errorMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="intitule" className="text-sm font-medium">
                  Intitulé*
                </Label>
                <Input
                  id="intitule"
                  name="intitule"
                  value={formData.intitule}
                  onChange={handleInputChange}
                  required
                  className="text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="type_sujet" className="text-sm font-medium">
                    Type de sujet*
                  </Label>
                  <Select
                    value={formData.type_sujet}
                    onValueChange={(value) => handleSelectChange("type_sujet", value)}
                    required
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="classique">Classique</SelectItem>
                      <SelectItem value="innovant">Innovant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="option" className="text-sm font-medium">
                    Option*
                  </Label>
                  <Select
                    value={formData.option}
                    onValueChange={(value) => handleSelectChange("option", value)}
                    required
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Sélectionner une option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GL">GL</SelectItem>
                      <SelectItem value="IA">IA</SelectItem>
                      <SelectItem value="SIC">SIC</SelectItem>
                      <SelectItem value="RSD">RSD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="resume" className="text-sm font-medium">
                  Résumé*
                </Label>
                <Textarea
                  id="resume"
                  name="resume"
                  value={formData.resume}
                  onChange={handleInputChange}
                  className="min-h-[80px] sm:min-h-[100px] text-sm"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="technologies_utilisees" className="text-sm font-medium">
                  Technologies utilisées
                </Label>
                <Input
                  id="technologies_utilisees"
                  name="technologies_utilisees"
                  value={formData.technologies_utilisees}
                  onChange={handleInputChange}
                  placeholder="Ex: React, Laravel, Docker"
                  className="text-sm"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="besoins_materiels" className="text-sm font-medium">
                  Besoins matériels
                </Label>
                <Input
                  id="besoins_materiels"
                  name="besoins_materiels"
                  value={formData.besoins_materiels}
                  onChange={handleInputChange}
                  placeholder="Ex: Serveur, Capteurs"
                  className="text-sm"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="co_encadrant_id" className="text-sm font-medium">
                  Co-encadrant
                </Label>
                <Select
                  value={formData.co_encadrant_id || "none"}
                  onValueChange={(value) => handleSelectChange("co_encadrant_id", value === "none" ? "" : value)}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Sélectionner un co-encadrant (optionnel)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Aucun co-encadrant --</SelectItem>
                    {enseignantsData?.map((enseignant: Enseignant) => (
                      <SelectItem key={enseignant.id} value={enseignant.id}>
                        {enseignant.name} {enseignant.grade ? `(${enseignant.grade})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false)
                  resetForm()
                }}
                className="w-full sm:w-auto"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={submitPropositionMutation.isPending || updatePropositionMutation.isPending}
                className="bg-orange-600 hover:bg-orange-500 w-full sm:w-auto"
              >
                {submitPropositionMutation.isPending || updatePropositionMutation.isPending ? (
                  <>
                    <LoadingSpinner /> <span className="ml-2">Traitement...</span>
                  </>
                ) : editMode ? (
                  "Mettre à jour"
                ) : (
                  "Soumettre"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PropositionPage