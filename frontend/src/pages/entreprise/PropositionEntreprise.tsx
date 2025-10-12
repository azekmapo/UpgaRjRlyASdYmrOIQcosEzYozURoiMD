"use client"
import type React from "react"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { propositionService } from "@/services/api"
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
import { AlertCircle, ChevronLeft, ChevronRight, Edit, Trash2, Eye } from "lucide-react"
import { createPortal } from "react-dom"

interface EntrepriseProposition {
  id: string
  intitule: string
  option: "GL" | "RSD" | "SIC" | "IA"
  resume: string
  status: string
  technologies_utilisees?: string
  created_at: string
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

interface PropositionIndexResponse {
  success: boolean
  data: {
    propositions: EntrepriseProposition[]
    isPeriodOver: boolean
  }
}

const PropositionEntreprise: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [editingProposition, setEditingProposition] = useState<EntrepriseProposition | null>(null)
  const [propositionToDelete, setPropositionToDelete] = useState<EntrepriseProposition | null>(null)
  const [viewingProposition, setViewingProposition] = useState<EntrepriseProposition | null>(null)
  const queryClient = useQueryClient()
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [formData, setFormData] = useState({
    intitule: "",
    option: "GL" as "GL" | "RSD" | "SIC" | "IA",
    resume: "",
    technologies: "",
  })

  const getStatusLabel = (status: string) => {
    const statusLabels = {
      pending: "En attente",
      accepted: "Accepté",
      declined: "Rejeté",
    }
    return statusLabels[status as keyof typeof statusLabels] || status
  }

  const getStatusBadgeClass = (status: string) => {
    const statusClasses = {
      pending: "bg-yellow-100 text-yellow-800",
      accepted: "bg-green-100 text-green-800",
      declined: "bg-red-100 text-red-800",
    }
    return `inline-flex px-2 py-1 rounded-full text-xs font-medium ${
      statusClasses[status as keyof typeof statusClasses] || "bg-gray-100 text-gray-800"
    }`
  }

  const {
    data: propositionResponse,
    isLoading: isLoadingPropositions,
    error,
  } = useQuery({
    queryKey: ["entreprise-propositions", currentPage],
    queryFn: async () => {
      try {
        const response = (await propositionService.getPropositions()) as PropositionIndexResponse
        console.log("Raw API response:", response)
        if (!response) {
          console.log("No response received")
          return { propositions: [], isPeriodOver: false }
        }
        if (response.success && response.data) {
          console.log("Response data:", response.data)
          let propositions = []
          if (response.data.propositions && Array.isArray(response.data.propositions)) {
            propositions = response.data.propositions
            console.log("Found propositions property, length:", propositions.length)
          }
          return {
            propositions: propositions,
            isPeriodOver: response.data.isPeriodOver || false,
          }
        }
        return { propositions: [], isPeriodOver: false }
      } catch (error) {
        console.error("Error fetching enterprise propositions:", error)
        toast.error("Erreur lors du chargement des propositions")
        throw error
      }
    },
  })

  const propositionData = propositionResponse?.propositions || []
  const isPeriodOver = propositionResponse?.isPeriodOver || false

  // Sort propositions by status when period is over
  const sortedPropositionData = isPeriodOver
    ? [...propositionData].sort((a, b) => {
        const statusOrder = { accepted: 0, pending: 1, declined: 2 }
        return (
          (statusOrder[a.status as keyof typeof statusOrder] ?? 3) -
          (statusOrder[b.status as keyof typeof statusOrder] ?? 3)
        )
      })
    : propositionData

