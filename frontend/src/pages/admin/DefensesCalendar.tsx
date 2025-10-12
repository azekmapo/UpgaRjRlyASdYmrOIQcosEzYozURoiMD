"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { z } from "zod"
import { soutenanceService } from "@/services/api"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader } from "lucide-react"

// Fonction utilitaire pour formater la date sans problème de fuseau horaire
const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

// Zod schemas
const DefenseSchema = z.object({
  id: z.number(),
  date: z.string().transform((str) => new Date(str)), // Backend sends string, transform to Date
  heure_debut: z.string(),
  heure_fin: z.string(),
  pfe_title: z.string(),
  room_name: z.string().nullable(),
  students: z.array(z.string().nullable()).optional(),
  jury_members: z
    .object({
      president: z.string().nullable(),
      examinateur: z.string().nullable(),
    })
    .optional(),
  encadrement: z
    .object({
      encadrant: z.string().nullable(),
      co_encadrant: z.string().nullable(),
    })
    .optional(),
})

const WorkingHoursSchema = z.object({
  start_time: z.string(),
  end_time: z.string(),
  defense_duration: z.number(),
  break_duration: z.number(),
  session: z.string().optional(),
})

type Defense = z.infer<typeof DefenseSchema>
type WorkingHours = z.infer<typeof WorkingHoursSchema>

interface DefensesCalendarProps {
  soutenances: any[] // Raw data from parent
  startDate?: string
  workingHours?: WorkingHours
  rooms?: { name: string }[]
  onSoutenancesUpdated?: () => void // Callback to refresh data in parent
  excludedDates?: string[] // Array of excluded dates in YYYY-MM-DD format
}

