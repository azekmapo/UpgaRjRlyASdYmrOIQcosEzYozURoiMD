"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Loader2, Save, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import apiService from "@/services/api";
import type { Role, BaremeFormData } from "@/types/NotationTypes";
import { z } from "zod";
import { VALIDATION_RULES } from "@/constants/validationRules";
import { safeToFixed, safeSum } from "@/utils/numberUtils";

// Zod schemas
const baseSchema = z.object({
  note_application: z.number().min(0).max(20),
  note_expose_oral: z.number().min(0).max(20),
  note_reponses_questions: z.number().min(0).max(20),
});

const encadrantSchema = baseSchema.extend({
  note_assiduite: z.number().min(0).max(20),
  note_manucrit: z.number().optional(),
});

const jurySchema = baseSchema.extend({
  note_manucrit: z.number().min(0).max(20),
  note_assiduite: z.number().optional(),
});

const createValidationSchema = (role: Role) => {
  const schema = role === "encadrant" ? encadrantSchema : jurySchema;
  return schema.refine(
    (data) => {
      const total =
        role === "encadrant"
          ? data.note_application +
            data.note_expose_oral +
            data.note_reponses_questions +
            (data.note_assiduite || 0)
          : data.note_application +
            data.note_expose_oral +
            data.note_reponses_questions +
            (data.note_manucrit || 0);
      return total === 20;
    },
    {
      message: "La somme des notes doit être égale à 20",
      path: ["total"],
    }
  );
};