  const submitPropositionMutation = useMutation({
    mutationFn: (data: typeof formData) => {
      const apiData = {
        intitule: data.intitule,
        option: data.option,
        resume: data.resume,
        technologies_utilisees: data.technologies,
      }
      if (editingProposition) {
        return propositionService.updateEntrepriseProposition(editingProposition.id, apiData)
      } else {
        return propositionService.submitEntrepriseProposition(apiData)
      }
    },
    onSuccess: (response) => {
      console.log("Submission success:", response)
      queryClient.invalidateQueries({ queryKey: ["entreprise-propositions"] })
      setIsDialogOpen(false)
      toast.success(editingProposition ? "Proposition mise à jour avec succès" : "Proposition soumise avec succès")
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

  const deletePropositionMutation = useMutation({
    mutationFn: (propositionId: string) => {
      return propositionService.deleteEntrepriseProposition(propositionId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entreprise-propositions"] })
      setIsDeleteDialogOpen(false)
      setPropositionToDelete(null)
      toast.success("Proposition supprimée avec succès")
    },
    onError: (error: ApiError) => {
      console.error("Error deleting proposition:", error)
      toast.error("Erreur lors de la suppression de la proposition")
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
    submitPropositionMutation.mutate(formData)
  }

  const handleEdit = (proposition: EntrepriseProposition) => {
    setEditingProposition(proposition)
    setFormData({
      intitule: proposition.intitule,
      option: proposition.option,
      resume: proposition.resume,
      technologies: proposition.technologies_utilisees || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (proposition: EntrepriseProposition) => {
    setPropositionToDelete(proposition)
    setIsDeleteDialogOpen(true)
  }

  const handleView = (proposition: EntrepriseProposition) => {
    setViewingProposition(proposition)
    setIsViewDialogOpen(true)
  }

  const confirmDelete = () => {
    if (propositionToDelete) {
      deletePropositionMutation.mutate(propositionToDelete.id)
    }
  }

  const resetForm = () => {
    setFormData({
      intitule: "",
      option: "GL",
      resume: "",
      technologies: "",
    })
    setErrorMessage(null)
    setEditingProposition(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const getOptionLabel = (option: string) => {
    const labels = {
      GL: "GL - Génie Logiciel",
      RSD: "RSD - Réseaux et Systèmes Distribués",
      SIC: "SIC - Systèmes d'Information et de Communication",
      IA: "IA - Intelligence Artificielle",
    }
    return labels[option as keyof typeof labels] || option
  }

  if (isLoadingPropositions) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive" className="my-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erreur lors du chargement des propositions: {error instanceof Error ? error.message : "Erreur inconnue"}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent sm:text-3xl md:text-4xl lg:text-5xl">
            Mes Propositions PFE
          </h1>
          <p className="mt-2 md:mt-4 text-base md:text-xl text-gray-600">
            Gérez et suivez toutes vos propositions de projets de fin d'études.
          </p>
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
                    <div className="text-xs sm:text-sm tracking-wide">Resumé</div>
                  </TableHead>
                  <TableHead className="px-3 sm:px-6 py-4 text-white font-semibold border-0 text-center">
                    <div className="text-xs sm:text-sm tracking-wide">Technologies</div>
                  </TableHead>
                  <TableHead className="px-3 sm:px-6 py-4 text-white font-semibold border-0 text-center">
                    <div className="text-xs sm:text-sm tracking-wide">Option</div>
                  </TableHead>
                  <TableHead className="px-3 sm:px-6 py-4 text-white font-semibold border-0 text-center">
                    <div className="text-xs sm:text-sm tracking-wide">Date</div>
                  </TableHead>
                  <TableHead className="px-3 sm:px-6 py-4 text-white font-semibold border-0 text-center">
                    <div className="text-xs sm:text-sm tracking-wide">Actions</div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPropositionData && Array.isArray(sortedPropositionData) && sortedPropositionData.length > 0 ? (
                  sortedPropositionData.map((proposition: EntrepriseProposition, index: number) => (
                    <TableRow
                      key={proposition.id || index}
                      className={`transition-all duration-200 border-b border-slate-100 hover:bg-slate-50 ${
                        index % 2 === 0 ? "bg-gray-50/50" : "bg-white"
                      }`}
                    >
                      <TableCell className="px-3 sm:px-6 py-4 text-center">
                        <span
                          className="font-medium text-gray-900 text-sm truncate block max-w-[200px] mx-auto"
                          title={proposition.intitule || "Sans titre"}
                        >
                          {proposition.intitule || "Sans titre"}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 sm:px-6 py-4 text-center">
                        <span
                          className="text-gray-600 text-sm truncate block max-w-[200px] mx-auto"
                          title={proposition.resume || "Pas de description"}
                        >
                          {proposition.resume || "Pas de description"}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 sm:px-6 py-4 text-center">
                        <span
                          className="text-gray-700 text-sm truncate block max-w-[200px] mx-auto"
                          title={proposition.technologies_utilisees || "N/A"}
                        >
                          {proposition.technologies_utilisees || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 sm:px-6 py-4 text-center">
                        <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {proposition.option || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 sm:px-6 py-4 text-center">
                        <span className="text-gray-700 text-sm">
                          {proposition.created_at ? formatDate(proposition.created_at) : "N/A"}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 sm:px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(proposition)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {isPeriodOver ? (
                            <span className={getStatusBadgeClass(proposition.status)}>
                              {getStatusLabel(proposition.status)}
                            </span>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(proposition)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(proposition)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="px-6 py-10 text-center">
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
          {sortedPropositionData && Array.isArray(sortedPropositionData) && sortedPropositionData.length > 0 ? (
            sortedPropositionData.map((proposition: EntrepriseProposition, index: number) => (
              <div
                key={proposition.id || index}
                className="bg-white rounded-lg shadow-md border border-gray-200 p-4 hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base mb-1 line-clamp-2">
                      {proposition.intitule || "Sans titre"}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {proposition.resume || "Pas de description"}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {proposition.option || "N/A"}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(proposition)}
                    className="h-8 w-8 p-0 shrink-0"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2 text-sm mb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Date:</span>
                    <span className="text-gray-700">
                      {proposition.created_at ? formatDate(proposition.created_at) : "N/A"}
                    </span>
                  </div>
                  {proposition.technologies_utilisees && (
                    <div className="flex justify-between items-start">
                      <span className="text-gray-500 font-medium flex-shrink-0">Technologies:</span>
                      <span
                        className="text-gray-700 text-right ml-2 line-clamp-2 max-w-[150px]"
                        title={proposition.technologies_utilisees}
                      >
                        {proposition.technologies_utilisees}
                      </span>
                    </div>
                  )}
                  {isPeriodOver && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-medium">Statut:</span>
                      <span className={getStatusBadgeClass(proposition.status)}>
                        {getStatusLabel(proposition.status)}
                      </span>
                    </div>
                  )}
                </div>
                {!isPeriodOver && (
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(proposition)} className="flex-1">
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(proposition)}
                      className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  </div>
                )}
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

        {/* Simple Pagination */}
        {sortedPropositionData && Array.isArray(sortedPropositionData) && sortedPropositionData.length > 0 && (
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
              disabled={!sortedPropositionData || sortedPropositionData.length < itemsPerPage}
              className="flex items-center gap-1 w-full sm:w-auto"
            >
              <span className="hidden sm:inline">Suivant</span>
              <span className="sm:hidden">Suiv.</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* View Details Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-slate-800">Détails de la Proposition</DialogTitle>
              <div className="flex flex-wrap gap-2 mt-3">
                {viewingProposition && (
                  <>
                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {viewingProposition.option}
                    </span>
                    {isPeriodOver && (
                      <span className={getStatusBadgeClass(viewingProposition.status)}>
                        {getStatusLabel(viewingProposition.status)}
                      </span>
                    )}
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
              {viewingProposition?.created_at && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Date de création</h4>
                  <p className="text-gray-700">{formatDate(viewingProposition.created_at)}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Add/Edit Dialog */}
        {!isPeriodOver &&
          createPortal(
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open)
                if (!open) resetForm()
              }}
            >
              <DialogTrigger asChild>
                <button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 fixed bottom-8 sm:bottom-12 right-8 sm:right-14 rounded-full w-12 h-12 sm:w-14 sm:h-14 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex items-center justify-center text-white shadow-orange-200 z-[9999]">
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
                    {editingProposition ? "Modifier la Proposition PFE" : "Nouvelle Proposition PFE"}
                  </DialogTitle>
                  <DialogDescription className="text-sm sm:text-base">
                    {editingProposition
                      ? "Modifiez les détails de votre proposition de projet."
                      : "Partagez vos projets innovants avec nos étudiants talentueux. Remplissez tous les champs obligatoires."}
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
                        Intitulé du projet <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="intitule"
                        name="intitule"
                        value={formData.intitule}
                        onChange={handleInputChange}
                        placeholder="Saisissez l'intitulé de votre projet..."
                        required
                        className="text-sm"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="option" className="text-sm font-medium">
                        Option <span className="text-red-500">*</span>
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
                          <SelectItem value="GL">GL - Génie Logiciel</SelectItem>
                          <SelectItem value="RSD">RSD - Réseaux et Systèmes Distribués</SelectItem>
                          <SelectItem value="SIC">SIC - Systèmes d'Information et de Communication</SelectItem>
                          <SelectItem value="IA">IA - Intelligence Artificielle</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="resume" className="text-sm font-medium">
                        Resumé <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="resume"
                        name="resume"
                        value={formData.resume}
                        onChange={handleInputChange}
                        placeholder="Décrivez votre projet, ses objectifs, les défis à relever et les compétences recherchées..."
                        className="min-h-[80px] sm:min-h-[100px] text-sm"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="technologies" className="text-sm font-medium">
                        Technologies utilisées <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="technologies"
                        name="technologies"
                        value={formData.technologies}
                        onChange={handleInputChange}
                        placeholder="React, Laravel, MySQL, Python, etc."
                        className="min-h-[60px] text-sm"
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
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
                      disabled={submitPropositionMutation.isPending}
                      className="bg-orange-600 hover:bg-orange-500 w-full sm:w-auto"
                    >
                      {submitPropositionMutation.isPending ? (
                        <>
                          <LoadingSpinner />{" "}
                          <span className="ml-2">{editingProposition ? "Mise à jour..." : "Soumission..."}</span>
                        </>
                      ) : (
                        <>
                          <span>🏢</span>
                          <span className="ml-2">
                            {editingProposition ? "Mettre à jour" : "Soumettre la proposition"}
                          </span>
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>,
            document.body,
          )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="w-[95vw] max-w-[400px] mx-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-red-600">Confirmer la suppression</DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Êtes-vous sûr de vouloir supprimer cette proposition ? Cette action est irréversible.
              </DialogDescription>
            </DialogHeader>
            {propositionToDelete && (
              <div className="py-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="font-medium text-gray-900 text-sm mb-1">{propositionToDelete.intitule}</h4>
                  <p className="text-xs text-gray-600 line-clamp-2">{propositionToDelete.resume}</p>
                </div>
              </div>
            )}
            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false)
                  setPropositionToDelete(null)
                }}
                className="w-full sm:w-auto"
              >
                Annuler
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={confirmDelete}
                disabled={deletePropositionMutation.isPending}
                className="w-full sm:w-auto"
              >
                {deletePropositionMutation.isPending ? (
                  <>
                    <LoadingSpinner /> <span className="ml-2">Suppression...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default PropositionEntreprise
