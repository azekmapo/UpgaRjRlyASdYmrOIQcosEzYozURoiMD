import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  BookMarked,
  Bell,
  User,
  Mail,
  Settings,
  type LucideIcon,
  ListTodo,
  FileEdit,
  UserCheck, 
  BarChart3,
  FileText,
  Signature,
} from "lucide-react";

export type NavigationItem = {
  title: string;
  href: string;
  icon: LucideIcon; 
  submenu?: NavigationItem[];
};

export type NavigationConfig = {
  main: NavigationItem[];
  secondary?: NavigationItem[];
};

export const getNavigationByRole = (role?: string, isResponsable?: boolean): NavigationConfig => {
  switch (role) {
    case 'admin':
      return {
        main: [
          { title: 'Dashboard', href: '/', icon: LayoutDashboard },
          { title: 'Calendrier', href: '/calendrier', icon: Calendar },
          { title: 'Profil', href: '/profil-admin', icon: User },
          { title: 'Sessions', href: '/sessions-admin', icon: ListTodo },
          { title: 'Emails', href: '/liste-emails-admin', icon: Mail },
          { title: 'Utilisateurs', href: '/utilisateurs', icon: Users },
          { title: 'Notifications', href: '/notifications', icon: Bell },
          { title: 'Soutenances', href: '/soutenances', icon: Settings },
          { title: 'Responsables', href: '/responsable-management', icon: UserCheck },
          { title: 'Barème', href: '/bareme-admin', icon: BarChart3 },
          { title: 'Options', href: '/options', icon: BookMarked },
        ]
        
      };

    case 'enseignant': {
      const enseignantNav: NavigationItem[] = [
        { title: 'Dashboard', href: '/', icon: LayoutDashboard },
        { title: 'Calendrier', href: '/calendrier', icon: Calendar },
        { title: 'Profil', href: '/profil-enseignant', icon: User },
        { title: 'Sessions', href: '/sessions', icon: ListTodo },  
        { title: 'Choix PFE', href: '/choix-pfe-enseignant', icon: BookMarked },
        { title: 'Propositions', href: '/propositions', icon: FileEdit },
        { title: 'Notifications', href: '/notifications', icon: Bell },
        { title: 'Validation', href: '/validation-propositions', icon: FileText },
        { title: 'Fiche Jury', href: '/fiche-jury', icon: FileText },
        { title: 'Évaluation', href: '/note-enseignant', icon: BarChart3 },
      ];
      
      // Only add Signature menu item if teacher is responsible
      if (isResponsable) {
        enseignantNav.push({ title: 'Signature', href: '/signature', icon: Signature });
      }
      
      return {
        main: enseignantNav
      };
    }

    case 'etudiant':
      return {
        main: [
          { title: 'Dashboard', href: '/', icon: LayoutDashboard },
          { title: 'Profil', href: '/profil-etudiant', icon: User },
          { title: 'Choix PFE', href: '/choix-pfe', icon: BookMarked },
          { title: 'Binôme', href: '/binome', icon: Users },
          { title: 'Calendrier', href: '/calendrier', icon: Calendar },
          { title: 'Notifications', href: '/notifications', icon: Bell },
          { title: 'Proposition', href: '/proposition-etudiant', icon: FileText },
        ],
        secondary: [
        ]
      };

    case 'entreprise':
      return {
        main: [
          { title: 'Dashboard', href: '/', icon: LayoutDashboard },
          { title: 'Profil', href: '/profil-entreprise', icon: User },
          { title: 'Calendrier', href: '/calendrier', icon: Calendar },
          { title: 'Proposition', href: '/proposition-entreprise', icon: FileText },
          { title: 'Notifications', href: '/notifications', icon: Bell },
        ],
        secondary: [
        ],
      };

    default:
      return {
        main: [
          { title: 'Dashboard', href: '/', icon: LayoutDashboard },
        ],
      };
  }
};