export default function BaremeAdmin() {
  const [role, setRole] = useState<Role>("encadrant");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const form = useForm<BaremeFormData>({
    resolver: zodResolver(createValidationSchema(role)),
    defaultValues: {
      note_application: 0,
      note_expose_oral: 0,
      note_reponses_questions: 0,
      note_assiduite: 0,
      note_manucrit: 0,
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = form;

  const watchedValues = watch();

  // Calculate current total with proper number validation
  const currentTotal =
    role === "encadrant"
      ? safeSum(
          watchedValues.note_application,
          watchedValues.note_expose_oral,
          watchedValues.note_reponses_questions,
          watchedValues.note_assiduite
        )
      : safeSum(
          watchedValues.note_application,
          watchedValues.note_expose_oral,
          watchedValues.note_reponses_questions,
          watchedValues.note_manucrit
        );

  // Load data when role changes
  useEffect(() => {
    const loadBaremeData = async () => {
      setIsLoadingData(true);
      try {
        const response = await apiService.notation.getBaremeByRole(role);
        if (response.success && response.data) {
          const bareme = response.data;
          setValue("note_application", bareme.note_application);
          setValue("note_expose_oral", bareme.note_expose_oral);
          setValue("note_reponses_questions", bareme.note_reponses_questions);
          if (role === "encadrant" && bareme.note_assiduite !== undefined) {
            setValue("note_assiduite", bareme.note_assiduite);
            setValue("note_manucrit", 0);
          } else if (role === "jury" && bareme.note_manucrit !== undefined) {
            setValue("note_manucrit", bareme.note_manucrit);
            setValue("note_assiduite", 0);
          }
        } else {
          // No existing bareme, set defaults
          setValue("note_application", 0);
          setValue("note_expose_oral", 0);
          setValue("note_reponses_questions", 0);
          if (role === "encadrant") {
            setValue("note_assiduite", 0);
            setValue("note_manucrit", 0);
          } else {
            setValue("note_manucrit", 0);
            setValue("note_assiduite", 0);
          }
        }
      } catch (error) {
        console.error("Error loading bareme data:", error);
        toast.error("Erreur lors du chargement des données");
      } finally {
        setIsLoadingData(false);
      }
    };

    loadBaremeData();
  }, [role, setValue]);

  const onSubmit = async (data: BaremeFormData) => {
    setIsLoading(true);
    try {
      const baremeData = {
        type_bareme: role,
        note_application: data.note_application,
        note_expose_oral: data.note_expose_oral,
        note_reponses_questions: data.note_reponses_questions,
        ...(role === "encadrant" && { note_assiduite: data.note_assiduite }),
        ...(role === "jury" && { note_manucrit: data.note_manucrit }),
      };

      const response = await apiService.notation.saveBareme(baremeData);

      if (response.success) {
        toast.success("Le barème a été enregistré avec succès !");
      } else {
        toast.error(response.message || "Erreur lors de l'enregistrement");
      }
    } catch (error: any) {
      console.error("Error saving bareme:", error);
      if (error.response?.data?.errors) {
        const errorMessages = Object.values(
          error.response.data.errors
        ).flat() as string[];
        toast.error(errorMessages.join(", "));
      } else {
        toast.error(
          error.response?.data?.message || "Erreur lors de l'enregistrement"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
  };

  if (isLoadingData) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Gestion du Barème d'Évaluation des PFE
          </h1>
          <p className="text-muted-foreground">
            Définissez et ajustez le barème des critères d'évaluation pour les
            Projets de Fin d'Études
          </p>
        </div>

        {/* Main Card */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl sm:text-2xl text-center text-slate-700">
              Configuration du Barème
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 sm:space-y-8">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6 sm:space-y-8"
            >
              {/* Role Selection */}
              <div className="space-y-2">
                <Label
                  htmlFor="role"
                  className="text-sm font-semibold text-gray-700"
                >
                  Sélectionnez le rôle
                </Label>
                <Select value={role} onValueChange={handleRoleChange}>
                  <SelectTrigger className="w-full h-12 bg-blue-50 border-2 border-blue-200 focus:border-blue-500 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="encadrant">Encadrant</SelectItem>
                    <SelectItem value="jury">Président/examinateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Form Fields Grid */}
              <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                {/* Application */}
                <div className="space-y-2">
                  <Label
                    htmlFor="note_application"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Application
                  </Label>
                  <Input
                    id="note_application"
                    type="number"
                    step={VALIDATION_RULES.STEP.toString()}
                    min={VALIDATION_RULES.MIN_NOTE.toString()}
                    max={VALIDATION_RULES.MAX_NOTE.toString()}
                    placeholder="Barème pour l'application"
                    className="h-12 bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:bg-white transition-all"
                    {...register("note_application", { valueAsNumber: true })}
                  />
                  {errors.note_application && (
                    <p className="text-sm text-red-600">
                      {errors.note_application.message}
                    </p>
                  )}
                </div>

                {/* Exposé oral */}
                <div className="space-y-2">
                  <Label
                    htmlFor="note_expose_oral"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Exposé oral
                  </Label>
                  <Input
                    id="note_expose_oral"
                    type="number"
                    step={VALIDATION_RULES.STEP.toString()}
                    min={VALIDATION_RULES.MIN_NOTE.toString()}
                    max={VALIDATION_RULES.MAX_NOTE.toString()}
                    placeholder="Barème pour l'Exposé oral"
                    className="h-12 bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:bg-white transition-all"
                    {...register("note_expose_oral", { valueAsNumber: true })}
                  />
                  {errors.note_expose_oral && (
                    <p className="text-sm text-red-600">
                      {errors.note_expose_oral.message}
                    </p>
                  )}
                </div>

                {/* Réponses aux questions */}
                <div className="space-y-2">
                  <Label
                    htmlFor="note_reponses_questions"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Réponses aux questions
                  </Label>
                  <Input
                    id="note_reponses_questions"
                    type="number"
                    step={VALIDATION_RULES.STEP.toString()}
                    min={VALIDATION_RULES.MIN_NOTE.toString()}
                    max={VALIDATION_RULES.MAX_NOTE.toString()}
                    placeholder="Barème pour Réponses aux questions"
                    className="h-12 bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:bg-white transition-all"
                    {...register("note_reponses_questions", {
                      valueAsNumber: true,
                    })}
                  />
                  {errors.note_reponses_questions && (
                    <p className="text-sm text-red-600">
                      {errors.note_reponses_questions.message}
                    </p>
                  )}
                </div>

                {/* Role-specific field */}
                {role === "encadrant" ? (
                  <div className="space-y-2">
                    <Label
                      htmlFor="note_assiduite"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Assiduité
                    </Label>
                    <Input
                      id="note_assiduite"
                      type="number"
                      step={VALIDATION_RULES.STEP.toString()}
                      min={VALIDATION_RULES.MIN_NOTE.toString()}
                      max={VALIDATION_RULES.MAX_NOTE.toString()}
                      placeholder="Barème pour l'Assiduité"
                      className="h-12 bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:bg-white transition-all"
                      {...register("note_assiduite", { valueAsNumber: true })}
                    />
                    {errors.note_assiduite && (
                      <p className="text-sm text-red-600">
                        {errors.note_assiduite.message}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label
                      htmlFor="note_manucrit"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Note de manuscrit
                    </Label>
                    <Input
                      id="note_manucrit"
                      type="number"
                      step={VALIDATION_RULES.STEP.toString()}
                      min={VALIDATION_RULES.MIN_NOTE.toString()}
                      max={VALIDATION_RULES.MAX_NOTE.toString()}
                      placeholder="Barème pour la note de manuscrit"
                      className="h-12 bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:bg-white transition-all"
                      {...register("note_manucrit", { valueAsNumber: true })}
                    />
                    {errors.note_manucrit && (
                      <p className="text-sm text-red-600">
                        {errors.note_manucrit.message}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Total Display */}
              <Card
                className={`border-2 transition-colors ${
                  currentTotal === 20
                    ? "border-green-200 bg-green-50"
                    : currentTotal > 20
                    ? "border-red-200 bg-red-50"
                    : "border-orange-200 bg-orange-50"
                }`}
              >
                <CardContent className="pt-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">
                      Total actuel:
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xl sm:text-2xl font-bold ${
                          currentTotal === 20
                            ? "text-green-600"
                            : currentTotal > 20
                            ? "text-red-600"
                            : "text-orange-600"
                        }`}
                      >
                        {safeToFixed(currentTotal, 1)}
                      </span>
                      <span className="text-slate-500 font-medium text-lg">
                        /20
                      </span>
                    </div>
                  </div>
                  {!isNaN(currentTotal) && currentTotal !== 20 && (
                    <div className="mt-3 text-sm">
                      {currentTotal < 20 ? (
                        <div className="flex items-center gap-2 text-orange-600">
                          <AlertCircle className="h-4 w-4" />
                          <span>
                            Il reste {(20 - currentTotal).toFixed(1)} points à
                            répartir
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          <span>
                            Vous dépassez de {(currentTotal - 20).toFixed(1)}{" "}
                            points
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex justify-center pt-4">
                <Button
                  type="submit"
                  disabled={
                    isLoading || isNaN(currentTotal) || currentTotal !== 20
                  }
                  className="w-full sm:w-auto px-8 py-3 h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Enregistrer le barème
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">📋 Informations importantes :</p>
              <ul className="space-y-1 text-xs sm:text-sm">
                <li>
                  • La somme totale des notes doit être exactement égale à 20
                  points
                </li>
                <li>
                  • Les critères varient selon le rôle sélectionné (Encadrant vs
                  Jury)
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
