import React, { useState, useEffect } from 'react';
import { leaveService } from '../../services/leaveService';
import { CreateLeaveRequestData, LeaveType, LeaveRequest } from '../../types/leave';
import { useAuth } from '../../context/AuthContext';

interface LeaveApplicationProps {
  onLeaveSubmitted?: (leave: LeaveRequest) => void;
}

const LeaveApplication: React.FC<LeaveApplicationProps> = ({ onLeaveSubmitted }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<CreateLeaveRequestData>({
    leaveType: 'casual',
    startDate: '',
    endDate: '',
    reason: '',
    isHalfDay: false,
    halfDaySession: undefined,
    emergencyContact: undefined,
    attachments: []
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showEmergencyContact, setShowEmergencyContact] = useState(false);

  const leaveTypes: { value: LeaveType; label: string; requiresEmergencyContact: boolean }[] = [
    { value: 'casual', label: 'Casual Leave', requiresEmergencyContact: false },
    { value: 'sick', label: 'Sick Leave', requiresEmergencyContact: true },
    { value: 'emergency', label: 'Emergency Leave', requiresEmergencyContact: true },
    { value: 'vacation', label: 'Vacation Leave', requiresEmergencyContact: false },
    { value: 'maternity', label: 'Maternity Leave', requiresEmergencyContact: true },
    { value: 'paternity', label: 'Paternity Leave', requiresEmergencyContact: true },
    { value: 'other', label: 'Other', requiresEmergencyContact: false }
  ];

  useEffect(() => {
    const selectedLeaveType = leaveTypes.find(lt => lt.value === formData.leaveType);
    setShowEmergencyContact(selectedLeaveType?.requiresEmergencyContact || false);
    
    if (!selectedLeaveType?.requiresEmergencyContact) {
      setFormData(prev => ({ ...prev, emergencyContact: undefined }));
    } else if (!formData.emergencyContact) {
      setFormData(prev => ({
        ...prev,
        emergencyContact: { name: '', phone: '', relationship: '' }
      }));
    }
  }, [formData.leaveType]);

  useEffect(() => {
    if (formData.isHalfDay) {
      setFormData(prev => ({ ...prev, endDate: prev.startDate }));
    }
  }, [formData.isHalfDay, formData.startDate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEmergencyContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact!,
        [name]: value
      }
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.startDate) return 'Start date is required';
    if (!formData.endDate) return 'End date is required';
    if (!formData.reason.trim()) return 'Reason is required';
    if (formData.reason.trim().length < 10) return 'Reason must be at least 10 characters';
    
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    
    if (endDate < startDate) return 'End date must be on or after start date';
    
    if (formData.isHalfDay) {
      if (startDate.getTime() !== endDate.getTime()) {
        return 'Half day leave must be for a single day';
      }
      if (!formData.halfDaySession) {
        return 'Half day session is required for half day leaves';
      }
    }
    
    if (showEmergencyContact && formData.emergencyContact) {
      if (!formData.emergencyContact.name.trim()) return 'Emergency contact name is required';
      if (!formData.emergencyContact.phone.trim()) return 'Emergency contact phone is required';
      if (!/^[0-9]{10}$/.test(formData.emergencyContact.phone)) {
        return 'Emergency contact phone must be 10 digits';
      }
      if (!formData.emergencyContact.relationship.trim()) return 'Emergency contact relationship is required';
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const leaveRequest = await leaveService.createLeaveRequest(formData);
      
      setSuccess('Leave application submitted successfully!');
      setFormData({
        leaveType: 'casual',
        startDate: '',
        endDate: '',
        reason: '',
        isHalfDay: false,
        halfDaySession: undefined,
        emergencyContact: undefined,
        attachments: []
      });
      
      if (onLeaveSubmitted) {
        onLeaveSubmitted(leaveRequest);
      }
      
    } catch (err: any) {
      console.error('Error submitting leave application:', err);
      setError(err.response?.data?.message || 'Failed to submit leave application');
    } finally {
      setLoading(false);
    }
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Apply for Leave</h2>
        <p className="mt-1 text-sm text-gray-600">
          Submit a new leave application
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Leave Type */}
          <div>
            <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700 mb-2">
              Leave Type *
            </label>
            <select
              id="leaveType"
              name="leaveType"
              value={formData.leaveType}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {leaveTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Half Day Toggle */}
          <div className="flex items-center">
            <input
              id="isHalfDay"
              name="isHalfDay"
              type="checkbox"
              checked={formData.isHalfDay}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isHalfDay" className="ml-2 block text-sm text-gray-700">
              Half Day Leave
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Start Date */}
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
              Start Date *
            </label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={handleInputChange}
              min={getTodayDate()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* End Date */}
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
              End Date *
            </label>
            <input
              id="endDate"
              name="endDate"
              type="date"
              value={formData.endDate}
              onChange={handleInputChange}
              min={formData.startDate || getTodayDate()}
              disabled={formData.isHalfDay}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              required
            />
          </div>
        </div>

        {/* Half Day Session */}
        {formData.isHalfDay && (
          <div>
            <label htmlFor="halfDaySession" className="block text-sm font-medium text-gray-700 mb-2">
              Half Day Session *
            </label>
            <select
              id="halfDaySession"
              name="halfDaySession"
              value={formData.halfDaySession || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select session</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
            </select>
          </div>
        )}

        {/* Reason */}
        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
            Reason for Leave *
          </label>
          <textarea
            id="reason"
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            rows={4}
            placeholder="Please provide a detailed reason for your leave application..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Minimum 10 characters required
          </p>
        </div>

        {/* Emergency Contact */}
        {showEmergencyContact && (
          <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Emergency Contact Information *</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="emergencyName" className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  id="emergencyName"
                  name="name"
                  type="text"
                  value={formData.emergencyContact?.name || ''}
                  onChange={handleEmergencyContactChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="emergencyPhone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  id="emergencyPhone"
                  name="phone"
                  type="tel"
                  value={formData.emergencyContact?.phone || ''}
                  onChange={handleEmergencyContactChange}
                  placeholder="10-digit phone number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="emergencyRelationship" className="block text-sm font-medium text-gray-700 mb-1">
                  Relationship *
                </label>
                <input
                  id="emergencyRelationship"
                  name="relationship"
                  type="text"
                  value={formData.emergencyContact?.relationship || ''}
                  onChange={handleEmergencyContactChange}
                  placeholder="e.g., Spouse, Parent"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </div>
            ) : (
              'Submit Application'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LeaveApplication;