import React from 'react';
import { ReportData, StudentReportCard, ClassPerformance, AttendanceSummary, StudentCount, TeacherAssignments, FeeStatus, SalaryStatus } from '../../types/reports';

interface ReportDisplayProps {
  reportData: ReportData;
}

export const ReportDisplay: React.FC<ReportDisplayProps> = ({ reportData }) => {
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  const renderStudentReportCard = (data: StudentReportCard) => (
    <div className="space-y-6">
      <div className="text-center border-b pb-4">
        <h3 className="text-xl font-bold">{data.student.name}</h3>
        <p className="text-gray-600">Roll No: {data.student.rollNo} | Class: {data.student.standard}-{data.student.section}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold mb-3">Academic Performance</h4>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-2 text-left">Subject</th>
                  <th className="border border-gray-300 p-2 text-center">Marks</th>
                  <th className="border border-gray-300 p-2 text-center">Grade</th>
                </tr>
              </thead>
              <tbody>
                {data.subjects.map((subject, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-2">{subject.subject}</td>
                    <td className="border border-gray-300 p-2 text-center">
                      {subject.marks}/{subject.maxMarks}
                    </td>
                    <td className="border border-gray-300 p-2 text-center font-semibold">
                      {subject.grade}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Summary</h4>
          <div className="space-y-3">
            <div className="bg-blue-50 p-3 rounded">
              <div className="text-sm text-gray-600">Overall Grade</div>
              <div className="text-xl font-bold text-blue-600">{data.overallGrade}</div>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <div className="text-sm text-gray-600">Class Rank</div>
              <div className="text-xl font-bold text-green-600">{data.rank} of {data.totalStudents}</div>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <div className="text-sm text-gray-600">Attendance</div>
              <div className="text-xl font-bold text-purple-600">
                {formatPercentage(data.attendance.percentage)}
              </div>
              <div className="text-sm text-gray-600">
                {data.attendance.presentDays}/{data.attendance.totalDays} days
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderClassPerformance = (data: ClassPerformance) => (
    <div className="space-y-6">
      <div className="text-center border-b pb-4">
        <h3 className="text-xl font-bold">Class {data.class.standard}-{data.class.section} Performance</h3>
        <p className="text-gray-600">Total Students: {data.totalStudents}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 p-2 text-left">Subject</th>
              <th className="border border-gray-300 p-2 text-center">Average</th>
              <th className="border border-gray-300 p-2 text-center">Pass %</th>
              <th className="border border-gray-300 p-2 text-center">Highest</th>
              <th className="border border-gray-300 p-2 text-center">Lowest</th>
              <th className="border border-gray-300 p-2 text-left">Top Student</th>
            </tr>
          </thead>
          <tbody>
            {data.subjects.map((subject, index) => (
              <tr key={index}>
                <td className="border border-gray-300 p-2 font-medium">{subject.subject}</td>
                <td className="border border-gray-300 p-2 text-center">
                  {subject.averageMarks.toFixed(1)}/{subject.maxMarks}
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  {formatPercentage(subject.passPercentage)}
                </td>
                <td className="border border-gray-300 p-2 text-center">{subject.highestMarks}</td>
                <td className="border border-gray-300 p-2 text-center">{subject.lowestMarks}</td>
                <td className="border border-gray-300 p-2">{subject.topStudent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-blue-50 p-4 rounded">
        <div className="text-center">
          <div className="text-sm text-gray-600">Overall Class Average</div>
          <div className="text-2xl font-bold text-blue-600">{data.overallAverage.toFixed(1)}%</div>
        </div>
      </div>
    </div>
  );

  const renderAttendanceSummary = (data: AttendanceSummary) => (
    <div className="space-y-6">
      <div className="text-center border-b pb-4">
        <h3 className="text-xl font-bold">Attendance Summary</h3>
        <p className="text-gray-600">
          Period: {formatDate(data.period.startDate)} to {formatDate(data.period.endDate)}
        </p>
        {data.class && (
          <p className="text-gray-600">Class: {data.class.standard}-{data.class.section}</p>
        )}
        {data.student && (
          <p className="text-gray-600">{data.student.name} (Roll No: {data.student.rollNo})</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold mb-3">Subject-wise Attendance</h4>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-2 text-left">Subject</th>
                  <th className="border border-gray-300 p-2 text-center">Attended</th>
                  <th className="border border-gray-300 p-2 text-center">Total</th>
                  <th className="border border-gray-300 p-2 text-center">%</th>
                </tr>
              </thead>
              <tbody>
                {data.subjects.map((subject, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-2">{subject.subject}</td>
                    <td className="border border-gray-300 p-2 text-center">{subject.attendedClasses}</td>
                    <td className="border border-gray-300 p-2 text-center">{subject.totalClasses}</td>
                    <td className="border border-gray-300 p-2 text-center">
                      {formatPercentage(subject.percentage)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Overall Summary</h4>
          <div className="bg-blue-50 p-4 rounded">
            <div className="text-center">
              <div className="text-sm text-gray-600">Overall Attendance</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatPercentage(data.overallAttendance.percentage)}
              </div>
              <div className="text-sm text-gray-600">
                {data.overallAttendance.attendedClasses}/{data.overallAttendance.totalClasses} classes
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStudentCount = (data: StudentCount) => (
    <div className="space-y-6">
      <div className="text-center border-b pb-4">
        <h3 className="text-xl font-bold">Student Enrollment Report</h3>
      </div>

      <div className="space-y-4">
        {data.byStandard.map((standard, index) => (
          <div key={index} className="border rounded-lg p-4">
            <h4 className="font-semibold mb-3">Standard {standard.standard}</h4>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-2 text-left">Section</th>
                    <th className="border border-gray-300 p-2 text-center">Active</th>
                    <th className="border border-gray-300 p-2 text-center">Left</th>
                    <th className="border border-gray-300 p-2 text-center">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {standard.sections.map((section, sIndex) => (
                    <tr key={sIndex}>
                      <td className="border border-gray-300 p-2">Section {section.section}</td>
                      <td className="border border-gray-300 p-2 text-center text-green-600 font-semibold">
                        {section.activeCount}
                      </td>
                      <td className="border border-gray-300 p-2 text-center text-red-600">
                        {section.leftCount}
                      </td>
                      <td className="border border-gray-300 p-2 text-center font-semibold">
                        {section.totalCount}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold">
                    <td className="border border-gray-300 p-2">Standard Total</td>
                    <td className="border border-gray-300 p-2 text-center text-green-600">
                      {standard.totalActive}
                    </td>
                    <td className="border border-gray-300 p-2 text-center text-red-600">
                      {standard.totalLeft}
                    </td>
                    <td className="border border-gray-300 p-2 text-center">
                      {standard.grandTotal}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 p-4 rounded">
        <h4 className="font-semibold mb-2 text-center">School Total</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-sm text-gray-600">Active Students</div>
            <div className="text-xl font-bold text-green-600">{data.schoolTotal.activeCount}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Left Students</div>
            <div className="text-xl font-bold text-red-600">{data.schoolTotal.leftCount}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Total Enrolled</div>
            <div className="text-xl font-bold text-blue-600">{data.schoolTotal.totalCount}</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTeacherAssignments = (data: TeacherAssignments) => (
    <div className="space-y-6">
      <div className="text-center border-b pb-4">
        <h3 className="text-xl font-bold">Teacher Assignments Report</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 p-2 text-left">Teacher</th>
              <th className="border border-gray-300 p-2 text-left">Subjects</th>
              <th className="border border-gray-300 p-2 text-left">Assignments</th>
              <th className="border border-gray-300 p-2 text-center">Total Classes</th>
            </tr>
          </thead>
          <tbody>
            {data.teachers.map((teacher, index) => (
              <tr key={index}>
                <td className="border border-gray-300 p-2">
                  <div className="font-medium">{teacher.name}</div>
                  <div className="text-sm text-gray-600">ID: {teacher.employeeId}</div>
                </td>
                <td className="border border-gray-300 p-2">
                  <div className="flex flex-wrap gap-1">
                    {teacher.subjects.map((subject, sIndex) => (
                      <span key={sIndex} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {subject}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="border border-gray-300 p-2">
                  {teacher.assignments.length > 0 ? (
                    <div className="space-y-1">
                      {teacher.assignments.map((assignment, aIndex) => (
                        <div key={aIndex} className="text-sm">
                          {assignment.standard}-{assignment.section} ({assignment.subject})
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-500 text-sm">No assignments</span>
                  )}
                </td>
                <td className="border border-gray-300 p-2 text-center font-semibold">
                  {teacher.totalClasses}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderFeeStatus = (data: FeeStatus) => (
    <div className="space-y-6">
      <div className="text-center border-b pb-4">
        <h3 className="text-xl font-bold">Fee Status Report</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-3 rounded text-center">
          <div className="text-sm text-gray-600">Total Students</div>
          <div className="text-xl font-bold text-blue-600">{data.summary.totalStudents}</div>
        </div>
        <div className="bg-green-50 p-3 rounded text-center">
          <div className="text-sm text-gray-600">Paid</div>
          <div className="text-xl font-bold text-green-600">{data.summary.paidCount}</div>
        </div>
        <div className="bg-yellow-50 p-3 rounded text-center">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-xl font-bold text-yellow-600">{data.summary.pendingCount}</div>
        </div>
        <div className="bg-red-50 p-3 rounded text-center">
          <div className="text-sm text-gray-600">Overdue</div>
          <div className="text-xl font-bold text-red-600">{data.summary.overdueCount}</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 p-2 text-left">Student</th>
              <th className="border border-gray-300 p-2 text-center">Class</th>
              <th className="border border-gray-300 p-2 text-center">Fee Amount</th>
              <th className="border border-gray-300 p-2 text-center">Paid</th>
              <th className="border border-gray-300 p-2 text-center">Pending</th>
              <th className="border border-gray-300 p-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.students.map((student, index) => (
              <tr key={index}>
                <td className="border border-gray-300 p-2">
                  <div className="font-medium">{student.name}</div>
                  <div className="text-sm text-gray-600">Roll: {student.rollNo}</div>
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  {student.standard}-{student.section}
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  {formatCurrency(student.feeAmount)}
                </td>
                <td className="border border-gray-300 p-2 text-center text-green-600">
                  {formatCurrency(student.paidAmount)}
                </td>
                <td className="border border-gray-300 p-2 text-center text-red-600">
                  {formatCurrency(student.pendingAmount)}
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    student.status === 'paid' ? 'bg-green-100 text-green-800' :
                    student.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {student.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSalaryStatus = (data: SalaryStatus) => (
    <div className="space-y-6">
      <div className="text-center border-b pb-4">
        <h3 className="text-xl font-bold">Salary Status Report</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-3 rounded text-center">
          <div className="text-sm text-gray-600">Total Teachers</div>
          <div className="text-xl font-bold text-blue-600">{data.summary.totalTeachers}</div>
        </div>
        <div className="bg-green-50 p-3 rounded text-center">
          <div className="text-sm text-gray-600">Paid</div>
          <div className="text-xl font-bold text-green-600">{data.summary.paidCount}</div>
        </div>
        <div className="bg-red-50 p-3 rounded text-center">
          <div className="text-sm text-gray-600">Unpaid</div>
          <div className="text-xl font-bold text-red-600">{data.summary.unpaidCount}</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 p-2 text-left">Teacher</th>
              <th className="border border-gray-300 p-2 text-center">Salary</th>
              <th className="border border-gray-300 p-2 text-center">Status</th>
              <th className="border border-gray-300 p-2 text-center">Last Paid</th>
              <th className="border border-gray-300 p-2 text-center">Pending Months</th>
            </tr>
          </thead>
          <tbody>
            {data.teachers.map((teacher, index) => (
              <tr key={index}>
                <td className="border border-gray-300 p-2">
                  <div className="font-medium">{teacher.name}</div>
                  <div className="text-sm text-gray-600">ID: {teacher.employeeId}</div>
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  {formatCurrency(teacher.salaryAmount)}
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    teacher.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {teacher.status}
                  </span>
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  {teacher.lastPaidDate ? formatDate(teacher.lastPaidDate) : 'Never'}
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  {teacher.pendingMonths > 0 ? (
                    <span className="text-red-600 font-semibold">{teacher.pendingMonths}</span>
                  ) : (
                    <span className="text-green-600">0</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderReportContent = () => {
    switch (reportData.type) {
      case 'student-report-card':
        return renderStudentReportCard(reportData.data as StudentReportCard);
      case 'class-performance':
        return renderClassPerformance(reportData.data as ClassPerformance);
      case 'attendance-summary':
        return renderAttendanceSummary(reportData.data as AttendanceSummary);
      case 'student-count':
        return renderStudentCount(reportData.data as StudentCount);
      case 'teacher-assignments':
        return renderTeacherAssignments(reportData.data as TeacherAssignments);
      case 'fee-status':
        return renderFeeStatus(reportData.data as FeeStatus);
      case 'salary-status':
        return renderSalaryStatus(reportData.data as SalaryStatus);
      default:
        return <div>Unsupported report type</div>;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4 text-center">
        <h2 className="text-2xl font-bold">{reportData.title}</h2>
        <p className="text-sm text-gray-600">Generated on {formatDate(reportData.generatedAt)}</p>
      </div>
      
      {renderReportContent()}
    </div>
  );
};