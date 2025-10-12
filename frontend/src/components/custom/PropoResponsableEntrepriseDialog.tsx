import React, { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import ConfirmationDialog from "@/components/custom/confirmation-dialog";
import { validationPropositionsService } from '@/services/api';
import type { PropositionEntreprise } from '@/types/validation-proposals/validation-proposals';

interface RemarquesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (remarks: string) => void;
}

const RemarquesModal: React.FC<RemarquesModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [remarks, setRemarks] = useState('');

  const handleSubmit = () => {
    if (remarks.trim()) {
      onSubmit(remarks.trim());
      setRemarks('');
      onClose();
    }
  };

  const handleClose = () => {
    setRemarks('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center">Ajouter des remarques</DialogTitle>
          <DialogDescription className="text-center">
            Veuillez saisir vos remarques concernant cette proposition.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="remarks">Remarques</Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Entrez vos remarques..."
              className="min-h-[120px] max-h-[200px] overflow-y-auto"
            />
          </div>
        </div>
        <DialogFooter className="flex justify-center gap-2">
          <Button
            onClick={handleSubmit}
            disabled={!remarks.trim()}
            className="bg-gradient-to-r cursor-pointer from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
          >
            Valider
          </Button>
          <Button variant="outline" onClick={handleClose} className='cursor-pointer'>
            Annuler
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface PropoResponsableEntrepriseDialogProps {
  proposition: PropositionEntreprise;
  isOpen: boolean;
  onClose: () => void;
  onActionCompleted: () => void;
}

const PropoResponsableEntrepriseDialog: React.FC<PropoResponsableEntrepriseDialogProps> = ({
  proposition,
  isOpen,
  onClose,
  onActionCompleted
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [remarkText, setRemarkText] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState<string | null>(null);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [loadingStates, setLoadingStates] = useState({
    accept: false,
    decline: false,
    acceptWithRemarks: false
  });

  const setLoadingState = (action: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [action]: loading }));
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmitRemarks = (remarks: string) => {
    setRemarkText(remarks);
    setIsModalOpen(false);
    handleActionClick('acceptWithRemarks');
  };

  const handleAccept = async () => {
    if (!proposition) return;

    setLoadingState('accept', true);
    try {
      await validationPropositionsService.acceptPropositionEntreprise(
        proposition.id,
        proposition.entreprise_id
      );

      toast.success('Proposition acceptée avec succès');
      onActionCompleted();
      onClose();
    } catch (error) {
      toast.error('Erreur lors de l\'acceptation de la proposition');
    } finally {
      setLoadingState('accept', false);
    }
  };

  const handleDecline = async () => {
    if (!proposition) return;

    setLoadingState('decline', true);

    try {
      await validationPropositionsService.declinePropositionEntreprise(
        proposition.id,
        proposition.entreprise_id
      );

      toast.success('Proposition refusée avec succès');
      onActionCompleted();
      onClose();
    } catch (error) {
      toast.error('Erreur lors du refus de la proposition');
    } finally {
      setLoadingState('decline', false);
    }
  };

  const handleAcceptWithRemarks = async () => {
    if (!proposition) return;

    setLoadingState('acceptWithRemarks', true);

    try {
      await validationPropositionsService.acceptPropositionEntreprise(
        proposition.id,
        proposition.entreprise_id,
        remarkText
      );

      toast.success('Proposition acceptée avec remarques avec succès');
      onActionCompleted();
      onClose();
    } catch (error) {
      toast.error('Erreur lors de l\'acceptation avec remarques');
    } finally {
      setLoadingState('acceptWithRemarks', false);
    }
  };

  const handleActionClick = (action: string) => {
    const messages = {
      accept: "Êtes-vous sûr de vouloir accepter cette proposition ?",
      decline: "Êtes-vous sûr de vouloir refuser cette proposition ?",
      acceptWithRemarks: "Êtes-vous sûr de vouloir accepter cette proposition avec des remarques ?"
    };

    setConfirmationMessage(messages[action as keyof typeof messages]);
    setConfirmationAction(action);
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    switch (confirmationAction) {
      case 'accept':
        handleAccept();
        break;
      case 'decline':
        handleDecline();
        break;
      case 'acceptWithRemarks':
        handleAcceptWithRemarks();
        break;
    }
    setShowConfirmation(false);
  };

  const isAnyLoading = Object.values(loadingStates).some(loading => loading);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold">Proposition de PFE - Entreprise</DialogTitle>
            <DialogDescription className="text-center">
              En tant que responsable de la matière, votre rôle est de consulter et de valider les propositions de projets de fin d'études.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
              <div className="md:col-span-4">
                <label htmlFor="entreprise" className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom
                </label>
                <input
                  type="text"
                  id="entreprise"
                  value={proposition.entreprise?.name || 'Nom entreprise non disponible'}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-900 font-medium focus:bg-white transition-all duration-200"
                  readOnly
                />
              </div>
              <div className="md:col-span-4">
                <label htmlFor="denomination" className="block text-sm font-semibold text-gray-700 mb-2">
                  Dénomination
                </label>
                <input
                  type="text"
                  id="denomination"
                  value={proposition.entreprise?.entreprise?.denomination || 'Denomination non disponible'}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-900 font-medium focus:bg-white transition-all duration-200"
                  readOnly
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="option" className="block text-sm font-semibold text-gray-700 mb-2">
                  L'option
                </label>
                <input
                  type="text"
                  id="option"
                  value={proposition.option || 'Non défini'}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-900 font-medium focus:bg-white transition-all duration-200"
                  readOnly
                />
              </div>
            

            <div>
              <label htmlFor="intitule" className="block text-sm font-semibold text-gray-700 mb-2">
                L'intitulé du projet
              </label>
              <input
                type="text"
                id="intitule"
                value={proposition.intitule || 'Titre du projet non disponible'}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-900 font-medium focus:bg-white transition-all duration-200"
                readOnly
              />
            </div>

            <div>
              <label htmlFor="technologies" className="block text-sm font-semibold text-gray-700 mb-2">
                Technologies utilisées
              </label>
              <textarea
                id="technologies"
                rows={5}
                value={proposition.technologies_utilisees || 'Technologies non disponibles'}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-900 font-medium focus:bg-white transition-all duration-200 resize-vertical"
                readOnly
              />
            </div>

            <div>
              <label htmlFor="resume" className="block text-sm font-semibold text-gray-700 mb-2">
                Résumé / Introduction du projet
              </label>
              <textarea
                id="resume"
                rows={5}
                value={proposition.resume || 'Résumé non disponible'}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-900 font-medium focus:bg-white transition-all duration-200 resize-vertical"
                readOnly
              />
            </div>

            {proposition.status === 'accepted' && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium text-center">Cette proposition a été acceptée.</p>
              </div>
            )}

            {proposition.status === 'declined' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-medium text-center">Cette proposition a été refusée.</p>
              </div>
            )}
          </div>

          {proposition.status === 'pending' && (
           <div className="flex flex-col sm:flex-row gap-2 pt-6 justify-center">
              <button
                type="button"
                onClick={() => handleActionClick('accept')}
                disabled={isAnyLoading}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 cursor-pointer bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg shadow-lg shadow-green-200 hover:from-green-600 hover:to-green-700 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-green-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingStates.accept ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    traite...
                  </div>
                ) : (
                  <>
                    Accepter
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleOpenModal}
                disabled={isAnyLoading}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 md:py-0 md:text-[13px] cursor-pointer bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg shadow-lg shadow-orange-200 hover:from-orange-600 hover:to-orange-700 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingStates.acceptWithRemarks ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    traite...
                  </div>
                ) : (
                  <>
                    Accepter avec remarques
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleActionClick('decline')}
                disabled={isAnyLoading}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 cursor-pointer bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg shadow-lg shadow-red-200 hover:from-red-600 hover:to-red-700 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-red-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingStates.decline ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    traite...
                  </div>
                ) : (
                  <>
                    Refuser
                  </>
                )}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <RemarquesModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitRemarks}
      />

      <ConfirmationDialog
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirme={handleConfirm}
        title="Confirmation"
        message={confirmationMessage}
      />
    </>
  );
};

export default PropoResponsableEntrepriseDialog;