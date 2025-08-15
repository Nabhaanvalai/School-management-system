import React, { useState, useEffect } from 'react';
import { Payment, StudentPaymentSummary, PaymentFilters } from '../../types/payment';
import { paymentService } from '../../services/paymentService';

interface PaymentStatusProps {
  studentId: string;
  className?: string;
}

const PaymentStatus: React.FC<PaymentStatusProps> = ({ studentId, className = '' }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<StudentPaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PaymentFilters>({
    academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)
  });

  useEffect(() => {
    fetchPaymentData();
  }, [studentId, filters]);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [paymentsData, summaryData] = await Promise.all([
        paymentService.getStudentPayments(studentId, filters),
        paymentService.getStudentPaymentSummary(studentId, filters.academicYear)
      ]);

      setPayments(paymentsData);
      setSummary(summaryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payment data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof PaymentFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'overdue':
        return 'text-red-600 bg-red-100';
      case 'cancelled':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'tuition':
        return 'text-blue-600 bg-blue-100';
      case 'admission':
        return 'text-purple-600 bg-purple-100';
      case 'exam':
        return 'text-orange-600 bg-orange-100';
      case 'transport':
        return 'text-green-600 bg-green-100';
      case 'library':
        return 'text-indigo-600 bg-indigo-100';
      case 'sports':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const downloadReceipt = async (paymentId: string) => {
    try {
      const blob = await paymentService.downloadReceipt(paymentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download receipt:', err);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold mb-2">Error Loading Payment Status</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchPaymentData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Fee Payment Status</h2>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Academic Year
            </label>
            <select
              value={filters.academicYear || ''}
              onChange={(e) => handleFilterChange('academicYear', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Years</option>
              <option value="2023-2024">2023-2024</option>
              <option value="2024-2025">2024-2025</option>
              <option value="2025-2026">2025-2026</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fee Category
            </label>
            <select
              value={filters.feeCategory || ''}
              onChange={(e) => handleFilterChange('feeCategory', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              <option value="tuition">Tuition</option>
              <option value="admission">Admission</option>
              <option value="exam">Exam</option>
              <option value="transport">Transport</option>
              <option value="library">Library</option>
              <option value="sports">Sports</option>
            </select>
          </div>
        </div>

        {/* Payment Summary */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(summary.totalAmount)}
              </div>
              <div className="text-sm text-blue-700">Total Amount</div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.paidAmount)}
              </div>
              <div className="text-sm text-green-700">Paid Amount</div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(summary.pendingAmount)}
              </div>
              <div className="text-sm text-yellow-700">Pending Amount</div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.overdueAmount)}
              </div>
              <div className="text-sm text-red-700">Overdue Amount</div>
            </div>
          </div>
        )}

        {/* Category-wise Breakdown */}
        {summary && summary.paymentsByCategory.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Category-wise Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {summary.paymentsByCategory.map((category) => (
                <div key={category.category} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(category.category)}`}>
                      {category.category.charAt(0).toUpperCase() + category.category.slice(1)}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-medium">{formatCurrency(category.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600">Paid:</span>
                      <span className="font-medium">{formatCurrency(category.paidAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-600">Pending:</span>
                      <span className="font-medium">{formatCurrency(category.pendingAmount)}</span>
                    </div>
                    {category.overdueAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-red-600">Overdue:</span>
                        <span className="font-medium">{formatCurrency(category.overdueAmount)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Payment Records */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment History</h3>
        
        {payments.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-lg">No payment records found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="font-medium">{payment.description}</div>
                      {payment.receiptNumber && (
                        <div className="text-xs text-gray-500">
                          Receipt: {payment.receiptNumber}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {payment.feeCategory && (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(payment.feeCategory)}`}>
                          {payment.feeCategory.charAt(0).toUpperCase() + payment.feeCategory.slice(1)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(payment.dueDate)}
                      {payment.paidDate && (
                        <div className="text-xs text-green-600">
                          Paid: {formatDate(payment.paidDate)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.status === 'paid' && payment.receiptNumber && (
                        <button
                          onClick={() => downloadReceipt(payment._id)}
                          className="text-blue-600 hover:text-blue-900 text-xs"
                        >
                          Download Receipt
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentStatus;