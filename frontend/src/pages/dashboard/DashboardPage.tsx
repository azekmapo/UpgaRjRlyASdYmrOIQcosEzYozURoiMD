import { useAuth } from "@/contexts/AuthContext";
import DashboardAdmin from '../admin/DashboardAdmin';
import DashboardDynamic from "@/components/custom/DashboardDynamic";

export default function DashboardPage() {
  const { user } = useAuth();

  // Function to render dashboard based on user role
  const renderDashboard = () => {
    if (!user?.role) {
      return <div>Chargement...</div>;
    }
    switch (user.role.toLowerCase()) {
      case 'admin':
        return <DashboardAdmin />;
      
      case 'etudiant':
      case 'enseignant':
      case 'entreprise':
        return <DashboardDynamic role={user.role.toLowerCase() as 'etudiant' | 'enseignant' | 'entreprise'} />;
      
      default:
        // Default message for unknown roles
        return <div>Rôle non reconnu. Veuillez contacter l'administrateur.</div>;
    }
  };

  return (
    <div className="space-y-6">
      {renderDashboard()}
    </div>
  );
}