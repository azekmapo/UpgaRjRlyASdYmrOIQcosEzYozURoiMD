"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  activateSignature,
  deleteSignature,
  fetchSignatures,
  saveSignature,
} from "@/services/signature-service";
import LoadingSpinner from "@/components/loading-spinner";
import AnimatedSignature from "@/components/signature/AnimatedSignature";
import CreateSignatureDialog from "@/components/signature/CreateSignatureDialog";
import NoSignaturesFound from "@/components/signature/NoSignaturesFound";
import SignatureGallery from "@/components/signature/SignatureGallery";
import type { Signature } from "@/types/signature";
import { Pen } from "lucide-react";

export default function SignatureManager() {
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [userId, setUserId] = useState<string>();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isJuryPresident, setIsJuryPresident] = useState<boolean>(false);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const cachedUser = sessionStorage.getItem("cached_user");
        console.log(cachedUser)
        if (cachedUser) {
          const userData = JSON.parse(cachedUser);
          setUserId(userData.id);
          
          // Check if user is admin
          if (userData.role === "admin") {
            setIsAdmin(true);
            return;
          }
          
          // Check if user is a teacher
          if (userData.role !== "enseignant") {
            setIsUnauthorized(true);
            toast.error("Access denied. Only admin or jury presidents can access signatures.");
            return;
          }
          
          // Check is_jury_president status from user data
          const isPresident = userData.is_jury_president || false;
          setIsJuryPresident(isPresident);
          
          // User must be jury president
          if (!isPresident) {
            setIsUnauthorized(true);
            toast.error("Access denied. Only admin or jury presidents can manage signatures.");
          }
        } else {
          throw new Error("No cached user found");
        }
      } catch (error) {
        console.error("Error fetching user ID:", error);
        toast.error("Failed to load user ID. Please try again.");
        setIsUnauthorized(true);
      }
    };

    fetchUserId();
  }, []);

  useEffect(() => {
    const loadSignatures = async () => {
      if (!userId || (!isAdmin && !isJuryPresident)) return;

      try {
        setIsLoading(true);
        const fetchedSignatures = await fetchSignatures(userId);
        setSignatures(Array.isArray(fetchedSignatures) ? fetchedSignatures : []);
      } catch (error) {
        console.error("Error fetching signatures:", error);
        if (error instanceof Error && error.message.includes("403")) {
          toast.error("Access denied. Only admin or jury presidents can manage signatures.");
          setIsUnauthorized(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadSignatures();
  }, [userId, isAdmin, isJuryPresident]);

  const handleNewSignature = async (signatureFile: File) => {
    try {
      if (!userId) {
        throw new Error("User ID is undefined");
      }

      console.log("Saving signature with file:", signatureFile);
      const result = await saveSignature(userId, signatureFile);
      console.log("Save signature result:", result);
      
      // Refresh signatures list
      const fetchedSignatures = await fetchSignatures(userId);
      console.log("Fetched signatures:", fetchedSignatures);
      setSignatures(Array.isArray(fetchedSignatures) ? fetchedSignatures : []);
      setIsCreateDialogOpen(false);

      toast.success("Your new digital signature has been successfully added.");
    } catch (error) {
      console.trace("Error creating signature:", error);
      toast.error("Unable to create your signature. Please try again.");
    }
  };

  const handleActivateSignature = async (signatureId: string) => {
    try {
      if (!userId) {
        throw new Error("User ID is undefined");
      }

      await activateSignature(userId, signatureId);

      setSignatures((prevSignatures) =>
        prevSignatures.map((sig) => ({
          ...sig,
          is_active: sig.id === signatureId,
        }))
      );

      toast.success("This signature is now your primary digital signature.");
    } catch (error) {
      console.error("Error activating signature:", error);
      toast.error("Could not activate the signature. Please try again.");
    }
  };

  const handleDeleteSignature = async (signatureId: string) => {
    try {
      await deleteSignature(signatureId);
      setSignatures(signatures.filter((sig) => sig.id !== signatureId));
      toast.success("The signature has been permanently deleted.");
    } catch (error) {
      console.error("Error deleting signature:", error);
      toast.error("Unable to delete the signature. Please try again.");
    }
  };

  // Show unauthorized message if user is not a responsible teacher
  if (isUnauthorized) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4">
        <Card className="w-full max-w-3xl shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <div className="text-red-500 text-6xl">🔒</div>
              <h2 className="text-2xl font-bold">Accès Refusé</h2>
              <p className="text-muted-foreground">
                Seuls les administrateurs et les présidents de jury peuvent accéder à la gestion des signatures.
              </p>
              <p className="text-sm text-muted-foreground">
                Si vous pensez qu'il s'agit d'une erreur, veuillez contacter votre administrateur.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-start min-h-screen p-4">
      <Card className="w-full max-w-3xl shadow-lg">
        <motion.div
          className="w-full bg-gradient-to-r from-primary/10 via-primary/5 to-background p-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <AnimatedSignature
            className="w-full h-24"
            color="hsl(var(--primary))"
            strokeWidth={3}
            duration={3}
          />
        </motion.div>

        <CardContent className="space-y-6">
          <div className="flex flex-col space-y-6">
            {/* Role badges */}
            <div className="flex gap-2 mt-4">
              {isAdmin && (
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  Administrateur
                </span>
              )}
              {isJuryPresident && (
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                  Président de Jury
                </span>
              )}
            </div>
            
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="ml-auto mt-5"
              variant="outline"
            >
              <Pen className="mr-2 h-4 w-4" />
              Create New Signature
            </Button>
            {isLoading ? (
              <LoadingSpinner />
            ) : signatures.length > 0 ? (
              <SignatureGallery
                signatures={signatures}
                onActivate={handleActivateSignature}
                onDelete={handleDeleteSignature}
              />
            ) : (
              <NoSignaturesFound />
            )}
          </div>
        </CardContent>
      </Card>

      {isCreateDialogOpen && (
        <CreateSignatureDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          onSave={handleNewSignature}
        />
      )}
      
    </div>
  );
}