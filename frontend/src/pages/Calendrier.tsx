"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import LoadingSpinner from "@/components/loading-spinner"
import { CalendarIcon, CheckCircle2, PlayCircle, CircleDot, AlertCircle } from "lucide-react"
import { z } from "zod"
import { calendrierService } from "@/services/api" 
import type { Periode } from "@/types/calendrierTypes" 
import { createPortal } from "react-dom"
import { Settings, Loader } from "lucide-react"
import PeriodeAdmin from "../pages/admin/PeriodeAdmin"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Zod schema for periode validation
const PeriodeSchema = z.object({
  id: z.number(),
  titre: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  date_debut: z.string(),
  date_fin: z.string(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
})

const PeriodesArraySchema = z.array(PeriodeSchema)

type PeriodeStatus = "completed" | "active" | "pending"

import { useAuth } from "@/contexts/AuthContext"

const ProjectCalendar = () => {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const [periodes, setPeriodes] = useState<Periode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Ensure component is mounted before using createPortal
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch periodes from API
  useEffect(() => {
    const fetchPeriodes = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await calendrierService.getPeriodes()

        if (response.success) {
          // Validate the received data
          const validated = PeriodesArraySchema.parse(response.periodes)
          setPeriodes(validated)
        } else {
          throw new Error("Failed to fetch periodes")
        }
      } catch (err) {
        console.error("Error fetching periodes:", err)

        if (err instanceof z.ZodError) {
          const errorMessages = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
          setError(`Validation error: ${errorMessages}`)
          toast.error("Invalid periode data received")
        } else {
          setError("Failed to load periodes. Please try again.")
          toast.error("Failed to load periodes")
        }
        setPeriodes([])
      } finally {
        setLoading(false)
      }
    }

    fetchPeriodes()
  }, [])

  // Helper function for formatting dates
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  // Helper function to get status icon
  const getStatusIcon = (status: PeriodeStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />
      case "active":
        return <PlayCircle className="w-5 h-5 text-blue-500" />
      default:
        return <CircleDot className="w-5 h-5 text-slate-400" />
    }
  }

  // Helper function to calculate periode duration in days
  const getPeriodeDuration = (dateDebut: string, dateFin: string): number => {
    const startDate = new Date(dateDebut)
    const endDate = new Date(dateFin)
    const diffTime = endDate.getTime() - startDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Helper function to calculate remaining days
  const getRemainingDays = (dateFin: string): number => {
    const today = new Date()
    const endDate = new Date(dateFin)
    const diffTime = endDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Helper function to calculate progress percentage for active periodes
  const getProgressPercentage = (dateDebut: string, dateFin: string): number => {
    const today = new Date()
    const startDate = new Date(dateDebut)
    const endDate = new Date(dateFin)

    if (today < startDate) return 0
    if (today > endDate) return 100

    const totalDuration = endDate.getTime() - startDate.getTime()
    const elapsed = today.getTime() - startDate.getTime()
    return Math.round((elapsed / totalDuration) * 100)
  }

  // Helper function to determine periode status
  const getPeriodeStatus = (periode: Periode): PeriodeStatus => {
    const today = new Date()
    const startDate = new Date(periode.date_debut)
    const endDate = new Date(periode.date_fin)

    if (endDate < today) {
      return "completed"
    } else if (startDate <= today && endDate >= today) {
      return "active"
    } else {
      return "pending"
    }
  }

  // Calculate stats
  const completedCount = periodes.filter((p) => getPeriodeStatus(p) === "completed").length
  const pendingCount = periodes.filter((p) => getPeriodeStatus(p) === "pending").length

  // Retry function
  const handleRetry = () => {
    window.location.reload()
  }

  // Fixed button component using createPortal
  const FixedButton = () => {
    if (!mounted || user?.role !== "admin") return null

    return createPortal(
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            disabled={loading}
            className="fixed bottom-4 right-4 sm:bottom-11 sm:right-11 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-110 disabled:hover:scale-100 flex items-center justify-center z-50"
            title="Modifier les périodes"
          >
            {loading ? <Loader className="animate-spin" size={24} /> : <Settings size={24} />}
          </button>
        </DialogTrigger>

        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier les périodes</DialogTitle>
          </DialogHeader>

          <PeriodeAdmin
  periodes={periodes}
  onClose={() => setOpen(false)}
  onPeriodeUpdated={async (updatedPeriode) => {
    // Update local state first for immediate UI feedback
    setPeriodes((prev) => prev.map((p) => (p.id === updatedPeriode.id ? updatedPeriode : p)))
    
    // Fetch fresh data from server without closing dialog
    // We don't change periodeId, so it stays on the current selection
    try {
      const response = await calendrierService.getPeriodes()
      if (response.success) {
        const validated = PeriodesArraySchema.parse(response.periodes)
        setPeriodes(validated)
      }
    } catch (err) {
      console.error("Error refreshing periodes:", err)
    }
  }}
/>
        </DialogContent>
      </Dialog>,
      document.body,
    )
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-500 mb-4 text-center">{error}</p>
        <Button onClick={handleRetry}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Header Section */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Suivi du Projet de Fin d'Études</h1>
        <p className="text-muted-foreground">Suivez l'avancement de votre projet à travers les différentes périodes</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
                <p className="text-sm text-muted-foreground">Périodes terminées</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                <CircleDot className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Périodes à venir</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Section */}
      {periodes.length > 0 ? (
        <div className="space-y-4">
          {/* Mobile Header */}
          <div className="md:hidden text-center space-y-1">
            <h2 className="text-xl font-bold text-gray-900 flex items-center justify-center gap-2">
              <CalendarIcon className="w-5 h-5 text-slate-700" />
              Planning des Périodes
            </h2>
            <p className="text-sm text-muted-foreground">Chronologie détaillée des périodes du projet</p>
          </div>

          {/* Mobile View - Simple Cards */}
          <div className="md:hidden space-y-3">
            {periodes.map((periode) => {
              const periodeStatus = getPeriodeStatus(periode)
              const progress =
                periodeStatus === "active" ? getProgressPercentage(periode.date_debut, periode.date_fin) : 0
              const remainingDays = getRemainingDays(periode.date_fin)

              return (
                <div
                  key={periode.id}
                  className={`p-4 rounded-xl border shadow-md transition-all duration-200 ${
                    periodeStatus === "completed"
                      ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-300"
                      : periodeStatus === "active"
                        ? "bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-300"
                        : "bg-gradient-to-br from-slate-50 to-slate-100/50 border-slate-300"
                  }`}
                >
                  {/* Header with Icon and Badge */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                          periodeStatus === "completed"
                            ? "bg-emerald-50 border-emerald-200"
                            : periodeStatus === "active"
                              ? "bg-blue-50 border-blue-200"
                              : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        {getStatusIcon(periodeStatus)}
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 leading-tight">{periode.titre}</h3>
                    </div>
                  </div>

                  {/* Badge */}
                  <div className="mb-3">
                    <Badge
                      variant={
                        periodeStatus === "completed" ? "default" : periodeStatus === "active" ? "secondary" : "outline"
                      }
                      className={
                        periodeStatus === "completed"
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                          : periodeStatus === "active"
                            ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-100"
                      }
                    >
                      {periodeStatus === "completed" && "✅ Terminé"}
                      {periodeStatus === "active" && `🔄 ${Math.max(0, remainingDays)} jours restants`}
                      {periodeStatus === "pending" && "⏳ À venir"}
                    </Badge>
                  </div>

                  {/* Date Range */}
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      <span>
                        {formatDate(periode.date_debut)} - {formatDate(periode.date_fin)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground pl-5">
                      {getPeriodeDuration(periode.date_debut, periode.date_fin)} jours
                    </div>
                  </div>

                  {/* Progress Bar for Active Periode */}
                  {periodeStatus === "active" && (
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-gray-700">Progression</span>
                        <span className="text-xs font-medium text-blue-600">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-400 to-blue-500 h-2 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <p className="text-gray-700 text-sm leading-relaxed">{periode.description}</p>
                </div>
              )
            })}
          </div>

          {/* Desktop Card Container */}
          <Card className="hidden md:block border shadow-sm">
            <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-t-lg">
              <CardTitle className="text-xl md:text-2xl flex items-center gap-3">
                <CalendarIcon className="w-5 h-5" />
                Planning des Périodes
              </CardTitle>
              <CardDescription className="text-slate-200">Chronologie détaillée des périodes du projet</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {/* Desktop View - Timeline */}
              <div className="space-y-6">
                {periodes.map((periode, index) => {
                  const periodeStatus = getPeriodeStatus(periode)
                  const progress =
                    periodeStatus === "active" ? getProgressPercentage(periode.date_debut, periode.date_fin) : 0
                  const remainingDays = getRemainingDays(periode.date_fin)

                  return (
                    <div key={periode.id} className="relative">
                      {/* Connection Line */}
                      {index < periodes.length - 1 && (
                        <div
                          className={`absolute left-6 top-16 w-0.5 h-10 ${
                            periodeStatus === "completed"
                              ? "bg-emerald-300"
                              : periodeStatus === "active"
                                ? "bg-blue-300"
                                : "bg-slate-200"
                          }`}
                        />
                      )}

                      <div className="flex gap-4">
                        {/* Status Icon */}
                        <div
                          className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                            periodeStatus === "completed"
                              ? "bg-emerald-50 border-emerald-200"
                              : periodeStatus === "active"
                                ? "bg-blue-50 border-blue-200"
                                : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          {getStatusIcon(periodeStatus)}
                        </div>

                        {/* Periode Content */}
                        <div className="flex-1 min-w-0">
                          <div
                            className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                              periodeStatus === "completed"
                                ? "bg-emerald-50/50 border-emerald-200"
                                : periodeStatus === "active"
                                  ? "bg-blue-50/50 border-blue-200"
                                  : "bg-slate-50/50 border-slate-200"
                            }`}
                          >
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                              <h3 className="text-lg font-semibold text-gray-900">{periode.titre}</h3>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    periodeStatus === "completed"
                                      ? "default"
                                      : periodeStatus === "active"
                                        ? "secondary"
                                        : "outline"
                                  }
                                  className={
                                    periodeStatus === "completed"
                                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                                      : periodeStatus === "active"
                                        ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
                                        : "bg-slate-100 text-slate-700 hover:bg-slate-100"
                                  }
                                >
                                  {periodeStatus === "completed" && "✅ Terminé"}
                                  {periodeStatus === "active" && `🔄 ${Math.max(0, remainingDays)} jours restants`}
                                  {periodeStatus === "pending" && "⏳ À venir"}
                                </Badge>
                              </div>
                            </div>

                            {/* Date Range */}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3 flex-wrap">
                              <CalendarIcon className="w-4 h-4" />
                              <span>
                                Du {formatDate(periode.date_debut)} au {formatDate(periode.date_fin)}
                              </span>
                              <span className="text-muted-foreground/60">•</span>
                              <span>{getPeriodeDuration(periode.date_debut, periode.date_fin)} jours</span>
                            </div>

                            {/* Progress Bar for Active Periode */}
                            {periodeStatus === "active" && (
                              <div className="mb-3">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-xs font-medium text-gray-700">Progression</span>
                                  <span className="text-xs font-medium text-blue-600">{progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-gradient-to-r from-blue-400 to-blue-500 h-2 rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Description */}
                            <p className="text-gray-700 text-sm leading-relaxed">{periode.description}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <CalendarIcon className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune période disponible</h3>
          <p className="text-muted-foreground">Les périodes du projet seront affichées ici une fois configurées.</p>
        </div>
      )}

      {/* Fixed Button using createPortal */}
      <FixedButton />
    </div>
  )
}

export default ProjectCalendar
