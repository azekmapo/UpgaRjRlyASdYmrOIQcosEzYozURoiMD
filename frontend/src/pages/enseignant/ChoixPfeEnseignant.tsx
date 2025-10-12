"use client"
import type React from "react"
import { useState, useEffect } from "react"
import { z } from "zod"
import { toast } from "sonner"
import { encadrementService } from "@/services/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Eye } from "lucide-react"
import LoadingSpinner from "@/components/loading-spinner"
import { fetchOptions } from "@/functions/fetchOptions"
import type { OptionItem } from "@/types/options"

interface Theme {
  id: string
  intitule: string
  resume?: string
  besoins_materiels?: string
  technologies_utilisees?: string
  type_sujet: "classique" | "innovant" | "stage"
  option?: string
  encadrant_name?: string
  co_encadrant_name?: string
  entreprise_name?: string
  moyenne_group?: number
  type: "proposition" | "pfe"
  originalList?: "available" | "current" | "co"
  role?: "encadrant" | "co_encadrant"
  isNeedingCoEncadrant?: boolean
}

const choixEncadrementSchema = z.object({
  ranked_themes: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["proposition", "pfe"]),
      rank: z.number(),
    }),
  ),
})

const ChoixPfeEnseignant: React.FC = () => {
  const [availableList, setAvailableList] = useState<Theme[]>([])
  const [rankedList, setRankedList] = useState<Theme[]>([])
  const [draggedItem, setDraggedItem] = useState<Theme | null>(null)
  const [draggedOverItem, setDraggedOverItem] = useState<Theme | null>(null)
  const [draggedOverZone, setDraggedOverZone] = useState<"available" | "ranked" | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [activeTab, setActiveTab] = useState<"available" | "preferences">("available")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Theme | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState("all")
  const [validationError, setValidationError] = useState<string | null>(null)
  const [removedCoEncadrements, setRemovedCoEncadrements] = useState<number[]>([])
  const [options, setOptions] = useState<OptionItem[]>([])

  const [touchDraggedItem, setTouchDraggedItem] = useState<Theme | null>(null)
  const [touchDraggedIndex, setTouchDraggedIndex] = useState<number | null>(null)
  const [touchPosition, setTouchPosition] = useState({ x: 0, y: 0 })
  const [touchOffset, setTouchOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const response = await fetchOptions()
        if (response.success) {
          setOptions(response.options)
        }
      } catch (err) {
        console.error("Error loading options:", err)
      }
    }

    loadOptions()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const response = await encadrementService.getEncadrementData()

        const available = [...response.availableThemes, ...response.pfesForCoEncadrement]
        const current = [...response.currentEncadrements, ...response.coEncadrements].sort(
          (a, b) => (a.ordre || 0) - (b.ordre || 0),
        )

        setAvailableList(available)
        setRankedList(current)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const getItemKey = (item: Theme) => `${item.id}-${item.type}`

  const getBadgeStyle = (type: string, value?: string | number) => {
    const baseStyle = "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
    switch (type) {
      case "type":
        if (value === "stage") return `${baseStyle} bg-purple-100 text-purple-800`
        if (value === "innovant") return `${baseStyle} bg-emerald-100 text-emerald-800`
        return `${baseStyle} bg-sky-100 text-sky-800`
      case "moyenne":
        return `${baseStyle} bg-green-100 text-green-800`
      case "option":
        return `${baseStyle} bg-orange-100 text-orange-800`
      case "role":
        if (value === "encadrant") return `${baseStyle} bg-blue-100 text-blue-800`
        return `${baseStyle} bg-pink-100 text-pink-800`
      default:
        return baseStyle
    }
  }

  const getItemClassName = (item: Theme, isDraggedOver = false, isMobileView = false, isBeingDragged = false) => {
    let classes = `group relative rounded-xl border transition-all duration-300 ${
      isMobileView ? "touch-none select-none" : "cursor-move transform hover:scale-[1.02] hover:shadow-lg"
    }`

    if (isBeingDragged) {
      classes += " invisible"
    } else if (isDraggedOver) {
      classes += " border-blue-400 bg-blue-50 scale-[1.02] shadow-lg ring-2 ring-blue-200"
    } else if (item.role === "co_encadrant") {
      classes += " border-gray-200 bg-yellow-50 hover:border-blue-300"
    } else if (item.role === "encadrant") {
      classes += " border-gray-200 bg-white hover:border-blue-300"
    } else {
      classes += " border-gray-200 bg-white hover:border-blue-300"
    }
    return classes
  }

  const handleDragStart = (item: Theme) => {
    setDraggedItem(item)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDraggedOverItem(null)
    setDraggedOverZone(null)
  }

  const handleDragOver = (e: React.DragEvent, item: Theme) => {
    e.preventDefault()
    e.stopPropagation()
    setDraggedOverItem(item)
    setDraggedOverZone(null)
  }

  const handleZoneDragOver = (e: React.DragEvent, zone: "available" | "ranked") => {
    e.preventDefault()
    e.stopPropagation()
    if (!draggedOverItem) {
      setDraggedOverZone(zone)
    }
  }

  const handleItemDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDraggedOverItem(null)
    }
  }

  const handleDrop = (
    targetList: Theme[],
    setTargetList: React.Dispatch<React.SetStateAction<Theme[]>>,
    sourceList: Theme[],
    setSourceList: React.Dispatch<React.SetStateAction<Theme[]>>,
  ) => {
    if (!draggedItem) return
    const draggedItemKey = getItemKey(draggedItem)
    const isItemInTarget = targetList.some((item) => getItemKey(item) === draggedItemKey)

    if (isItemInTarget) {
      if (!draggedOverItem) return
      const startIndex = targetList.findIndex((item) => getItemKey(item) === draggedItemKey)
      const endIndex = targetList.findIndex((item) => getItemKey(item) === getItemKey(draggedOverItem))
      if (startIndex === endIndex) return

      const newList = Array.from(targetList)
      const [removed] = newList.splice(startIndex, 1)
      newList.splice(endIndex, 0, removed)
      setTargetList(newList)
    } else {
      if (sourceList === rankedList && draggedItem.originalList === "co") {
        setRemovedCoEncadrements((prev) => [...prev, Number(draggedItem.id)])
      }

      const newSourceList = sourceList.filter((item) => getItemKey(item) !== draggedItemKey)
      setSourceList(newSourceList)
      const newTargetList = [...targetList]

      if (draggedOverItem && targetList.some((item) => getItemKey(item) === getItemKey(draggedOverItem))) {
        const dropIndex = targetList.findIndex((item) => getItemKey(item) === getItemKey(draggedOverItem))
        newTargetList.splice(dropIndex, 0, draggedItem)
      } else {
        newTargetList.push(draggedItem)
      }
      setTargetList(newTargetList)
    }
  }

  const handleMobileAdd = (item: Theme) => {
    const newAvailableList = availableList.filter((theme) => getItemKey(theme) !== getItemKey(item))
    setAvailableList(newAvailableList)
    setRankedList([...rankedList, item])
  }

  const handleMobileRemove = (item: Theme) => {
    if (item.originalList === "co") {
      setRemovedCoEncadrements((prev) => [...prev, Number(item.id)])
    }

    const newRankedList = rankedList.filter((theme) => getItemKey(theme) !== getItemKey(item))
    setRankedList(newRankedList)
    setAvailableList([...availableList, item])
  }

  const handleTouchStart = (e: React.TouchEvent, item: Theme, index: number) => {
    const touch = e.touches[0]
    const rect = e.currentTarget.getBoundingClientRect()

    setTouchOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    })

    setTouchPosition({
      x: touch.clientX,
      y: touch.clientY,
    })

    setTouchDraggedItem(item)
    setTouchDraggedIndex(index)
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchDraggedItem || !isDragging) return

    e.preventDefault()
    const touch = e.touches[0]

    setTouchPosition({
      x: touch.clientX,
      y: touch.clientY,
    })

    const elements = document.elementsFromPoint(touch.clientX, touch.clientY)
    const itemElement = elements.find((el) => el.hasAttribute("data-item-index"))

    if (itemElement) {
      const hoveredIdx = Number.parseInt(itemElement.getAttribute("data-item-index") || "-1")
      setHoveredIndex(hoveredIdx)
    } else {
      setHoveredIndex(null)
    }
  }

  const handleTouchEnd = () => {
    if (!touchDraggedItem || hoveredIndex === null || hoveredIndex === touchDraggedIndex) {
      resetTouchDrag()
      return
    }

    const newList = Array.from(rankedList)
    const [removed] = newList.splice(touchDraggedIndex!, 1)
    newList.splice(hoveredIndex, 0, removed)
    setRankedList(newList)

    resetTouchDrag()
  }

  const resetTouchDrag = () => {
    setTouchDraggedItem(null)
    setTouchDraggedIndex(null)
    setTouchPosition({ x: 0, y: 0 })
    setTouchOffset({ x: 0, y: 0 })
    setIsDragging(false)
    setHoveredIndex(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    const rankedThemes = rankedList.map((theme, index) => ({
      id: String(theme.id),
      type: theme.type,
      rank: index + 1,
    }))

    try {
      choixEncadrementSchema.parse({ ranked_themes: rankedThemes })
      setIsLoading(true)

      await encadrementService.submitChoices({
        ranked_themes: rankedThemes,
        removed_co_encadrements: removedCoEncadrements,
      })

      toast.success("Vos choix d'encadrement ont été enregistrés avec succès")
      setRemovedCoEncadrements([])
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = `Validation failed: ${error.errors[0].message} at ${error.errors[0].path.join(".")}`
        setValidationError(errorMessage)
        toast.error(errorMessage)
      } else {
        const errorMessage = "Une erreur est survenue lors de l'enregistrement"
        setValidationError(errorMessage)
        toast.error(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleItemClick = (item: Theme, e: React.MouseEvent) => {
    if (isDragging) return
    e.preventDefault()
    e.stopPropagation()
    setSelectedItem(item)
    setShowModal(true)
  }

  const filteredThemes = filter === "all" ? availableList : availableList.filter((theme) => theme.option === filter)

  const filterOptions = ["all", ...options.map((opt) => opt.option)]

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="text-center space-y-2 mb-8 lg:mb-12">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Participation en tant qu'Encadrant</h1>
          <p className="text-muted-foreground">
            {isMobile
              ? "Tapez sur + pour ajouter. Maintenez et glissez pour réorganiser vos préférences."
              : "Glissez-déposez les sujets de PFE pour indiquer les groupes de projets que vous souhaitez encadrer ou co-encadrer. Organisez-les par ordre de préférence."}
          </p>
        </div>

        {validationError && (
          <div className="max-w-md mx-auto mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
            {validationError}
          </div>
        )}

        <div className="max-w-md mx-auto mb-6 lg:mb-8">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Préférences sélectionnées</span>
            <span className="font-medium">{rankedList.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${rankedList.length > 0 ? 100 : 0}%` }}
            ></div>
          </div>
        </div>

        {isMobile && (
          <div className="mb-6">
            <div className="flex bg-gray-100 rounded-xl p-1.5 gap-2">
              <button
                onClick={() => setActiveTab("available")}
                className={`flex-1 py-3 px-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === "available" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs sm:text-sm">Disponibles</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full min-w-[24px] text-center ${
                      activeTab === "available" ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {filteredThemes.length}
                  </span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("preferences")}
                className={`flex-1 py-3 px-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === "preferences" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs sm:text-sm">Préférences</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full min-w-[24px] text-center ${
                      activeTab === "preferences" ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {rankedList.length}
                  </span>
                </div>
              </button>
            </div>
          </div>
        )}

        <div className={isMobile ? "space-y-6" : "grid lg:grid-cols-2 gap-8"}>
          <div
            className={`bg-white rounded-2xl shadow-xl border overflow-hidden transition-all duration-200 ${
              draggedOverZone === "available" ? "border-blue-400 ring-2 ring-blue-200 bg-blue-50" : "border-gray-200"
            } ${isMobile && activeTab !== "available" ? "hidden" : ""}`}
          >
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-4 lg:px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg lg:text-xl font-semibold text-white">PFE Disponibles</h2>
                </div>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="bg-white/10 backdrop-blur border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                >
                  {filterOptions.map((option) => (
                    <option key={option} value={option} className="text-gray-900">
                      {option === "all" ? "Toutes les options" : option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="px-4 lg:px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-sky-100 border border-sky-300"></div>
                  <span className="text-gray-600">Type sujet</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-100 border border-orange-300"></div>
                  <span className="text-gray-600">Option</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-100 border border-green-300"></div>
                  <span className="text-gray-600">Moyenne</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-300"></div>
                  <span className="text-gray-600">Besoin co-encadrant</span>
                </div>
              </div>
            </div>
            <div
              className={`p-4 lg:p-6 ${
                isMobile ? "max-h-none" : "max-h-96 overflow-y-auto"
              } space-y-3 ${isMobile ? "min-h-0" : "min-h-80"}`}
              onDragOver={!isMobile ? (e) => handleZoneDragOver(e, "available") : undefined}
              onDrop={
                !isMobile ? () => handleDrop(availableList, setAvailableList, rankedList, setRankedList) : undefined
              }
            >
              {filteredThemes.length > 0 ? (
                filteredThemes.map((item) => (
                  <div
                    key={getItemKey(item)}
                    className={getItemClassName(
                      item,
                      !!(draggedOverItem && getItemKey(draggedOverItem) === getItemKey(item)),
                      isMobile,
                    )}
                    draggable={!isMobile}
                    onDragStart={!isMobile ? () => handleDragStart(item) : undefined}
                    onDragEnd={!isMobile ? handleDragEnd : undefined}
                    onDragOver={!isMobile ? (e) => handleDragOver(e, item) : undefined}
                    onDragLeave={!isMobile ? handleItemDragLeave : undefined}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-medium text-gray-900 leading-tight pr-2 flex-1 line-clamp-2 min-w-0">
                          {item.intitule}
                        </h3>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={(e) => handleItemClick(item, e)}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {isMobile && (
                            <button
                              onClick={() => handleMobileAdd(item)}
                              className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded-full transition-colors"
                            >
                              +
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={getBadgeStyle("type", item.type_sujet)}>{item.type_sujet}</span>
                        {item.option && <span className={getBadgeStyle("option")}>{item.option}</span>}
                        {item.moyenne_group && <span className={getBadgeStyle("moyenne")}>{item.moyenne_group}</span>}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p className="font-medium">Aucun PFE disponible</p>
                  <p className="text-sm">Essayez de changer le filtre</p>
                </div>
              )}
            </div>
          </div>

          <div
            className={`bg-white rounded-2xl shadow-xl border overflow-hidden transition-all duration-200 ${
              draggedOverZone === "ranked" ? "border-blue-400 ring-2 ring-blue-200 bg-blue-50" : "border-gray-200"
            } ${isMobile && activeTab !== "preferences" ? "hidden" : ""}`}
          >
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 lg:px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg lg:text-xl font-semibold text-white">
                    Mes Encadrements
                    {isMobile && <br />}
                    {" / Co-Encadrements"}
                  </h2>
                </div>
                <div className="bg-white/20 backdrop-blur rounded-full px-3 py-1">
                  <span className="text-white font-medium text-sm">{rankedList.length}</span>
                </div>
              </div>
            </div>
            <div className="px-4 lg:px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-sky-100 border border-sky-300"></div>
                  <span className="text-gray-600">Type sujet</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-100 border border-orange-300"></div>
                  <span className="text-gray-600">Option</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-100 border border-green-300"></div>
                  <span className="text-gray-600">Moyenne</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-300"></div>
                  <span className="text-gray-600">Co-encadrement</span>
                </div>
              </div>
            </div>
            <div
              className={`p-4 lg:p-6 ${
                isMobile ? "max-h-none" : "max-h-96 overflow-y-auto"
              } space-y-3 ${rankedList.length === 0 ? (isMobile ? "min-h-[200px]" : "min-h-80") : ""}`}
              onDragOver={!isMobile ? (e) => handleZoneDragOver(e, "ranked") : undefined}
              onDrop={
                !isMobile ? () => handleDrop(rankedList, setRankedList, availableList, setAvailableList) : undefined
              }
            >
              {rankedList.length > 0 ? (
                rankedList.map((item, index) => (
                  <div
                    key={getItemKey(item)}
                    data-item-index={index}
                    className={getItemClassName(
                      item,
                      hoveredIndex === index && isDragging,
                      isMobile,
                      touchDraggedItem && getItemKey(touchDraggedItem) === getItemKey(item),
                    )}
                    draggable={!isMobile}
                    onDragStart={!isMobile ? () => handleDragStart(item) : undefined}
                    onDragEnd={!isMobile ? handleDragEnd : undefined}
                    onDragOver={!isMobile ? (e) => handleDragOver(e, item) : undefined}
                    onDragLeave={!isMobile ? handleItemDragLeave : undefined}
                    onTouchStart={(e) => handleTouchStart(e, item, index)}
                    onTouchMove={(e) => handleTouchMove(e, rankedList)}
                    onTouchEnd={handleTouchEnd}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-200 shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="font-medium text-gray-900 leading-tight pr-2 flex-1 line-clamp-2 min-w-0">
                              {item.intitule}
                            </h3>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={(e) => handleItemClick(item, e)}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {isMobile && (
                                <button
                                  onClick={() => handleMobileRemove(item)}
                                  className="bg-red-500 hover:bg-red-600 text-white text-sm px-2 py-1 rounded transition-colors"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className={getBadgeStyle("type", item.type_sujet)}>{item.type_sujet}</span>
                            {item.option && <span className={getBadgeStyle("option")}>{item.option}</span>}
                            {item.moyenne_group && (
                              <span className={getBadgeStyle("moyenne")}>{item.moyenne_group}</span>
                            )}
                            {item.role && (
                              <span className={getBadgeStyle("role", item.role)}>
                                {item.role === "encadrant" ? "Encadrant" : "Co-encadrant"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center text-gray-400 h-full py-8">
                  <div className="text-center px-4">
                    <span className="text-5xl mb-3 block opacity-50">⭐</span>
                    <p className="font-medium text-base mb-1">
                      {isMobile ? "Ajoutez des projets à vos préférences" : "Glissez les projets ici"}
                    </p>
                    <p className="text-sm">
                      {isMobile ? "Tapez sur + pour ajouter" : "Organisez-les par ordre de préférence"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t bg-gray-50 px-4 lg:px-6 py-4">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Enregistrement...
                  </>
                ) : (
                  "Confirmer les choix"
                )}
              </button>
              {rankedList.length === 0 && (
                <p className="text-center text-sm text-gray-500 mt-2">
                  Vous pouvez confirmer une liste vide pour retirer toutes vos préférences
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {isDragging && touchDraggedItem && (
        <div
          className="fixed pointer-events-none z-[9999]"
          style={{
            left: touchPosition.x - touchOffset.x,
            top: touchPosition.y - touchOffset.y,
            width: "calc(100vw - 2rem)",
            maxWidth: "600px",
          }}
        >
          <div className="bg-white rounded-xl border-2 border-blue-500 shadow-2xl opacity-90">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-200 shrink-0">
                  {touchDraggedIndex! + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 leading-tight line-clamp-2">{touchDraggedItem.intitule}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className={getBadgeStyle("type", touchDraggedItem.type_sujet)}>
                      {touchDraggedItem.type_sujet}
                    </span>
                    {touchDraggedItem.option && (
                      <span className={getBadgeStyle("option")}>{touchDraggedItem.option}</span>
                    )}
                    {touchDraggedItem.moyenne_group && (
                      <span className={getBadgeStyle("moyenne")}>{touchDraggedItem.moyenne_group}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-800">Détails du Projet</DialogTitle>
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedItem && (
                <>
                  <span className={getBadgeStyle("type", selectedItem.type_sujet)}>{selectedItem.type_sujet}</span>
                  {selectedItem.option && <span className={getBadgeStyle("option")}>{selectedItem.option}</span>}
                  {selectedItem.moyenne_group && (
                    <span className={getBadgeStyle("moyenne")}>{selectedItem.moyenne_group}</span>
                  )}
                  {selectedItem.role && (
                    <span className={getBadgeStyle("role", selectedItem.role)}>
                      {selectedItem.role === "encadrant" ? "Encadrant" : "Co-encadrant"}
                    </span>
                  )}
                </>
              )}
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Intitulé</h4>
              <p className="text-gray-700">{selectedItem?.intitule}</p>
            </div>
            {selectedItem?.resume && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Résumé</h4>
                <p className="text-gray-700">{selectedItem.resume}</p>
              </div>
            )}
            {selectedItem?.encadrant_name && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Encadrant</h4>
                <p className="text-gray-700">{selectedItem.encadrant_name}</p>
              </div>
            )}
            {selectedItem?.co_encadrant_name && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Co-encadrant</h4>
                <p className="text-gray-700">{selectedItem.co_encadrant_name}</p>
              </div>
            )}
            {selectedItem?.besoins_materiels && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Besoins matériels</h4>
                <p className="text-gray-700">{selectedItem.besoins_materiels}</p>
              </div>
            )}
            {selectedItem?.technologies_utilisees && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Technologies utilisées</h4>
                <p className="text-gray-700">{selectedItem.technologies_utilisees}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ChoixPfeEnseignant
