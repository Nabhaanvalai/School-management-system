import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Exam, IExam, SubjectExam, StudentMarks, StudentResult } from '../models/Exam';
import { Student } from '../models/Student';

// Create a new exam
export const createExam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, academicYear, classId, examType, subjects } = req.body;

    // Validate that the class exists by checking if there are students in that class
    const studentsInClass = await Student.find({ 
      standard: classId.split('-')[0], 
      section: classId.split('-')[1],
      status: 'active'
    });

    if (studentsInClass.length === 0) {
      res.status(400).json({
        status: 'error',
        message: 'No active students found in the specified class'
      });
      return;
    }

    // Create the exam
    const exam = new Exam({
      name,
      academicYear,
      classId,
      examType,
      subjects: subjects || [],
      createdBy: req.user!.id
    });

    await exam.save();

    res.status(201).json({
      status: 'success',
      message: 'Exam created successfully',
      data: {
        exam
      }
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({
        status: 'error',
        message: 'An exam with this name already exists for the specified class, type, and academic year'
      });
      return;
    }
    next(error);
  }
};

// Get all exams with optional filtering
export const getExams = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { 
      academicYear, 
      classId, 
      examType, 
      isActive = 'true',
      isResultPublished,
      page = '1',
      limit = '10'
    } = req.query;

    // Build filter object
    const filter: any = {};
    
    if (academicYear) filter.academicYear = academicYear;
    if (classId) filter.classId = classId;
    if (examType) filter.examType = examType;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (isResultPublished !== undefined) filter.isResultPublished = isResultPublished === 'true';

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Get exams with pagination
    const exams = await Exam.find(filter)
      .populate('createdBy', 'email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const totalExams = await Exam.countDocuments(filter);
    const totalPages = Math.ceil(totalExams / limitNum);

    res.status(200).json({
      status: 'success',
      data: {
        exams,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalExams,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get a specific exam by ID
export const getExamById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const exam = await Exam.findById(id)
      .populate('createdBy', 'email')
      .populate('results.studentId', 'name rollNo');

    if (!exam) {
      res.status(404).json({
        status: 'error',
        message: 'Exam not found'
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: {
        exam
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update an exam
export const updateExam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Don't allow updating results through this endpoint
    delete updates.results;
    delete updates.createdBy;

    const exam = await Exam.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'email');

    if (!exam) {
      res.status(404).json({
        status: 'error',
        message: 'Exam not found'
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'Exam updated successfully',
      data: {
        exam
      }
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({
        status: 'error',
        message: 'An exam with this name already exists for the specified class, type, and academic year'
      });
      return;
    }
    next(error);
  }
};

// Delete an exam (soft delete by setting isActive to false)
export const deleteExam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const exam = await Exam.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!exam) {
      res.status(404).json({
        status: 'error',
        message: 'Exam not found'
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'Exam deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Add subject to an exam
export const addSubjectToExam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const subjectData: SubjectExam = req.body;

    const exam = await Exam.findById(id);

    if (!exam) {
      res.status(404).json({
        status: 'error',
        message: 'Exam not found'
      });
      return;
    }

    // Check if results are already published
    if (exam.isResultPublished) {
      res.status(400).json({
        status: 'error',
        message: 'Cannot modify exam after results are published'
      });
      return;
    }

    exam.addSubject(subjectData);
    await exam.save();

    res.status(200).json({
      status: 'success',
      message: 'Subject added to exam successfully',
      data: {
        exam
      }
    });
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      res.status(400).json({
        status: 'error',
        message: error.message
      });
      return;
    }
    next(error);
  }
};

// Remove subject from an exam
export const removeSubjectFromExam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, subject } = req.params;

    const exam = await Exam.findById(id);

    if (!exam) {
      res.status(404).json({
        status: 'error',
        message: 'Exam not found'
      });
      return;
    }

    // Check if results are already published
    if (exam.isResultPublished) {
      res.status(400).json({
        status: 'error',
        message: 'Cannot modify exam after results are published'
      });
      return;
    }

    exam.removeSubject(subject);
    await exam.save();

    res.status(200).json({
      status: 'success',
      message: 'Subject removed from exam successfully',
      data: {
        exam
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get exams by class
export const getExamsByClass = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { classId } = req.params;
    const { academicYear } = req.query;

    const exams = await (Exam as any).findByClass(classId, academicYear as string);

    res.status(200).json({
      status: 'success',
      data: {
        exams
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get upcoming exams
export const getUpcomingExams = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { classId, days = '30' } = req.query;
    
    const daysAhead = parseInt(days as string);
    const currentDate = new Date();
    const futureDate = new Date();
    futureDate.setDate(currentDate.getDate() + daysAhead);

    const filter: any = {
      isActive: true,
      'subjects.date': {
        $gte: currentDate,
        $lte: futureDate
      }
    };

    if (classId) {
      filter.classId = classId;
    }

    const exams = await Exam.find(filter)
      .populate('createdBy', 'email')
      .sort({ 'subjects.date': 1 });

    // Filter and sort subjects by upcoming dates
    const upcomingExams = exams.map(exam => {
      const upcomingSubjects = exam.subjects
        .filter(subject => subject.date >= currentDate && subject.date <= futureDate)
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      return {
        ...exam.toJSON(),
        subjects: upcomingSubjects
      };
    }).filter(exam => exam.subjects.length > 0);

    res.status(200).json({
      status: 'success',
      data: {
        exams: upcomingExams
      }
    });
  } catch (error) {
    next(error);
  }
};

// Enter marks for students in an exam
export const enterMarks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { studentMarks } = req.body; // Array of { studentId, marks: [{ subject, marksObtained }] }

    const exam = await Exam.findById(id);

    if (!exam) {
      res.status(404).json({
        status: 'error',
        message: 'Exam not found'
      });
      return;
    }

    // Validate that all subjects in marks exist in the exam
    const examSubjects = exam.subjects.map(s => s.subject.toLowerCase());
    
    for (const studentMark of studentMarks) {
      for (const mark of studentMark.marks) {
        if (!examSubjects.includes(mark.subject.toLowerCase())) {
          res.status(400).json({
            status: 'error',
            message: `Subject "${mark.subject}" not found in this exam`
          });
          return;
        }

        // Validate marks don't exceed maximum marks for the subject
        const subjectInfo = exam.subjects.find(s => s.subject.toLowerCase() === mark.subject.toLowerCase());
        if (subjectInfo && mark.marksObtained > subjectInfo.maxMarks) {
          res.status(400).json({
            status: 'error',
            message: `Marks for ${mark.subject} cannot exceed maximum marks of ${subjectInfo.maxMarks}`
          });
          return;
        }
      }
    }

    // Process each student's marks
    for (const studentMark of studentMarks) {
      const { studentId, marks } = studentMark;

      // Verify student exists
      const student = await Student.findById(studentId);
      if (!student) {
        res.status(400).json({
          status: 'error',
          message: `Student with ID ${studentId} not found`
        });
        return;
      }

      // Calculate grades for each subject
      const processedMarks: StudentMarks[] = marks.map((mark: any) => {
        const subjectInfo = exam.subjects.find(s => s.subject.toLowerCase() === mark.subject.toLowerCase());
        const percentage = subjectInfo ? (mark.marksObtained / subjectInfo.maxMarks) * 100 : 0;
        const grade = exam.calculateGrade(percentage);

        return {
          subject: mark.subject,
          marksObtained: mark.marksObtained,
          grade,
          remarks: mark.remarks || ''
        };
      });

      // Calculate total marks and percentage
      const totalMarks = processedMarks.reduce((sum, mark) => sum + mark.marksObtained, 0);
      const maxMarks = exam.getTotalMaxMarks();
      const percentage = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100) : 0;
      const overallGrade = exam.calculateGrade(percentage);

      // Create or update student result
      const studentResult: StudentResult = {
        studentId: new mongoose.Types.ObjectId(studentId),
        marks: processedMarks,
        totalMarks,
        percentage,
        overallGrade,
        rank: 0 // Will be calculated when results are published
      };

      exam.addStudentResult(studentResult);
    }

    await exam.save();

    res.status(200).json({
      status: 'success',
      message: 'Marks entered successfully',
      data: {
        exam: await exam.populate('results.studentId', 'name rollNo')
      }
    });
  } catch (error) {
    next(error);
  }
};

// Publish exam results (calculate ranks)
export const publishResults = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const exam = await Exam.findById(id);

    if (!exam) {
      res.status(404).json({
        status: 'error',
        message: 'Exam not found'
      });
      return;
    }

    if (exam.results.length === 0) {
      res.status(400).json({
        status: 'error',
        message: 'No marks entered for this exam'
      });
      return;
    }

    exam.publishResults();
    await exam.save();

    res.status(200).json({
      status: 'success',
      message: 'Results published successfully',
      data: {
        exam: await exam.populate('results.studentId', 'name rollNo')
      }
    });
  } catch (error) {
    next(error);
  }
};