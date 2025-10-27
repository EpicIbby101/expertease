'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, 
  Search, 
  Plus, 
  Mail, 
  Calendar, 
  TrendingUp, 
  Award,
  Activity,
  MoreHorizontal,
  Edit,
  Eye,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Trainee {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  created_at: string;
  last_login_at?: string;
  completionRate: number;
  averageScore: number;
  coursesCompleted: number;
  totalCourses: number;
  engagementScore: number;
}

interface CompanyTraineeManagerProps {
  companyId: string;
  companyName: string;
}

export function CompanyTraineeManager({ companyId, companyName }: CompanyTraineeManagerProps) {
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTrainee, setSelectedTrainee] = useState<Trainee | null>(null);
  const [inviteFormData, setInviteFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    message: `Welcome to ${companyName}! You've been invited to join our training program.`
  });
  
  // Filtering state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [performanceFilter, setPerformanceFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'score'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchTrainees();
  }, [companyId]);

  const fetchTrainees = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/company/trainees?companyId=${companyId}`);
      const data = await response.json();
      
      if (response.ok) {
        setTrainees(data.trainees || []);
      } else {
        toast.error('Failed to fetch trainees');
      }
    } catch (error) {
      console.error('Error fetching trainees:', error);
      toast.error('An error occurred while fetching trainees');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteTrainee = async () => {
    if (!inviteFormData.email) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      const response = await fetch('/api/company/create-trainee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteFormData.email,
          first_name: inviteFormData.first_name,
          last_name: inviteFormData.last_name,
          companyId,
          message: inviteFormData.message
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Trainee invited successfully!');
        setIsInviteDialogOpen(false);
        setInviteFormData({
          email: '',
          first_name: '',
          last_name: '',
          message: `Welcome to ${companyName}! You've been invited to join our training program.`
        });
        fetchTrainees();
      } else {
        toast.error(data.error || 'Failed to invite trainee');
      }
    } catch (error) {
      console.error('Error inviting trainee:', error);
      toast.error('An error occurred while inviting trainee');
    }
  };

  const handleEditTrainee = (trainee: Trainee) => {
    setSelectedTrainee(trainee);
    setIsEditDialogOpen(true);
  };

  const handleViewTrainee = (trainee: Trainee) => {
    setSelectedTrainee(trainee);
    setIsViewDialogOpen(true);
  };

  const handleDeleteTrainee = (trainee: Trainee) => {
    setSelectedTrainee(trainee);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteTrainee = async () => {
    if (!selectedTrainee) return;

    try {
      const response = await fetch('/api/company/delete-trainee', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ traineeId: selectedTrainee.id })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Trainee removed successfully');
        setIsDeleteDialogOpen(false);
        setSelectedTrainee(null);
        fetchTrainees();
      } else {
        toast.error(data.error || 'Failed to remove trainee');
      }
    } catch (error) {
      console.error('Error deleting trainee:', error);
      toast.error('An error occurred while removing trainee');
    }
  };

  const handleRefresh = () => {
    fetchTrainees();
  };

  const filteredAndSortedTrainees = trainees
    .filter(trainee => {
      const matchesSearch = 
        trainee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${trainee.first_name || ''} ${trainee.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'active' && trainee.is_active) ||
        (statusFilter === 'inactive' && !trainee.is_active);
      
      const matchesPerformance = 
        performanceFilter === 'all' ||
        (performanceFilter === 'high' && trainee.averageScore >= 85) ||
        (performanceFilter === 'medium' && trainee.averageScore >= 70 && trainee.averageScore < 85) ||
        (performanceFilter === 'low' && trainee.averageScore < 70);
      
      return matchesSearch && matchesStatus && matchesPerformance;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.email;
          bValue = `${b.first_name || ''} ${b.last_name || ''}`.trim() || b.email;
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'score':
          aValue = a.averageScore;
          bValue = b.averageScore;
          break;
        default:
          return 0;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });

  const getPerformanceBadgeColor = (score: number) => {
    if (score >= 85) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getEngagementBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (score >= 60) return 'bg-purple-100 text-purple-800 border-purple-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Users className="h-8 w-8 animate-pulse text-blue-600" />
        <span className="ml-2 text-gray-600">Loading trainees...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Trainee Management</h2>
          <p className="text-gray-600">Manage and track your company's trainees</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button 
            onClick={() => setIsInviteDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Invite Trainee
          </Button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search trainees by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
            <Select value={performanceFilter} onValueChange={(value: any) => setPerformanceFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Performance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Performance</SelectItem>
                <SelectItem value="high">High (85%+)</SelectItem>
                <SelectItem value="medium">Medium (70-84%)</SelectItem>
                <SelectItem value="low">Low (&lt;70%)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="created_at">Date Added</SelectItem>
                <SelectItem value="score">Average Score</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Trainees List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Trainees ({filteredAndSortedTrainees.length})
              </CardTitle>
              <CardDescription>
                {filteredAndSortedTrainees.length === trainees.length 
                  ? 'All trainees in your company'
                  : `${filteredAndSortedTrainees.length} of ${trainees.length} trainees match your filters`
                }
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAndSortedTrainees.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all' || performanceFilter !== 'all'
                  ? 'No trainees match your search criteria'
                  : 'No trainees in your company yet'
                }
              </p>
              {searchTerm || statusFilter !== 'all' || performanceFilter !== 'all' ? (
                <Button variant="outline" onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setPerformanceFilter('all');
                }}>
                  Clear Filters
                </Button>
              ) : (
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Invite Your First Trainee
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAndSortedTrainees.map((trainee) => (
                <div
                  key={trainee.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-white hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      trainee.is_active ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <Users className={`h-6 w-6 ${trainee.is_active ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {`${trainee.first_name || ''} ${trainee.last_name || ''}`.trim() || trainee.email}
                        </h3>
                        <Badge variant="outline" className="text-xs text-gray-500">
                          {trainee.email}
                        </Badge>
                        <Badge className={
                          trainee.is_active 
                            ? 'bg-green-100 text-green-800 border-green-200' 
                            : 'bg-red-100 text-red-800 border-red-200'
                        }>
                          {trainee.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Award className="h-4 w-4" />
                          <span className="font-medium">{trainee.averageScore.toFixed(1)}%</span>
                          <span>avg score</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          <span className="font-medium">{trainee.coursesCompleted}/{trainee.totalCourses}</span>
                          <span>courses</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity className="h-4 w-4" />
                          <span className="font-medium">{trainee.engagementScore.toFixed(1)}%</span>
                          <span>engagement</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Last active {getTimeAgo(trainee.last_login_at || trainee.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPerformanceBadgeColor(trainee.averageScore)}>
                      {trainee.averageScore >= 85 ? 'Excellent' : 
                       trainee.averageScore >= 70 ? 'Good' : 'Needs Improvement'}
                    </Badge>
                    <Badge variant="outline" className={getEngagementBadgeColor(trainee.engagementScore)}>
                      {trainee.engagementScore >= 80 ? 'High' : 
                       trainee.engagementScore >= 60 ? 'Medium' : 'Low'} Engagement
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewTrainee(trainee)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditTrainee(trainee)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteTrainee(trainee)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove Trainee
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Trainee Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Invite Trainee</DialogTitle>
            <DialogDescription>
              Send an invitation to a new trainee to join your company's training program.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="trainee@example.com"
                value={inviteFormData.email}
                onChange={(e) => setInviteFormData({ ...inviteFormData, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  placeholder="John"
                  value={inviteFormData.first_name}
                  onChange={(e) => setInviteFormData({ ...inviteFormData, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  placeholder="Doe"
                  value={inviteFormData.last_name}
                  onChange={(e) => setInviteFormData({ ...inviteFormData, last_name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Welcome Message</Label>
              <Textarea
                id="message"
                placeholder="Welcome message..."
                value={inviteFormData.message}
                onChange={(e) => setInviteFormData({ ...inviteFormData, message: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInviteTrainee}>
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Trainee Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Trainee Details</DialogTitle>
            <DialogDescription>
              View detailed information about this trainee
            </DialogDescription>
          </DialogHeader>
          {selectedTrainee && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">Name</Label>
                  <p className="font-medium">
                    {`${selectedTrainee.first_name || ''} ${selectedTrainee.last_name || ''}`.trim() || 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Email</Label>
                  <p className="font-medium">{selectedTrainee.email}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Status</Label>
                  <Badge className={
                    selectedTrainee.is_active 
                      ? 'bg-green-100 text-green-800 border-green-200' 
                      : 'bg-red-100 text-red-800 border-red-200'
                  }>
                    {selectedTrainee.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Average Score</Label>
                  <p className="font-medium">{selectedTrainee.averageScore.toFixed(1)}%</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Courses Completed</Label>
                  <p className="font-medium">
                    {selectedTrainee.coursesCompleted} / {selectedTrainee.totalCourses}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Engagement Score</Label>
                  <p className="font-medium">{selectedTrainee.engagementScore.toFixed(1)}%</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Joined</Label>
                  <p className="font-medium">{format(new Date(selectedTrainee.created_at), 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Last Active</Label>
                  <p className="font-medium">
                    {selectedTrainee.last_login_at 
                      ? getTimeAgo(selectedTrainee.last_login_at)
                      : 'Never'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Remove Trainee</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedTrainee?.email} from your company? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteTrainee}>
              Remove Trainee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CompanyTraineeManager;
