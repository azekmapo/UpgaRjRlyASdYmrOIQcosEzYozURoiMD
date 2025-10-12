import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { periodeService } from '@/services/api';
import type { DashboardContent, MyPeriode } from '@/types/periodes';

interface DashboardDynamicProps {
  role: 'etudiant' | 'enseignant' | 'entreprise';
}

export default function DashboardDynamic({ role }: DashboardDynamicProps) {
  const [periode, setPeriode] = useState<MyPeriode | null>(null);
  const [dashboardContent, setDashboardContent] = useState<DashboardContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [isResponsable, setIsResponsable] = useState(false);
  const navigate = useNavigate();

  const parseDashboardContent = (periode: MyPeriode, userRole: string, isResp: boolean): DashboardContent => {
    const effectiveRole = (userRole === 'enseignant' && isResp && periode.dashboard_title.includes('responsable£')) 
      ? 'responsable' 
      : userRole;

    const parseField = (field: string): string | undefined => {
      if (!field) return undefined;
      
      const rolePairs = field.split('$');
      for (const pair of rolePairs) {
        const [pairRole, content] = pair.split('£');
        if (pairRole === effectiveRole && content) {
          return content;
        }
      }
      return undefined;
    };

    const parseButtonField = (field: string): { name?: string; url?: string } => {
      if (!field) return {};
      
      const rolePairs = field.split('$');
      for (const pair of rolePairs) {
        const parts = pair.split('£');
        if (parts.length >= 3 && parts[0] === effectiveRole) {
          return {
            name: parts[1],
            url: parts[2]
          };
        }
      }
      return {};
    };

    const title = parseField(periode.dashboard_title) || '';
    const description = parseField(periode.dashboard_description) || '';
    
    const buttonData = parseButtonField(periode.dashboard_button);

    return {
      title,
      description,
      buttonName: buttonData.name,
      buttonUrl: buttonData.url
    };
  };

  useEffect(() => {
    const fetchPeriodeActive = async () => {
      try {
        setLoading(true);
        const response = await periodeService.getPeriodeActive();
        if (response.success) {
          setPeriode(response.data);
          setIsResponsable(response.is_responsable || false);
          const content = parseDashboardContent(response.data, role, response.is_responsable || false);
          setDashboardContent(content);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la période active:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPeriodeActive();
  }, [role]);

  const handleButtonClick = () => {
    if (dashboardContent?.buttonUrl) {
      navigate(`/${dashboardContent.buttonUrl}`);
    }
  };

  const getRoleLabel = () => {
    if (role === 'enseignant' && isResponsable) return 'Responsable';
    if (role === 'enseignant') return 'Enseignant';
    if (role === 'etudiant') return 'Étudiant';
    return 'Entreprise';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!periode || !dashboardContent) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-600">Aucune période active</h2>
        <p className="text-gray-500 mt-2">Il n'y a actuellement aucune période active configurée.</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4 py-12">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md border border-gray-200 p-6 sm:p-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Bienvenue cher {getRoleLabel()}
          </h1>

          {dashboardContent.title && (
            <h2 className="text-xl text-gray-700 font-medium">
              {dashboardContent.title}
            </h2>
          )}

          {dashboardContent.description && (
            <p className="text-gray-600 leading-relaxed">
              {dashboardContent.description}
            </p>
          )}

          {dashboardContent.buttonName && dashboardContent.buttonUrl && (
            <div className="pt-2">
              <button 
                onClick={handleButtonClick}
                className="inline-flex items-center cursor-pointer gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg shadow-lg shadow-orange-200 hover:from-orange-600 hover:to-orange-700 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-300 transition-all duration-200"
              >
                {dashboardContent.buttonName}
              </button>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200 mt-6 text-sm text-gray-500">
            <p>Période active: <span className="font-medium text-gray-700">{periode.titre}</span></p>
            <p className="text-xs mt-1">
              Du {new Date(periode.date_debut).toLocaleDateString('fr-FR')} au {new Date(periode.date_fin).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}