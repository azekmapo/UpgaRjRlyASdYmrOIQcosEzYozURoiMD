import { useState, useEffect } from "react"
import { calendrierService } from "@/services/api"
import type { Periode } from "@/types/calendrierTypes"

export const usePeriodeFilter = () => {
  const [activePeriodes, setActivePeriodes] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActivePeriodes = async () => {
      try {
        const response = await calendrierService.getPeriodes()
        const periodes: Periode[] = response.periodes || []
        const now = new Date()
        
        const activeIds = periodes
          .filter(p => {
            const debut = new Date(p.date_debut)
            const fin = new Date(p.date_fin)
            return now >= debut && now <= fin
          })
          .map(p => p.id)

        setActivePeriodes(activeIds)
      } catch (error) {
        console.error("Failed to fetch periodes:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivePeriodes()
  }, [])

  const isVisible = (periodes?: number[]): boolean => {
    if (!periodes || periodes.length === 0) return true
    if (activePeriodes.length === 0) return false
    return periodes.some(p => activePeriodes.includes(p))
  }

  return { activePeriodes, loading, isVisible }
}