"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { z } from "zod"
import { toast } from "sonner"
import { propositionService } from "@/services/api" // Adjust import path as needed

// Types
interface ExistingProposition {
  intitule?: string
  type_sujet?: "classique" | "innovant"
  option?: "GL" | "RSD" | "SIC" | "IA"
  resume?: string
  technologies_utilisees?: string
  besoins_materiels?: string
}

interface PropositionEtudiantProps {
  existingProposition?: ExistingProposition
}

// Updated Zod Schema - removed option as it will come from student's profile
const propositionSchema = z.object({
  intitule: z.string().min(1, "L'intitulé du projet est requis").trim(),
  type_sujet: z.enum(["classique", "innovant"], {
    required_error: "Le type du projet est requis",
  }),
  resume: z.string().min(1, "Le résumé du projet est requis").trim(),
  technologies: z.string().min(1, "Les technologies utilisées sont requises").trim(),
  besoins: z.string().min(1, "Les besoins matériels sont requis").trim(),
})

type PropositionFormData = z.infer<typeof propositionSchema>

// Custom Loading Component
const Loading: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-gray-700 font-medium">Chargement...</span>
      </div>
    </div>
  </div>
)

const PropositionEtudiant: React.FC<PropositionEtudiantProps> = ({ existingProposition: propExistingProposition }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof PropositionFormData, string>>>({}) // Removed showSuccess, showError, successMessage, and errorMessage state variables
  const [existingProposition, setExistingProposition] = useState<ExistingProposition | null>(null)
  const [formData, setFormData] = useState<PropositionFormData>({
    intitule: "",
    type_sujet: "classique",
    resume: "",
    technologies: "",
    besoins: "",
  })

  // Load existing proposition data on component mount
  useEffect(() => {
    const loadPropositionData = async () => {
      try {
        setIsLoading(true)
        const response = await propositionService.getPropositions()

        if (response.success && response.data.existingProposition) {
          const existing = response.data.existingProposition
          setExistingProposition(existing)

          // Update form data with existing proposition (excluding option)
          setFormData({
            intitule: existing.intitule || "",
            type_sujet: existing.type_sujet || "classique",
            resume: existing.resume || "",
            technologies: existing.technologies_utilisees || "",
            besoins: existing.besoins_materiels || "",
          })
        }
      } catch (error) {
        console.error("Error loading proposition data:", error)
        toast.error("Erreur lors du chargement des données")
      } finally {
        setIsLoading(false)
      }
    }

    // Use prop data if provided, otherwise fetch from API
    if (propExistingProposition) {
      setExistingProposition(propExistingProposition)
      setFormData({
        intitule: propExistingProposition.intitule || "",
        type_sujet: propExistingProposition.type_sujet || "classique",
        resume: propExistingProposition.resume || "",
        technologies: propExistingProposition.technologies_utilisees || "",
        besoins: propExistingProposition.besoins_materiels || "",
      })
      setIsLoading(false)
    } else {
      loadPropositionData()
    }
  }, [propExistingProposition])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear error when user starts typing
    if (errors[name as keyof PropositionFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const validateForm = (): boolean => {
    try {
      propositionSchema.parse(formData)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof PropositionFormData, string>> = {}
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as keyof PropositionFormData] = err.message
          }
        })
        setErrors(newErrors)
      }
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isSubmitting || !validateForm()) return

    setIsSubmitting(true)

    try {
      const response = await propositionService.submitEtudiantProposition(formData)

      if (response.success) {
        toast.success(response.message || "Proposition soumise avec succès!")

        // Update existing proposition state if this was an update
        if (existingProposition) {
          setExistingProposition({
            ...existingProposition,
            intitule: formData.intitule,
            type_sujet: formData.type_sujet,
            resume: formData.resume,
            technologies_utilisees: formData.technologies,
            besoins_materiels: formData.besoins,
          })
        }
      } else {
        throw new Error(response.message || "Erreur lors de la soumission")
      }
    } catch (error: any) {
      console.error("Error submitting proposition:", error)
      toast.error(error.message || "Une erreur est survenue lors de la soumission")

      // Handle validation errors from server
      if (error.errors) {
        const serverErrors: Partial<Record<keyof PropositionFormData, string>> = {}
        Object.entries(error.errors).forEach(([key, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            serverErrors[key as keyof PropositionFormData] = messages[0]
          }
        })
        setErrors(serverErrors)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show custom loading component while fetching data
  if (isLoading) {
    return <Loading />
  }

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 lg:mb-12">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-4">
            {existingProposition ? "Modifier votre proposition de PFE" : "Votre proposition de PFE"}
          </h1>
          <div className="max-w-2xl mx-auto">
            <p className="text-gray-600 text-base sm:text-lg leading-relaxed px-4">
              Gérez et actualisez votre proposition de PFE pour qu'elle reflète au mieux votre sujet.
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white md:rounded-xl md:shadow-lg md:border md:border-gray-200 p-4 sm:p-6 lg:p-8">
          <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8">
            {/* Project Title */}
            <div>
              <label htmlFor="intitule" className="block text-sm font-semibold text-gray-700 mb-2">
                Intitulé du projet <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="intitule"
                name="intitule"
                value={formData.intitule}
                onChange={handleChange}
                placeholder="Saisissez l'intitulé de votre projet..."
                className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg text-gray-900 font-medium transition-all duration-200 focus:outline-none ${
                  errors.intitule
                    ? "bg-red-50 border-red-300 focus:border-red-500 focus:bg-white"
                    : "bg-gray-50 border-gray-200 focus:border-blue-500 focus:bg-white"
                }`}
                required
              />
              {errors.intitule && <p className="mt-1 text-sm text-red-600">{errors.intitule}</p>}
            </div>

            {/* Type du projet - now full width */}
            <div>
              <label htmlFor="type_sujet" className="block text-sm font-semibold text-gray-700 mb-2">
                Type du projet <span className="text-red-500">*</span>
              </label>
              <select
                id="type_sujet"
                name="type_sujet"
                value={formData.type_sujet}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-900 font-medium focus:border-blue-500 focus:bg-white transition-all duration-200"
                required
              >
                <option value="classique">Classique</option>
                <option value="innovant">Innovant</option>
              </select>
              {errors.type_sujet && <p className="mt-1 text-sm text-red-600">{errors.type_sujet}</p>}
            </div>

            {/* Project Summary */}
            <div>
              <label htmlFor="resume" className="block text-sm font-semibold text-gray-700 mb-2">
                Résumé / Introduction du projet <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <textarea
                  id="resume"
                  name="resume"
                  value={formData.resume}
                  onChange={handleChange}
                  placeholder="Décrivez votre projet, ses objectifs, et son contexte..."
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg text-gray-900 font-medium transition-all duration-200 focus:outline-none resize-none ${
                    errors.resume
                      ? "bg-red-50 border-red-300 focus:border-red-500 focus:bg-white"
                      : "bg-gray-50 border-gray-200 focus:border-blue-500 focus:bg-white"
                  }`}
                  rows={4}
                  required
                />
                <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 text-xs text-gray-400">
                  {formData.resume.length} caractères
                </div>
              </div>
              {errors.resume && <p className="mt-1 text-sm text-red-600">{errors.resume}</p>}
            </div>

            {/* Technologies and Requirements Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              <div>
                <label htmlFor="technologies" className="block text-sm font-semibold text-gray-700 mb-2">
                  Technologies utilisées <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="technologies"
                  name="technologies"
                  value={formData.technologies}
                  onChange={handleChange}
                  placeholder="React, Laravel, MySQL, etc."
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg text-gray-900 font-medium transition-all duration-200 focus:outline-none resize-none ${
                    errors.technologies
                      ? "bg-red-50 border-red-300 focus:border-red-500 focus:bg-white"
                      : "bg-gray-50 border-gray-200 focus:border-blue-500 focus:bg-white"
                  }`}
                  rows={3}
                  required
                />
                {errors.technologies && <p className="mt-1 text-sm text-red-600">{errors.technologies}</p>}
              </div>

              <div>
                <label htmlFor="besoins" className="block text-sm font-semibold text-gray-700 mb-2">
                  Besoins matériels <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="besoins"
                  name="besoins"
                  value={formData.besoins}
                  onChange={handleChange}
                  placeholder="Serveur, équipements spéciaux, etc."
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg text-gray-900 font-medium transition-all duration-200 focus:outline-none resize-none ${
                    errors.besoins
                      ? "bg-red-50 border-red-300 focus:border-red-500 focus:bg-white"
                      : "bg-gray-50 border-gray-200 focus:border-blue-500 focus:bg-white"
                  }`}
                  rows={3}
                  required
                />
                {errors.besoins && <p className="mt-1 text-sm text-red-600">{errors.besoins}</p>}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 font-semibold rounded-lg shadow-lg transition-all duration-200 text-sm sm:text-base ${
                  isSubmitting
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-orange-200 hover:from-orange-600 hover:to-orange-700 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-300"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Envoi en cours...</span>
                  </>
                ) : (
                  <>
                    <span>{existingProposition ? "Mettre à jour ma proposition" : "Soumettre ma proposition"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default PropositionEtudiant
