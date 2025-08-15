import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Exam } from '../models/Exam';
import { Student } from '../models/Student';
import { Attendance } from '../models/Attendance';
import { Teacher } from '../models/Teacher';
import PDFDocument from 'pdfkit';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';

// Get yearly report card for a student
export const getStudentReportCard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { academicYear, format = 'json' } = req.query;

    // Validate student exists
    const student = await Student.findById(id);
    if (!student) {
      res.status(404).json({
        status: 'error',
        message: 'Student not found'
      });
      return;
    }

    // Build query for exams
    const examQuery: any = {
      'results.studentId': id,
      isResultPublished: true,
      isActive: true
    };

    if (academicYear) {
      examQuery.academicYear = academicYear;
    }

    // Get all published exams for the student
    const exams = await Exam.find(examQuery)
      .populate('results.studentId', 'name rollNo')
      .sort({ examType: 1, createdAt: 1 });

    if (exams.length === 0) {
      res.status(404).json({
        status: 'error',
        message: 'No published results found for this student'
      });
      return;
    }

    // Process exam results for the student
    const processedExams = exams.map(exam => {
      const studentResult = exam.results.find(result => 
        result.studentId.toString() === id
      );

      if (!studentResult) return null;

      return {
        examId: exam.id,
        examName: exam.name,
        examType: exam.examType,
        academicYear: exam.academicYear,
        totalMarks: studentResult.totalMarks,
        maxMarks: exam.getTotalMaxMarks(),
        percentage: studentResult.percentage,
        overallGrade: studentResult.overallGrade,
        rank: studentResult.rank,
        subjects: studentResult.marks.map(mark => ({
          subject: mark.subject,
          marksObtained: mark.marksObtained,
          maxMarks: exam.subjects.find(s => s.subject.toLowerCase() === mark.subject.toLowerCase())?.maxMarks || 0,
          grade: mark.grade,
          remarks: mark.remarks
        }))
      };
    }).filter((exam): exam is NonNullable<typeof exam> => exam !== null);

    const reportData = {
      student: {
        id: student.id,
        name: student.name,
        rollNo: student.rollNo,
        class: `${student.standard}-${student.section}`,
        academicYear: academicYear || exams[0].academicYear
      },
      exams: processedExams
    };

    // Calculate overall performance summary
    const totalExams = reportData.exams.length;
    const averagePercentage = totalExams > 0 
      ? Math.round(reportData.exams.reduce((sum, exam) => sum + exam.percentage, 0) / totalExams)
      : 0;
    
    const gradeDistribution = reportData.exams.reduce((dist: any, exam) => {
      dist[exam.overallGrade] = (dist[exam.overallGrade] || 0) + 1;
      return dist;
    }, {});

    const summary = {
      totalExams,
      averagePercentage,
      overallGrade: calculateOverallGrade(averagePercentage),
      gradeDistribution,
      bestPerformance: reportData.exams.reduce((best, exam) => 
        exam.percentage > best.percentage ? exam : best, reportData.exams[0]),
      subjectWisePerformance: calculateSubjectWisePerformance(reportData.exams)
    };

    const completeReport = {
      ...reportData,
      summary
    };

    // Return PDF if requested
    if (format === 'pdf') {
      const pdfBuffer = await generateReportCardPDF(completeReport);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="report-card-${student.rollNo}-${academicYear || 'current'}.pdf"`);
      res.send(pdfBuffer);
      return;
    }

    // Return JSON by default
    res.status(200).json({
      status: 'success',
      data: completeReport
    });
  } catch (error) {
    next(error);
  }
};

// Get class performance analytics report
export const getClassPerformanceReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { classId, academicYear, format = 'json' } = req.query;

    if (!classId || !academicYear) {
      res.status(400).json({
        status: 'error',
        message: 'classId and academicYear are required'
      });
      return;
    }

    // Parse class ID to get standard and section
    const [standard, section] = (classId as string).split('-');

    // Get all students in the class
    const students = await Student.find({ 
      standard, 
      section, 
      status: 'active' 
    }).select('name rollNo');

    if (students.length === 0) {
      res.status(404).json({
        status: 'error',
        message: 'No active students found in the specified class'
      });
      return;
    }

    // Get exam results for the class
    const exams = await Exam.find({
      academicYear: academicYear as string,
      isResultPublished: true,
      isActive: true,
      'results.studentId': { $in: students.map(s => s._id) }
    }).populate('results.studentId', 'name rollNo');

    // Calculate class performance metrics
    const classPerformance = calculateClassPerformanceMetrics(students, exams, classId as string);

    // Get attendance summary for the class
    const attendanceSummary = await calculateClassAttendanceMetrics(
      classId as string, 
      academicYear as string
    );

    const reportData = {
      classInfo: {
        classId: classId as string,
        standard,
        section,
        academicYear: academicYear as string,
        totalStudents: students.length
      },
      academicPerformance: classPerformance,
      attendanceMetrics: attendanceSummary,
      generatedAt: new Date()
    };

    // Return PDF or Excel if requested
    if (format === 'pdf') {
      const pdfBuffer = await generateClassPerformancePDF(reportData);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="class-performance-${classId}-${academicYear}.pdf"`);
      res.send(pdfBuffer);
      return;
    }

    if (format === 'excel') {
      const excelBuffer = await generateClassPerformanceExcel(reportData);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="class-performance-${classId}-${academicYear}.xlsx"`);
      res.send(excelBuffer);
      return;
    }

    res.status(200).json({
      status: 'success',
      data: reportData
    });
  } catch (error) {
    next(error);
  }
};

// Get student enrollment statistics
export const getStudentCountReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { academicYear, format = 'json' } = req.query;

    // Get enrollment statistics by standard and section
    const enrollmentStats = await Student.aggregate([
      {
        $match: {
          status: 'active'
        }
      },
      {
        $group: {
          _id: {
            standard: '$standard',
            section: '$section'
          },
          count: { $sum: 1 },
          students: {
            $push: {
              name: '$name',
              rollNo: '$rollNo',
              admissionDate: '$admissionDate'
            }
          }
        }
      },
      {
        $sort: {
          '_id.standard': 1,
          '_id.section': 1
        }
      }
    ]);

    // Calculate totals by standard
    const standardTotals = enrollmentStats.reduce((acc: any, item) => {
      const standard = item._id.standard;
      if (!acc[standard]) {
        acc[standard] = 0;
      }
      acc[standard] += item.count;
      return acc;
    }, {});

    // Calculate overall statistics
    const totalStudents = enrollmentStats.reduce((sum, item) => sum + item.count, 0);
    const totalClasses = enrollmentStats.length;
    const averageStudentsPerClass = totalClasses > 0 ? Math.round(totalStudents / totalClasses) : 0;

    // Get recent admissions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentAdmissions = await Student.countDocuments({
      status: 'active',
      admissionDate: { $gte: thirtyDaysAgo }
    });

    // Get students who left this academic year
    const studentsLeft = await Student.countDocuments({
      status: 'left',
      leavingDate: { $gte: new Date(`${new Date().getFullYear()}-04-01`) }
    });

    const reportData = {
      summary: {
        totalStudents,
        totalClasses,
        averageStudentsPerClass,
        recentAdmissions,
        studentsLeft,
        academicYear: academicYear || getCurrentAcademicYear()
      },
      byStandard: standardTotals,
      byClass: enrollmentStats.map(item => ({
        classId: `${item._id.standard}-${item._id.section}`,
        standard: item._id.standard,
        section: item._id.section,
        studentCount: item.count,
        students: item.students
      })),
      generatedAt: new Date()
    };

    // Return PDF or Excel if requested
    if (format === 'pdf') {
      const pdfBuffer = await generateStudentCountPDF(reportData);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="student-count-report-${academicYear || 'current'}.pdf"`);
      res.send(pdfBuffer);
      return;
    }

    if (format === 'excel') {
      const excelBuffer = await generateStudentCountExcel(reportData);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="student-count-report-${academicYear || 'current'}.xlsx"`);
      res.send(excelBuffer);
      return;
    }

    res.status(200).json({
      status: 'success',
      data: reportData
    });
  } catch (error) {
    next(error);
  }
};

// Get attendance analytics summary
export const getAttendanceSummaryReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { 
      classId, 
      subject, 
      startDate, 
      endDate, 
      academicYear, 
      format = 'json' 
    } = req.query;

    // Set default date range if not provided
    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30); // Last 30 days

    const queryStartDate = startDate ? new Date(startDate as string) : defaultStartDate;
    const queryEndDate = endDate ? new Date(endDate as string) : defaultEndDate;
    const queryAcademicYear = academicYear as string || getCurrentAcademicYear();

    // Build attendance query
    const attendanceQuery: any = {
      date: { $gte: queryStartDate, $lte: queryEndDate },
      academicYear: queryAcademicYear
    };

    if (classId) {
      attendanceQuery.classId = classId;
    }

    if (subject) {
      attendanceQuery.subject = subject;
    }

    // Get attendance records with student and teacher details
    const attendanceRecords = await Attendance.find(attendanceQuery)
      .populate('studentId', 'name rollNo standard section')
      .populate('teacherId', 'name employeeId')
      .sort({ date: -1 });

    // Calculate overall attendance statistics
    const overallStats = calculateAttendanceStatistics(attendanceRecords);

    // Calculate class-wise statistics if no specific class is requested
    const classWiseStats = classId ? null : calculateClassWiseAttendanceStats(attendanceRecords);

    // Calculate subject-wise statistics
    const subjectWiseStats = calculateSubjectWiseAttendanceStats(attendanceRecords);

    // Calculate daily attendance trends
    const dailyTrends = calculateDailyAttendanceTrends(attendanceRecords, queryStartDate, queryEndDate);

    // Get low attendance students (below 75%)
    const lowAttendanceStudents = await getLowAttendanceStudents(
      queryStartDate, 
      queryEndDate, 
      queryAcademicYear,
      classId as string
    );

    const reportData = {
      parameters: {
        classId: classId || 'All Classes',
        subject: subject || 'All Subjects',
        startDate: queryStartDate,
        endDate: queryEndDate,
        academicYear: queryAcademicYear
      },
      overallStatistics: overallStats,
      classWiseStatistics: classWiseStats,
      subjectWiseStatistics: subjectWiseStats,
      dailyTrends,
      lowAttendanceStudents,
      generatedAt: new Date()
    };

    // Return PDF or Excel if requested
    if (format === 'pdf') {
      const pdfBuffer = await generateAttendanceSummaryPDF(reportData);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="attendance-summary-${queryAcademicYear}.pdf"`);
      res.send(pdfBuffer);
      return;
    }

    if (format === 'excel') {
      const excelBuffer = await generateAttendanceSummaryExcel(reportData);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="attendance-summary-${queryAcademicYear}.xlsx"`);
      res.send(excelBuffer);
      return;
    }

    res.status(200).json({
      status: 'success',
      data: reportData
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to calculate overall grade
const calculateOverallGrade = (percentage: number): string => {
  if (percentage >= 95) return 'A+';
  if (percentage >= 85) return 'A';
  if (percentage >= 75) return 'B+';
  if (percentage >= 65) return 'B';
  if (percentage >= 55) return 'C+';
  if (percentage >= 45) return 'C';
  if (percentage >= 35) return 'D';
  return 'F';
};

// Helper function to calculate subject-wise performance
const calculateSubjectWisePerformance = (exams: any[]): any => {
  const subjectPerformance: any = {};

  exams.forEach(exam => {
    exam.subjects.forEach((subject: any) => {
      if (!subjectPerformance[subject.subject]) {
        subjectPerformance[subject.subject] = {
          totalMarks: 0,
          totalMaxMarks: 0,
          examCount: 0,
          grades: []
        };
      }

      subjectPerformance[subject.subject].totalMarks += subject.marksObtained;
      subjectPerformance[subject.subject].totalMaxMarks += subject.maxMarks;
      subjectPerformance[subject.subject].examCount += 1;
      subjectPerformance[subject.subject].grades.push(subject.grade);
    });
  });

  // Calculate averages and most frequent grade
  Object.keys(subjectPerformance).forEach(subject => {
    const perf = subjectPerformance[subject];
    perf.averagePercentage = Math.round((perf.totalMarks / perf.totalMaxMarks) * 100);
    perf.averageGrade = calculateOverallGrade(perf.averagePercentage);
    
    // Find most frequent grade
    const gradeCount = perf.grades.reduce((count: any, grade: string) => {
      count[grade] = (count[grade] || 0) + 1;
      return count;
    }, {});
    
    perf.mostFrequentGrade = Object.keys(gradeCount).reduce((a, b) => 
      gradeCount[a] > gradeCount[b] ? a : b
    );
  });

  return subjectPerformance;
};

// Helper function to generate PDF report card
const generateReportCardPDF = async (reportData: any): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fontSize(20).text('EDUSYS', { align: 'center' });
      doc.fontSize(16).text('STUDENT REPORT CARD', { align: 'center' });
      doc.moveDown();

      // Student Information
      doc.fontSize(12);
      doc.text(`Student Name: ${reportData.student.name}`, 50, doc.y);
      doc.text(`Roll Number: ${reportData.student.rollNo}`, 300, doc.y - 15);
      doc.text(`Class: ${reportData.student.class}`, 50, doc.y);
      doc.text(`Academic Year: ${reportData.student.academicYear}`, 300, doc.y - 15);
      doc.moveDown();

      // Summary Section
      doc.fontSize(14).text('PERFORMANCE SUMMARY', { underline: true });
      doc.fontSize(12);
      doc.text(`Total Exams: ${reportData.summary.totalExams}`);
      doc.text(`Average Percentage: ${reportData.summary.averagePercentage}%`);
      doc.text(`Overall Grade: ${reportData.summary.overallGrade}`);
      doc.moveDown();

      // Exam Results
      doc.fontSize(14).text('EXAMINATION RESULTS', { underline: true });
      doc.moveDown();

      reportData.exams.forEach((exam: any, index: number) => {
        if (doc.y > 700) {
          doc.addPage();
        }

        doc.fontSize(12).text(`${index + 1}. ${exam.examName} (${exam.examType.toUpperCase()})`, { underline: true });
        doc.text(`Total: ${exam.totalMarks}/${exam.maxMarks} | Percentage: ${exam.percentage}% | Grade: ${exam.overallGrade} | Rank: ${exam.rank || 'N/A'}`);
        
        // Subject-wise marks
        exam.subjects.forEach((subject: any) => {
          doc.text(`  ${subject.subject}: ${subject.marksObtained}/${subject.maxMarks} (${subject.grade})`, { indent: 20 });
        });
        
        doc.moveDown();
      });

      // Subject-wise Performance
      if (doc.y > 600) {
        doc.addPage();
      }

      doc.fontSize(14).text('SUBJECT-WISE PERFORMANCE', { underline: true });
      doc.fontSize(12);

      Object.keys(reportData.summary.subjectWisePerformance).forEach(subject => {
        const perf = reportData.summary.subjectWisePerformance[subject];
        doc.text(`${subject}: ${perf.averagePercentage}% (${perf.averageGrade}) - ${perf.examCount} exams`);
      });

      doc.moveDown();
      doc.fontSize(10).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'right' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Helper function to get current academic year
const getCurrentAcademicYear = (): string => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  // Academic year starts in April (month 3, 0-indexed)
  if (currentMonth >= 3) {
    return `${currentYear}-${currentYear + 1}`;
  } else {
    return `${currentYear - 1}-${currentYear}`;
  }
};

// Helper function to calculate class performance metrics
const calculateClassPerformanceMetrics = (students: any[], exams: any[], classId: string) => {
  if (exams.length === 0) {
    return {
      totalExams: 0,
      averageClassPercentage: 0,
      gradeDistribution: {},
      topPerformers: [],
      subjectWisePerformance: {}
    };
  }

  const allResults = exams.flatMap(exam => 
    exam.results.filter((result: any) => 
      students.some(student => student._id.toString() === result.studentId._id.toString())
    )
  );

  const totalResults = allResults.length;
  const averageClassPercentage = totalResults > 0 
    ? Math.round(allResults.reduce((sum: number, result: any) => sum + result.percentage, 0) / totalResults)
    : 0;

  // Grade distribution
  const gradeDistribution = allResults.reduce((dist: any, result: any) => {
    dist[result.overallGrade] = (dist[result.overallGrade] || 0) + 1;
    return dist;
  }, {});

  // Top performers (top 5 by average percentage)
  const studentPerformances = students.map(student => {
    const studentResults = allResults.filter((result: any) => 
      result.studentId._id.toString() === student._id.toString()
    );
    
    if (studentResults.length === 0) return null;
    
    const avgPercentage = Math.round(
      studentResults.reduce((sum: number, result: any) => sum + result.percentage, 0) / studentResults.length
    );
    
    return {
      studentId: student._id,
      name: student.name,
      rollNo: student.rollNo,
      averagePercentage: avgPercentage,
      totalExams: studentResults.length
    };
  }).filter(Boolean);

  const topPerformers = studentPerformances
    .sort((a: any, b: any) => b.averagePercentage - a.averagePercentage)
    .slice(0, 5);

  // Subject-wise class performance
  const subjectWisePerformance: any = {};
  
  exams.forEach(exam => {
    exam.subjects.forEach((examSubject: any) => {
      const subject = examSubject.subject;
      if (!subjectWisePerformance[subject]) {
        subjectWisePerformance[subject] = {
          totalMarks: 0,
          totalMaxMarks: 0,
          studentCount: 0,
          grades: []
        };
      }

      exam.results.forEach((result: any) => {
        if (students.some(student => student._id.toString() === result.studentId._id.toString())) {
          const subjectMark = result.marks.find((mark: any) => mark.subject === subject);
          if (subjectMark) {
            subjectWisePerformance[subject].totalMarks += subjectMark.marksObtained;
            subjectWisePerformance[subject].totalMaxMarks += examSubject.maxMarks;
            subjectWisePerformance[subject].studentCount += 1;
            subjectWisePerformance[subject].grades.push(subjectMark.grade);
          }
        }
      });
    });
  });

  // Calculate subject averages
  Object.keys(subjectWisePerformance).forEach(subject => {
    const perf = subjectWisePerformance[subject];
    perf.averagePercentage = perf.totalMaxMarks > 0 
      ? Math.round((perf.totalMarks / perf.totalMaxMarks) * 100)
      : 0;
    perf.averageGrade = calculateOverallGrade(perf.averagePercentage);
  });

  return {
    totalExams: exams.length,
    averageClassPercentage,
    gradeDistribution,
    topPerformers,
    subjectWisePerformance
  };
};

// Helper function to calculate class attendance metrics
const calculateClassAttendanceMetrics = async (classId: string, academicYear: string) => {
  const attendanceRecords = await Attendance.find({
    classId,
    academicYear
  }).populate('studentId', 'name rollNo');

  if (attendanceRecords.length === 0) {
    return {
      totalRecords: 0,
      overallAttendancePercentage: 0,
      subjectWiseAttendance: {},
      attendanceDistribution: { present: 0, absent: 0, late: 0 }
    };
  }

  const totalRecords = attendanceRecords.length;
  const presentRecords = attendanceRecords.filter(record => 
    record.status === 'present' || record.status === 'late'
  ).length;
  
  const overallAttendancePercentage = Math.round((presentRecords / totalRecords) * 100);

  // Subject-wise attendance
  const subjectWiseAttendance: any = {};
  attendanceRecords.forEach(record => {
    if (!subjectWiseAttendance[record.subject]) {
      subjectWiseAttendance[record.subject] = {
        total: 0,
        present: 0,
        absent: 0,
        late: 0
      };
    }
    
    subjectWiseAttendance[record.subject].total += 1;
    subjectWiseAttendance[record.subject][record.status] += 1;
  });

  // Calculate percentages for each subject
  Object.keys(subjectWiseAttendance).forEach(subject => {
    const stats = subjectWiseAttendance[subject];
    stats.attendancePercentage = Math.round(((stats.present + stats.late) / stats.total) * 100);
  });

  // Overall attendance distribution
  const attendanceDistribution = attendanceRecords.reduce((dist: any, record) => {
    dist[record.status] = (dist[record.status] || 0) + 1;
    return dist;
  }, { present: 0, absent: 0, late: 0 });

  return {
    totalRecords,
    overallAttendancePercentage,
    subjectWiseAttendance,
    attendanceDistribution
  };
};

// Helper function to calculate attendance statistics
const calculateAttendanceStatistics = (attendanceRecords: any[]) => {
  if (attendanceRecords.length === 0) {
    return {
      totalRecords: 0,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      attendancePercentage: 0
    };
  }

  const totalRecords = attendanceRecords.length;
  const presentCount = attendanceRecords.filter(record => record.status === 'present').length;
  const absentCount = attendanceRecords.filter(record => record.status === 'absent').length;
  const lateCount = attendanceRecords.filter(record => record.status === 'late').length;
  
  const attendancePercentage = Math.round(((presentCount + lateCount) / totalRecords) * 100);

  return {
    totalRecords,
    presentCount,
    absentCount,
    lateCount,
    attendancePercentage
  };
};

// Helper function to calculate class-wise attendance statistics
const calculateClassWiseAttendanceStats = (attendanceRecords: any[]) => {
  const classStats: any = {};

  attendanceRecords.forEach(record => {
    const classId = record.classId;
    if (!classStats[classId]) {
      classStats[classId] = {
        total: 0,
        present: 0,
        absent: 0,
        late: 0
      };
    }
    
    classStats[classId].total += 1;
    classStats[classId][record.status] += 1;
  });

  // Calculate percentages
  Object.keys(classStats).forEach(classId => {
    const stats = classStats[classId];
    stats.attendancePercentage = Math.round(((stats.present + stats.late) / stats.total) * 100);
  });

  return classStats;
};

// Helper function to calculate subject-wise attendance statistics
const calculateSubjectWiseAttendanceStats = (attendanceRecords: any[]) => {
  const subjectStats: any = {};

  attendanceRecords.forEach(record => {
    const subject = record.subject;
    if (!subjectStats[subject]) {
      subjectStats[subject] = {
        total: 0,
        present: 0,
        absent: 0,
        late: 0
      };
    }
    
    subjectStats[subject].total += 1;
    subjectStats[subject][record.status] += 1;
  });

  // Calculate percentages
  Object.keys(subjectStats).forEach(subject => {
    const stats = subjectStats[subject];
    stats.attendancePercentage = Math.round(((stats.present + stats.late) / stats.total) * 100);
  });

  return subjectStats;
};

// Helper function to calculate daily attendance trends
const calculateDailyAttendanceTrends = (attendanceRecords: any[], startDate: Date, endDate: Date) => {
  const dailyStats: any = {};
  
  // Initialize all dates in range
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    dailyStats[dateStr] = {
      date: dateStr,
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
      attendancePercentage: 0
    };
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Populate with actual data
  attendanceRecords.forEach(record => {
    const dateStr = record.date.toISOString().split('T')[0];
    if (dailyStats[dateStr]) {
      dailyStats[dateStr].total += 1;
      dailyStats[dateStr][record.status] += 1;
    }
  });

  // Calculate percentages
  Object.keys(dailyStats).forEach(date => {
    const stats = dailyStats[date];
    if (stats.total > 0) {
      stats.attendancePercentage = Math.round(((stats.present + stats.late) / stats.total) * 100);
    }
  });

  return Object.values(dailyStats);
};

// Helper function to get low attendance students
const getLowAttendanceStudents = async (startDate: Date, endDate: Date, academicYear: string, classId?: string) => {
  const query: any = {
    date: { $gte: startDate, $lte: endDate },
    academicYear
  };

  if (classId) {
    query.classId = classId;
  }

  const attendanceRecords = await Attendance.find(query)
    .populate('studentId', 'name rollNo standard section');

  // Group by student
  const studentAttendance: any = {};
  
  attendanceRecords.forEach(record => {
    const studentId = record.studentId._id.toString();
    if (!studentAttendance[studentId]) {
      studentAttendance[studentId] = {
        student: record.studentId,
        total: 0,
        present: 0,
        absent: 0,
        late: 0
      };
    }
    
    studentAttendance[studentId].total += 1;
    studentAttendance[studentId][record.status] += 1;
  });

  // Calculate percentages and filter low attendance
  const lowAttendanceStudents = Object.values(studentAttendance)
    .map((stats: any) => {
      const attendancePercentage = Math.round(((stats.present + stats.late) / stats.total) * 100);
      return {
        ...stats,
        attendancePercentage
      };
    })
    .filter((stats: any) => stats.attendancePercentage < 75)
    .sort((a: any, b: any) => a.attendancePercentage - b.attendancePercentage);

  return lowAttendanceStudents;
};

// PDF Generation Functions
const generateClassPerformancePDF = async (reportData: any): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fontSize(20).text('CLASS PERFORMANCE REPORT', { align: 'center' });
      doc.moveDown();

      // Class Information
      doc.fontSize(14).text('CLASS INFORMATION', { underline: true });
      doc.fontSize(12);
      doc.text(`Class: ${reportData.classInfo.classId}`);
      doc.text(`Academic Year: ${reportData.classInfo.academicYear}`);
      doc.text(`Total Students: ${reportData.classInfo.totalStudents}`);
      doc.moveDown();

      // Academic Performance
      doc.fontSize(14).text('ACADEMIC PERFORMANCE', { underline: true });
      doc.fontSize(12);
      doc.text(`Average Class Percentage: ${reportData.academicPerformance.averageClassPercentage}%`);
      doc.text(`Total Exams Conducted: ${reportData.academicPerformance.totalExams}`);
      doc.moveDown();

      // Attendance Metrics
      doc.fontSize(14).text('ATTENDANCE METRICS', { underline: true });
      doc.fontSize(12);
      doc.text(`Overall Attendance: ${reportData.attendanceMetrics.overallAttendancePercentage}%`);
      doc.text(`Total Attendance Records: ${reportData.attendanceMetrics.totalRecords}`);
      doc.moveDown();

      doc.fontSize(10).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'right' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

const generateStudentCountPDF = async (reportData: any): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fontSize(20).text('STUDENT ENROLLMENT REPORT', { align: 'center' });
      doc.moveDown();

      // Summary
      doc.fontSize(14).text('ENROLLMENT SUMMARY', { underline: true });
      doc.fontSize(12);
      doc.text(`Total Students: ${reportData.summary.totalStudents}`);
      doc.text(`Total Classes: ${reportData.summary.totalClasses}`);
      doc.text(`Average Students per Class: ${reportData.summary.averageStudentsPerClass}`);
      doc.text(`Recent Admissions (30 days): ${reportData.summary.recentAdmissions}`);
      doc.text(`Students Left: ${reportData.summary.studentsLeft}`);
      doc.moveDown();

      // Class-wise breakdown
      doc.fontSize(14).text('CLASS-WISE ENROLLMENT', { underline: true });
      doc.fontSize(12);
      reportData.byClass.forEach((classData: any) => {
        doc.text(`${classData.classId}: ${classData.studentCount} students`);
      });

      doc.moveDown();
      doc.fontSize(10).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'right' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

const generateAttendanceSummaryPDF = async (reportData: any): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fontSize(20).text('ATTENDANCE SUMMARY REPORT', { align: 'center' });
      doc.moveDown();

      // Parameters
      doc.fontSize(14).text('REPORT PARAMETERS', { underline: true });
      doc.fontSize(12);
      doc.text(`Class: ${reportData.parameters.classId}`);
      doc.text(`Subject: ${reportData.parameters.subject}`);
      doc.text(`Period: ${reportData.parameters.startDate.toDateString()} to ${reportData.parameters.endDate.toDateString()}`);
      doc.text(`Academic Year: ${reportData.parameters.academicYear}`);
      doc.moveDown();

      // Overall Statistics
      doc.fontSize(14).text('OVERALL STATISTICS', { underline: true });
      doc.fontSize(12);
      doc.text(`Total Records: ${reportData.overallStatistics.totalRecords}`);
      doc.text(`Attendance Percentage: ${reportData.overallStatistics.attendancePercentage}%`);
      doc.text(`Present: ${reportData.overallStatistics.presentCount}`);
      doc.text(`Absent: ${reportData.overallStatistics.absentCount}`);
      doc.text(`Late: ${reportData.overallStatistics.lateCount}`);
      doc.moveDown();

      doc.fontSize(10).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'right' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Excel Generation Functions
const generateClassPerformanceExcel = async (reportData: any): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Class Performance');

  // Add headers
  worksheet.addRow(['Class Performance Report']);
  worksheet.addRow([]);
  worksheet.addRow(['Class Information']);
  worksheet.addRow(['Class ID', reportData.classInfo.classId]);
  worksheet.addRow(['Academic Year', reportData.classInfo.academicYear]);
  worksheet.addRow(['Total Students', reportData.classInfo.totalStudents]);
  worksheet.addRow([]);
  worksheet.addRow(['Academic Performance']);
  worksheet.addRow(['Average Class Percentage', `${reportData.academicPerformance.averageClassPercentage}%`]);
  worksheet.addRow(['Total Exams', reportData.academicPerformance.totalExams]);

  return Buffer.from(await workbook.xlsx.writeBuffer());
};

const generateStudentCountExcel = async (reportData: any): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Student Count');

  // Add headers
  worksheet.addRow(['Student Enrollment Report']);
  worksheet.addRow([]);
  worksheet.addRow(['Summary']);
  worksheet.addRow(['Total Students', reportData.summary.totalStudents]);
  worksheet.addRow(['Total Classes', reportData.summary.totalClasses]);
  worksheet.addRow(['Average per Class', reportData.summary.averageStudentsPerClass]);
  worksheet.addRow([]);
  worksheet.addRow(['Class', 'Student Count']);
  
  reportData.byClass.forEach((classData: any) => {
    worksheet.addRow([classData.classId, classData.studentCount]);
  });

  return Buffer.from(await workbook.xlsx.writeBuffer());
};

const generateAttendanceSummaryExcel = async (reportData: any): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Attendance Summary');

  // Add headers
  worksheet.addRow(['Attendance Summary Report']);
  worksheet.addRow([]);
  worksheet.addRow(['Parameters']);
  worksheet.addRow(['Class', reportData.parameters.classId]);
  worksheet.addRow(['Subject', reportData.parameters.subject]);
  worksheet.addRow(['Academic Year', reportData.parameters.academicYear]);
  worksheet.addRow([]);
  worksheet.addRow(['Overall Statistics']);
  worksheet.addRow(['Total Records', reportData.overallStatistics.totalRecords]);
  worksheet.addRow(['Attendance %', `${reportData.overallStatistics.attendancePercentage}%`]);
  worksheet.addRow(['Present', reportData.overallStatistics.presentCount]);
  worksheet.addRow(['Absent', reportData.overallStatistics.absentCount]);
  worksheet.addRow(['Late', reportData.overallStatistics.lateCount]);

  return Buffer.from(await workbook.xlsx.writeBuffer());
};