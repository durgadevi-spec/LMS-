import { getStoredUsers, updateUser, deleteUser } from '@/lib/storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Edit2, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';

export default function Employees() {
  const [users, setUsers] = useState(getStoredUsers());
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const { toast } = useToast();

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditDesignation(user.designation);
  };

  const handleSaveEdit = () => {
    if (!editingUser) return;
    const updated = updateUser(editingUser.id, { name: editName, designation: editDesignation });
    setUsers(updated);
    setEditingUser(null);
    toast({
      title: "Success",
      description: "Employee updated successfully",
      className: "bg-green-500/10 border-green-500/20 text-white"
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      const updated = deleteUser(id);
      setUsers(updated);
      toast({
        title: "Success",
        description: "Employee deleted successfully",
        className: "bg-green-500/10 border-green-500/20 text-white"
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-display font-bold text-white mb-2">Employees Directory</h2>
          <p className="text-muted-foreground">Manage employee details and roles</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search employees..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-black/20 border-white/10 text-white focus:border-primary/50"
          />
        </div>
      </div>

      <Card className="bg-card/40 backdrop-blur border-white/10">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="hover:bg-transparent border-white/10">
                <TableHead className="text-gray-300">Code</TableHead>
                <TableHead className="text-gray-300">Name</TableHead>
                <TableHead className="text-gray-300">Designation</TableHead>
                <TableHead className="text-gray-300">Role</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
                <TableHead className="text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-white/5 border-white/10 transition-colors" data-testid={`row-employee-${user.id}`}>
                  <TableCell className="font-mono text-primary">{user.code}</TableCell>
                  <TableCell className="font-medium text-white">{user.name}</TableCell>
                  <TableCell className="text-gray-300">{user.designation}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'} className={user.role === 'Admin' ? 'bg-primary/20 text-primary hover:bg-primary/30' : 'bg-white/10 text-gray-300'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                    <span className="text-xs text-gray-400">Active</span>
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border-blue-600/20"
                      onClick={() => handleEdit(user)}
                      data-testid={`button-edit-${user.id}`}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-red-600/10 hover:bg-red-600/20 text-red-400 border-red-600/20"
                      onClick={() => handleDelete(user.id, user.name)}
                      data-testid={`button-delete-${user.id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Employee Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="bg-card border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-black/20 border-white/10 text-white"
                data-testid="input-edit-name"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Designation</Label>
              <Input
                value={editDesignation}
                onChange={(e) => setEditDesignation(e.target.value)}
                className="bg-black/20 border-white/10 text-white"
                data-testid="input-edit-designation"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditingUser(null)}
              className="text-gray-300"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEdit}
              className="bg-primary hover:bg-primary/90"
              data-testid="button-save-edit"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
