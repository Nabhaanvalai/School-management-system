import express from 'express';
import {
  createCalendarEvent,
  getCalendarEvents,
  getCalendarEventById,
  updateCalendarEvent,
  deleteCalendarEvent,
  getEventsByType,
  getHolidays,
  getUpcomingEvents
} from '../controllers/calendarController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';
import { body, param, query } from 'express-validator';
import { handleValidationErrors } from '../middleware/validationSchemas';

const router = express.Router();

// Validation schemas
const createEventValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description must be between 1 and 1000 characters'),
  body('eventType')
    .isIn(['holiday', 'exam', 'sports-day', 'annual-day', 'parent-meeting', 'workshop', 'other'])
    .withMessage('Invalid event type'),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((endDate, { req }) => {
      if (new Date(endDate) < new Date(req.body.startDate)) {
        throw new Error('End date must be on or after start date');
      }
      return true;
    }),
  body('isAllDay')
    .optional()
    .isBoolean()
    .withMessage('isAllDay must be a boolean'),
  body('startTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  body('endTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Location must be less than 200 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid priority level'),
  body('isRecurring')
    .optional()
    .isBoolean()
    .withMessage('isRecurring must be a boolean'),
  body('recurringPattern')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'yearly'])
    .withMessage('Invalid recurring pattern'),
  body('recurringEndDate')
    .optional()
    .isISO8601()
    .withMessage('Recurring end date must be a valid date'),
  body('academicYear')
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format "YYYY-YYYY"')
    .custom((value) => {
      const [startYear, endYear] = value.split('-').map(Number);
      if (endYear !== startYear + 1 || startYear < 2000 || startYear > new Date().getFullYear() + 5) {
        throw new Error('Invalid academic year range');
      }
      return true;
    }),
  body('targetAudience')
    .isArray({ min: 1 })
    .withMessage('Target audience must be a non-empty array')
    .custom((audiences) => {
      const validAudiences = ['all', 'students', 'teachers', 'parents', 'staff'];
      const invalidAudiences = audiences.filter((aud: string) => !validAudiences.includes(aud));
      if (invalidAudiences.length > 0) {
        throw new Error(`Invalid target audience: ${invalidAudiences.join(', ')}`);
      }
      if (audiences.includes('all') && audiences.length > 1) {
        throw new Error('Cannot specify other audiences when "all" is selected');
      }
      return true;
    }),
  body('classIds')
    .optional()
    .isArray()
    .withMessage('Class IDs must be an array')
    .custom((classIds) => {
      if (classIds && classIds.length > 0) {
        const invalidIds = classIds.filter((id: string) => !/^[1-9][0-2]?-[A-F]$/.test(id));
        if (invalidIds.length > 0) {
          throw new Error(`Invalid class ID format: ${invalidIds.join(', ')}`);
        }
      }
      return true;
    }),
  handleValidationErrors
];

const updateEventValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid event ID'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description must be between 1 and 1000 characters'),
  body('eventType')
    .optional()
    .isIn(['holiday', 'exam', 'sports-day', 'annual-day', 'parent-meeting', 'workshop', 'other'])
    .withMessage('Invalid event type'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid priority level'),
  body('academicYear')
    .optional()
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format "YYYY-YYYY"'),
  body('targetAudience')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Target audience must be a non-empty array'),
  handleValidationErrors
];

const getEventValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid event ID'),
  handleValidationErrors
];

const getEventsByTypeValidation = [
  param('eventType')
    .isIn(['holiday', 'exam', 'sports-day', 'annual-day', 'parent-meeting', 'workshop', 'other'])
    .withMessage('Invalid event type'),
  query('academicYear')
    .optional()
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format "YYYY-YYYY"'),
  handleValidationErrors
];

const getEventsValidation = [
  query('academicYear')
    .optional()
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format "YYYY-YYYY"'),
  query('eventType')
    .optional()
    .isIn(['holiday', 'exam', 'sports-day', 'annual-day', 'parent-meeting', 'workshop', 'other'])
    .withMessage('Invalid event type'),
  query('targetAudience')
    .optional()
    .isIn(['all', 'students', 'teachers', 'parents', 'staff'])
    .withMessage('Invalid target audience'),
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid priority level'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('upcoming')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Upcoming days must be between 1 and 365'),
  handleValidationErrors
];

// Routes

// POST /api/calendar - Create a new calendar event (Admin only)
router.post(
  '/',
  authenticateToken,
  requireRole(['admin']),
  createEventValidation,
  createCalendarEvent
);

// GET /api/calendar - Get calendar events with filtering
router.get(
  '/',
  authenticateToken,
  getEventsValidation,
  getCalendarEvents
);

// GET /api/calendar/upcoming - Get upcoming events
router.get(
  '/upcoming',
  authenticateToken,
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365'),
  query('academicYear')
    .optional()
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format "YYYY-YYYY"'),
  query('targetAudience')
    .optional()
    .isIn(['all', 'students', 'teachers', 'parents', 'staff'])
    .withMessage('Invalid target audience'),
  handleValidationErrors,
  getUpcomingEvents
);

// GET /api/calendar/holidays - Get holidays
router.get(
  '/holidays',
  authenticateToken,
  query('academicYear')
    .optional()
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format "YYYY-YYYY"'),
  handleValidationErrors,
  getHolidays
);

// GET /api/calendar/type/:eventType - Get events by type
router.get(
  '/type/:eventType',
  authenticateToken,
  getEventsByTypeValidation,
  getEventsByType
);

// GET /api/calendar/:id - Get a specific calendar event
router.get(
  '/:id',
  authenticateToken,
  getEventValidation,
  getCalendarEventById
);

// PUT /api/calendar/:id - Update a calendar event (Admin only)
router.put(
  '/:id',
  authenticateToken,
  requireRole(['admin']),
  updateEventValidation,
  updateCalendarEvent
);

// DELETE /api/calendar/:id - Delete (deactivate) a calendar event (Admin only)
router.delete(
  '/:id',
  authenticateToken,
  requireRole(['admin']),
  param('id')
    .isMongoId()
    .withMessage('Invalid event ID'),
  handleValidationErrors,
  deleteCalendarEvent
);

export default router;