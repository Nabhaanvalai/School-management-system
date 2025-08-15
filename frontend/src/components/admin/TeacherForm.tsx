import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Teacher, CreateTeacherData, UpdateTeacherData } from '../../types/teacher';

const teacherSchema = yup.object({
  employeeId: yup.string().required('Employee ID is required'),
  name: yup.string().required('Name is required').min(2, 'Name must be at least 2 characters'),
  subjects: yup.array().of(yup.string().required()).min(1, 'At least one subject is required').required(),
  salary: yup.object({
    amount: yup.number().required('Salary amount is required').min(0, 'Salary must be positive'),
    status: yup.string().oneOf(['paid', 'unpaid']).required('Salary status is required'),
  }).required(),
}).required();

const AVAILABLE_SUBJECTS = [
  'Mathematics',
  'English',
  'Science',
  'Social Studies',
  'Hindi',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'Physical Education',
  'Art',
  'Music'
];

interface TeacherFormProps {
  teacher?: Teacher | null;
  onSubmit: (data: CreateTeacherData | UpdateTeacherData) => Promise<void>;
  onCancel: () => void;
}

export const TeacherForm: React.FC<TeacherFormProps> = ({ teacher, onSubmit, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<string[]>(teacher?.subjects || ['']);
  const isEditing = !!teacher;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CreateTeacherData>({
    resolver: yupResolver(teacherSchema) as any,
    defaultValues: teacher ? {
      employeeId: teacher.employeeId,
      name: teacher.name,
      subjects: teacher.subjects,
      salary: {
        amount: teacher.salary.amount,
        status: teacher.salary.status,
      },
    } : {
      employeeId: '',
      name: '',
      subjects: [''],
      salary: {
        amount: 0,
        status: 'unpaid' as const,
      },
    },
  });

  useEffect(() => {
    if (teacher) {
      setSubjects(teacher.subjects);
      reset({
        employeeId: teacher.employeeId,
        name: teacher.name,
        subjects: teacher.subjects,
        salary: {
          amount: teacher.salary.amount,
          status: teacher.salary.status,
        },
      });
    }
  }, [teacher, reset]);

  useEffect(() => {
    setValue('subjects', subjects.filter(s => s.trim() !== ''));
  }, [subjects, setValue]);

  const handleFormSubmit = async (data: CreateTeacherData) => {
    setLoading(true);
    try {
      const filteredSubjects = subjects.filter(s => s.trim() !== '');
      await onSubmit({ ...data, subjects: filteredSubjects });
    } catch (err) {
      console.error('Form submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  const addSubject = () => {
    setSubjects(prev => [...prev, '']);
  };

  const removeSubject = (index: number) => {
    setSubjects(prev => prev.filter((_, i) => i !== index));
  };

  const updateSubject = (index: number, value: string) => {
    setSubjects(prev => prev.map((subject, i) => i === index ? value : subject));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-screen overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {isEditing ? 'Edit Teacher' : 'Add New Teacher'}
        </h2>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Employee ID</label>
              <input
                {...register('employeeId')}
                type="text"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder="Enter employee ID"
              />
              {errors.employeeId && (
                <p className="text-red-500 text-sm mt-1">{errors.employeeId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                {...register('name')}
                type="text"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder="Enter teacher name"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">Subjects</label>
              <button
                type="button"
                onClick={addSubject}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                + Add Subject
              </button>
            </div>
            
            {subjects.map((subject, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <select
                  value={subject}
                  onChange={(e) => updateSubject(index, e.target.value)}
                  className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a subject</option>
                  {AVAILABLE_SUBJECTS.map(subjectOption => (
                    <option key={subjectOption} value={subjectOption}>{subjectOption}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeSubject(index)}
                  className="px-3 py-2 text-red-600 border border-red-300 rounded hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            ))}
            
            {errors.subjects && (
              <p className="text-red-500 text-sm mt-1">{errors.subjects.message}</p>
            )}
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-3">Salary Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Salary Amount</label>
                <input
                  {...register('salary.amount', { valueAsNumber: true })}
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter salary amount"
                />
                {errors.salary?.amount && (
                  <p className="text-red-500 text-sm mt-1">{errors.salary.amount.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Salary Status</label>
                <select
                  {...register('salary.status')}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                </select>
                {errors.salary?.status && (
                  <p className="text-red-500 text-sm mt-1">{errors.salary.status.message}</p>
                )}
              </div>
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
              {loading ? 'Saving...' : (isEditing ? 'Update Teacher' : 'Add Teacher')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};