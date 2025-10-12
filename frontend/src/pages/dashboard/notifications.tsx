"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useForm, type SubmitHandler } from "react-hook-form"
import LoadingSpinner from "@/components/loading-spinner"
import { toast } from "sonner"
import { useNotifications } from "@/hooks/useNotifications"
import { notificationService } from "@/services/notificationService"
import type { EmailAutomationType, EmailValidationType, NotificationsType } from "@/types/db-types"
import type { User } from "@/types/auth"
import { format } from "date-fns"
import { useAuth } from "@/hooks/useAuth"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import UserSelector from "@/components/user-selector"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Bell, Check, X, Trash2, Calendar, UserIcon } from "lucide-react"

const notificationFormSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  message: z.string().min(1, "Le message est requis"),
  type: z.string().min(1, "Le type est requis"),
  receiver_id: z.union([
    z.string().min(1, "Le destinataire est requis"),
    z.array(z.string()).min(1, "Au moins un destinataire est requis"),
  ]),
  status: z.string(),
})

type NotificationFormValues = z.infer<typeof notificationFormSchema>

const NotificationsPage: React.FC = () => {
  const { notifications, fetchNotifications, isLoading, removeNotification, updateNotificationStatus } =
    useNotifications()
  const [selectedNotification, setSelectedNotification] = useState<NotificationsType | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [responseAction, setResponseAction] = useState<"accepted" | "declined" | null>(null)
  const { user } = useAuth()
  const [isUserSelectorOpen, setIsUserSelectorOpen] = useState(false)
  const [currentUserSelectorRole, setCurrentUserSelectorRole] = useState<string>("")
  const [currentUserSelectorTitle, setCurrentUserSelectorTitle] = useState<string>("")
  const [selectedValidation, setSelectedValidation] = useState<EmailValidationType | null>(null)
  const [isValidationDialogOpen, setIsValidationDialogOpen] = useState(false)
  const [isLoadingValidation, setIsLoadingValidation] = useState(false)
  const [selectedEmailAutomation, setSelectedEmailAutomation] = useState<EmailAutomationType | null>(null)
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const [isLoadingEmailAutomation, setIsLoadingEmailAutomation] = useState(false)
  const [isAccepting, setIsAccepting] = useState(false)

  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      title: "",
      message: "",
      type: "SYSTEM",
      receiver_id: "",
      status: "new",
    },
  })

  const handleNotificationClick = (notification: NotificationsType) => {
    if (notification.type === "PFE_VALIDATION") {
      handleValidationNotificationClick(notification)
    } else if (notification.type === "EMAIL_NOTIFICATION") {
      handleEmailNotificationClick(notification)
    } else {
      setSelectedNotification(notification)
      setIsDetailDialogOpen(true)
    }
  }

  const handleDeleteNotification = async (id: string) => {
    if (!user) {
      toast.error("Vous n'êtes pas authentifié.")
      return
    }
    try {
      const response = await notificationService.deleteNotification(id, user.id)
      if (response.success) {
        toast.success("Notification supprimée avec succès")
        fetchNotifications()
        setIsDetailDialogOpen(false)
      }
    } catch {
      toast.error("Erreur lors de la suppression de la notification")
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm")
    } catch {
      return dateString
    }
  }

  const renderNotificationIcon = (type: string) => {
    switch (type) {
      case "SYSTEM":
        return <span className="text-blue-500">🔔</span>
      case "MESSAGE":
        return <span className="text-green-500">✉️</span>
      case "EVENT":
        return <span className="text-purple-500">📅</span>
      case "ALERT":
        return <span className="text-red-500">⚠️</span>
      case "REMINDER":
        return <span className="text-orange-500">⏰</span>
      case "PFE_VALIDATION":
        return <span className="text-amber-300">📋</span>
      case "EMAIL_NOTIFICATION":
        return <span className="text-blue-600">📧</span>
      default:
        return <span className="text-gray-500">📩</span>
    }
  }

  const handleOpenUserSelector = (role: string, title: string) => {
    setCurrentUserSelectorRole(role)
    setCurrentUserSelectorTitle(title)
    setIsUserSelectorOpen(true)
  }

  const handleUserSelection = (users: User[]) => {
    const updatedUsers = [...selectedUsers]
    const existingIds = new Set(updatedUsers.map((u) => u.id))

    users.forEach((user) => {
      if (!existingIds.has(user.id)) {
        updatedUsers.push(user)
        existingIds.add(user.id)
      }
    })

    setSelectedUsers(updatedUsers)

    // Update form value with array of IDs
    if (updatedUsers.length > 0) {
      form.setValue(
        "receiver_id",
        updatedUsers.map((u) => u.id),
      )
    }
  }

  const handleRemoveSelectedUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId))

    // Update form value
    const updatedIds = selectedUsers.filter((u) => u.id !== userId).map((u) => u.id)
    if (updatedIds.length > 0) {
      form.setValue("receiver_id", updatedIds)
    } else {
      form.setValue("receiver_id", "specific")
    }
  }

  const onSubmitNotification: SubmitHandler<NotificationFormValues> = async (data) => {
    setIsSubmitting(true)

    try {
      if (!user) {
        toast.error("Utilisateur non authentifié")
        return
      }

      // Handle receiver_id based on selection
      let receiverId = data.receiver_id

      // Handle group selections
      if (
        data.receiver_id === "all" ||
        data.receiver_id === "etudiant" ||
        data.receiver_id === "enseignants" ||
        data.receiver_id === "entreprise"
      ) {
        // Use the group identifier directly
        console.log(`Sending notification to group: ${data.receiver_id}`)
      } else if (data.receiver_id === "specific" && selectedUsers.length === 0) {
        toast.error("Veuillez sélectionner au moins un utilisateur")
        setIsSubmitting(false)
        return
      } else if (data.receiver_id === "specific" && selectedUsers.length > 0) {
        // For specific users, use their IDs as an array
        receiverId = selectedUsers.map((user) => user.id)
        console.log(`Sending notification to specific users: ${receiverId}`)
      }

      const notification = {
        ...data,
        receiver_id: receiverId,
        sender_id: user.id,
      }

      console.log("Sending notification:", notification)

      try {
        const response = await notificationService.createNotification(notification)

        if (response.success) {
          toast.success("Notification envoyée avec succès")
          form.reset()
          setSelectedUsers([])
          setIsCreateDialogOpen(false)
          fetchNotifications()
        } else {
          toast.error(`Erreur: ${response.message || "Erreur inconnue"}`)
        }
      } catch (error: unknown) {
        // Check if it's a network error but notification might have been saved
        if (error instanceof Error && error.message && error.message.toLowerCase().includes("network")) {
          console.warn("Network error when connecting to socket server - notification may still be saved")
          toast.warning("La notification a été enregistrée mais le serveur de notifications pourrait être indisponible")
          form.reset()
          setSelectedUsers([])
          setIsCreateDialogOpen(false)
          fetchNotifications()
        } else {
          const errorMessage = error instanceof Error ? error.message : "Erreur inconnue lors de l'envoi"
          toast.error(`Erreur: ${errorMessage}`)
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
      toast.error(`Erreur lors de l'envoi de la notification: ${errorMessage}`)
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePropositionResponse = (response: "accepted" | "declined") => {
    setResponseAction(response)
    setIsConfirmDialogOpen(true)
  }

  const handleGroupInvitationResponse = (response: "accepted" | "declined") => {
    setResponseAction(response)
    setIsConfirmDialogOpen(true)
  }

  const confirmPropositionResponse = async () => {
    if (!selectedNotification || !responseAction || !user) {
      toast.error("Erreur: Impossible de traiter la réponse.")
      return
    }

    setIsAccepting(true)

    try {
      let response

      if (selectedNotification.type === "GROUP_INVITATION") {
        // Handle group invitation response
        if (!selectedNotification.group_id) {
          toast.error("Identifiant du groupe manquant")
          return
        }

        response = await notificationService.handleGroupInvitationResponse({
          notification_id: selectedNotification.id || "",
          response: responseAction,
          user_id: user.id,
          group_id: selectedNotification.group_id.toString(),
        })
      } else {
        // Handle proposition response (existing logic)
        if (!selectedNotification.proposition_id) {
          toast.error("Identifiant de la proposition manquant")
          return
        }

        response = await notificationService.handlePropositionResponse({
          notification_id: selectedNotification.id || "",
          response: responseAction,
          user_id: user.id,
          proposition_id: selectedNotification.proposition_id.toString(),
        })
      }

      if (response.success) {
        const actionText = responseAction === "accepted" ? "acceptée" : "refusée"
        const itemType = selectedNotification.type === "GROUP_INVITATION" ? "Invitation" : "Proposition"
        toast.success(`${itemType} ${actionText}`)

        // Update the notification status locally without waiting for socket
        if (selectedNotification.sender_id === user.id) {
          // If we're the sender, remove the notification
          removeNotification(selectedNotification.id || "")
        } else {
          // If we're the receiver, update the status
          updateNotificationStatus(selectedNotification.id || "", responseAction)
        }

        // Refresh notifications from server
        fetchNotifications()
        setIsDetailDialogOpen(false)
      } else {
        toast.error(`Erreur: ${response.message || "Erreur inconnue"}`)
      }
    } catch (error) {
      console.error("Error handling response:", error)
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
      toast.error(`Erreur lors de la réponse: ${errorMessage}`)
    } finally {
      setIsAccepting(false)
      setIsConfirmDialogOpen(false)
      setResponseAction(null)
    }
  }

  const handleValidationNotificationClick = async (notification: NotificationsType) => {
    if (!notification.email_validation_id) {
      toast.error("Identifiants de validation manquants")
      return
    }

    setIsValidationDialogOpen(true)
    setIsLoadingValidation(true)

    try {
      const response = await notificationService.handlePfeValidationView(notification.email_validation_id)
      if (response.success && response.data) {
        setSelectedValidation(response.data)
      } else {
        toast.error("Erreur lors du chargement des détails de validation")
        setIsValidationDialogOpen(false)
      }
    } catch (error) {
      console.error("Error loading validation details:", error)
      toast.error("Erreur lors du chargement des détails")
      setIsValidationDialogOpen(false)
    } finally {
      setIsLoadingValidation(false)
    }
  }

  const handleEmailNotificationClick = async (notification: NotificationsType) => {
    if (!notification.email_automation_id) {
      toast.error("Identifiant d'email automation manquant")
      return
    }

    setIsEmailDialogOpen(true)
    setIsLoadingEmailAutomation(true)

    try {
      const response = await notificationService.handleEmailAutomationView(notification.email_automation_id)
      if (response.success && response.data) {
        setSelectedEmailAutomation(response.data)
      } else {
        toast.error("Erreur lors du chargement des détails de l'email")
        setIsEmailDialogOpen(false)
      }
    } catch (error) {
      console.error("Error loading email automation details:", error)
      toast.error("Erreur lors du chargement des détails")
      setIsEmailDialogOpen(false)
    } finally {
      setIsLoadingEmailAutomation(false)
    }
  }

  const shouldShowResponseButtons = (notification: NotificationsType | null) => {
    if (!notification || !user) return false

    return (
      (notification.type === "CO_SUPERVISION" || notification.type === "GROUP_INVITATION") &&
      notification.status === "pending" &&
      notification.receiver_id === user.id
    )
  }

  const NotificationDetailsDialog = () => {
    if (!selectedNotification) return null

    return (
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
<DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
  <DialogHeader>
    <DialogTitle className="flex items-center gap-2">
      {renderNotificationIcon(selectedNotification.type)}
      <span className="line-clamp-2">{selectedNotification.title || "Notification"}</span>
    </DialogTitle>
  </DialogHeader>
  <div className="space-y-6">
    {/* Description moved here */}
    <p className="text-sm text-gray-600">
      {selectedNotification.type === "CO_SUPERVISION"
        ? "Demande de co-encadrement"
        : selectedNotification.type === "GROUP_INVITATION"
          ? "Invitation de binôme"
          : "Notification système"}
    </p>
    
    <div className="text-sm leading-relaxed">
      {selectedNotification.message || selectedNotification.formatted_message || "Aucun message disponible"}
    </div>
    
    <div className="text-xs text-muted-foreground space-y-1">
      <p className="flex items-center gap-2">
        <UserIcon className="h-3 w-3" />
        <span>De: {selectedNotification.sender?.name || "Système"}</span>
      </p>
      <p className="flex items-center gap-2">
        <Calendar className="h-3 w-3" />
        <span>Date: {formatDate(selectedNotification.created_at)}</span>
      </p>
      {selectedNotification.proposition_id && (
        <p className="flex items-center gap-2 text-blue-600">
          <span>ID Proposition: {selectedNotification.proposition_id}</span>
        </p>
      )}
    </div>
  </div>
  
  <DialogFooter className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200">
  {shouldShowResponseButtons(selectedNotification) && (
    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:flex-1">
        <Button
          onClick={() => {
            if (selectedNotification.type === "GROUP_INVITATION") {
              handleGroupInvitationResponse("accepted")
            } else {
              handlePropositionResponse("accepted")
            }
          }}
          className="bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 w-full flex-1 flex items-center justify-center space-x-2"
        >
          <Check className="h-4 w-4" />
          <span>Accepter</span>
        </Button><Button
  onClick={() => {
    if (selectedNotification.type === "GROUP_INVITATION") {
      handleGroupInvitationResponse("declined")
    } else {
      handlePropositionResponse("declined")
    }
  }}
  variant="outline"
  className="w-full flex-1 flex items-center justify-center space-x-2"
>
  <X className="h-4 w-4" />
  <span>Refuser</span>
</Button>
      </div>
    )}
    <div className="flex gap-2 w-full sm:w-auto">
      {user?.role === "admin" && (
        <Button
          onClick={() => handleDeleteNotification(selectedNotification.id || "")}
          variant="outline"
          className="text-red-500 hover:bg-red-100 hover:text-red-600 w-full justify-center"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  </DialogFooter>
</DialogContent>
      </Dialog>
    )
  }

  const CreateNotificationDialog = () => {
    if (!user) return null

    return (
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
  <DialogHeader>
    <DialogTitle>Créer une notification</DialogTitle>
  </DialogHeader>
  <div className="space-y-6">
    <p className="text-sm text-gray-600">
      Envoyez une notification à un utilisateur ou un groupe d'utilisateurs.
    </p>
    
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitNotification)} className="space-y-4">
        {/* All your existing form fields remain the same */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titre</FormLabel>
              <FormControl>
                <Input placeholder="Titre de la notification" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea placeholder="Contenu de la notification" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="SYSTEM">Système</SelectItem>
                  <SelectItem value="MESSAGE">Message</SelectItem>
                  <SelectItem value="EVENT">Événement</SelectItem>
                  <SelectItem value="ALERT">Alerte</SelectItem>
                  <SelectItem value="REMINDER">Rappel</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="receiver_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Destinataire</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value)
                  if (value === "specific") {
                    handleOpenUserSelector("all", "Sélectionner des utilisateurs")
                  }
                }}
                defaultValue={field.value as string}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le destinataire" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {user?.role === "admin" && (
                    <>
                      <SelectItem value="all">Tous les utilisateurs</SelectItem>
                      <SelectItem value="etudiant">Tous les étudiants</SelectItem>
                      <SelectItem value="enseignants">Tous les enseignants</SelectItem>
                      <SelectItem value="entreprise">Toutes les entreprises</SelectItem>
                    </>
                  )}
                  {user?.role === "enseignant" && (
                    <>
                      <SelectItem value="enseignants">Tous les enseignants</SelectItem>
                    </>
                  )}
                  {user?.role === "etudiant" && (
                    <>
                      <SelectItem value="etudiant">Tous les étudiants</SelectItem>
                    </>
                  )}
                  <SelectItem value="specific">Utilisateurs spécifiques</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.watch("receiver_id") === "specific" && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((selectedUser) => (
                <div key={selectedUser.id} className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1">
                  <span>{selectedUser.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSelectedUser(selectedUser.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenUserSelector("all", "Ajouter des utilisateurs")}
            >
              Ajouter des utilisateurs
            </Button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200">
          <Button 
            type="button" 
            onClick={() => setIsCreateDialogOpen(false)} 
            disabled={isSubmitting}
            variant="outline"
          >
            Annuler
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 flex items-center space-x-2"
          >
            {isSubmitting && <LoadingSpinner />}
            <span>{isSubmitting ? "Envoi en cours..." : "Envoyer"}</span>
          </Button>
        </div>
      </form>
    </Form>
  </div>
</DialogContent>
      </Dialog>
    )
  }

  const ConfirmationDialog = () => {
    if (!selectedNotification) return null

    const isGroupInvitation = selectedNotification.type === "GROUP_INVITATION"

    return (
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-2xl">
  <AlertDialogHeader>
    <AlertDialogTitle>
      {isGroupInvitation
        ? responseAction === "accepted"
          ? "Accepter l'invitation de binôme"
          : "Refuser l'invitation de binôme"
        : responseAction === "accepted"
          ? "Accepter la co-supervision"
          : "Refuser la co-supervision"}
    </AlertDialogTitle>
  </AlertDialogHeader>
  <div className="space-y-4">
    <p className="text-sm text-gray-600">
      {isGroupInvitation ? (
        <>
          Êtes-vous sûr de vouloir {responseAction === "accepted" ? "accepter" : "refuser"} cette invitation
          de binôme ?
        </>
      ) : (
        <>
          Êtes-vous sûr de vouloir {responseAction === "accepted" ? "accepter" : "refuser"} cette proposition
          de co-encadrement ?
        </>
      )}
    </p>
    {responseAction === "accepted" ? (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-700 font-medium">
          {isGroupInvitation
            ? "En acceptant, vous formerez un binôme avec cet étudiant pour votre projet."
            : "En acceptant, vous deviendrez co-encadrant de ce projet."}
        </p>
      </div>
    ) : (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-700 font-medium">
          {isGroupInvitation
            ? "En refusant, vous ne formerez pas de binôme avec cet étudiant."
            : "En refusant, vous ne serez pas associé à ce projet."}
        </p>
      </div>
    )}
  </div>
  <AlertDialogFooter className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200">
    <AlertDialogCancel disabled={isAccepting}>Annuler</AlertDialogCancel>
    <AlertDialogAction
  onClick={confirmPropositionResponse}
  disabled={isAccepting}
  className={
    responseAction === "accepted" 
      ? "bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600" 
      : "bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600"
  }
>
      {isAccepting ? (
        <div className="flex items-center space-x-2">
          <LoadingSpinner />
          <span>Traitement...</span>
        </div>
      ) : (
        <>{responseAction === "accepted" ? "Accepter" : "Refuser"}</>
      )}
    </AlertDialogAction>
  </AlertDialogFooter>
</AlertDialogContent>
      </AlertDialog>
    )
  }

  const ValidationDialog = () => {
  return (
    <Dialog open={isValidationDialogOpen} onOpenChange={setIsValidationDialogOpen}>
      <DialogContent className="sm:max-w-[600px] p-0 max-h-[90vh] overflow-y-auto">
        {isLoadingValidation ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <LoadingSpinner />
          </div>
        ) : !selectedValidation ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Aucune donnée disponible</p>
          </div>
        ) : (
          <>
            <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-slate-800 to-slate-700">
              <DialogTitle className="text-xl flex items-center gap-2 text-white">
                📋 
                <span className="line-clamp-2">
                  {selectedValidation.status === 'accepted' ? 'Proposition PFE Acceptée' : 'Proposition PFE Refusée'}
                </span>
              </DialogTitle>
            <p className="text-white">
                Validation de votre proposition de Projet de Fin d'Études
             </p>
              
            </DialogHeader>
            <div className="px-6 py-6 space-y-4">
              {selectedValidation.role === 'etudiant' && (
                <div className="space-y-4">
                  <div className="text-sm font-medium">
                    Cher{selectedValidation.name2 ? 's' : ''} {selectedValidation.name}
                    {selectedValidation.name2 && `, ${selectedValidation.name2}`},
                  </div>
                  
                  {selectedValidation.status === 'accepted' ? (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="font-semibold text-green-800">🎉 Félicitations !</div>
                      <div className="text-green-700 text-sm mt-1">
                        Votre proposition de Projet de Fin d'Études a été validée et acceptée par la commission pédagogique.
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="font-semibold text-red-800">⚠️ Notification importante :</div>
                      <div className="text-red-700 text-sm mt-1">
                        Votre proposition de Projet de Fin d'Études n'a pas été retenue par la commission pédagogique.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedValidation.role === 'enseignant' && (
                <div className="space-y-4">
                  <div className="text-sm font-medium">
                    Cher{selectedValidation.name2 ? 's collègues' : ' collègue'} {selectedValidation.name} (Encadrant)
                    {selectedValidation.name2 && `, ${selectedValidation.name2} (Co-encadrant)`},
                  </div>
                  
                  {selectedValidation.status === 'accepted' ? (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="font-semibold text-green-800">✅ Validation confirmée :</div>
                      <div className="text-green-700 text-sm mt-1">
                        Votre proposition de Projet de Fin d'Études a été approuvée par la commission pédagogique.
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="font-semibold text-red-800">❌ Décision de la commission :</div>
                      <div className="text-red-700 text-sm mt-1">
                        Votre proposition de Projet de Fin d'Études n'a pas été retenue.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedValidation.role === 'entreprise' && (
                <div className="space-y-4">
                  <div className="text-sm font-medium">
                    Cher{selectedValidation.name2 ? 's' : ''} {selectedValidation.name},
                  </div>
                  <div className="text-sm font-medium">
                    Au nom de l'entreprise {selectedValidation.denomination},
                  </div>
                  
                  {selectedValidation.status === 'accepted' ? (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="font-semibold text-green-800">🤝 Partenariat confirmé :</div>
                      <div className="text-green-700 text-sm mt-1">
                        Votre proposition de Projet de Fin d'Études a été acceptée par notre établissement.
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="font-semibold text-red-800">📋 Décision académique :</div>
                      <div className="text-red-700 text-sm mt-1">
                        Votre proposition de Projet de Fin d'Études n'a pas été retenue pour cette session.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedValidation.remarques && (
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className="font-medium text-gray-800 mb-2">📝 Observations de la Commission</div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-100 p-3 rounded border-l-4 border-blue-500">
                    {selectedValidation.remarques}
                  </div>
                </div>
              )}

              {selectedValidation.status === 'accepted' && (
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className="font-medium text-gray-800 mb-3">🎯 Spécifications Validées</div>
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded border">
                      <div className="font-medium text-sm text-gray-700">Intitulé :</div>
                      <div className="text-sm">{selectedValidation.intitule}</div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <div className="font-medium text-sm text-gray-700">Option :</div>
                      <div className="text-sm">{selectedValidation.option}</div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <div className="font-medium text-sm text-gray-700">Type :</div>
                      <div className="text-sm">{selectedValidation.type}</div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <div className="font-medium text-sm text-gray-700">Résumé :</div>
                      <div className="text-sm whitespace-pre-wrap">{selectedValidation.resumer}</div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <div className="font-medium text-sm text-gray-700">Technologies :</div>
                      <div className="text-sm whitespace-pre-wrap">{selectedValidation.technologies}</div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <div className="font-medium text-sm text-gray-700">Besoins matériels :</div>
                      <div className="text-sm whitespace-pre-wrap">{selectedValidation.besoins_materiels}</div>
                    </div>
                  </div>
                </div>
              )}

              {selectedValidation.status !== 'accepted' && (
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className="font-medium text-gray-800 mb-2">📋 Intitulé</div>
                  <div className="text-sm">{selectedValidation.intitule}</div>
                </div>
              )}

              {selectedValidation.status === 'accepted' ? (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-sm text-green-800 italic">
                    Nous vous souhaitons plein succès dans la réalisation de votre projet et restons à votre disposition pour tout accompagnement nécessaire.
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="font-medium text-yellow-800">💡 Prochaines Étapes :</div>
                  <div className="text-sm text-yellow-700 mt-1">
                    Ce n'est qu'une étape. Reste actif sur la plateforme de nouvelles opportunités sont à venir très prochainement !
                  </div>
                </div>
              )}

              <div className="text-center text-xs text-gray-500 pt-4 border-t">
                <p>Cordialement,<br/>La Commission Pédagogique des Projets de Fin d'Études</p>
              </div>
            </div>
            <DialogFooter className="bg-muted px-6 py-4">
              <div className="w-full flex justify-center">
              <Button className="cursor-pointer" onClick={() => setIsValidationDialogOpen(false)} variant="outline">
                Fermer
              </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
  };

  const EmailDialog = () => {
  return (
    <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
      <DialogContent className="sm:max-w-[600px] p-0 max-h-[90vh] overflow-y-auto">
        {isLoadingEmailAutomation ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <LoadingSpinner />
          </div>
        ) : !selectedEmailAutomation ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Aucune donnée disponible</p>
          </div>
        ) : (
          <>
            <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-slate-800 to-slate-700">
            <DialogTitle className="text-xl flex items-center justify-center gap-2 text-white">
            📧 
            <span className="line-clamp-2">
            {selectedEmailAutomation.email_objet}
            </span>
            </DialogTitle>
            </DialogHeader>
            <div className="px-6 py-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="bg-white p-4 rounded border">
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {selectedEmailAutomation.email_contenu}
                  </div>
                </div>
              </div>
              <div className="text-center text-xs text-gray-500 pt-4 border-t">
                <p>Message envoyé par l'administration</p>
              </div>
            </div>
            <DialogFooter className="bg-muted px-6 py-4">
              <div className="w-full flex justify-center">
                <Button 
                  className="cursor-pointer" 
                  onClick={() => setIsEmailDialogOpen(false)} 
                  variant="outline"
                >
                  Fermer
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
  };

  const UserSelectorDialog = () => {
    if (!user) return null

    return (
      <UserSelector
        isOpen={isUserSelectorOpen}
        onClose={() => setIsUserSelectorOpen(false)}
        onSelect={handleUserSelection}
        role={currentUserSelectorRole}
        title={currentUserSelectorTitle}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="text-center space-y-2 mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Notifications</h1>
        <p className="text-muted-foreground">Gérez et consultez toutes vos notifications ici.</p>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 px-6 bg-gray-50 rounded-lg">
          <Bell className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Aucune notification</h3>
          <p className="mt-1 text-sm text-gray-500">Vous n'avez pas de nouvelles notifications.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className="hover:shadow-md transition-shadow cursor-pointer border border-gray-200 overflow-hidden"
              onClick={() => handleNotificationClick(notification)}
            >
              <CardContent className="p-4 sm:p-5 flex items-start gap-4">
                <div className="text-2xl sm:text-3xl mt-1 flex-shrink-0">
                  {renderNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                    <p className="font-semibold text-gray-800 text-base sm:text-lg line-clamp-1">
                      {notification.title || "Notification"}
                    </p>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(notification.created_at)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {notification.message || notification.formatted_message || "Aucun détail disponible"}
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">De: {notification.sender?.name || "Système"}</span>
                    {notification.status && notification.status !== "new" && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          notification.status === "accepted"
                            ? "bg-green-100 text-green-800"
                            : notification.status === "declined"
                              ? "bg-red-100 text-red-800"
                              : notification.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {notification.status}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {/* Dialogs */}
      <NotificationDetailsDialog />
      <CreateNotificationDialog />
      <ConfirmationDialog />
      <ValidationDialog />
      <EmailDialog />
      <UserSelectorDialog />
    </div>
  )
}

export default NotificationsPage
