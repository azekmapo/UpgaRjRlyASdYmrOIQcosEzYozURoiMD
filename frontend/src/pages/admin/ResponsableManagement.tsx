import React, { useState, useEffect } from 'react';
import { Loader2, Users, UserCheck } from 'lucide-react';
import { responsableService } from '@/services/api';
import { fetchOptions } from '@/functions/fetchOptions';
import type { EnseignantBasic, UpdateResponsableRequest } from '@/types/responsables/responsables';
import type { OptionItem } from '@/types/options';
import ConfirmationDialog from "@/components/custom/confirmation-dialog";
import { toast } from "sonner";

const ResponsableManagement: React.FC = () => {
  const [enseignants, setEnseignants] = useState<EnseignantBasic[]>([]);
  const [options, setOptions] = useState<OptionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingChange, setPendingChange] = useState<{
    optionNom: string;
    enseignantId: string;
    enseignantNom: string;
    ancienResponsable: string | null;
  } | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [enseignantsResponse, optionsResponse] = await Promise.all([
        responsableService.getEnseignantsForResponsable(),
        fetchOptions()
      ]);
      
      if (enseignantsResponse.success && optionsResponse.success) {
        setEnseignants(enseignantsResponse.data.enseignants);
        setOptions(optionsResponse.options);
      } else {
        setEnseignants([]);
        setOptions([]);
        setError('Impossible de charger les données');
      }
    } catch (error) {
      setError('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getAvailableEnseignants = (): EnseignantBasic[] => {
    return enseignants
      .filter(ens => !ens.is_responsable)
      .sort((a, b) => a.nom.localeCompare(b.nom));
  };

  const handleResponsableChange = (optionNom: string, enseignantId: string) => {
    if (!enseignantId) return;

    const enseignant = enseignants.find(ens => ens.id === enseignantId);
    if (!enseignant) return;

    const option = options.find(opt => opt.option === optionNom);
    const ancienResponsable = option?.responsable?.name || null;
    
    setPendingChange({
      optionNom,
      enseignantId,
      enseignantNom: enseignant.nom,
      ancienResponsable
    });
    setShowConfirmDialog(true);
  };

  const handleConfirmChange = async () => {
    if (!pendingChange) return;
    setShowConfirmDialog(false);
    setIsLoading(true);
    try {
      const updateData: UpdateResponsableRequest = {
        option_nom: pendingChange.optionNom,
        enseignant_id: pendingChange.enseignantId
      };

      const response = await responsableService.updateResponsable(updateData);

      if (response.success) {
        await fetchData();
        toast.success(`${pendingChange.enseignantNom} est maintenant responsable de ${pendingChange.optionNom}`);
      } else {
        toast.error(response.message || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du responsable');
    } finally {
      setIsLoading(false);
      setPendingChange(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Chargement des données...</span>
        </div>
      </div>
    );
  }

  if (error || enseignants.length === 0 || options.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Aucune donnée trouvée'}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 cursor-pointer bg-slate-800 text-white rounded hover:bg-slate-900"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center justify-center gap-3">
            <Users className="h-8 w-8" />
            Gestion des Responsables d'Options
          </h1>
          <p className="text-slate-600">Assignez un responsable pour chaque option</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="grid md:grid-cols-2 gap-8">
            {options.sort((a, b) => a.option.localeCompare(b.option)).map((option) => {
              const availableEnseignants = getAvailableEnseignants();

              return (
                <div key={option.option} className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <UserCheck className="h-5 w-5 text-slate-800" />
                    <h3 className="text-lg font-semibold text-slate-800">
                      Option {option.option}
                    </h3>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Responsable actuel
                    </label>
                    <div className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-900 font-medium">
                      {option.responsable ? option.responsable.name : 'Aucun responsable assigné'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Assigner un nouveau responsable
                    </label>
                    <select
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-gray-900 font-medium focus:border-blue-500 focus:bg-white transition-all duration-200"
                      value=""
                      onChange={(e) => handleResponsableChange(option.option, e.target.value)}
                    >
                      <option value="">Sélectionner un enseignant</option>
                      {availableEnseignants.map((enseignant) => (
                        <option key={enseignant.id} value={enseignant.id}>
                          {enseignant.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <ConfirmationDialog
          isOpen={showConfirmDialog}
          onClose={() => setShowConfirmDialog(false)}
          onConfirme={handleConfirmChange}
          title="Confirmation d'assignation"
          message={
            pendingChange
              ? `Êtes-vous sûr de vouloir assigner ${pendingChange.enseignantNom} comme responsable de l'option ${pendingChange.optionNom} ?${
                  pendingChange.ancienResponsable
                    ? ` Cela remplacera ${pendingChange.ancienResponsable}.`
                    : ''
                }`
              : ''
          }
        />
      </div>
    </div>
  );
};

export default ResponsableManagement;