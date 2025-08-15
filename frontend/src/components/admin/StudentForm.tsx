import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Student, CreateStudentData, UpdateStudentData } from '../../types/student';

const studentSchema = yup.object({
  rollNo: yup.string().required('Roll number is required'),
  name: yup.string().required('Name is required').min(2, 'Name must be at least 2 characters'),
  dateOfBirth: yup.string().required('Date of birth is required'),
  admissionDate: yup.string().required('Admission date is required'),
  standard: yup.string().required('Standard is required'),
  section: yup.string().required('Section is required'),
  parentContact: yup.object({
    fatherName: yup.string().required('Father name is required'),
    motherName: yup.string().required('Mother name is required'),
    phone: yup.string().required('Phone is required').matches(/^\d{10}$/, 'Phone must be 10 digits'),
    email: yup.string().email('Invalid email').required('Email is required'),
    address: yup.string().required('Address is required'),
  }),
});

interface StudentFormProps {
  student?: Student | null;
  onSubmit: (data: CreateStudentData | UpdateStudentData) => Promise<void>;
  onCancel: () => void;
}

export const StudentForm: React.FC<StudentFormProps> = ({ student, onSubmit, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const isEditing = !!student;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateStudentData>({
    resolver: yupResolver(studentSchema),
    defaultValues: student ? {
      rollNo: student.rollNo,
      name: student.name,
      dateOfBirth: new Date(student.dateOfBirth).toISOString().split('T')[0],
      admissionDate: new Date(student.admissionDate).toISOString().split('T')[0],
      standard: student.standard,
      section: student.section,
      parentContact: student.parentContact,
    } : {
      rollNo: '',
      name: '',
      dateOfBirth: '',
      admissionDate: '',
      standard: '1',
      section: 'A',
      parentContact: {
        fatherName: '',
        motherName: '',
        phone: '',
        email: '',
        address: '',
      },
    },
  });

  useEffect(() => {
    if (student) {
      reset({
        rollNo: student.rollNo,
        name: student.name,
        dateOfBirth: new Date(student.dateOfBirth).toISOString().split('T')[0],
        admissionDate: new Date(student.admissionDate).toISOString().split('T')[0],
        standard: student.standard,
        section: student.section,
        parentContact: student.parentContact,
      });
    }
  }, [student, reset]);

  const handleFormSubmit = async (data: CreateStudentData) => {
    setLoading(true);
    try {
      await onSubmit(data);
    } catch (err) {
      console.error('Form submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-screen overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {isEditing ? 'Edit Student' : 'Add New Student'}
        </h2>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Roll Number</label>
              <input
                {...register('rollNo')}
                type="text"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder="Enter roll number"
              />
              {errors.rollNo && (
                <p className="text-red-500 text-sm mt-1">{errors.rollNo.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                {...register('name')}
                type="text"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder="Enter student name"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Date of Birth</label>
              <input
                {...register('dateOfBirth')}
                type="date"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
              {errors.dateOfBirth && (
                <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Admission Date</label>
              <input
                {...register('admissionDate')}
                type="date"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
              {errors.admissionDate && (
                <p className="text-red-500 text-sm mt-1">{errors.admissionDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Standard</label>
              <select
                {...register('standard')}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                  <option key={num} value={num.toString()}>{num}</option>
                ))}
              </select>
              {errors.standard && (
                <p className="text-red-500 text-sm mt-1">{errors.standard.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Section</label>
              <select
                {...register('section')}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                {['A', 'B', 'C', 'D'].map(sec => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
              {errors.section && (
                <p className="text-red-500 text-sm mt-1">{errors.section.message}</p>
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-3">Parent Contact Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Father's Name</label>
                <input
                  {...register('parentContact.fatherName')}
                  type="text"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter father's name"
                />
                {errors.parentContact?.fatherName && (
                  <p className="text-red-500 text-sm mt-1">{errors.parentContact.fatherName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Mother's Name</label>
                <input
                  {...register('parentContact.motherName')}
                  type="text"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter mother's name"
                />
                {errors.parentContact?.motherName && (
                  <p className="text-red-500 text-sm mt-1">{errors.parentContact.motherName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  {...register('parentContact.phone')}
                  type="tel"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter phone number"
                />
                {errors.parentContact?.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.parentContact.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  {...register('parentContact.email')}
                  type="email"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email address"
                />
                {errors.parentContact?.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.parentContact.email.message}</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">Address</label>
              <textarea
                {...register('parentContact.address')}
                rows={3}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder="Enter complete address"
              />
              {errors.parentContact?.address && (
                <p className="text-red-500 text-sm mt-1">{errors.parentContact.address.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
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
              {loading ? 'Saving...' : (isEditing ? 'Update Student' : 'Add Student')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};