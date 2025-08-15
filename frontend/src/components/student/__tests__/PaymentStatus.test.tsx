import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import PaymentStatus from '../PaymentStatus';
import { paymentService } from '../../../services/paymentService';

// Mock the payment service
vi.mock('../../../services/paymentService');

const mockPaymentService = vi.mocked(paymentService);

const mockPaymentsData = [
  {
    _id: 'payment1',
    paymentType: 'student-fee' as const,
    studentId: {
      _id: 'student1',
      name: 'John Doe',
      rollNo: '001',
      standard: '10',
      section: 'A'
    },
    amount: 5000,
    dueDate: new Date('2024-01-15'),
    paidDate: new Date('2024-01-10'),
    status: 'paid' as const,
    paymentMethod: 'online' as const,
    receiptNumber: 'FEE202401001',
    feeCategory: 'tuition' as const,
    academicYear: '2024-2025',
    description: 'Tuition Fee - January 2024',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-10')
  },
  {
    _id: 'payment2',
    paymentType: 'student-fee' as const,
    studentId: {
      _id: 'student1',
      name: 'John Doe',
      rollNo: '001',
      standard: '10',
      section: 'A'
    },
    amount: 2000,
    dueDate: new Date('2024-02-15'),
    status: 'pending' as const,
    feeCategory: 'exam' as const,
    academicYear: '2024-2025',
    description: 'Exam Fee - February 2024',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01')
  }
];

const mockSummaryData = {
  studentId: 'student1',
  totalAmount: 7000,
  paidAmount: 5000,
  pendingAmount: 2000,
  overdueAmount: 0,
  payments: mockPaymentsData,
  paymentsByCategory: [
    {
      category: 'tuition' as const,
      totalAmount: 5000,
      paidAmount: 5000,
      pendingAmount: 0,
      overdueAmount: 0
    },
    {
      category: 'exam' as const,
      totalAmount: 2000,
      paidAmount: 0,
      pendingAmount: 2000,
      overdueAmount: 0
    }
  ]
};

// Mock URL.createObjectURL and related functions
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'blob:mock-url'),
    revokeObjectURL: vi.fn()
  }
});

