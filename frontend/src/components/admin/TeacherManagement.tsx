import React, { useState, useEffect } from 'react';
import { Teacher, TeacherFilters, CreateTeacherData, UpdateTeacherData, TeacherAssignment, SalaryUpdate } from '../../types/teacher';
import { teacherService } from '../../services/teacherService';
import { TeacherForm } from './TeacherForm';
import { TeacherList } from './TeacherList';
import { TeacherFiltersComponent } from './TeacherFilters';
import { AssignmentModal } from './AssignmentModal';
import { SalaryModal } from './SalaryModal';

export const TeacherManagement: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TeacherFilters>({});
  const [showForm, setShowForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignmentTeacher, setAssignmentTeacher] = useState<Teacher | null>(null);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [salaryTeacher, setSalaryTeacher] = useState<Teacher | null>(null);

  useEffect(() => {
    loadTeachers();
  }, [filters]);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await teacherService.getTeachers(filters);
      setTeachers(data);
    } catch (err) {
      setError('Failed to load teachers');
      console.error('Error loading teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeacher = async (teacherData: CreateTeacherData) => {
    try {
      const newTeacher = await teacherService.createTeacher(teacherData);
      setTeachers(prev => [...prev, newTeacher]);
      setShowForm(false);
    } catch (err) {
      console.error('Error creating teacher:', err);
      throw err;
    }
  };

  const handleUpdateTeacher = async (id: string, teacherData: UpdateTeacherData) => {
    try {
      const updatedTeacher = await teacherService.updateTeacher(id, teacherData);
      setTeachers(prev => prev.map(t => t._id === id ? updatedTeacher : t));
      setEditingTeacher(null);
      setShowForm(false);
    } catch (err) {
      console.error('Error updating teacher:', err);
      throw err;
    }
  };

  const handleAssignTeacher = async (assignments: TeacherAssignment[]) => {
    if (!assignmentTeacher) return;
    
    try {
      const updatedTeacher = await teacherService.assignTeacherToClass(assignmentTeacher._id, assignments);
      setTeachers(prev => prev.map(t => t._id === assignmentTeacher._id ? updatedTeacher : t));
      setShowAssignmentModal(false);
      setAssignmentTeacher(null);
    } catch (err) {
      console.error('Error assigning teacher:', err);
      throw err;
    }
  };

  const handleUpdateSalary = async (salaryData: SalaryUpdate) => {
    if (!salaryTeacher) return;
    
    try {
      const updatedTeacher = await teacherService.updateSalaryStatus(salaryTeacher._id, salaryData);
      setTeachers(prev => prev.map(t => t._id === salaryTeacher._id ? updatedTeacher : t));
      setShowSalaryModal(false);
      setSalaryTeacher(null);
    } catch (err) {
      console.error('Error updating salary:', err);
      throw err;
    }
  };

  const handleDeleteTeacher = async (teacher: Teacher) => {
    if (!confirm(`Are you sure you want to delete ${teacher.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await teacherService.deleteTeacher(teacher._id);
      setTeachers(prev => prev.filter(t => t._id !== teacher._id));
    } catch (err) {
      console.error('Error deleting teacher:', err);
      throw err;
    }
  };

  const openEditForm = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setShowForm(true);
  };

  const openAssignmentModal = (teacher: Teacher) => {
    setAssignmentTeacher(teacher);
    setShowAssignmentModal(true);
  };

  const openSalaryModal = (teacher: Teacher) => {
    setSalaryTeacher(teacher);
    setShowSalaryModal(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingTeacher(null);
  };

  const closeAssignmentModal = () => {
    setShowAssignmentModal(false);
    setAssignmentTeacher(null);
  };

  const closeSalaryModal = () => {
    setShowSalaryModal(false);
    setSalaryTeacher(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading teachers...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Teacher Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add New Teacher
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <TeacherFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
      />

      <TeacherList
        teachers={teachers}
        onEdit={openEditForm}
        onAssign={openAssignmentModal}
        onUpdateSalary={openSalaryModal}
        onDelete={handleDeleteTeacher}
      />

      {showForm && (
        <TeacherForm
          teacher={editingTeacher}
          onSubmit={editingTeacher ? 
            (data) => handleUpdateTeacher(editingTeacher._id, data as UpdateTeacherData) : 
            (data) => handleCreateTeacher(data as CreateTeacherData)
          }
          onCancel={closeForm}
        />
      )}

      {showAssignmentModal && assignmentTeacher && (
        <AssignmentModal
          teacher={assignmentTeacher}
          onAssign={handleAssignTeacher}
          onCancel={closeAssignmentModal}
        />
      )}

      {showSalaryModal && salaryTeacher && (
        <SalaryModal
          teacher={salaryTeacher}
          onUpdate={handleUpdateSalary}
          onCancel={closeSalaryModal}
        />
      )}
    </div>
  );
};