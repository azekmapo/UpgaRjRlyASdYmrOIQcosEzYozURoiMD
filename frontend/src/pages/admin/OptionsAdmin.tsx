import React, { useState, useEffect } from "react";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { optionService } from "@/services/optionsService";
import type { Option } from "@/types/options";

const OptionManagement: React.FC = () => {
  const [options, setOptions] = useState<Option[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [formData, setFormData] = useState({ nom: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch options from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await optionService.getOptions();
        if (response.success) {
          setOptions(response.options);
        }
      } catch (error) {
        toast.error("Erreur lors du chargement des options");
        console.error("Error fetching options:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAdd = () => {
    setFormData({ nom: "" });
    setShowAddDialog(true);
  };

  const handleEdit = (option: Option) => {
    setSelectedOption(option);
    setFormData({ nom: option.option });
    setShowEditDialog(true);
  };

  const handleDelete = (option: Option) => {
    setSelectedOption(option);
    setShowDeleteDialog(true);
  };

  const confirmAdd = async () => {
    if (!formData.nom.trim()) {
      toast.error("Le nom de l'option est requis");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await optionService.createOption({
        nom: formData.nom.trim(),
      });

      if (response.success) {
        setOptions([...options, response.data]);
        setShowAddDialog(false);
        toast.success(`Option ${response.data.option} ajoutée avec succès`);
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Erreur lors de l'ajout de l'option"
      );
      console.error("Error adding option:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmEdit = async () => {
    if (!formData.nom.trim() || !selectedOption) {
      toast.error("Le nom de l'option est requis");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await optionService.updateOption(selectedOption.id, {
        nom: formData.nom.trim(),
      });

      if (response.success) {
        setOptions(
          options.map((opt) =>
            opt.id === selectedOption.id ? response.data : opt
          )
        );
        setShowEditDialog(false);
        setSelectedOption(null);
        toast.success(`Option ${response.data.option} modifiée avec succès`);
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Erreur lors de la modification de l'option"
      );
      console.error("Error updating option:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedOption) return;

    try {
      setIsSubmitting(true);
      const response = await optionService.deleteOption(selectedOption.id);

      if (response.success) {
        setOptions(options.filter((opt) => opt.id !== selectedOption.id));
        setShowDeleteDialog(false);
        toast.success(`Option ${selectedOption.option} supprimée avec succès`);
        setSelectedOption(null);
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Erreur lors de la suppression de l'option"
      );
      console.error("Error deleting option:", error);
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Gestion des Options
          </h1>
          <p className="text-muted-foreground">
            Définissez et gérez les différentes spécialités du master
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-slate-800">
              Options disponibles
            </h2>
            <button
              onClick={handleAdd}
              className="inline-flex items-center cursor-pointer gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg shadow-lg shadow-orange-200 hover:from-orange-600 hover:to-orange-700 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-300 transition-all duration-200"
            >
              <Plus className="h-5 w-5" />
              Ajouter une option
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {options
              .sort((a, b) => a.option.localeCompare(b.option))
              .map((option) => (
                <div
                  key={option.id}
                  className="border-2 border-gray-200 rounded-lg p-6 hover:border-slate-300 transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-1">
                        Option {option.option}
                      </h3>
                      {option.responsable && (
                        <p className="text-sm text-gray-600">
                          Responsable: {option.responsable.name}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(option)}
                        className="p-2 text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
                        title="Modifier"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(option)}
                        className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {options.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Aucune option disponible. Cliquez sur "Ajouter une option" pour
              commencer.
            </div>
          )}
        </div>

        {/* Add Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une option</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom de l'option *
                </label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ nom: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                  placeholder="Ex: GL, IA, SIC..."
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <DialogFooter>
              <button
                onClick={() => setShowAddDialog(false)}
                className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                onClick={confirmAdd}
                disabled={isSubmitting}
                className="inline-flex items-center cursor-pointer gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg shadow-lg shadow-orange-200 hover:from-orange-600 hover:to-orange-700 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Ajout...
                  </>
                ) : (
                  "Ajouter"
                )}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier l'option</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom de l'option *
                </label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ nom: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <DialogFooter>
              <button
                onClick={() => setShowEditDialog(false)}
                className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                onClick={confirmEdit}
                disabled={isSubmitting}
                className="inline-flex items-center cursor-pointer gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg shadow-lg shadow-orange-200 hover:from-orange-600 hover:to-orange-700 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Modification...
                  </>
                ) : (
                  "Modifier"
                )}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmer la suppression</DialogTitle>
            </DialogHeader>

            <p className="text-gray-600 py-4">
              Êtes-vous sûr de vouloir supprimer l'option{" "}
              <strong>{selectedOption?.option}</strong> ? Cette action est
              irréversible.
            </p>

            <DialogFooter>
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                disabled={isSubmitting}
                className="inline-flex items-center cursor-pointer gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg shadow-lg shadow-red-200 hover:from-red-600 hover:to-red-700 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-red-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  "Supprimer"
                )}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default OptionManagement;
