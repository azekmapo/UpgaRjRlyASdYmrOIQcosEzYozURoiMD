"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { Loader2, Camera, User, CropIcon, Check, X } from "lucide-react"
import LoadingSpinner from "@/components/loading-spinner"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { profileService } from "@/services/api"
import type { EtudiantProfile } from "@/types/global/etudiant"
import ChangePasswordEtudiantDialog from "@/components/custom/ChangePasswordEtudiantDialog"
import ReactCrop, { type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const MIN_CROP_SIZE = 100

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  const minWidthPercent = Math.max((MIN_CROP_SIZE / mediaWidth) * 100, 20)
  const maxWidthPercent = Math.min(80, minWidthPercent + 50)

  const initialWidth = Math.max(minWidthPercent, Math.min(maxWidthPercent, 50))

  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: initialWidth,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

function validateCropSize(crop: PixelCrop, imageWidth: number, imageHeight: number): boolean {
  return crop.width >= MIN_CROP_SIZE && crop.height >= MIN_CROP_SIZE
}

async function getCroppedImg(image: HTMLImageElement, crop: PixelCrop, fileName: string): Promise<Blob> {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    throw new Error("No 2d context")
  }

  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height

  canvas.width = crop.width
  canvas.height = crop.height

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height,
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"))
          return
        }
        resolve(blob)
      },
      "image/jpeg",
      0.9,
    )
  })
}

