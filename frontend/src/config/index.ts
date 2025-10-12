import { lazy } from 'react';

const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const choixPfe = lazy(() => import('../pages/etudiant/ChoixPFE'));
const notifications = lazy(() => import('../pages/dashboard/notifications'));
const Propositions = lazy(() => import('../pages/enseignant/propositions'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const UnauthorizedPage = lazy(() => import('../pages/UnauthorizedPage'));
const choixPfeEnseignant = lazy(() => import('../pages/enseignant/ChoixPfeEnseignant'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/forgot-password/ForgotPassword'));
const CodeVerification = lazy(() => import('../pages/auth/forgot-password/CodeVerification'));
const ChangePasswordPage = lazy(() => import('../pages/auth/forgot-password/ChangePassword'));
const propositionEtudiant = lazy(() => import('../pages/etudiant/PropositionEtudiant'));
const ProfilEtudiantPage = lazy(() => import('../pages/etudiant/ProfilEtudiant'));
const ProfilEnseignantPage = lazy(() => import('../pages/enseignant/ProfilEnseignant'));
const ProfilEntreprisePage = lazy(() => import('../pages/entreprise/ProfilEntreprise'));
const ProfilAdminPage = lazy(() => import('../pages/admin/ProfilAdmin'));
const ListeEmailsAdminPage = lazy(() => import('../pages/admin/ListeEmailsAdmin'));
const UtilisateursPage = lazy(() => import('../pages/admin/Utilisateurs'));
const propositionEntreprise = lazy(() => import('../pages/entreprise/PropositionEntreprise'));
const CalendrierPage = lazy(() => import('../pages/Calendrier'));
const SoutenanceAdmin = lazy(() => import('../pages/admin/SoutenanceAdmin'));
const ProposResponsablePage = lazy(() => import('../pages/enseignant/ProposResponsable'));
const FicheJury = lazy(() => import('../pages/enseignant/FicheJury'));
const ResponsableManagementPage = lazy(() => import('../pages/admin/ResponsableManagement'));
const BaremeAdmin = lazy(() => import('../pages/admin/BaremeAdmin'));
const NoteEnseignant = lazy(() => import('../pages/enseignant/NoteEnseignant'));
const BinomeEtudiant = lazy(() => import('@/pages/etudiant/BinomeEtudiant'))
const Sessions = lazy(() => import('@/pages/enseignant/sessions'))
const Signature = lazy(() => import('@/pages/admin/Signature'))
const AdminSessions = lazy(() => import('@/pages/admin/SessionsAdmin'))
const Options = lazy(() => import('@/pages/admin/OptionsAdmin'))

export type UserRole = 'admin' | 'enseignant' | 'etudiant' | 'entreprise';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteComponentProps = any;

type Route = {
  path: string;
  component: React.ComponentType<RouteComponentProps>;
  roles?: UserRole[];
};

type Routes = {
  public: Route[];
  dashboard: Route[];
  notFound: Route;
};

export const appRoutes: Routes = {
  public: [
    {
      path: '/login',
      component: LoginPage,
    },
    {
      path: '/unauthorized',
      component: UnauthorizedPage,
    },

    {
      path: '/forgot-password',
      component: ForgotPasswordPage,
    },
    {
      path: '/code-verification',
      component: CodeVerification,
    },
    {
      path: '/change-password',
      component: ChangePasswordPage,
    },
  ],

  dashboard: [
    {
      path: '/',
      component: DashboardPage,
      roles: ['admin', 'enseignant', 'etudiant', 'entreprise'],
    },
    {
      path: '/choix-pfe',
      component: choixPfe,
      roles: ['etudiant'],
    },
    {
      path: '/binome',
      component: BinomeEtudiant,
      roles: ['etudiant'],
    },
    {
      path: '/notifications',
      component: notifications,
      roles: ['etudiant', 'admin', 'enseignant', 'entreprise'],
    },
    {
      path: '/sessions',
      component: Sessions,
      roles: ['enseignant'],
    },
    {
      path: '/choix-pfe-enseignant',
      component: choixPfeEnseignant,
      roles: ['enseignant'],
    },
    {
      path: '/proposition-etudiant',
      component: propositionEtudiant,
      roles: ['etudiant'],
    },
    {
      path: '/profil-etudiant',
      component: ProfilEtudiantPage,
      roles: ['etudiant'],
    },
    {
      path: '/profil-enseignant',
      component: ProfilEnseignantPage,
      roles: ['enseignant'],
    },
    {
      path: '/profil-entreprise',
      component: ProfilEntreprisePage,
      roles: ['entreprise'],
    },
    {
      path: '/profil-admin',
      component: ProfilAdminPage,
      roles: ['admin'],
    },
    {
      path: '/liste-emails-admin',
      component: ListeEmailsAdminPage,
      roles: ['admin'],
    },
    {
      path: '/proposition-entreprise',
      component: propositionEntreprise,
      roles: ['entreprise'],
    },
    {
      path: '/utilisateurs',
      component: UtilisateursPage,
      roles: ['admin'],
    },
    {
      path: '/calendrier',
      component: CalendrierPage,
      roles: ['admin', 'enseignant', 'etudiant', 'entreprise'],
    },
    {
      path: '/propositions',
      component: Propositions,
      roles: ['enseignant'],
    },
    {
      path: '/soutenances',
      component: SoutenanceAdmin,
      roles: ['admin'],
    },
    {
      path: '/validation-propositions',
      component: ProposResponsablePage,
      roles: ['enseignant'],
    },
    {
      path: '/fiche-jury',
      component: FicheJury,
      roles: ['enseignant'],
    },
    {
      path: '/responsable-management',
      component: ResponsableManagementPage,
      roles: ['admin'],
    },
    {
      path: '/bareme-admin',
      component: BaremeAdmin,
      roles: ['admin'],
    },
    {
      path: '/note-enseignant',
      component: NoteEnseignant,
      roles: ['enseignant'],
    },
    {
      path: '/signature',
      component: Signature,
      roles: ['enseignant'],
    },
    {
      path: '/sessions-admin',
      component: AdminSessions,
      roles: ['admin'],
    },
    {
      path: '/options',
      component: Options,
      roles: ['admin'],
    },
  ],

  // 404 route
  notFound: {
    path: '*',
    component: NotFoundPage,
  },
};