const DefensesCalendar: React.FC<DefensesCalendarProps> = ({
  soutenances: rawSoutenances = [],
  startDate,
  workingHours = {
    start_time: "08:00",
    end_time: "16:00",
    defense_duration: 60,
    break_duration: 15,
  },
  rooms = [],
  onSoutenancesUpdated,
  excludedDates = [],
}) => {
  // Local state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [soutenance, setSoutenance] = useState<Defense[]>([])
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedSoutenance, setSelectedSoutenance] = useState<Defense | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showDayDialog, setShowDayDialog] = useState(false)
  const [selectedDayData, setSelectedDayData] = useState<{
    date: Date
    soutenances: Defense[]
  } | null>(null)
  const [editData, setEditData] = useState({
    time: "",
    salle: "",
  })
  const [draggedSoutenance, setDraggedSoutenance] = useState<Defense | null>(null)
  const [currentMonth, setCurrentMonth] = useState(startDate ? new Date(startDate) : new Date())

  // Transform raw soutenances data when it changes
  useEffect(() => {
    if (rawSoutenances && rawSoutenances.length > 0) {
      const transformedSoutenances = rawSoutenances.map((s: any) => ({
        id: s.id,
        date: new Date(s.date),
        heure_debut: s.heure_debut,
        heure_fin: s.heure_fin,
        // Améliorer l'affichage des étudiants
        etudiant: s.students && s.students.length > 0 ? s.students.filter(Boolean).join(" & ") : "N/A",
        etudiantDetails: s.students && s.students.length > 0 ? s.students.filter(Boolean).join(" & ") : "N/A",
        sujet: s.pfe_title || "N/A",
        // Corriger l'affichage du jury
        jury_president: s.jury_members?.president || "N/A",
        jury_examinateur: s.jury_members?.examinateur || "N/A",
        // Ajouter l'encadrement
        encadrant: s.encadrement?.encadrant || "N/A",
        co_encadrant: s.encadrement?.co_encadrant || "N/A",
        salle: s.room_name || "N/A",
      }))
      setSoutenance(transformedSoutenances)
    } else {
      setSoutenance([])
    }
  }, [rawSoutenances])

  // Update current month when startDate changes
  useEffect(() => {
    if (startDate) {
      setCurrentMonth(new Date(startDate))
    }
  }, [startDate])

  const validateTime = (time: string) => {
    if (!time || !workingHours?.start_time || !workingHours?.end_time) {
      return false
    }
    const [hours, minutes] = time.split(":").map(Number)
    const inputTime = hours * 60 + minutes
    const [startHours, startMinutes] = workingHours.start_time.split(":").map(Number)
    const [endHours, endMinutes] = workingHours.end_time.split(":").map(Number)
    const workStart = startHours * 60 + startMinutes
    const workEnd = endHours * 60 + endMinutes
    const defenseDuration = workingHours.defense_duration || 60
    const defenseEndTime = inputTime + defenseDuration

    if (inputTime < workStart || inputTime > workEnd) {
      return false
    }
    if (defenseEndTime > workEnd) {
      return false
    }
    return true
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: (Date | null)[] = []

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null)
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }
    return days
  }

  const handleEdit = async () => {
    if (selectedSoutenance && editData.time) {
      if (!validateTime(editData.time)) {
        setError("Invalid time selected")
        return
      }

      try {
        setLoading(true)
        setError(null)
        // Correction: S'assurer que la structure des données est correcte
        const response = await soutenanceService.updateSoutenanceTime(selectedSoutenance.id, {
          time: editData.time,
          working_hours: {
            start_time: workingHours.start_time,
            end_time: workingHours.end_time,
          },
          rooms: rooms,
        })

        if (response.success) {
          // Update local state with the response data
          const updatedSoutenance = soutenance.map((s) =>
            s.id === selectedSoutenance.id
              ? {
                  ...s,
                  heure_debut: response.data.heure_debut,
                  heure_fin: response.data.heure_fin,
                  salle: response.data.salle?.nom_salle || s.salle,
                }
              : s,
          )
          setSoutenance(updatedSoutenance)
          setSelectedSoutenance({
            ...selectedSoutenance,
            heure_debut: response.data.heure_debut,
            heure_fin: response.data.heure_fin,
            salle: response.data.salle?.nom_salle || selectedSoutenance.salle,
          })
          setShowEditDialog(false)
          // Notify parent to refresh data
          if (onSoutenancesUpdated) {
            onSoutenancesUpdated()
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to update soutenance")
        console.error("Error updating soutenance:", err)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleConfirmDelete = async () => {
    if (selectedSoutenance) {
      try {
        setLoading(true)
        setError(null)
        const response = await soutenanceService.deleteSoutenance(selectedSoutenance.id)
        if (response.success) {
          const updatedSoutenance = soutenance.filter((s) => s.id !== selectedSoutenance.id)
          setSoutenance(updatedSoutenance)
          setSelectedSoutenance(null)
          setShowConfirmDialog(false)
          // Notify parent to refresh data
          if (onSoutenancesUpdated) {
            onSoutenancesUpdated()
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to delete soutenance")
        console.error("Error deleting soutenance:", err)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleDragStart = (e: React.DragEvent, soutenance: Defense) => {
    setDraggedSoutenance(soutenance)
    e.dataTransfer.setData("text/plain", "")
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (date: Date | null) => {
    console.log("Drop attempted:", { draggedSoutenance, date }) // Pour debug

    if (draggedSoutenance && date) {
      if (date.getDay() === 5) {
        // Friday check
        console.log("Cannot drop on Friday")
        setDraggedSoutenance(null)
        return
      }

      try {
        setLoading(true)
        setError(null)

        console.log("Updating soutenance:", draggedSoutenance.id, "to date:", formatDateForAPI(date))

        const response = await soutenanceService.updateSoutenance(draggedSoutenance.id, {
          new_date: formatDateForAPI(date),
          working_hours: {
            start_time: workingHours.start_time,
            end_time: workingHours.end_time,
          },
          rooms: rooms,
        })

        if (response.success) {
          const updatedSoutenances = soutenance.map((s) => {
            if (s.id === draggedSoutenance.id) {
              return {
                ...s,
                date: new Date(response.data.date),
                heure_debut: response.data.heure_debut,
                heure_fin: response.data.heure_fin,
                salle: response.data.salle?.nom_salle || s.salle,
              }
            }
            return s
          })
          setSoutenance(updatedSoutenances)

          // Notify parent to refresh data
          if (onSoutenancesUpdated) {
            onSoutenancesUpdated()
          }

          console.log("Soutenance updated successfully")
        }
      } catch (err: any) {
        setError(err.message || "Failed to update soutenance date")
        console.error("Error updating soutenance date:", err)
      } finally {
        setLoading(false)
        setDraggedSoutenance(null)
      }
    } else {
      console.log("Drop failed: missing data", { draggedSoutenance, date })
      setDraggedSoutenance(null)
    }
  }

  // Nouvelle fonction pour gérer le drag depuis la modal
  const handleModalDragStart = (e: React.DragEvent, soutenance: Defense) => {
    console.log("Drag started from modal:", soutenance.etudiant) // Pour debug
    setDraggedSoutenance(soutenance)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", soutenance.id.toString())

    // Ne pas fermer la modal immédiatement, attendre un peu
    setTimeout(() => {
      setShowDayDialog(false)
    }, 100)
  }

  const handleDayClick = (day: Date, soutenances: Defense[]) => {
    if (soutenances.length > 0) {
      setSelectedDayData({
        date: day,
        soutenances: soutenances,
      })
      setShowDayDialog(true)
    }
  }

  const monthName = currentMonth.toLocaleString("fr-FR", { month: "long" })
  const days = getDaysInMonth(currentMonth)

  const getSoutenancesForDay = (day: Date) => {
    return soutenance.filter((s) => s.date.toDateString() === day.toDateString())
  }

  const isExcludedDate = (day: Date) => {
    const dateString = formatDateForAPI(day)
    return excludedDates.includes(dateString)
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto p-2 sm:p-4 lg:p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800">Calendrier des Soutenances</h1>
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </Button>
                  <h2 className="text-base sm:text-lg lg:text-xl font-medium text-gray-700 capitalize min-w-[150px] sm:min-w-[200px] text-center">
                    {monthName} {currentMonth.getFullYear()}
                  </h2>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
              <Loader className="animate-spin h-6 w-6 text-orange-500" />
              <span className="text-gray-700">Chargement...</span>
            </div>
          </div>
        )}

        {/* Calendar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Week header */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-t-lg overflow-hidden">
            {[
              { full: "Dimanche", short: "Dim" },
              { full: "Lundi", short: "Lun" },
              { full: "Mardi", short: "Mar" },
              { full: "Mercredi", short: "Mer" },
              { full: "Jeudi", short: "Jeu" },
              { full: "Vendredi", short: "Ven" },
              { full: "Samedi", short: "Sam" },
            ].map((day) => (
              <div
                key={day.full}
                className="bg-blue-500 px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-medium text-white"
              >
                <span className="hidden sm:inline">{day.full}</span>
                <span className="sm:hidden">{day.short}</span>
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {days.map((day, index) => {
              const daySoutenances = day ? getSoutenancesForDay(day) : []
              const hasMany = daySoutenances.length > 2
              const isExcluded = day ? isExcludedDate(day) : false

              return (
                <div
                  key={index}
                  className={`min-h-[80px] sm:min-h-[100px] lg:min-h-[120px] p-1 sm:p-2 transition-colors relative ${
                    !day 
                      ? "bg-gray-50" 
                      : isExcluded 
                        ? "bg-red-50 border-red-200" 
                        : "bg-white hover:bg-gray-50"
                  } ${draggedSoutenance && day && !isExcluded ? "border-2 border-dashed border-orange-300 bg-orange-50" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault()
                    if (!isExcluded) {
                      e.dataTransfer.dropEffect = "move"
                    } else {
                      e.dataTransfer.dropEffect = "none"
                    }
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault()
                    if (day && draggedSoutenance && !isExcluded) {
                      e.currentTarget.classList.add("bg-orange-100", "border-orange-400")
                    }
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault()
                    e.currentTarget.classList.remove("bg-orange-100", "border-orange-400")
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.currentTarget.classList.remove("bg-orange-100", "border-orange-400")
                    if (!isExcluded) {
                      handleDrop(day)
                    }
                  }}
                >
                  {day && (
                    <>
                      <div className={`text-xs sm:text-sm font-medium mb-1 sm:mb-2 ${isExcluded ? "text-red-600" : "text-gray-700"}`}>
                        {day.getDate()}
                        {isExcluded && (
                          <span className="ml-1 text-red-500 text-xs">🚫</span>
                        )}
                      </div>
                      {isExcluded ? (
                        <div className="text-xs text-red-600 text-center py-2">
                          Jour exclu
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {daySoutenances.slice(0, 2).map((soutenance) => (
                            <div
                              key={soutenance.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, soutenance)}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedSoutenance(soutenance)
                                setShowDetailsDialog(true)
                              }}
                              className="bg-gradient-to-r from-orange-400 to-orange-500 text-white px-1 sm:px-2 py-1 rounded text-xs cursor-pointer hover:from-orange-500 hover:to-orange-600 transition-all transform hover:scale-105 flex items-center group shadow-sm"
                            >
                              <span className="text-orange-200 mr-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                ≡
                              </span>
                              <span className="truncate flex-1">
                                {soutenance.etudiant} - {soutenance.heure_debut}
                              </span>
                            </div>
                          ))}
                          {/* Show "View more" button if there are more than 2 */}
                          {hasMany && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDayClick(day, daySoutenances)}
                              className="w-full text-xs h-6"
                            >
                              +{daySoutenances.length - 2} autres
                            </Button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Day Details Dialog */}
      <Dialog open={showDayDialog} onOpenChange={setShowDayDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg lg:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Soutenances du {selectedDayData?.date.toLocaleDateString("fr-FR")}</DialogTitle>
            <DialogDescription>
              💡 Astuce : Maintenez le clic et faites glisser les soutenances vers d'autres dates du calendrier. Cliquez
              simplement pour voir les détails.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {selectedDayData?.soutenances.map((soutenance) => {
              let dragStartTime = 0
              let isDragging = false

              return (
                <div
                  key={soutenance.id}
                  draggable={true}
                  onMouseDown={() => {
                    dragStartTime = Date.now()
                    isDragging = false
                  }}
                  onDragStart={(e) => {
                    isDragging = true
                    e.stopPropagation()
                    handleModalDragStart(e, soutenance)
                  }}
                  onDragEnd={(e) => {
                    console.log("Drag ended")
                    isDragging = false
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    // Attendre un peu pour voir si c'est un drag ou un clic
                    setTimeout(() => {
                      if (!isDragging && Date.now() - dragStartTime < 200) {
                        // C'est un clic simple, pas un drag
                        setSelectedSoutenance(soutenance)
                        setShowDayDialog(false)
                        setShowDetailsDialog(true)
                      }
                    }, 50)
                  }}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 hover:border-orange-300 cursor-pointer transition-all duration-200 group select-none"
                  style={{ touchAction: "none" }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="text-orange-400 mr-2 opacity-0 group-hover:opacity-100 transition-opacity text-lg">
                          ⋮⋮
                        </span>
                        <h4 className="font-medium text-gray-800">{soutenance.etudiant}</h4>
                      </div>
                      <p className="text-sm text-gray-600">{soutenance.etudiantDetails}</p>
                      <p className="text-sm text-blue-600 mt-1">
                        {soutenance.heure_debut} - {soutenance.heure_fin}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{soutenance.salle}</p>
                      <p className="text-xs text-orange-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        Clic = détails | Glisser = déplacer
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg lg:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la soutenance</DialogTitle>
          </DialogHeader>

          {selectedSoutenance && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Sujet</Label>
                  <p className="text-gray-900">{selectedSoutenance.sujet}</p>
                </div>
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Étudiant(s)</Label>
                  <p className="text-gray-900">{selectedSoutenance.etudiantDetails}</p>
                </div>
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Date</Label>
                  <p className="text-gray-900">{selectedSoutenance.date.toLocaleDateString("fr-FR")}</p>
                </div>
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Heure</Label>
                  <p className="text-gray-900">
                    {selectedSoutenance.heure_debut} - {selectedSoutenance.heure_fin}
                  </p>
                </div>
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Salle</Label>
                  <p className="text-gray-900">{selectedSoutenance.salle}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Encadrant</Label>
                  <p className="text-gray-900">{selectedSoutenance.encadrant}</p>
                </div>
                {selectedSoutenance.co_encadrant && selectedSoutenance.co_encadrant !== "N/A" && (
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">Co-encadrant</Label>
                    <p className="text-gray-900">{selectedSoutenance.co_encadrant}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Président du jury</Label>
                  <p className="text-gray-900">{selectedSoutenance.jury_president}</p>
                </div>
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Examinateur</Label>
                  <p className="text-gray-900">{selectedSoutenance.jury_examinateur}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Button
              onClick={() => {
                setShowEditDialog(true)
                setShowDetailsDialog(false)
                setEditData({
                  time: selectedSoutenance?.heure_debut || "",
                  salle: selectedSoutenance?.salle || "",
                })
              }}
              className="bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600"
            >
              Modifier
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowDetailsDialog(false)
                setShowConfirmDialog(true)
              }}
              className="bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600"
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={showEditDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowEditDialog(false)
            setShowDetailsDialog(true)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la soutenance</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="editTime" className="block text-sm font-medium text-gray-700 mb-2">
                Heure de début
              </Label>
              <Input
                id="editTime"
                type="time"
                value={editData.time}
                onChange={(e) => setEditData({ ...editData, time: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false)
                setShowDetailsDialog(true)
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleEdit}
              className="bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600"
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmation de suppression</DialogTitle>
            <DialogDescription>Voulez-vous vraiment supprimer cette soutenance ?</DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              className="bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600"
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default DefensesCalendar