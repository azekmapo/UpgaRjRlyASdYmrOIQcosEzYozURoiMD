"use client"
import type React from "react"
import { useState, useEffect } from "react"
import { z } from "zod"
import { choixPFEService } from "@/services/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Eye } from "lucide-react"
import { toast } from "sonner"

interface Theme {
  id: number
  intitule: string
  resume?: string
  besoins_materiels?: string
  technologies_utilisees?: string
  type_sujet: "classique" | "innovant" | "stage"
  option?: string
  encadrant_name?: string
  co_encadrant_name?: string
  entreprise_name?: string
}

const choixPFESchema = z.object({
  ranked_themes: z
    .array(
      z.object({
        theme_id: z.number(),
        type_sujet: z.enum(["classique", "innovant", "stage"]),
        rank: z.number(),
      }),
    )
    .length(10, "Vous devez choisir exactement 10 thèmes"),
})

const ChoixPFE: React.FC = () => {
  const [initialList, setInitialList] = useState<Theme[]>([])
  const [rankedList, setRankedList] = useState<Theme[]>([])
  const [draggedItem, setDraggedItem] = useState<Theme | null>(null)
  const [draggedOverItem, setDraggedOverItem] = useState<Theme | null>(null)
  const [draggedOverZone, setDraggedOverZone] = useState<"initial" | "ranked" | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [activeTab, setActiveTab] = useState<"available" | "wishlist">("available")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Theme | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [ApiData, setApiData] = useState<any>(null)
  const [hasGroup, setHasGroup] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    const fetchData = async () => {
      try {
        setIsLoadingData(true)
        const response = await choixPFEService.getChoices()
        console.log("API Response:", response)

        if (response.success) {
          setApiData(response.data)
          setHasGroup(response.data.hasGroup)

          if (response.data.hasGroup) {
            const transformedThemes: Theme[] = response.data.availableThemes.map((theme: any) => ({
              id: theme.id,
              intitule: theme.intitule,
              resume: theme.resume,
              besoins_materiels: theme.besoins_materiels,
              technologies_utilisees: theme.technologies_utilisees,
              type_sujet: theme.type_sujet,
              option: theme.option,
              encadrant_name: theme.encadrant_name,
              co_encadrant_name: theme.co_encadrant_name,
              entreprise_name: theme.entreprise_name || theme.entreprise,
            }))

            if (response.data.currentChoices && response.data.currentChoices.length > 0) {
              const chosenThemes: Theme[] = []

              response.data.currentChoices.forEach((choice: any) => {
                const foundTheme = transformedThemes.find(
                  (theme: Theme) => theme.id === choice.theme_id && theme.type_sujet === choice.type_sujet,
                )
                if (foundTheme) {
                  chosenThemes.push(foundTheme)
                }
              })

              setRankedList(chosenThemes)

              const remainingThemes = transformedThemes.filter(
                (theme: Theme) =>
                  !(response.data.currentChoices ?? []).some(
                    (choice: any) => choice.theme_id === theme.id && choice.type_sujet === theme.type_sujet,
                  ),
              )
              setInitialList(remainingThemes)
            } else {
              setInitialList(transformedThemes)
              setRankedList([])
            }
          }
        } else {
          setError(response.message || "Failed to load data")
        }
      } catch (err) {
        setError("An error occurred while loading data")
        console.error("Error fetching PFE choices:", err)
      } finally {
        setIsLoadingData(false)
      }
    }
    fetchData()
  }, [])

  const getItemKey = (item: Theme) => `${item.id}-${item.type_sujet}`

  const getBadgeStyle = (type: string, value?: string) => {
    const baseStyle = "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
    switch (type) {
      case "type":
        if (value === "stage") return `${baseStyle} bg-purple-100 text-purple-800`
        if (value === "innovant") return `${baseStyle} bg-emerald-100 text-emerald-800`
        return `${baseStyle} bg-sky-100 text-sky-800`
      case "option":
        return `${baseStyle} bg-orange-100 text-orange-800`
      case "entreprise":
        return `${baseStyle} bg-amber-100 text-amber-800 max-w-32 truncate`
      default:
        return baseStyle
    }
  }

  const getItemClassName = (item: Theme, isDraggedOver = false, isMobileView = false, isBeingDragged = false) => {
    let classes = `group relative bg-white rounded-xl border transition-all duration-200 ${
      isMobileView ? "touch-none select-none" : "cursor-move transform hover:scale-[1.02] hover:shadow-lg"
    }`

    if (isBeingDragged) {
      classes += " invisible"
    } else if (isDraggedOver) {
      classes += " border-blue-500 bg-blue-50 ring-2 ring-blue-300"
    } else {
      classes += " border-gray-200 hover:border-blue-300"
    }

    if (item.type_sujet === "stage") {
      classes += " bg-gradient-to-r from-purple-50 to-purple-100"
    } else if (item.type_sujet === "innovant") {
      classes += " bg-gradient-to-r from-green-50 to-green-100"
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

  const handleZoneDragOver = (e: React.DragEvent, zone: "initial" | "ranked") => {
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
    isRankedList = false,
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
      if (isRankedList && targetList.length >= 10) return
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
    if (rankedList.length >= 10) return
    const newInitialList = initialList.filter((theme) => getItemKey(theme) !== getItemKey(item))
    setInitialList(newInitialList)
    const newRankedList = [...rankedList, item]
    setRankedList(newRankedList)
  }

  const handleMobileRemove = (item: Theme) => {
    const newRankedList = rankedList.filter((theme) => getItemKey(theme) !== getItemKey(item))
    setRankedList(newRankedList)
    const newInitialList = [...initialList, item]
    setInitialList(newInitialList)
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

  const handleTouchMove = (e: React.TouchEvent, list: Theme[]) => {
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
      theme_id: theme.id,
      rank: index + 1,
      type_sujet: theme.type_sujet,
    }))
    try {
      choixPFESchema.parse({ ranked_themes: rankedThemes })
      setIsLoading(true)
      const response = await choixPFEService.submitChoices(rankedThemes)

      if (response.success) {
        toast.success("Vos choix de PFE ont été enregistrés avec succès")
      } else {
        toast.error(response.message || "Échec de l'enregistrement des choix")
        setValidationError(response.message || "Failed to save choices")
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message)
        setValidationError(error.errors[0].message)
      } else {
        toast.error("Une erreur s'est produite lors de l'enregistrement")
        setValidationError("An error occurred while saving your choices")
        console.error("Error submitting choices:", error)
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

  const closeModal = () => {
    setShowModal(false)
    setSelectedItem(null)
  }

  if (isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-700 font-medium">Chargement...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!hasGroup) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Groupe Requis</h2>
            <p className="text-gray-600">Vous devez faire partie d'un groupe pour effectuer votre choix de PFE.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
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
                    {touchDraggedItem.entreprise_name && (
                      <span className={getBadgeStyle("entreprise")}>{touchDraggedItem.entreprise_name}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-8 lg:mb-12">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Choisir Votre PFE</h1>
          <p className="text-base lg:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {isMobile
              ? "Tapez sur + pour ajouter. Maintenez et glissez pour réorganiser vos préférences."
              : "Glissez-déposez les sujets de PFE depuis la liste disponible vers votre liste de souhaits. Organisez-les par ordre de préférence (10 choix requis)."}
          </p>
        </div>

        {validationError && (
          <div className="max-w-md mx-auto mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
            {validationError}
          </div>
        )}

        <div className="max-w-md mx-auto mb-6 lg:mb-8">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Progression</span>
            <span className="font-medium">{rankedList.length}/10</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(rankedList.length / 10) * 100}%` }}
            ></div>
          </div>
        </div>

        {isMobile && (
          <div className="mb-6 px-1">
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              <button
                onClick={() => setActiveTab("available")}
                className={`flex-1 py-3 px-1 rounded-lg font-medium text-sm transition-all duration-200 ${
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
                    {initialList.length}
                  </span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("wishlist")}
                className={`flex-1 py-3 px-1 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === "wishlist" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs sm:text-sm">Préférences</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full min-w-[24px] text-center ${
                      activeTab === "wishlist" ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {rankedList.length}/10
                  </span>
                </div>
              </button>
            </div>
          </div>
        )}

        <div className={isMobile ? "space-y-6" : "grid lg:grid-cols-2 gap-8"}>
          <div
            className={`bg-white rounded-2xl shadow-xl border overflow-hidden transition-all duration-200 ${
              draggedOverZone === "initial" ? "border-blue-400 ring-2 ring-blue-200 bg-blue-50" : "border-gray-200"
            } ${isMobile && activeTab !== "available" ? "hidden" : ""}`}
          >
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-4 lg:px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg lg:text-xl font-semibold text-white">PFE Disponibles</h2>
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
                  <div className="w-3 h-3 rounded-full bg-amber-100 border border-amber-300"></div>
                  <span className="text-gray-600">Entreprise</span>
                </div>
              </div>
            </div>
            <div
              className={`p-4 lg:p-6 ${isMobile ? "max-h-none" : "max-h-96 overflow-y-auto"} space-y-3 ${isMobile ? "min-h-0" : "min-h-80"}`}
              onDragOver={!isMobile ? (e) => handleZoneDragOver(e, "initial") : undefined}
              onDrop={!isMobile ? () => handleDrop(initialList, setInitialList, rankedList, setRankedList) : undefined}
            >
              {initialList.length > 0 ? (
                initialList.map((item) => (
                  <div
                    key={getItemKey(item)}
                    data-item-id={getItemKey(item)}
                    className={getItemClassName(
                      item,
                      !!(draggedOverItem && getItemKey(draggedOverItem) === getItemKey(item)),
                      isMobile,
                    )}
                    draggable={!isMobile}
                    onDragStart={() => handleDragStart(item)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, item)}
                    onDragLeave={handleItemDragLeave}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-medium text-gray-900 leading-tight pr-2 flex-1 line-clamp-2">
                          {item.intitule}
                        </h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleItemClick(item, e)}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {isMobile && (
                            <button
                              onClick={() => handleMobileAdd(item)}
                              disabled={rankedList.length >= 10}
                              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white text-sm px-3 py-1 rounded-full transition-colors disabled:cursor-not-allowed"
                            >
                              +
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={getBadgeStyle("type", item.type_sujet)}>{item.type_sujet}</span>
                        {item.option && <span className={getBadgeStyle("option")}>{item.option}</span>}
                        {item.entreprise_name && (
                          <span className={getBadgeStyle("entreprise")}>{item.entreprise_name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p className="font-medium">Aucun PFE disponible</p>
                </div>
              )}
            </div>
          </div>

          <div
            className={`bg-white rounded-2xl shadow-xl border overflow-hidden transition-all duration-200 ${
              draggedOverZone === "ranked" ? "border-blue-400 ring-2 ring-blue-200 bg-blue-50" : "border-gray-200"
            } ${isMobile && activeTab !== "wishlist" ? "hidden" : ""}`}
          >
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 lg:px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg lg:text-xl font-semibold text-white">Mes Préférences</h2>
                </div>
                <div className="bg-white/20 backdrop-blur rounded-full px-3 py-1">
                  <span className="text-white font-medium text-sm">{rankedList.length}/10</span>
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
                  <div className="w-3 h-3 rounded-full bg-amber-100 border border-amber-300"></div>
                  <span className="text-gray-600">Entreprise</span>
                </div>
              </div>
            </div>
            <div
              className={`p-4 lg:p-6 ${isMobile ? "max-h-none" : "max-h-96 overflow-y-auto"} space-y-3 ${isMobile ? "min-h-96" : "min-h-80"} relative`}
              onDragOver={(e) => handleZoneDragOver(e, "ranked")}
              onDrop={() => handleDrop(rankedList, setRankedList, initialList, setInitialList, true)}
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
                    onDragStart={() => handleDragStart(item)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, item)}
                    onDragLeave={handleItemDragLeave}
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
                          <div className="flex items-start gap-2">
                            <h3 className="font-medium text-gray-900 leading-tight flex-1 min-w-0 line-clamp-2">
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
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className={getBadgeStyle("type", item.type_sujet)}>{item.type_sujet}</span>
                            {item.option && <span className={getBadgeStyle("option")}>{item.option}</span>}
                            {item.entreprise_name && (
                              <span className={getBadgeStyle("entreprise")}>{item.entreprise_name}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <div className="text-center px-4">
                    <span className="text-6xl mb-3 block opacity-50">⭐</span>
                    <p className="font-medium text-base sm:text-lg mb-1.5">
                      {isMobile ? "Ajoutez des PFE à votre liste" : "Glissez les PFE ici"}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-400">
                      {isMobile ? "Tapez sur + pour ajouter" : "Organisez-les par ordre de préférence"}
                    </p>
                    <p className="text-xs mt-2 text-orange-500 font-medium">10 choix requis</p>
                  </div>
                </div>
              )}
            </div>
            <div className="border-t bg-gray-50 px-4 lg:px-6 py-4">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={rankedList.length !== 10 || isLoading}
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
              {rankedList.length !== 10 && (
                <p className="text-center text-sm text-gray-500 mt-2">Vous devez sélectionner exactement 10 thèmes</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-800">{selectedItem?.intitule}</DialogTitle>
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedItem && (
                <>
                  <span className={getBadgeStyle("type", selectedItem.type_sujet)}>{selectedItem.type_sujet}</span>
                  {selectedItem.option && <span className={getBadgeStyle("option")}>{selectedItem.option}</span>}
                  {selectedItem.entreprise_name && (
                    <span className={getBadgeStyle("entreprise")}>{selectedItem.entreprise_name}</span>
                  )}
                </>
              )}
            </div>
          </DialogHeader>
          <div className="space-y-4">
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

export default ChoixPFE
