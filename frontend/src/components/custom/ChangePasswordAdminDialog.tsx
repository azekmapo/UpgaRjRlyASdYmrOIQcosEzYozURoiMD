import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { profileService } from '@/services/api';
import type { ChangePasswordProfileRequest } from '@/types/user-profiles/user-profiles';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const changePasswordSchema = z.object({
  oldPassword: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .nonempty('Le mot de passe actuel est obligatoire.'),
  newPassword: z.string()
    .min(8, 'Saisir au moins 8 caractères')
    .nonempty('Le nouveau mot de passe est obligatoire.'),
  confirmNewPassword: z.string()
    .min(8, 'Saisir au moins 8 caractères')
    .nonempty('La confirmation du nouveau mot de passe est obligatoire.'),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: 'Les mots de passe ne sont pas identiques',
  path: ['confirmNewPassword'],
}).refine(data => data.oldPassword !== data.newPassword, {
  message: 'Le nouveau mot de passe doit être différent de l\'ancien',
  path: ['newPassword'],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

interface ChangePasswordAdminDialogProps {
  children: React.ReactNode;
}

const ChangePasswordAdminDialog: React.FC<ChangePasswordAdminDialogProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [oldPasswordError, setOldPasswordError] = useState('');
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      setIsLoading(true);
      setOldPasswordError('');

      const requestData: ChangePasswordProfileRequest = {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
        confirmNewPassword: data.confirmNewPassword,
      };

      const response = await profileService.changePassword(requestData);

      if (response.success) {
        toast.success(response.message || 'Votre mot de passe est changé avec succès.');
        reset();
        setOpen(false);
      } else {
        toast.error('Une erreur s\'est produite');
      }
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'status' in error &&
        (error as { status: unknown }).status === 422 &&
        'response' in error &&
        typeof (error as { response: unknown }).response === 'object' &&
        (error as { response: { data?: { message?: string } } }).response?.data?.message
      ) {
        setOldPasswordError("Tu n'as pas entré le bon mot de passe actuel.");
      } else {
        toast.error("Une erreur s'est produite");
      }
    }
    finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      reset();
      setOldPasswordError('');
      setShowOldPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className='text-center'>Changement de mot de passe</DialogTitle>
          <DialogDescription className='text-center'>
            Modifiez votre mot de passe actuel en saisissant les informations ci-dessous.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="oldPassword" className="block text-sm font-semibold text-gray-700 mb-2">
              Mot de Passe Actuel
            </Label>
            <div className="relative">
              <Input
                type={showOldPassword ? "text" : "password"}
                id="oldPassword"
                {...register('oldPassword')}
                className="w-full px-4 py-3 pr-12 h-11 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-900 font-medium focus:bg-white transition-all duration-200"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                disabled={isLoading}
              >
                {showOldPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.oldPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.oldPassword.message}</p>
            )}
            {oldPasswordError && (
              <p className="text-red-500 text-sm mt-1">{oldPasswordError}</p>
            )}
          </div>

          <div>
            <Label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-2">
              Nouveau Mot de Passe
            </Label>
            <div className="relative">
              <Input
                type={showNewPassword ? "text" : "password"}
                id="newPassword"
                {...register('newPassword')}
                className="w-full px-4 py-3 pr-12 h-11 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-900 font-medium focus:bg-white transition-all duration-200"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                disabled={isLoading}
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="confirmNewPassword" className="block text-sm font-semibold text-gray-700 mb-2">
              Confirmer le Nouveau Mot de Passe
            </Label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmNewPassword"
                {...register('confirmNewPassword')}
                className="w-full px-4 py-3 pr-12 h-11 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-900 font-medium focus:bg-white transition-all duration-200"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.confirmNewPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmNewPassword.message}</p>
            )}
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 cursor-pointer bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg shadow-lg shadow-orange-200 hover:from-orange-600 hover:to-orange-700 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-300 transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Changement en cours...
                </div>
              ) : (
                <>
                  <span>🔐</span>
                  Changer mot de passe
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordAdminDialog;