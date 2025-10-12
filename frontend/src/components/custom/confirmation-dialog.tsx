import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ConfirmationDialogProps } from '@/types/confirmation-dialog';

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
    isOpen = true,
    onClose,
    onConfirme,
    title = "Erreur",
    message = "Une erreur s'est produite. Veuillez réessayer."
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
            <DialogContent className="bg-white border border-gray-300 rounded-lg w-full max-w-md p-6">
                <DialogHeader className="text-center space-y-2">
                    <DialogTitle className="text-lg font-semibold text-gray-900 text-center">
                        {title}
                    </DialogTitle>
                    <p className="text-sm text-gray-600 text-center">
                        {message}
                    </p>
                </DialogHeader>
                <div className="flex justify-center gap-3 mt-6">
                    <button
                        onClick={onConfirme}
                        className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-white hover:text-orange-500 border border-orange-500 cursor-pointer"
                    >
                        Confirmer
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-white hover:text-orange-500 border border-orange-500 cursor-pointer"
                    >
                        Annuler
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ConfirmationDialog;