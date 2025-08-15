"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishResults = exports.enterMarks = exports.getUpcomingExams = exports.getExamsByClass = exports.removeSubjectFromExam = exports.addSubjectToExam = exports.deleteExam = exports.updateExam = exports.getExamById = exports.getExams = exports.createExam = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Exam_1 = require("../models/Exam");
const Student_1 = require("../models/Student");
// Create a new exam
const createExam = async (req, res, next) => {
    try {
        const { name, academicYear, classId, examType, subjects } = req.body;
        // Validate that the class exists by checking if there are students in that class
        const studentsInClass = await Student_1.Student.find({
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
        const exam = new Exam_1.Exam({
            name,
            academicYear,
            classId,
            examType,
            subjects: subjects || [],
            createdBy: req.user.id
        });
        await exam.save();
        res.status(201).json({
            status: 'success',
            message: 'Exam created successfully',
            data: {
                exam
            }
        });
    }
    catch (error) {
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
exports.createExam = createExam;
// Get all exams with optional filtering
const getExams = async (req, res, next) => {
    try {
        const { academicYear, classId, examType, isActive = 'true', isResultPublished, page = '1', limit = '10' } = req.query;
        // Build filter object
        const filter = {};
        if (academicYear)
            filter.academicYear = academicYear;
        if (classId)
            filter.classId = classId;
        if (examType)
            filter.examType = examType;
        if (isActive !== undefined)
            filter.isActive = isActive === 'true';
        if (isResultPublished !== undefined)
            filter.isResultPublished = isResultPublished === 'true';
        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Get exams with pagination
        const exams = await Exam_1.Exam.find(filter)
            .populate('createdBy', 'email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);
        // Get total count for pagination
        const totalExams = await Exam_1.Exam.countDocuments(filter);
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
    }
    catch (error) {
        next(error);
    }
};
exports.getExams = getExams;
// Get a specific exam by ID
const getExamById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const exam = await Exam_1.Exam.findById(id)
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
    }
    catch (error) {
        next(error);
    }
};
exports.getExamById = getExamById;
// Update an exam
const updateExam = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        // Don't allow updating results through this endpoint
        delete updates.results;
        delete updates.createdBy;
        const exam = await Exam_1.Exam.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).populate('createdBy', 'email');
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
    }
    catch (error) {
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
exports.updateExam = updateExam;
// Delete an exam (soft delete by setting isActive to false)
const deleteExam = async (req, res, next) => {
    try {
        const { id } = req.params;
        const exam = await Exam_1.Exam.findByIdAndUpdate(id, { isActive: false }, { new: true });
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
    }
    catch (error) {
        next(error);
    }
};
exports.deleteExam = deleteExam;
// Add subject to an exam
const addSubjectToExam = async (req, res, next) => {
    try {
        const { id } = req.params;
        const subjectData = req.body;
        const exam = await Exam_1.Exam.findById(id);
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
    }
    catch (error) {
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
exports.addSubjectToExam = addSubjectToExam;
// Remove subject from an exam
const removeSubjectFromExam = async (req, res, next) => {
    try {
        const { id, subject } = req.params;
        const exam = await Exam_1.Exam.findById(id);
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
    }
    catch (error) {
        next(error);
    }
};
exports.removeSubjectFromExam = removeSubjectFromExam;
// Get exams by class
const getExamsByClass = async (req, res, next) => {
    try {
        const { classId } = req.params;
        const { academicYear } = req.query;
        const exams = await Exam_1.Exam.findByClass(classId, academicYear);
        res.status(200).json({
            status: 'success',
            data: {
                exams
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getExamsByClass = getExamsByClass;
// Get upcoming exams
const getUpcomingExams = async (req, res, next) => {
    try {
        const { classId, days = '30' } = req.query;
        const daysAhead = parseInt(days);
        const currentDate = new Date();
        const futureDate = new Date();
        futureDate.setDate(currentDate.getDate() + daysAhead);
        const filter = {
            isActive: true,
            'subjects.date': {
                $gte: currentDate,
                $lte: futureDate
            }
        };
        if (classId) {
            filter.classId = classId;
        }
        const exams = await Exam_1.Exam.find(filter)
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
    }
    catch (error) {
        next(error);
    }
};
exports.getUpcomingExams = getUpcomingExams;
// Enter marks for students in an exam
const enterMarks = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { studentMarks } = req.body; // Array of { studentId, marks: [{ subject, marksObtained }] }
        const exam = await Exam_1.Exam.findById(id);
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
            const student = await Student_1.Student.findById(studentId);
            if (!student) {
                res.status(400).json({
                    status: 'error',
                    message: `Student with ID ${studentId} not found`
                });
                return;
            }
            // Calculate grades for each subject
            const processedMarks = marks.map((mark) => {
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
            const studentResult = {
                studentId: new mongoose_1.default.Types.ObjectId(studentId),
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
    }
    catch (error) {
        next(error);
    }
};
exports.enterMarks = enterMarks;
// Publish exam results (calculate ranks)
const publishResults = async (req, res, next) => {
    try {
        const { id } = req.params;
        const exam = await Exam_1.Exam.findById(id);
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
    }
    catch (error) {
        next(error);
    }
};
exports.publishResults = publishResults;
//# sourceMappingURL=examController.js.map