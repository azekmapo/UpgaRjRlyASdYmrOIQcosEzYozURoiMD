"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Send, CheckCircle, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import apiService from "@/services/api"
import type { Role, BaremeData, PfeProject, NoteSubmissionData, NotationFormData } from "@/types/NotationTypes"
import { safeToFixed, safeSum, safePercentage } from "@/utils/numberUtils"

// Zod schemas
const createValidationSchema = (role: Role, bareme: BaremeData) => {
  const baseSchema = z.object({
    pfe_id: z.string().min(1, "Veuillez sélectionner un projet"),
    note_application: z
      .number()
      .min(0, "La note ne peut pas être négative")
      .max(bareme.note_application, `La note ne peut pas dépasser ${bareme.note_application}`),
    note_expose_oral: z
      .number()
      .min(0, "La note ne peut pas être négative")
      .max(bareme.note_expose_oral, `La note ne peut pas dépasser ${bareme.note_expose_oral}`),
    note_reponses_questions: z
      .number()
      .min(0, "La note ne peut pas être négative")
      .max(bareme.note_reponses_questions, `La note ne peut pas dépasser ${bareme.note_reponses_questions}`),
  })

  if (role === "encadrant") {
    return baseSchema.extend({
      note_assiduite: z
        .number()
        .min(0, "La note ne peut pas être négative")
        .max(bareme.note_assiduite || 0, `La note ne peut pas dépasser ${bareme.note_assiduite}`),
      note_manucrit: z.number().optional(),
    })
  } else {
    return baseSchema.extend({
      note_manucrit: z
        .number()
        .min(0, "La note ne peut pas être négative")
        .max(bareme.note_manucrit || 0, `La note ne peut pas dépasser ${bareme.note_manucrit}`),
      note_assiduite: z.number().optional(),
    })
  }
}

