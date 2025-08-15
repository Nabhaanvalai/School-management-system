import React, { useState } from 'react';
import { Teacher, TeacherAssignment } from '../../types/teacher';

interface AssignmentModalProps {
  teacher: Teacher;
  onAssign: (assignments: TeacherAssignment[]) => Promise<void>;
  onCancel: () => void;
}

export const AssignmentModal: React.FC<AssignmentModalProps> = ({ teacher, onAssign, onCancel }) => {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>(
    teacher.assignedClasses.length > 0 ? teacher.assignedClasses : [{ standard: '1', section: 'A', subject: teacher.subjects[0] || '' }]
  );
  const [loading, setLoading] = useState(false);

  const addAssignment = () => {
    setAssignments(prev => [...prev, { standard: '1', section: 'A', subject: teacher.subjects[0] || '' }]);
  };

  const removeAssignment = (index: number) => {
    setAssignments(prev => prev.filter((_, i) => i !== index));
  };

  const updateAssignment = (index: number, field: keyof TeacherAssignment, value: string) => {
    setAssignments(prev => prev.map((assignment, i) => 
      i === index ? { ...assignment, [field]: value } : assignment
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onAssign(assignments);
    } catch (err) {
      console.error('Assignment failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-screen overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Assign Classes to {teacher.name}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">Class Assignments</label>
              <button
                type="button"
                onClick={addAssignment}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                + Add Assignment
              </button>
            </div>
            
            {assignments.map((assignment, index) => (
              <div key={index} className="grid grid-cols-4 gap-2 mb-2 items-end">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Standard</label>
                  <select
                    value={assignment.standard}
                    onChange={(e) => updateAssignment(index, 'standard', e.target.value)}
                    className="w-full p-2 border rounded text-sm"
                    required
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num.toString()}>{num}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Section</label>
                  <select
                    value={assignment.section}
                    onChange={(e) => updateAssignment(index, 'section', e.target.value)}
                    className="w-full p-2 border rounded text-sm"
                    required
                  >
                    {['A', 'B', 'C', 'D'].map(sec => (
                      <option key={sec} value={sec}>{sec}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Subject</label>
                  <select
                    value={assignment.subject}
                    onChange={(e) => updateAssignment(index, 'subject', e.target.value)}
                    className="w-full p-2 border rounded text-sm"
                    required
                  >
                    {teacher.subjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <button
                    type="button"
                    onClick={() => removeAssignment(index)}
                    className="w-full px-2 py-2 text-red-600 border border-red-300 rounded hover:bg-red-50 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            
            {assignments.length === 0 && (
              <p className="text-gray-500 text-sm">No assignments. Click "Add Assignment" to assign classes.</p>
            )}
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
              {loading ? 'Assigning...' : 'Update Assignments'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};