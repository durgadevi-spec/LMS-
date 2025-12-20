import { getStoredLeaves, getStoredUsers } from '@/lib/storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Download, Mail, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function Reports() {
  const leaves = getStoredLeaves();
  const users = getStoredUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [searchDepartment, setSearchDepartment] = useState('');
  const { toast } = useToast();

  const exportToCSV = () => {
    try {
      const employees = users.filter(u => u.role === 'Employee');
      const reportData = employees.map(user => {
        const userLeaves = leaves.filter(l => l.employeeCode === user.code && l.status === 'Approved');
        const casualCount = userLeaves.filter(l => l.type === 'Casual').length;
        const sickCount = userLeaves.filter(l => l.type === 'Sick').length;
        const odCount = userLeaves.filter(l => l.type === 'OD').length;
        const compOffCount = userLeaves.filter(l => l.type === 'Comp Off').length;
        const lwpCount = userLeaves.filter(l => l.type === 'LWP').length;
        const earnedCount = userLeaves.filter(l => l.type === 'Earned').length;
        
        return {
          name: user.name,
          code: user.code,
          designation: user.designation,
          casual: casualCount,
          sick: sickCount,
          od: odCount,
          compOff: compOffCount,
          lwp: lwpCount,
          earned: earnedCount,
          total: casualCount + sickCount + odCount + compOffCount + lwpCount + earnedCount
        };
      });

      let csv = 'Employee Name,Employee Code,Designation,Casual,Sick,OD,Comp Off,LWP,Earned,Total\n';
      reportData.forEach(row => {
        csv += `"${row.name}","${row.code}","${row.designation}",${row.casual},${row.sick},${row.od},${row.compOff},${row.lwp},${row.earned},${row.total}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Leave-Report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Report exported successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export report",
        variant: "destructive"
      });
    }
  };

  const shareViaEmail = () => {
    toast({
      title: "Email Sharing",
      description: "To enable email sharing, please upgrade to full-stack. This requires backend integration.",
    });
  };

  const shareViaWhatsApp = () => {
    toast({
      title: "WhatsApp Sharing",
      description: "To enable WhatsApp sharing, please upgrade to full-stack. This requires backend integration.",
    });
  };

  // Build a comprehensive report with all leave types
  const reportData = users
    .filter(u => u.role === 'Employee')
    .map(user => {
      const userLeaves = leaves.filter(l => l.employeeCode === user.code && l.status === 'Approved');
      
      const casualCount = userLeaves.filter(l => l.type === 'Casual').length;
      const sickCount = userLeaves.filter(l => l.type === 'Sick').length;
      const odCount = userLeaves.filter(l => l.type === 'OD').length;
      const compOffCount = userLeaves.filter(l => l.type === 'Comp Off').length;
      const lwpCount = userLeaves.filter(l => l.type === 'LWP').length;
      const earnedCount = userLeaves.filter(l => l.type === 'Earned').length;
      const totalLeaves = userLeaves.length;

      return {
        user,
        casual: casualCount,
        sick: sickCount,
        od: odCount,
        compOff: compOffCount,
        lwp: lwpCount,
        earned: earnedCount,
        total: totalLeaves
      };
    });

  const filteredData = reportData.filter(item =>
    (item.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     item.user.code.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!searchDepartment || item.user.designation.toLowerCase().includes(searchDepartment.toLowerCase()))
  );

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'Casual': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Sick': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'OD': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'Comp Off': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-white mb-2">Leave & OD Reports</h2>
          <p className="text-muted-foreground">Comprehensive view of all employee leaves and on-duty requests</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Button 
            onClick={exportToCSV}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-[0_0_15px_rgba(6,182,212,0.5)]"
            data-testid="button-export-csv"
          >
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          <Button 
            onClick={shareViaEmail}
            variant="outline" 
            className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
            data-testid="button-share-email"
          >
            <Mail className="w-4 h-4 mr-2" /> Email
          </Button>
          <Button 
            onClick={shareViaWhatsApp}
            variant="outline" 
            className="border-green-500/30 text-green-400 hover:bg-green-500/10"
            data-testid="button-share-whatsapp"
          >
            <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 w-full">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search Employee Name or Code..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-black/20 border-white/10 text-white focus:border-primary/50"
            data-testid="input-search-employee"
          />
        </div>
        <Input 
          placeholder="Filter by Designation..." 
          value={searchDepartment}
          onChange={(e) => setSearchDepartment(e.target.value)}
          className="bg-black/20 border-white/10 text-white focus:border-primary/50"
          data-testid="input-search-designation"
        />
        <Input 
          type="date" 
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-black/20 border-white/10 text-white focus:border-primary/50"
          data-testid="input-filter-date"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-card/40 backdrop-blur border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Total Casual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{reportData.reduce((sum, r) => sum + r.casual, 0)}</div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Total Sick</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{reportData.reduce((sum, r) => sum + r.sick, 0)}</div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Total OD</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{reportData.reduce((sum, r) => sum + r.od, 0)}</div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Total Comp Off</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">{reportData.reduce((sum, r) => sum + r.compOff, 0)}</div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Total Leaves</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{reportData.reduce((sum, r) => sum + r.total, 0)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/40 backdrop-blur border-white/10">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="hover:bg-transparent border-white/10">
                  <TableHead className="text-gray-300">Employee</TableHead>
                  <TableHead className="text-gray-300">Code</TableHead>
                  <TableHead className="text-gray-300">Designation</TableHead>
                  <TableHead className="text-gray-300 text-center">Casual</TableHead>
                  <TableHead className="text-gray-300 text-center">Sick</TableHead>
                  <TableHead className="text-gray-300 text-center">OD</TableHead>
                  <TableHead className="text-gray-300 text-center">Comp Off</TableHead>
                  <TableHead className="text-gray-300 text-center">LWP</TableHead>
                  <TableHead className="text-gray-300 text-center">Earned</TableHead>
                  <TableHead className="text-gray-300 text-center">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow key={item.user.id} className="hover:bg-white/5 border-white/10 transition-colors">
                    <TableCell className="font-medium text-white">{item.user.name}</TableCell>
                    <TableCell className="text-primary font-mono">{item.user.code}</TableCell>
                    <TableCell className="text-gray-300 text-sm">{item.user.designation}</TableCell>
                    <TableCell className="text-center text-blue-400 font-bold">{item.casual}</TableCell>
                    <TableCell className="text-center text-red-400 font-bold">{item.sick}</TableCell>
                    <TableCell className="text-center text-green-400 font-bold">{item.od}</TableCell>
                    <TableCell className="text-center text-purple-400 font-bold">{item.compOff}</TableCell>
                    <TableCell className="text-center text-gray-400 font-bold">{item.lwp}</TableCell>
                    <TableCell className="text-center text-yellow-400 font-bold">{item.earned}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        {item.total}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Leave Listing */}
      <Card className="bg-card/40 backdrop-blur border-white/10">
        <CardHeader>
          <CardTitle className="text-white">All Approved Leaves {selectedDate && `on ${format(new Date(selectedDate), 'MMM dd, yyyy')}`}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="hover:bg-transparent border-white/10">
                  <TableHead className="text-gray-300">Employee</TableHead>
                  <TableHead className="text-gray-300">Type</TableHead>
                  <TableHead className="text-gray-300">Duration</TableHead>
                  <TableHead className="text-gray-300">From - To</TableHead>
                  <TableHead className="text-gray-300">Reason</TableHead>
                  <TableHead className="text-gray-300">Applied</TableHead>
                  <TableHead className="text-gray-300">Approved By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaves
                  .filter(l => {
                    const matchesSearch = searchTerm === '' || l.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesDate = !selectedDate || (l.startDate <= selectedDate && l.endDate >= selectedDate);
                    return l.status === 'Approved' && matchesSearch && matchesDate;
                  })
                  .map((leave) => (
                    <TableRow key={leave.id} className="hover:bg-white/5 border-white/10 transition-colors" data-testid={`row-leave-${leave.id}`}>
                      <TableCell className="font-medium text-white">{leave.employeeName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(leave.type)}>
                          {leave.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-300">{leave.duration}</TableCell>
                      <TableCell className="text-gray-300 text-sm">
                        {format(new Date(leave.startDate), 'MMM dd')} - {format(new Date(leave.endDate), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-gray-300 max-w-[200px] truncate">{leave.description}</TableCell>
                      <TableCell className="text-gray-300 text-sm">{format(new Date(leave.appliedDate), 'MMM dd')}</TableCell>
                      <TableCell className="text-xs text-gray-400">{leave.actionBy || '-'}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