export default function NoteEnseignant() {
  const [role, setRole] = useState<Role>("encadrant")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isLoadingNotes, setIsLoadingNotes] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [bareme, setBareme] = useState<BaremeData | null>(null)
  const [filteredPfes, setFilteredPfes] = useState<PfeProject[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const VALIDATION_RULES = {
    STEP: 0.25,
    MIN_NOTE: 0,
  }

  const form = useForm<NotationFormData>({
    resolver: bareme ? zodResolver(createValidationSchema(role, bareme)) : undefined,
    defaultValues: {
      pfe_id: "",
      note_application: 0,
      note_expose_oral: 0,
      note_reponses_questions: 0,
      note_assiduite: 0,
      note_manucrit: 0,
    },
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
    trigger,
  } = form

  const watchedValues = watch()

  // Function to load existing notes for a PFE
  const loadExistingNotes = async (pfeId: string) => {
    if (!pfeId || !role) return

    setIsLoadingNotes(true)
    try {
      const response = await apiService.notation.getExistingNotes(pfeId, role)
      if (response.success && response.data) {
        // Pre-fill form with existing notes
        setValue("note_application", response.data.note_application || 0)
        setValue("note_expose_oral", response.data.note_expose_orale || 0)
        setValue("note_reponses_questions", response.data.note_reponses_questions || 0)

        if (role === "encadrant") {
          setValue("note_assiduite", response.data.note_assiduite || 0)
        } else {
          setValue("note_manucrit", response.data.note_manucrit || 0)
        }
      }
    } catch (error) {
      console.error("Error loading existing notes:", error)
    } finally {
      setIsLoadingNotes(false)
    }
  }

  // Function to validate and constrain input values
  const handleNoteChange = (field: keyof NotationFormData, value: string, maxValue: number) => {
    const numValue = Number.parseFloat(value)
    if (isNaN(numValue)) {
      setValue(field, 0)
      return
    }

    // Constrain the value to the maximum allowed
    const constrainedValue = Math.min(Math.max(numValue, 0), maxValue)
    setValue(field, constrainedValue)

    // Clear validation errors for this field
    setValidationErrors((prev) => prev.filter((error) => !error.includes(field)))

    // Trigger validation for this field
    trigger(field)
  }

  // Calculate current total with safe number operations
  const currentTotal = !bareme
    ? 0
    : role === "encadrant"
      ? safeSum(
          watchedValues.note_application,
          watchedValues.note_expose_oral,
          watchedValues.note_reponses_questions,
          watchedValues.note_assiduite,
        )
      : safeSum(
          watchedValues.note_application,
          watchedValues.note_expose_oral,
          watchedValues.note_reponses_questions,
          watchedValues.note_manucrit,
        )

  const maxTotal = 20 // Le total est toujours 20

  // Load data when role changes
  useEffect(() => {
    const loadEvaluationData = async () => {
      setIsLoadingData(true)
      setValidationErrors([])
      try {
        const response = await apiService.notation.getEvaluationData(role)
        if (response.success && response.data) {
          setBareme(response.data.bareme)
          setFilteredPfes(response.data.pfes)

          // Reset form with new bareme constraints
          setValue("note_application", 0)
          setValue("note_expose_oral", 0)
          setValue("note_reponses_questions", 0)
          setValue("note_assiduite", 0)
          setValue("note_manucrit", 0)
          setValue("pfe_id", "")
        }
      } catch (error) {
        console.error("Error loading evaluation data:", error)
        setValidationErrors(["Erreur lors du chargement des données"])
      } finally {
        setIsLoadingData(false)
      }
    }

    loadEvaluationData()
  }, [role, setValue])

  // Load existing notes when PFE is selected
  useEffect(() => {
    if (watchedValues.pfe_id && bareme) {
      loadExistingNotes(watchedValues.pfe_id)
    }
  }, [watchedValues.pfe_id, role, bareme])

  const onSubmit = async (data: NotationFormData) => {
    if (!bareme) return

    setIsLoading(true)
    setSuccessMessage("")
    setValidationErrors([])

    try {
      // Additional validation before submission
      const errors: string[] = []

      if (data.note_application > bareme.note_application) {
        errors.push(`Note Application dépasse le maximum (${bareme.note_application})`)
      }
      if (data.note_expose_oral > bareme.note_expose_oral) {
        errors.push(`Note Exposé Oral dépasse le maximum (${bareme.note_expose_oral})`)
      }
      if (data.note_reponses_questions > bareme.note_reponses_questions) {
        errors.push(`Note Réponses Questions dépasse le maximum (${bareme.note_reponses_questions})`)
      }

      if (role === "encadrant" && data.note_assiduite && data.note_assiduite > (bareme.note_assiduite || 0)) {
        errors.push(`Note Assiduité dépasse le maximum (${bareme.note_assiduite})`)
      }

      if (role === "jury" && data.note_manucrit && data.note_manucrit > (bareme.note_manucrit || 0)) {
        errors.push(`Note Manuscrit dépasse le maximum (${bareme.note_manucrit})`)
      }

      if (errors.length > 0) {
        setValidationErrors(errors)
        toast.error("Veuillez corriger les erreurs dans le formulaire.")
        setIsLoading(false)
        return
      }

      const noteData: NoteSubmissionData = {
        role,
        pfe_id: data.pfe_id,
        note_application: data.note_application,
        note_expose_orale: data.note_expose_oral,
        note_reponses_questions: data.note_reponses_questions,
        ...(role === "encadrant" && { note_assiduite: data.note_assiduite }),
        ...(role === "jury" && { note_manucrit: data.note_manucrit }),
      }

      const response = await apiService.notation.submitNote(noteData)
      if (response.success) {
        const selectedProject = filteredPfes.find((pfe) => pfe.id === data.pfe_id)
        const successMsg = `Évaluation mise à jour avec succès pour le projet "${selectedProject?.intitule}" !`
        setSuccessMessage(successMsg)
        toast.success(successMsg)
      } else {
        setValidationErrors([response.message || "Erreur lors de l'enregistrement"])
        toast.error(response.message || "Erreur lors de l'enregistrement")
      }
    } catch (error: any) {
      console.error("Error saving evaluation:", error)
      if (error.response?.data?.errors) {
        const errorMessages = Object.values(error.response.data.errors).flat() as string[]
        setValidationErrors(errorMessages)
        toast.error("Erreur lors de l'enregistrement. Veuillez vérifier les erreurs.")
      } else {
        const errorMsg = error.response?.data?.message || "Erreur lors de l'enregistrement"
        setValidationErrors([errorMsg])
        toast.error(errorMsg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole)
    setSuccessMessage("")
    setValidationErrors([])
  }

  const handlePfeChange = (pfeId: string) => {
    setValue("pfe_id", pfeId)
  }

  const selectedProject = filteredPfes.find((pfe) => pfe.id === watchedValues.pfe_id)

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Chargement des données...</p>
        </div>
      </div>
    )
  }

  if (!bareme) {
    return (
      <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <Alert className="max-w-md border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Aucun barème trouvé pour ce rôle. Veuillez contacter l'administrateur.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-2 mb-8 lg:mb-12">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Évaluation Personnalisée des PFEs</h1>
          <p className="text-muted-foreground">
            En tant que membre du jury, vous avez l'opportunité d'évaluer chaque PFE de manière juste et structurée en
            attribuant une note aux critères essentiels.
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">{successMessage}</AlertDescription>
          </Alert>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="font-semibold mb-2">Erreurs de validation :</div>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-sm">
                    {error}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Card */}
        <Card className="shadow-none sm:shadow-xl border-0 sm:border sm:bg-white/80 sm:backdrop-blur-sm bg-transparent">
          <CardHeader className="pb-6 hidden sm:block">
            <CardTitle className="text-xl sm:text-2xl text-center text-slate-700">Formulaire d'Évaluation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 sm:space-y-8 p-0 sm:p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
              {/* Role and Project Selection */}
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                {/* Role Selection */}
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-semibold text-gray-700">
                    Votre rôle
                  </Label>
                  <Select value={role} onValueChange={handleRoleChange}>
                    <SelectTrigger className="w-full h-12 bg-blue-50 border-2 border-blue-200 focus:border-blue-500 transition-colors text-sm sm:text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="w-full">
                      <SelectItem value="encadrant" className="text-sm sm:text-base">
                        Encadrant
                      </SelectItem>
                      <SelectItem value="jury" className="text-sm sm:text-base">
                        Président/Examinateur
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Project Selection */}
                <div className="space-y-2">
                  <Label htmlFor="pfe_id" className="text-sm font-semibold text-gray-700">
                    L'intitulé du projet
                  </Label>
                  <Select value={watchedValues.pfe_id} onValueChange={handlePfeChange}>
                    <SelectTrigger className="w-full h-12 bg-gray-50 border-2 border-gray-200 focus:border-blue-500 transition-colors text-sm sm:text-base">
                      <SelectValue placeholder="Sélectionnez un projet" />
                    </SelectTrigger>
                    <SelectContent className="w-full max-w-[90vw] sm:max-w-none">
                      {filteredPfes.map((pfe) => (
                        <SelectItem key={pfe.id} value={pfe.id} className="text-sm sm:text-base">
                          <div className="flex flex-col w-full">
                            <span className="font-medium text-xs sm:text-sm lg:text-base truncate max-w-[250px] sm:max-w-[300px] lg:max-w-none">
                              {pfe.intitule}
                            </span>
                            <span className="text-xs text-gray-500 truncate max-w-[250px] sm:max-w-[300px] lg:max-w-none">
                              Étudiant: {pfe.etudiant}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.pfe_id && <p className="text-sm text-red-600">{errors.pfe_id.message}</p>}
                </div>
              </div>

              {/* Loading existing notes indicator */}
              {isLoadingNotes && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <AlertDescription className="text-blue-800">Chargement des notes existantes...</AlertDescription>
                </Alert>
              )}

              {/* Selected Project Info */}
              {selectedProject && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <div className="grid gap-2 text-sm">
                      <div>
                        <span className="font-semibold">Projet:</span> {selectedProject.intitule}
                      </div>
                      <div>
                        <span className="font-semibold">Étudiant:</span> {selectedProject.etudiant}
                      </div>
                      <div>
                        <span className="font-semibold">Encadrant:</span> {selectedProject.encadrant}
                      </div>
                      <div>
                        <span className="font-semibold">Date de soutenance:</span>{" "}
                        {new Date(selectedProject.date_soutenance).toLocaleDateString("fr-FR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Evaluation Fields Grid */}
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                {/* Application */}
                <div className="space-y-2">
                  <Label htmlFor="note_application" className="text-sm font-semibold text-gray-700">
                    Application / {bareme.note_application}
                    <span className="text-xs text-gray-500 ml-2">(Max: {bareme.note_application})</span>
                  </Label>
                  <Input
                    id="note_application"
                    type="number"
                    step={VALIDATION_RULES.STEP.toString()}
                    min={VALIDATION_RULES.MIN_NOTE.toString()}
                    max={bareme.note_application}
                    placeholder={`Note de l'application (max: ${bareme.note_application})`}
                    className="h-12 bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:bg-white transition-all"
                    value={watchedValues.note_application || ""}
                    onChange={(e) => handleNoteChange("note_application", e.target.value, bareme.note_application)}
                  />
                  {errors.note_application && <p className="text-sm text-red-600">{errors.note_application.message}</p>}
                </div>

                {/* Exposé oral */}
                <div className="space-y-2">
                  <Label htmlFor="note_expose_oral" className="text-sm font-semibold text-gray-700">
                    Exposé oral / {bareme.note_expose_oral}
                    <span className="text-xs text-gray-500 ml-2">(Max: {bareme.note_expose_oral})</span>
                  </Label>
                  <Input
                    id="note_expose_oral"
                    type="number"
                    step={VALIDATION_RULES.STEP.toString()}
                    min={VALIDATION_RULES.MIN_NOTE.toString()}
                    max={bareme.note_expose_oral}
                    placeholder={`Note de l'exposé oral (max: ${bareme.note_expose_oral})`}
                    className="h-12 bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:bg-white transition-all"
                    value={watchedValues.note_expose_oral || ""}
                    onChange={(e) => handleNoteChange("note_expose_oral", e.target.value, bareme.note_expose_oral)}
                  />
                  {errors.note_expose_oral && <p className="text-sm text-red-600">{errors.note_expose_oral.message}</p>}
                </div>

                {/* Réponses aux questions */}
                <div className="space-y-2">
                  <Label htmlFor="note_reponses_questions" className="text-sm font-semibold text-gray-700">
                    Réponses aux questions / {bareme.note_reponses_questions}
                    <span className="text-xs text-gray-500 ml-2">(Max: {bareme.note_reponses_questions})</span>
                  </Label>
                  <Input
                    id="note_reponses_questions"
                    type="number"
                    step={VALIDATION_RULES.STEP.toString()}
                    min={VALIDATION_RULES.MIN_NOTE.toString()}
                    max={bareme.note_reponses_questions}
                    placeholder={`Note des réponses aux questions (max: ${bareme.note_reponses_questions})`}
                    className="h-12 bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:bg-white transition-all"
                    value={watchedValues.note_reponses_questions || ""}
                    onChange={(e) =>
                      handleNoteChange("note_reponses_questions", e.target.value, bareme.note_reponses_questions)
                    }
                  />
                  {errors.note_reponses_questions && (
                    <p className="text-sm text-red-600">{errors.note_reponses_questions.message}</p>
                  )}
                </div>

                {/* Role-specific field */}
                {role === "encadrant" ? (
                  <div className="space-y-2">
                    <Label htmlFor="note_assiduite" className="text-sm font-semibold text-gray-700">
                      Assiduité / {bareme.note_assiduite}
                      <span className="text-xs text-gray-500 ml-2">(Max: {bareme.note_assiduite})</span>
                    </Label>
                    <Input
                      id="note_assiduite"
                      type="number"
                      step={VALIDATION_RULES.STEP.toString()}
                      min={VALIDATION_RULES.MIN_NOTE.toString()}
                      max={bareme.note_assiduite}
                      placeholder={`Note d'assiduité (max: ${bareme.note_assiduite})`}
                      className="h-12 bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:bg-white transition-all"
                      value={watchedValues.note_assiduite || ""}
                      onChange={(e) => handleNoteChange("note_assiduite", e.target.value, bareme.note_assiduite || 0)}
                    />
                    {errors.note_assiduite && <p className="text-sm text-red-600">{errors.note_assiduite.message}</p>}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="note_manucrit" className="text-sm font-semibold text-gray-700">
                      Manuscrit / {bareme.note_manucrit}
                      <span className="text-xs text-gray-500 ml-2">(Max: {bareme.note_manucrit})</span>
                    </Label>
                    <Input
                      id="note_manucrit"
                      type="number"
                      step={VALIDATION_RULES.STEP.toString()}
                      min={VALIDATION_RULES.MIN_NOTE.toString()}
                      max={bareme.note_manucrit}
                      placeholder={`Note du manuscrit (max: ${bareme.note_manucrit})`}
                      className="h-12 bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:bg-white transition-all"
                      value={watchedValues.note_manucrit || ""}
                      onChange={(e) => handleNoteChange("note_manucrit", e.target.value, bareme.note_manucrit || 0)}
                    />
                    {errors.note_manucrit && <p className="text-sm text-red-600">{errors.note_manucrit.message}</p>}
                  </div>
                )}
              </div>

              {/* Total Display */}
              <Card className="border-2 border-slate-200 bg-slate-50">
                <CardContent className="pt-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">Total actuel:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xl sm:text-2xl font-bold text-slate-700">
                        {safeToFixed(currentTotal, 2)}
                      </span>
                      <span className="text-slate-500 font-medium text-lg">/{maxTotal}</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${safePercentage(currentTotal, maxTotal)}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex justify-center pt-4">
                <Button
                  type="submit"
                  disabled={isLoading || !watchedValues.pfe_id || validationErrors.length > 0}
                  className="w-full sm:w-auto px-8 py-3 h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Envoyer l'évaluation
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">📝 Instructions d'évaluation :</p>
              <ul className="space-y-1 text-xs sm:text-sm">
                <li>• Sélectionnez votre rôle et le projet à évaluer</li>
                <li>• Les notes existantes seront automatiquement chargées si disponibles</li>
                <li>• Attribuez une note pour chaque critère selon le barème défini</li>
                <li>
                  • <strong>Les notes sont automatiquement limitées par les valeurs maximales du barème</strong>
                </li>
                <li>• Utilisez des incréments de 0.25 pour plus de précision</li>
                <li>• Le total affiché est sur 20 points</li>
                <li>• Vérifiez les informations du projet avant de soumettre</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
