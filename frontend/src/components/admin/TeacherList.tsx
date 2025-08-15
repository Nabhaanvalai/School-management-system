import React from 'react';
import { Teacher } from '../../types/teacher';

interface TeacherListProps {
  teachers: Teacher[];
  onEdit: (teacher: Teacher) => void;
  onAssign: (teacher: Teacher) => void;
  onUpdateSalary: (teacher: Teacher) => void;
  onDelete: (teacher: Teacher) => Promise<void>;
}

export const TeacherList: React.FC<TeacherListProps> = ({
  teachers,
  onEdit,
  onAssign,
  onUpdateSalary,
  onDelete,
}) => {
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString();
  };

  const getSalaryStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    if (status === 'paid') {
      return `${baseClasses} bg-green-100 text-green-800`;
    }
    return `${baseClasses} bg-red-100 text-red-800`;
  };

  if (teachers.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No teachers found</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Teacher Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subjects
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assignments
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Salary
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {teachers.map((teacher) => (
              <tr key={teacher._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {teacher.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {teacher.employeeId}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {teacher.subjects.map((subject, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {teacher.assignedClasses.length > 0 ? (
                      <div className="space-y-1">
                        {teacher.assignedClasses.map((assignment, index) => (
                          <div key={index} className="text-xs">
                            {assignment.standard}-{assignment.section} ({assignment.subject})
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500 text-xs">No assignments</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm text-gray-900">
                      ₹{teacher.salary.amount.toLocaleString()}
                    </div>
                    <span className={getSalaryStatusBadge(teacher.salary.status)}>
                      {teacher.salary.status}
                    </span>
                    {teacher.salary.lastPaidDate && (
                      <div className="text-xs text-gray-500 mt-1">
                        Last paid: {formatDate(teacher.salary.lastPaidDate)}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex flex-col space-y-1">
                    <button
                      onClick={() => onEdit(teacher)}
                      className="text-blue-600 hover:text-blue-900 text-left"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onAssign(teacher)}
                      className="text-green-600 hover:text-green-900 text-left"
                    >
                      Assign Classes
                    </button>
                    <button
                      onClick={() => onUpdateSalary(teacher)}
                      className="text-purple-600 hover:text-purple-900 text-left"
                    >
                      Update Salary
                    </button>
                    <button
                      onClick={() => onDelete(teacher)}
                      className="text-red-600 hover:text-red-900 text-left"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};