const ProfilEtudiant: React.FC = () => {
  const [profileData, setProfileData] = useState<EtudiantProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUploadingPicture, setIsUploadingPicture] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [showCropDialog, setShowCropDialog] = useState(false)
  const [crop, setCrop] = useState<any>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [croppedImageBlob, setCroppedImageBlob] = useState<Blob | null>(null)
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null)
  const [cropError, setCropError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const { user, refreshUser } = useAuth()

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await profileService.getProfileEtudiant()

      if (response.success) {
        setProfileData(response.data)
      } else {
        setProfileData(null)
        setError("Impossible de charger le profil")
      }
    } catch (error) {
      setError("Erreur de connexion")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Veuillez sélectionner une image valide")
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("La taille de l'image ne doit pas dépasser 5MB")
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string)
        setSelectedFile(file)
        setShowCropDialog(true)
        setCropError(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    const initialCrop = centerAspectCrop(width, height, 1)
    setCrop(initialCrop)
    setCropError(null)
  }, [])

  const onCropChange = useCallback(
    (crop: any, percentCrop: any) => {
      setCrop(percentCrop)

      if (cropError) {
        setCropError(null)
      }
    },
    [cropError],
  )

  const onCropComplete = useCallback((c: PixelCrop) => {
    if (!imgRef.current) return

    const imageWidth = imgRef.current.width
    const imageHeight = imgRef.current.height

    if (!validateCropSize(c, imageWidth, imageHeight)) {
      setCropError(`La zone de recadrage est trop petite. Taille minimale : ${MIN_CROP_SIZE}x${MIN_CROP_SIZE} pixels`)
      setCompletedCrop(undefined)
      return
    }

    setCropError(null)
    setCompletedCrop(c)
  }, [])

  const handleCropComplete = async () => {
    if (!completedCrop || !imgRef.current) {
      toast.error("Veuillez sélectionner une zone de recadrage valide")
      return
    }

    if (!validateCropSize(completedCrop, imgRef.current.width, imgRef.current.height)) {
      toast.error(`La zone de recadrage est trop petite. Taille minimale : ${MIN_CROP_SIZE}x${MIN_CROP_SIZE} pixels`)
      return
    }

    try {
      const croppedBlob = await getCroppedImg(imgRef.current, completedCrop, selectedFile?.name || "cropped-image.jpg")

      setCroppedImageBlob(croppedBlob)

      const croppedUrl = URL.createObjectURL(croppedBlob)
      setCroppedImageUrl(croppedUrl)

      setShowCropDialog(false)
      setShowPreviewDialog(true)
    } catch (error) {
      toast.error("Erreur lors du recadrage de l'image")
    }
  }

  const handleConfirmUpload = async () => {
    if (!croppedImageBlob) return

    setShowPreviewDialog(false)
    setIsUploadingPicture(true)

    try {
      const croppedFile = new File([croppedImageBlob], selectedFile?.name || "profile-picture.jpg", {
        type: "image/jpeg",
      })

      const response = await profileService.uploadProfilePicture(croppedFile)

      if (response.success) {
        console.log('[Upload] Before refresh, current URL:', user?.profile_picture)
        await refreshUser()
        console.log('[Upload] After refresh, new URL:', user?.profile_picture)
        toast.success("Photo de profil mise à jour avec succès!")
      } else {
        throw new Error(response.message || "Erreur lors de l'upload")
      }
    } catch (error: any) {
      if (error.response?.status === 422) {
        const errors = error.response.data.errors
        if (errors?.profile_picture) {
          toast.error(errors.profile_picture[0])
        } else {
          toast.error(error.response.data.message || "Erreur de validation")
        }
      } else {
        toast.error(error.message || "Erreur lors de la mise à jour de la photo de profil")
      }
    } finally {
      setIsUploadingPicture(false)
      resetImageStates()
    }
  }

  const resetImageStates = () => {
    setPreviewImage(null)
    setSelectedFile(null)
    setCroppedImageBlob(null)
    if (croppedImageUrl) {
      URL.revokeObjectURL(croppedImageUrl)
    }
    setCroppedImageUrl(null)
    setCrop(undefined)
    setCompletedCrop(undefined)
    setCropError(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleCancelCrop = () => {
    setShowCropDialog(false)
    resetImageStates()
  }

  const handleCancelUpload = () => {
    setShowPreviewDialog(false)
    resetImageStates()
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  useEffect(() => {
    return () => {
      if (croppedImageUrl) {
        URL.revokeObjectURL(croppedImageUrl)
      }
    }
  }, [croppedImageUrl])

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error || !profileData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Aucune donnée trouvée"}</p>
          <button
            onClick={fetchProfile}
            className="px-4 py-2 cursor-pointer bg-slate-800 text-white rounded hover:bg-slate-800"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  const content = (
    <div className="p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center space-y-2 mb-8 md:mb-12">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Informations du profil</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Consultez et gérez vos informations personnelles et académiques
          </p>
        </div>

        <div className="md:bg-white md:rounded-xl md:shadow-lg md:border md:border-gray-200 md:p-8">
          {/* Profile Picture Section */}
          <div className="flex justify-center mb-6 md:mb-8">
            <div className="relative">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden bg-gradient-to-br from-orange-100 to-orange-200 border-4 border-white shadow-lg">
                {user?.profile_picture ? (
                  <img
                    key={user.profile_picture}
                    src={user.profile_picture || "/placeholder.svg"}
                    alt="Photo de profil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-14 h-14 md:w-16 md:h-16 text-orange-400" />
                  </div>
                )}
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPicture}
                className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full shadow-lg hover:from-orange-600 hover:to-orange-700 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 flex items-center justify-center disabled:opacity-50"
              >
                {isUploadingPicture ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg,image/gif"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="text-center mb-6">
            <p className="text-sm text-gray-600">
              Cliquez sur l'icône de l'appareil photo pour {user?.profile_picture ? "changer" : "ajouter"} votre photo
              de profil
            </p>
            <p className="text-xs text-gray-500 mt-1">Formats acceptés: JPEG, PNG, JPG, GIF • Taille max: 5MB</p>
          </div>

          <form className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-2 gap-3 md:gap-6">
              <div>
                <label htmlFor="nom" className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">
                  Nom
                </label>
                <input
                  type="text"
                  id="nom"
                  value={profileData.nom}
                  className="w-full px-3 py-2 md:px-4 md:py-3 text-sm md:text-base bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-900 font-medium focus:bg-white transition-all duration-200"
                  readOnly
                />
              </div>
              <div>
                <label htmlFor="role" className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">
                  Role
                </label>
                <input
                  type="text"
                  id="role"
                  value={profileData.role}
                  className="w-full px-3 py-2 md:px-4 md:py-3 text-sm md:text-base bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-900 font-medium focus:bg-white transition-all duration-200"
                  readOnly
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-6">
              <div>
                <label htmlFor="option" className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">
                  Option
                </label>
                <input
                  type="text"
                  id="option"
                  value={profileData.option}
                  className="w-full px-3 py-2 md:px-4 md:py-3 text-sm md:text-base bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-900 font-medium focus:bg-white transition-all duration-200"
                  readOnly
                />
              </div>
              <div>
                <label htmlFor="moyenne" className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">
                  Moyenne du Master 1
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="moyenne"
                    value={profileData.moyenne}
                    className="w-full px-3 py-2 md:px-4 md:py-3 text-sm md:text-base bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-900 font-medium focus:bg-white transition-all duration-200"
                    readOnly
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <span className="text-gray-900 font-bold">/20</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">
                Adresse e-mail
              </label>
              <input
                type="email"
                id="email"
                value={profileData.email}
                className="w-full px-3 py-2 md:px-4 md:py-3 text-sm md:text-base bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-900 font-medium focus:bg-white transition-all duration-200"
                readOnly
              />
            </div>
          </form>

          <div className="mt-6 md:mt-8 text-center">
            <ChangePasswordEtudiantDialog>
              <button className="inline-flex items-center cursor-pointer gap-2 px-5 py-2.5 md:px-6 md:py-3 text-sm md:text-base bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg shadow-lg shadow-orange-200 hover:from-orange-600 hover:to-orange-700 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-300 transition-all duration-200">
                Changer mon mot de passe
              </button>
            </ChangePasswordEtudiantDialog>
          </div>
        </div>
      </div>

      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CropIcon className="w-5 h-5" />
              Recadrer votre photo de profil
            </DialogTitle>
            <DialogDescription>
              Ajustez le cadre pour sélectionner la partie de l'image à utiliser comme photo de profil.
              <br />
              <span className="text-sm text-amber-600 font-medium">
                Taille minimale requise : {MIN_CROP_SIZE}x${MIN_CROP_SIZE} pixels
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center py-4 max-h-[60vh] overflow-auto">
            <div className="relative">
              {previewImage && (
                <ReactCrop
                  crop={crop}
                  onChange={onCropChange}
                  onComplete={onCropComplete}
                  aspect={1}
                  circularCrop
                  className="max-w-full max-h-[50vh]"
                  minWidth={MIN_CROP_SIZE}
                  minHeight={MIN_CROP_SIZE}
                >
                  <img
                    ref={imgRef}
                    alt="Crop me"
                    src={previewImage || "/placeholder.svg"}
                    onLoad={onImageLoad}
                    className="max-w-full max-h-[50vh] object-contain"
                  />
                </ReactCrop>
              )}
            </div>
          </div>

          {cropError && (
            <div className="text-center">
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{cropError}</p>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleCancelCrop} className="flex items-center gap-2 bg-transparent">
              <X className="w-4 h-4" />
              Annuler
            </Button>
            <Button
              onClick={handleCropComplete}
              disabled={!completedCrop || !!cropError}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Valider le recadrage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Aperçu de la photo de profil</DialogTitle>
            <DialogDescription>Voulez-vous utiliser cette image comme photo de profil ?</DialogDescription>
          </DialogHeader>

          <div className="flex justify-center py-4">
            <div className="w-48 h-48 rounded-full overflow-hidden bg-gradient-to-br from-orange-100 to-orange-200 border-4 border-white shadow-lg">
              {croppedImageUrl && (
                <img
                  src={croppedImageUrl || "/placeholder.svg"}
                  alt="Aperçu de la photo de profil"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleCancelUpload} disabled={isUploadingPicture}>
              Annuler
            </Button>
            <Button
              onClick={handleConfirmUpload}
              disabled={isUploadingPicture}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
              {isUploadingPicture ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Upload en cours...
                </>
              ) : (
                "Confirmer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )

  return <div>{content}</div>
}

export default ProfilEtudiant
