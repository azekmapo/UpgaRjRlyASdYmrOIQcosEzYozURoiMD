import { useState, useEffect } from 'react';
import { Calendar, Loader2, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { z } from 'zod';
import { periodeService } from '@/services/api'; // Import the service
import type { Periode } from '@/types/calendrierTypes'; // Import your existing types

// Zod schema for validation
const periodeSchema = z.object({
  periodeId: z.string().min(1, "Veuillez sélectionner une période"),
  dateDebut: z.date({
    required_error: "La date de début est requise",
    invalid_type_error: "Date de début invalide"
  }),
  dateFin: z.date({
    required_error: "La date de fin est requise",
    invalid_type_error: "Date de fin invalide"
  })
}).refine((data) => data.dateDebut < data.dateFin, {
  message: "La date de début doit être antérieure à la date de fin",
  path: ["dateFin"]
});

type PeriodeFormData = z.infer<typeof periodeSchema>;

interface PeriodeAdminProps {
  periodes?: Periode[];
  onClose?: () => void;
  onPeriodeUpdated?: (updatedPeriode: Periode) => void; // Callback for when periode is updated
}

const PeriodeAdmin: React.FC<PeriodeAdminProps> = ({ 
  periodes = [], 
  onClose, 
  onPeriodeUpdated 
}) => {
  const [dateDebut, setDateDebut] = useState<Date | null>(null);
  const [dateFin, setDateFin] = useState<Date | null>(null);
  const [periodeId, setPeriodeId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Fonction pour vérifier si une période est passée ou en cours
  const isPeriodePassedOrCurrent = (periode: Periode): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    const periodeDebut = new Date(periode.date_debut);
    periodeDebut.setHours(0, 0, 0, 0);
    
    const periodeFin = new Date(periode.date_fin);
    periodeFin.setHours(0, 0, 0, 0);
    
    // Période passée ou en cours si la date d'aujourd'hui est >= date de début
    return today >= periodeDebut;
  };

  // Fonction pour obtenir les périodes disponibles (futures uniquement)
  const getAvailablePeriodes = () => {
    return periodes.filter(periode => !isPeriodePassedOrCurrent(periode));
  };

  // Initialiser avec la première période disponible
  useEffect(() => {
  const availablePeriodes = getAvailablePeriodes();
  if (availablePeriodes.length > 0 && !periodeId) {
    setPeriodeId(availablePeriodes[0].id.toString());
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  useEffect(() => {
  if (periodeId && periodes) {
    const selectedPeriode = periodes.find(p => p.id.toString() === periodeId);
    if (selectedPeriode) {
      setDateDebut(new Date(selectedPeriode.date_debut));
      setDateFin(new Date(selectedPeriode.date_fin));
      setValidationErrors({});
      setSuccessMessage('');
      setErrorMessage('');
    }
  }
}, [periodeId]);

  // Fonction pour vérifier si les dates sont valides
  const areDatesValid = (): boolean => {
    if (!dateDebut || !dateFin) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const debut = new Date(dateDebut);
    debut.setHours(0, 0, 0, 0);
    
    const fin = new Date(dateFin);
    fin.setHours(0, 0, 0, 0);
    
    // Vérifier que la date de début est future et que la date de fin est après la date de début
    return debut > today && fin > debut;
  };

  const validateForm = (): boolean => {
    try {
      const formData: PeriodeFormData = {
        periodeId,
        dateDebut: dateDebut!,
        dateFin: dateFin!
      };
      periodeSchema.parse(formData);
      setValidationErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          errors[path] = err.message;
        });
        setValidationErrors(errors);
        return false;
      }
      return false;
    }
  };

  const handlePlanification = async () => {
    if (!validateForm()) {
      setErrorMessage("Veuillez corriger les erreurs dans le formulaire.");
      setSuccessMessage('');
      toast.error("Veuillez corriger les erreurs dans le formulaire.");
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await periodeService.updatePeriode(parseInt(periodeId), {
        date_debut: dateDebut!.toISOString(),
        date_fin: dateFin!.toISOString()
      });

      if (response.success) {
  setSuccessMessage(response.message);
  toast.success(response.message || "Période planifiée avec succès !");
  
  // Call the callback if provided to update the parent component
  if (onPeriodeUpdated) {
    const updatedPeriode = periodes.find(p => p.id.toString() === periodeId);
    if (updatedPeriode) {
      onPeriodeUpdated({
        ...updatedPeriode,
        date_debut: dateDebut!.toISOString(),
        date_fin: dateFin!.toISOString()
      });
    }
  }
  
  // Don't close the dialog - stay on current period
  // Just clear the success message after 3 seconds
  setTimeout(() => {
    setSuccessMessage('');
  }, 3000);
} else {
        setErrorMessage(response.message || "Erreur lors de la mise à jour");
        toast.error(response.message || "Erreur lors de la mise à jour");
      }
    } catch (error: any) {
      console.error('Error updating periode:', error);
      const errorMsg = error.response?.data?.message || 
        error.message || 
        "Erreur lors de la mise à jour. Veuillez réessayer.";
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePeriodeChange = (value: string) => {
    // Vérifier si la période sélectionnée est disponible
    const selectedPeriode = periodes.find(p => p.id.toString() === value);
    if (selectedPeriode && !isPeriodePassedOrCurrent(selectedPeriode)) {
      setPeriodeId(value);
      setValidationErrors({});
      setSuccessMessage('');
      setErrorMessage('');
    }
  };

  const handleDateChange = (type: 'debut' | 'fin', value: string) => {
    const date = value ? new Date(value) : null;
    
    if (type === 'debut') {
      setDateDebut(date);
      if (validationErrors.dateDebut) {
        setValidationErrors(prev => ({ ...prev, dateDebut: '' }));
      }
    } else {
      setDateFin(date);
      if (validationErrors.dateFin) {
        setValidationErrors(prev => ({ ...prev, dateFin: '' }));
      }
    }
  };

  // Vérifier si le bouton doit être désactivé
  const isButtonDisabled = () => {
    return isLoading || !dateDebut || !dateFin || !periodeId || !areDatesValid();
  };

  return (
    <div className="p-6">
      {/* Success Message */}
      {successMessage && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {errorMessage && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Title */}
      <h2 className="text-xl sm:text-2xl font-semibold text-center text-slate-700 mb-6">
        Gestion des Périodes
      </h2>

      {/* Form Content */}
      <div className="space-y-6 sm:space-y-8">
        {/* Period Selection */}
        <div className="space-y-2">
          <Label htmlFor="periodeTitre" className="text-sm font-semibold text-gray-700">
            Titre de la période
          </Label>
          <Select value={periodeId} onValueChange={handlePeriodeChange}>
            <SelectTrigger className={`w-full h-12 bg-blue-50 border-2 transition-colors ${
              validationErrors.periodeId
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-blue-200 focus:border-blue-500'
            }`}>
              <SelectValue placeholder="Sélectionnez une période" />
            </SelectTrigger>
            <SelectContent>
              {Array.isArray(periodes) && periodes.length > 0 ? (
                periodes.map((periode) => {
                  const isPassedOrCurrent = isPeriodePassedOrCurrent(periode);
                  return (
                    <SelectItem 
                      key={periode.id} 
                      value={periode.id.toString()}
                      disabled={isPassedOrCurrent}
                      className={isPassedOrCurrent ? 'text-red-500 cursor-not-allowed' : ''}
                    >
                      <span className={isPassedOrCurrent ? 'text-red-500' : ''}>
                        {periode.titre}
                        {isPassedOrCurrent && ' (Passée/En cours)'}
                      </span>
                    </SelectItem>
                  );
                })
              ) : (
                <SelectItem value="none" disabled>
                  Aucune période disponible
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          {validationErrors.periodeId && (
            <p className="text-sm text-red-600 mt-1">{validationErrors.periodeId}</p>
          )}
        </div>

        {/* Date Selection Grid */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          {/* Start Date */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Date de début</Label>
            <div className="relative">
              <Input
                type="date"
                value={dateDebut ? dateDebut.toISOString().split('T')[0] : ''}
                onChange={(e) => handleDateChange('debut', e.target.value)}
                min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]} // Minimum tomorrow
                className={`w-full h-12 bg-gray-50 border-2 transition-all pl-10 ${
                  validationErrors.dateDebut
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-200 focus:border-blue-500 focus:bg-white'
                }`}
              />
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            {validationErrors.dateDebut && (
              <p className="text-sm text-red-600 mt-1">{validationErrors.dateDebut}</p>
            )}
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Date de fin</Label>
            <div className="relative">
              <Input
                type="date"
                value={dateFin ? dateFin.toISOString().split('T')[0] : ''}
                onChange={(e) => handleDateChange('fin', e.target.value)}
                min={dateDebut ? new Date(dateDebut.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined}
                className={`w-full h-12 bg-gray-50 border-2 transition-all pl-10 ${
                  validationErrors.dateFin
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-200 focus:border-blue-500 focus:bg-white'
                }`}
              />
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            {validationErrors.dateFin && (
              <p className="text-sm text-red-600 mt-1">{validationErrors.dateFin}</p>
            )}
          </div>
        </div>

        {/* Validation Message for Dates */}
        {dateDebut && dateFin && !areDatesValid() && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              La date de fin doit être postérieure à la date de début.
            </AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <div className="flex justify-center pt-4">
          <Button
            onClick={handlePlanification}
            disabled={isButtonDisabled()}
            className="w-full sm:w-auto px-8 py-3 h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Planification en cours...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Planifier la période
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PeriodeAdmin;