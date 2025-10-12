import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import LoadingSpinner from '@/components/loading-spinner';
import { userService } from '@/services/userService';
import type { User } from '@/types/auth';
import { Search, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface UserSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selectedUsers: User[]) => void;
  role: string;
  title: string;
}

const UserSelector: React.FC<UserSelectorProps> = ({ isOpen, onClose, onSelect, role, title }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [fetchError, setFetchError] = useState(false);

  // Fetch users when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    } else {
      // Reset state when dialog closes
      setUsers([]);
      setFilteredUsers([]);
      setSelectedUsers([]);
      setSearchTerm('');
      setFetchError(false);
    }
  }, [isOpen, role]);

  // Filter users when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const fetchUsers = async (isRetry = false) => {
    try {
      if (isRetry) {
        toast.info("Tentative de reconnexion...");
      }
      
      setIsLoading(true);
      setFetchError(false);
      
      // Short timeout to prevent clicking the retry button too quickly
      await new Promise(resolve => setTimeout(resolve, isRetry ? 1000 : 0));
      
      const response = await userService.getUsers(role);
      
      if (response.success) {
        if (response.data.length === 0 && !isRetry) {
          // If no users found on first attempt and it's not a retry attempt
          // We might have a stale cache or temporary issue, try once more
          console.log('No users found on first attempt, retrying...');
          fetchUsers(true);
          return;
        }
        
        setUsers(response.data);
        setFilteredUsers(response.data);
        
      } else {
        // Response was unsuccessful
        console.warn("User fetch response unsuccessful:", response.message);
        setFetchError(true);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setFetchError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    fetchUsers(true);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleToggleUser = (user: User) => {
    setSelectedUsers(prevSelected => {
      const isSelected = prevSelected.some(u => u.id === user.id);
      
      if (isSelected) {
        return prevSelected.filter(u => u.id !== user.id);
      } else {
        return [...prevSelected, user];
      }
    });
  };

  const handleConfirm = () => {
    onSelect(selectedUsers);
    onClose();
  };

  // Get initials from name
  const getInitials = (name: string) => {
    if (!name) return '--';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="flex items-center border rounded-md px-3 py-1 mb-4">
          <Search className="h-4 w-4 mr-2 text-muted-foreground" />
          <Input 
            placeholder="Rechercher par nom ou email..." 
            value={searchTerm} 
            onChange={handleSearchChange} 
            className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        
        <div className="mb-4 flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {selectedUsers.length} utilisateur{selectedUsers.length !== 1 ? 's' : ''} sélectionné{selectedUsers.length !== 1 ? 's' : ''}
          </p>
          {filteredUsers.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {filteredUsers.length} utilisateur{filteredUsers.length !== 1 ? 's' : ''} trouvé{filteredUsers.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        
        <ScrollArea className="h-[300px]">
          {filteredUsers.length > 0 ? (
            <div className="space-y-2">
              {filteredUsers.map(user => (
                <div
                  key={user.id}
                  className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                  onClick={() => handleToggleUser(user)}
                >
                  <Checkbox 
                    checked={selectedUsers.some(u => u.id === user.id)} 
                    onCheckedChange={() => handleToggleUser(user)}
                  />
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-medium text-sm truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              {isLoading ? (
                <LoadingSpinner />
              ) : fetchError ? (
                <div className="text-center">
                  <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
                  <p className="text-muted-foreground mb-4">Erreur lors du chargement des utilisateurs</p>
                  <Button onClick={handleRetry} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Réessayer
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  {searchTerm ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur disponible'}
                </p>
              )}
            </div>
          )}
        </ScrollArea>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="mr-2">
            Annuler
          </Button>
          <Button onClick={handleConfirm} disabled={selectedUsers.length === 0}>
            Ajouter ({selectedUsers.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserSelector; 