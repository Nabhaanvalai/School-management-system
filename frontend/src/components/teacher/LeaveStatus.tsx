import React, { useState, useEffect } from 'react';
import { leaveService } from '../../services/leaveService';
import { LeaveRequest, LeaveStatus as LeaveStatusType, LeaveSummary } from '../../types/leave';
import { useAuth } from '../../context/AuthContext';

interface LeaveStatusProps {
  refreshTrigger?: number;
}

const LeaveStatus: React.FC<LeaveStatusProps> = ({ refreshTrigger }) => {
  const { user } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveSummary, setLeaveSummary] = useState<LeaveSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<LeaveStatusType | 'all'>('all');
  const [currentAcademicYear, setCurrentAcademicYear] = useState<string>('');

  useEffect(() => {
    // Set current academic year
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Academic year starts in April (month 3, 0-indexed)
    if (currentMonth >= 3) {
      setCurrentAcademicYear(`${currentYear}-${currentYear + 1}`);
    } else {
      setCurrentAcademicYear(`${currentYear - 1}-${currentYear}`);
    }
  }, []);

  useEffect(() => {
    if (user?.profile?._id && currentAcademicYear) {
      fetchLeaveData();
    }
  }, [user?.profile?._id, currentAcademicYear, refreshTrigger]);

  const fetchLeaveData = async () => {
    if (!user?.profile?._id || !currentAcademicYear) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [requests, summary] = await Promise.all([
        leaveService.getTeacherLeaveRequests(user.profile._id, currentAcademicYear),
        leaveService.getLeaveSummary(user.profile._id, currentAcademicYear)
      ]);
      
      setLeaveRequests(requests);
      setLeaveSummary(summary);
    } catch (err: any) {
      console.error('Error fetching leave data:', err);
      setError(err.response?.data?.message || 'Failed to fetch leave data');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelLeave = async (leaveId: string) => {
    if (!window.confirm('Are you sure you want to cancel this leave request?')) {
      return;
    }
    
    try {
      await leaveService.cancelLeaveRequest(leaveId, 'Cancelled by teacher');
      await fetchLeaveData(); // Refresh data
    } catch (err: any) {
      console.error('Error cancelling leave:', err);
      alert(err.response?.data?.message || 'Failed to cancel leave request');
    }
  };

  const getStatusBadge = (status: LeaveStatusType) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
      cancelled: { color: 'bg-gray-100 text-gray-800', label: 'Cancelled' }
    };
    
    const config = statusConfig[status];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getLeaveTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      casual: 'Casual',
      sick: 'Sick',
      emergency: 'Emergency',
      vacation: 'Vacation',
      maternity: 'Maternity',
      paternity: 'Paternity',
      other: 'Other'
    };
    return typeLabels[type] || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateRange = (startDate: string, endDate: string, isHalfDay: boolean, halfDaySession?: string) => {
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    
    if (start === end) {
      if (isHalfDay && halfDaySession) {
        return `${start} (${halfDaySession} half)`;
      }
      return start;
    }
    return `${start} - ${end}`;
  };

  const filteredRequests = selectedStatus === 'all' 
    ? leaveRequests 
    : leaveRequests.filter(request => request.status === selectedStatus);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64" role="status">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" data-testid="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading leave data</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button
              onClick={fetchLeaveData}
              className="mt-2 text-sm text-red-800 underline hover:text-red-900"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Leave Summary */}
      {leaveSummary && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Leave Summary ({currentAcademicYear})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{leaveSummary.total.days}</div>
              <div className="text-sm text-gray-500">Total Days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{leaveSummary.casual.days}</div>
              <div className="text-sm text-gray-500">Casual</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{leaveSummary.sick.days}</div>
              <div className="text-sm text-gray-500">Sick</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{leaveSummary.vacation.days}</div>
              <div className="text-sm text-gray-500">Vacation</div>
            </div>
          </div>
        </div>
      )}

      {/* Leave Requests */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">My Leave Requests</h2>
              <p className="mt-1 text-sm text-gray-600">
                Track your leave applications and their status
              </p>
            </div>
            
            {/* Status Filter */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as LeaveStatusType | 'all')}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No leave requests</h3>
              <p className="mt-1 text-sm text-gray-500">
                {selectedStatus === 'all' 
                  ? "You haven't submitted any leave requests yet."
                  : `No ${selectedStatus} leave requests found.`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <div key={request._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          {getLeaveTypeLabel(request.leaveType)} Leave
                        </h4>
                        {getStatusBadge(request.status)}
                        <span className="text-sm text-gray-500">
                          {request.totalDays} {request.totalDays === 1 ? 'day' : 'days'}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Dates:</span> {formatDateRange(
                          request.startDate, 
                          request.endDate, 
                          request.isHalfDay, 
                          request.halfDaySession
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Reason:</span> {request.reason}
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Applied on {formatDate(request.appliedDate)}
                        {request.reviewedDate && (
                          <span> • Reviewed on {formatDate(request.reviewedDate)}</span>
                        )}
                      </div>
                      
                      {request.reviewComments && (
                        <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                          <span className="font-medium text-gray-700">Review Comments:</span>
                          <p className="text-gray-600 mt-1">{request.reviewComments}</p>
                        </div>
                      )}
                    </div>
                    
                    {request.status === 'pending' && (
                      <button
                        onClick={() => handleCancelLeave(request._id)}
                        className="ml-4 px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveStatus;