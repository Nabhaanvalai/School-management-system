import React, { useState } from 'react';
import { Teacher, SalaryUpdate } from '../../types/teacher';

interface SalaryModalProps {
  teacher: Teacher;
  onUpdate: (salaryData: SalaryUpdate) => Promise<void>;
  onCancel: () => void;
}

export const SalaryModal: React.FC<SalaryModalProps> = ({ teacher, onUpdate, onCancel }) => {
  const [amount, setAmount] = useState(teacher.salary.amount);
  const [status, setStatus] = useState<'paid' | 'unpaid'>(teacher.salary.status);
  const [lastPaidDate, setLastPaidDate] = useState(
    teacher.salary.lastPaidDate ? 
      new Date(teacher.salary.lastPaidDate).toISOString().split('T')[0] : 
      new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const salaryData: SalaryUpdate = {
        amount,
        status,
        ...(status === 'paid' && { lastPaidDate })
      };
      
      await onUpdate(salaryData);
    } catch (err) {
      console.error('Salary update failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">Update Salary - {teacher.name}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Salary Amount</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'paid' | 'unpaid')}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          
          {status === 'paid' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Payment Date</label>
              <input
                type="date"
                value={lastPaidDate}
                onChange={(e) => setLastPaidDate(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}
          
          <div className="bg-gray-50 p-3 rounded mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Current Salary Information</h4>
            <div className="text-sm text-gray-600">
              <p>Current Amount: ₹{teacher.salary.amount.toLocaleString()}</p>
              <p>Current Status: {teacher.salary.status}</p>
              {teacher.salary.lastPaidDate && (
                <p>Last Paid: {new Date(teacher.salary.lastPaidDate).toLocaleDateString()}</p>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Salary'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};