describe('PaymentStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPaymentService.getStudentPayments.mockResolvedValue(mockPaymentsData);
    mockPaymentService.getStudentPaymentSummary.mockResolvedValue(mockSummaryData);
    mockPaymentService.downloadReceipt.mockResolvedValue(new Blob(['mock pdf'], { type: 'application/pdf' }));
  });

  it('renders loading state initially', () => {
    render(<PaymentStatus studentId="student1" />);
    
    expect(screen.getByTestId('loading-skeleton') || document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders payment data after loading', async () => {
    render(<PaymentStatus studentId="student1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Fee Payment Status')).toBeInTheDocument();
    });

    // Check summary cards
    expect(screen.getByText('₹7,000.00')).toBeInTheDocument(); // Total amount
    expect(screen.getByText('₹5,000.00')).toBeInTheDocument(); // Paid amount
    expect(screen.getByText('₹2,000.00')).toBeInTheDocument(); // Pending amount

    // Check payment records
    expect(screen.getByText('Tuition Fee - January 2024')).toBeInTheDocument();
    expect(screen.getByText('Exam Fee - February 2024')).toBeInTheDocument();
  });

  it('displays correct status colors', async () => {
    render(<PaymentStatus studentId="student1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Fee Payment Status')).toBeInTheDocument();
    });

    const paidStatus = screen.getByText('Paid');
    const pendingStatus = screen.getByText('Pending');
    
    expect(paidStatus).toHaveClass('text-green-600', 'bg-green-100');
    expect(pendingStatus).toHaveClass('text-yellow-600', 'bg-yellow-100');
  });

  it('displays correct category colors', async () => {
    render(<PaymentStatus studentId="student1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Fee Payment Status')).toBeInTheDocument();
    });

    const tuitionCategory = screen.getByText('Tuition');
    const examCategory = screen.getByText('Exam');
    
    expect(tuitionCategory).toHaveClass('text-blue-600', 'bg-blue-100');
    expect(examCategory).toHaveClass('text-orange-600', 'bg-orange-100');
  });

  it('displays category-wise breakdown', async () => {
    render(<PaymentStatus studentId="student1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Category-wise Breakdown')).toBeInTheDocument();
    });

    // Check tuition category breakdown
    const tuitionCards = screen.getAllByText('Tuition');
    expect(tuitionCards).toHaveLength(2); // One in table, one in breakdown

    // Check exam category breakdown
    const examCards = screen.getAllByText('Exam');
    expect(examCards).toHaveLength(2); // One in table, one in breakdown
  });

  it('handles filter changes', async () => {
    render(<PaymentStatus studentId="student1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Fee Payment Status')).toBeInTheDocument();
    });

    const statusSelect = screen.getByDisplayValue('All Status');
    fireEvent.change(statusSelect, { target: { value: 'paid' } });

    await waitFor(() => {
      expect(mockPaymentService.getStudentPayments).toHaveBeenCalledWith(
        'student1',
        expect.objectContaining({
          status: 'paid'
        })
      );
    });
  });

  it('handles receipt download', async () => {
    render(<PaymentStatus studentId="student1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Fee Payment Status')).toBeInTheDocument();
    });

    const downloadButton = screen.getByText('Download Receipt');
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(mockPaymentService.downloadReceipt).toHaveBeenCalledWith('payment1');
    });
  });

  it('handles error state', async () => {
    mockPaymentService.getStudentPayments.mockRejectedValue(new Error('Failed to fetch'));
    mockPaymentService.getStudentPaymentSummary.mockRejectedValue(new Error('Failed to fetch'));

    render(<PaymentStatus studentId="student1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Error Loading Payment Status')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Retry');
    expect(retryButton).toBeInTheDocument();
  });

  it('handles empty payment data', async () => {
    mockPaymentService.getStudentPayments.mockResolvedValue([]);

    render(<PaymentStatus studentId="student1" />);
    
    await waitFor(() => {
      expect(screen.getByText('No payment records found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument();
    });
  });

  it('formats currency correctly', async () => {
    render(<PaymentStatus studentId="student1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Fee Payment Status')).toBeInTheDocument();
    });

    // Check Indian currency formatting
    expect(screen.getByText('₹7,000.00')).toBeInTheDocument();
    expect(screen.getByText('₹5,000.00')).toBeInTheDocument();
    expect(screen.getByText('₹2,000.00')).toBeInTheDocument();
  });

  it('formats dates correctly', async () => {
    render(<PaymentStatus studentId="student1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Fee Payment Status')).toBeInTheDocument();
    });

    // Check if dates are formatted correctly (DD MMM YYYY format)
    expect(screen.getByText('15 Jan 2024')).toBeInTheDocument();
    expect(screen.getByText('15 Feb 2024')).toBeInTheDocument();
    expect(screen.getByText('Paid: 10 Jan 2024')).toBeInTheDocument();
  });

  it('displays receipt numbers when available', async () => {
    render(<PaymentStatus studentId="student1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Fee Payment Status')).toBeInTheDocument();
    });

    expect(screen.getByText('Receipt: FEE202401001')).toBeInTheDocument();
  });

  it('shows download receipt button only for paid payments with receipts', async () => {
    render(<PaymentStatus studentId="student1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Fee Payment Status')).toBeInTheDocument();
    });

    // Should have one download button for the paid payment with receipt
    const downloadButtons = screen.getAllByText('Download Receipt');
    expect(downloadButtons).toHaveLength(1);
  });

  it('calls service methods with correct parameters', async () => {
    render(<PaymentStatus studentId="student1" />);
    
    await waitFor(() => {
      expect(mockPaymentService.getStudentPayments).toHaveBeenCalledWith(
        'student1',
        expect.objectContaining({
          academicYear: expect.stringMatching(/^\d{4}-\d{4}$/)
        })
      );
      
      expect(mockPaymentService.getStudentPaymentSummary).toHaveBeenCalledWith(
        'student1',
        expect.stringMatching(/^\d{4}-\d{4}$/)
      );
    });
  });

  it('handles fee category filter', async () => {
    render(<PaymentStatus studentId="student1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Fee Payment Status')).toBeInTheDocument();
    });

    const categorySelect = screen.getByDisplayValue('All Categories');
    fireEvent.change(categorySelect, { target: { value: 'tuition' } });

    await waitFor(() => {
      expect(mockPaymentService.getStudentPayments).toHaveBeenCalledWith(
        'student1',
        expect.objectContaining({
          feeCategory: 'tuition'
        })
      );
    });
  });
});