import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="container flex flex-col items-center justify-center gap-6 px-4 text-center">
        <h1 className="text-6xl font-bold">403</h1>
        <h2 className="text-2xl font-semibold">Accès non autorisé</h2>
        <p className="text-muted-foreground max-w-md">
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        </p>
        <div className="flex gap-4">
          <Button
            onClick={() => navigate('/')}
            className="mt-4"
          >
            Retour au tableau de bord
          </Button>
          <Button
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}            className="mt-4"
            variant="outline"
          >
            Retour à la page précédente
          </Button>
        </div>
      </div>
    </div>
  );
}
