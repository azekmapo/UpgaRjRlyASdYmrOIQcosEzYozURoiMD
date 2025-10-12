"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Settings, Plus, Trash2, Loader, CalendarIcon } from "lucide-react"; // Added CalendarIcon
import { z } from "zod";
import { format } from "date-fns"; // Added format from date-fns
import { toast } from "sonner";
import DefensesCalendar from "./DefensesCalendar";
import { soutenanceService } from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"; // Added Popover components
import { Calendar } from "@/components/ui/calendar"; // Added Calendar component
import { cn } from "@/lib/utils"; // Added cn utility
import { createPortal } from "react-dom";
import { useNotifications } from "@/hooks/useNotifications"; // Added for notification listening

const RoomSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Le nom de la salle est requis"),
});

const WorkingHoursSchema = z.object({
  startTime: z.string(),
  endTime: z.string(),
  session: z.string(),
});

type Room = z.infer<typeof RoomSchema>;
type WorkingHours = z.infer<typeof WorkingHoursSchema>;

interface SoutenanceAdminProps {
  onSoutenancesUpdated?: (soutenances: any[]) => void;
}

const SoutenanceAdmin: React.FC<SoutenanceAdminProps> = ({
  onSoutenancesUpdated,
}) => {
  // Main data state
  const [soutenances, setSoutenances] = useState<any[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [currentWorkingHours, setCurrentWorkingHours] = useState<any>({
    start_time: "08:00",
    end_time: "16:00",
    defense_duration: 60,
    break_duration: 60,
  });
  const [currentRooms, setCurrentRooms] = useState<Room[]>([]);
  const [calendarKey, setCalendarKey] = useState(0);

  // Notification system
  const { notifications } = useNotifications();

  // Form state
  const [open, setOpen] = useState(false);
  const [roomsState, setRooms] = useState<Room[]>([]);
  const [workingHoursState, setWorkingHours] = useState<WorkingHours>({
    startTime: "08:00",
    endTime: "16:00",
    session: "1",
  });
  const [excludedDates, setExcludedDates] = useState<Date[]>([]); // New state for excluded dates

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchSoutenancesData = async () => {
    try {
      setInitialLoading(true);
      const response = await soutenanceService.getSoutenances();
      if (response.success && response.data) {
        setSoutenances(response.data.soutenances || []);
        setStartDate(response.data.startDate || "");
        const sallesData = response.data.salles || [];
        const roomsData = sallesData.map((salle: any) => ({
          id: salle.id,
          name: salle.nom_salle,
        }));
        setCurrentRooms(roomsData);
        // Correction: S'assurer que workingHours a la bonne structure
        if (response.data.workingHours) {
          const workingHoursData = {
            start_time: response.data.workingHours.start_time || "08:00",
            end_time: response.data.workingHours.end_time || "16:00",
            defense_duration: response.data.workingHours.defense_duration || 60,
            break_duration: response.data.workingHours.break_duration || 60,
          };
          setCurrentWorkingHours(workingHoursData);
        }
        setRooms(roomsData.length > 0 ? roomsData : [{ name: "" }]);
        if (onSoutenancesUpdated) {
          onSoutenancesUpdated(response.data.soutenances || []);
        }
      }
    } catch (error) {
      console.error("Error loading soutenances data:", error);
      setRooms([{ name: "" }]);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchSoutenancesData();
  }, []);

  // Listen for soutenance generation notifications
  useEffect(() => {
    const soutenanceNotifications = notifications.filter(
      (notification) =>
        notification.type === "SOUTENANCE_GENERATION" &&
        notification.status === "unread"
    );

    if (soutenanceNotifications.length > 0) {
      // Refresh soutenances data when we receive a generation notification
      fetchSoutenancesData();

      // Force calendar re-render
      setCalendarKey((prev) => prev + 1);
    }
  }, [notifications]);

  useEffect(() => {
    if (open && currentRooms.length > 0) {
      setRooms(currentRooms);
    }
  }, [open, currentRooms]);

  const handleAddRoom = () => {
    setRooms([...roomsState, { name: "" }]);
  };

  const handleRemoveRoom = (index: number) => {
    if (roomsState.length > 1) {
      const newRooms = roomsState.filter((_, i) => i !== index);
      setRooms(newRooms);
    }
  };

  const handleRoomChange = (index: number, value: string) => {
    const newRooms = [...roomsState];
    newRooms[index].name = value;
    setRooms(newRooms);
  };

  const validateForm = () => {
    if (workingHoursState.startTime >= workingHoursState.endTime) {
      return false;
    }
    const validRooms = roomsState.filter((room) => room.name.trim() !== "");
    if (validRooms.length === 0) {
      return false;
    }
    const roomNames = validRooms.map((room) => room.name.trim().toLowerCase());
    const uniqueRoomNames = new Set(roomNames);
    if (roomNames.length !== uniqueRoomNames.size) {
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    setLoading(true);
    try {
      const validRooms = roomsState.filter((room) => room.name.trim() !== "");
      const roomsData = validRooms.map((room) => ({ name: room.name.trim() }));
      // Format excludedDates to ISO strings (YYYY-MM-DD) for backend
      const formattedExcludedDates = excludedDates.map((date) =>
        format(date, "yyyy-MM-dd")
      );

      const configData = {
        working_hours: {
          start_time: workingHoursState.startTime,
          end_time: workingHoursState.endTime,
          session: workingHoursState.session,
        },
        rooms: roomsData,
        excluded_dates: formattedExcludedDates, // Add excluded dates to configData
      };

      const response = await soutenanceService.createSoutenances(configData);

      // Update current state
      setCurrentWorkingHours({
        start_time: configData.working_hours.start_time,
        end_time: configData.working_hours.end_time,
        defense_duration: 60,
        break_duration: 60,
      });
      setCurrentRooms(validRooms);

      // Close dialog immediately since job is running in background
      setOpen(false);

      if (response.job_dispatched) {
        toast.success(
          "Génération des soutenances démarrée en arrière-plan...",
          {
            description: `${response.pfe_count} PFEs à programmer. Vous recevrez une notification une fois terminé.`,
            duration: 5000,
          }
        );
      } else {
        toast.success("Soutenances générées avec succès!");
      }
      setCalendarKey((prev) => prev + 1);
    } catch (error: unknown) {
      console.error("Erreur lors de la génération:", error);

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Erreur lors de la génération des soutenances";
      toast.error("Erreur de génération", {
        description: errorMessage,
        duration: 8000,
      });

      setCalendarKey((prev) => prev + 1);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSoutenancesUpdated = async () => {
    await fetchSoutenancesData();
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader className="animate-spin w-6 h-6 text-orange-500" />
          <span className="text-gray-600">Chargement des données...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="text-center mb-8 pt-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">
          Planification des soutenances
        </h1>
        <p className="text-gray-600">
          Organisez et gérez les dates et horaires des soutenances pour les
          groupes d&apos;étudiants.
        </p>
      </div>
      <DefensesCalendar
        key={calendarKey} // Force re-render when key changes
        soutenances={soutenances}
        startDate={startDate}
        workingHours={currentWorkingHours}
        rooms={currentRooms}
        onSoutenancesUpdated={handleSoutenancesUpdated}
        excludedDates={excludedDates.map((date) => format(date, "yyyy-MM-dd"))} // Pass excluded dates to calendar
      />
      {isMounted &&
        createPortal(
          <Button
            onClick={() => setOpen(true)}
            disabled={loading}
            className="fixed bottom-4 right-4 sm:bottom-11 sm:right-11 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-110 disabled:hover:scale-100 z-50"
            title="Modifier les soutenances"
          >
            {loading ? (
              <Loader className="animate-spin" size={24} />
            ) : (
              <Settings size={24} />
            )}
          </Button>,
          document.body
        )}
      <Dialog
        open={open}
        onOpenChange={(isOpen) => !loading && setOpen(isOpen)}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configuration des Soutenances</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label
                htmlFor="session"
                className="text-lg font-medium text-gray-800 mb-4 block"
              >
                Session
              </Label>
              <Select
                value={workingHoursState.session}
                onValueChange={(value) =>
                  setWorkingHours({
                    ...workingHoursState,
                    session: value,
                  })
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une session" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Session 1</SelectItem>
                  <SelectItem value="2">Session 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                Durées de Soutenance (Configuration Automatique)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Durée de soutenance :</span>
                  <span className="font-medium">60 minutes</span>
                </div>
                <div className="flex justify-between">
                  <span>Pause entre soutenances :</span>
                  <span className="font-medium">60 minutes</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Ces durées sont configurées automatiquement et ne peuvent pas
                être modifiées.
              </p>
            </div>
            {/* New section for Excluded Days */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Jours Exclus de la Planification
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Sélectionnez les jours où aucune soutenance ne doit être
                planifiée.
              </p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !excludedDates.length && "text-muted-foreground"
                    )}
                    disabled={loading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {excludedDates.length > 0 ? (
                      excludedDates
                        .map((date) => format(date, "PPP"))
                        .join(", ")
                    ) : (
                      <span>Sélectionner les jours</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="multiple"
                    selected={excludedDates}
                    onSelect={setExcludedDates}
                    initialFocus
                    disabled={loading}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Horaires de Travail
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="startTime"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Heure de début
                  </Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={workingHoursState.startTime}
                    onChange={(e) =>
                      setWorkingHours({
                        ...workingHoursState,
                        startTime: e.target.value,
                      })
                    }
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label
                    htmlFor="endTime"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Heure de fin
                  </Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={workingHoursState.endTime}
                    onChange={(e) =>
                      setWorkingHours({
                        ...workingHoursState,
                        endTime: e.target.value,
                      })
                    }
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-800">
                  Salles de Soutenance
                </h3>
                <Button
                  onClick={handleAddRoom}
                  disabled={loading}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600"
                >
                  <Plus size={16} />
                  <span>Ajouter</span>
                </Button>
              </div>
              <div className="space-y-3">
                {roomsState.map((room, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3"
                  >
                    <Input
                      type="text"
                      placeholder="Nom de la salle"
                      value={room.name}
                      onChange={(e) => handleRoomChange(index, e.target.value)}
                      disabled={loading}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => handleRemoveRoom(index)}
                      disabled={roomsState.length === 1 || loading}
                      variant="outline"
                      size="icon"
                      className={
                        roomsState.length === 1 || loading
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-red-600 hover:text-red-700 hover:bg-red-50"
                      }
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200">
              <Button
                onClick={() => setOpen(false)}
                disabled={loading}
                variant="outline"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 flex items-center space-x-2"
              >
                {loading && <Loader className="animate-spin w-4 h-4" />}
                <span>
                  {loading ? "Création en cours..." : "Créer les Soutenances"}
                </span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SoutenanceAdmin;