import { Bell } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export function NotificationBell() {
  const { notifications } = useNotifications();
  const navigate = useNavigate();
  
  const recentNotifications = notifications.slice(0, 5);
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM HH:mm');
    } catch (e) {
      console.error(e);
      return dateString;
    }
  };
  
  const handleNotificationClick = () => {
    navigate(`/notifications`);
  };
  
  const renderNotificationIcon = (type?: string) => {
    switch (type) {
      case 'SYSTEM': return '🔔';
      case 'MESSAGE': return '✉️';
      case 'EVENT': return '📅';
      case 'ALERT': return '⚠️';
      case 'REMINDER': return '⏰';
      case 'CO_SUPERVISION': return '🤝';
      case 'PFE_VALIDATION': return '📋';
      case 'EMAIL_NOTIFICATION': return '📧';
      default: return '📩';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-orange-100 dark:hover:bg-slate-700 hover:text-orange-600 dark:hover:text-orange-400 transition-colors duration-200 group">
          <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300 group-hover:text-orange-600 dark:group-hover:text-orange-400" />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-semibold shadow-lg">
              {notifications.length > 9 ? '9+' : notifications.length}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          <span className="text-xs text-muted-foreground">{notifications.length} notification(s)</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup className="max-h-[400px] overflow-y-auto">
          {recentNotifications.length > 0 ? (
            recentNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="p-3 cursor-pointer hover:bg-slate-50"
                onClick={() => handleNotificationClick()}
              >
                <div className="flex gap-3 w-full items-start">
                  <div className="text-xl mt-1">{renderNotificationIcon(notification.type)}</div>
                  <div className="flex-1 truncate">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold truncate text-sm">
                        {notification.title || 'Notification'}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                        {formatDate(notification.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {notification.message || notification.formatted_message || 'Aucun détail disponible'}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              Aucune notification
            </div>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="p-2 cursor-pointer justify-center font-medium"
          onClick={() => navigate('/notifications')}
        >
          Voir toutes les notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 