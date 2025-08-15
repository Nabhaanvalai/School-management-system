"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const calendarController_1 = require("../controllers/calendarController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const express_validator_1 = require("express-validator");
const validationSchemas_1 = require("../middleware/validationSchemas");
const router = express_1.default.Router();
// Validation schemas
const createEventValidation = [
    (0, express_validator_1.body)('title')
        .trim()
        .isLength({ min: 3, max: 200 })
        .withMessage('Title must be between 3 and 200 characters'),
    (0, express_validator_1.body)('description')
        .trim()
        .isLength({ min: 1, max: 1000 })
        .withMessage('Description must be between 1 and 1000 characters'),
    (0, express_validator_1.body)('eventType')
        .isIn(['holiday', 'exam', 'sports-day', 'annual-day', 'parent-meeting', 'workshop', 'other'])
        .withMessage('Invalid event type'),
    (0, express_validator_1.body)('startDate')
        .isISO8601()
        .withMessage('Start date must be a valid date'),
    (0, express_validator_1.body)('endDate')
        .isISO8601()
        .withMessage('End date must be a valid date')
        .custom((endDate, { req }) => {
        if (new Date(endDate) < new Date(req.body.startDate)) {
            throw new Error('End date must be on or after start date');
        }
        return true;
    }),
    (0, express_validator_1.body)('isAllDay')
        .optional()
        .isBoolean()
        .withMessage('isAllDay must be a boolean'),
    (0, express_validator_1.body)('startTime')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Start time must be in HH:MM format'),
    (0, express_validator_1.body)('endTime')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('End time must be in HH:MM format'),
    (0, express_validator_1.body)('location')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Location must be less than 200 characters'),
    (0, express_validator_1.body)('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'critical'])
        .withMessage('Invalid priority level'),
    (0, express_validator_1.body)('isRecurring')
        .optional()
        .isBoolean()
        .withMessage('isRecurring must be a boolean'),
    (0, express_validator_1.body)('recurringPattern')
        .optional()
        .isIn(['daily', 'weekly', 'monthly', 'yearly'])
        .withMessage('Invalid recurring pattern'),
    (0, express_validator_1.body)('recurringEndDate')
        .optional()
        .isISO8601()
        .withMessage('Recurring end date must be a valid date'),
    (0, express_validator_1.body)('academicYear')
        .matches(/^\d{4}-\d{4}$/)
        .withMessage('Academic year must be in format "YYYY-YYYY"')
        .custom((value) => {
        const [startYear, endYear] = value.split('-').map(Number);
        if (endYear !== startYear + 1 || startYear < 2000 || startYear > new Date().getFullYear() + 5) {
            throw new Error('Invalid academic year range');
        }
        return true;
    }),
    (0, express_validator_1.body)('targetAudience')
        .isArray({ min: 1 })
        .withMessage('Target audience must be a non-empty array')
        .custom((audiences) => {
        const validAudiences = ['all', 'students', 'teachers', 'parents', 'staff'];
        const invalidAudiences = audiences.filter((aud) => !validAudiences.includes(aud));
        if (invalidAudiences.length > 0) {
            throw new Error(`Invalid target audience: ${invalidAudiences.join(', ')}`);
        }
        if (audiences.includes('all') && audiences.length > 1) {
            throw new Error('Cannot specify other audiences when "all" is selected');
        }
        return true;
    }),
    (0, express_validator_1.body)('classIds')
        .optional()
        .isArray()
        .withMessage('Class IDs must be an array')
        .custom((classIds) => {
        if (classIds && classIds.length > 0) {
            const invalidIds = classIds.filter((id) => !/^[1-9][0-2]?-[A-F]$/.test(id));
            if (invalidIds.length > 0) {
                throw new Error(`Invalid class ID format: ${invalidIds.join(', ')}`);
            }
        }
        return true;
    }),
    validationSchemas_1.handleValidationErrors
];
const updateEventValidation = [
    (0, express_validator_1.param)('id')
        .isMongoId()
        .withMessage('Invalid event ID'),
    (0, express_validator_1.body)('title')
        .optional()
        .trim()
        .isLength({ min: 3, max: 200 })
        .withMessage('Title must be between 3 and 200 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .trim()
        .isLength({ min: 1, max: 1000 })
        .withMessage('Description must be between 1 and 1000 characters'),
    (0, express_validator_1.body)('eventType')
        .optional()
        .isIn(['holiday', 'exam', 'sports-day', 'annual-day', 'parent-meeting', 'workshop', 'other'])
        .withMessage('Invalid event type'),
    (0, express_validator_1.body)('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid date'),
    (0, express_validator_1.body)('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid date'),
    (0, express_validator_1.body)('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'critical'])
        .withMessage('Invalid priority level'),
    (0, express_validator_1.body)('academicYear')
        .optional()
        .matches(/^\d{4}-\d{4}$/)
        .withMessage('Academic year must be in format "YYYY-YYYY"'),
    (0, express_validator_1.body)('targetAudience')
        .optional()
        .isArray({ min: 1 })
        .withMessage('Target audience must be a non-empty array'),
    validationSchemas_1.handleValidationErrors
];
const getEventValidation = [
    (0, express_validator_1.param)('id')
        .isMongoId()
        .withMessage('Invalid event ID'),
    validationSchemas_1.handleValidationErrors
];
const getEventsByTypeValidation = [
    (0, express_validator_1.param)('eventType')
        .isIn(['holiday', 'exam', 'sports-day', 'annual-day', 'parent-meeting', 'workshop', 'other'])
        .withMessage('Invalid event type'),
    (0, express_validator_1.query)('academicYear')
        .optional()
        .matches(/^\d{4}-\d{4}$/)
        .withMessage('Academic year must be in format "YYYY-YYYY"'),
    validationSchemas_1.handleValidationErrors
];
const getEventsValidation = [
    (0, express_validator_1.query)('academicYear')
        .optional()
        .matches(/^\d{4}-\d{4}$/)
        .withMessage('Academic year must be in format "YYYY-YYYY"'),
    (0, express_validator_1.query)('eventType')
        .optional()
        .isIn(['holiday', 'exam', 'sports-day', 'annual-day', 'parent-meeting', 'workshop', 'other'])
        .withMessage('Invalid event type'),
    (0, express_validator_1.query)('targetAudience')
        .optional()
        .isIn(['all', 'students', 'teachers', 'parents', 'staff'])
        .withMessage('Invalid target audience'),
    (0, express_validator_1.query)('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'critical'])
        .withMessage('Invalid priority level'),
    (0, express_validator_1.query)('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid date'),
    (0, express_validator_1.query)('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid date'),
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('upcoming')
        .optional()
        .isInt({ min: 1, max: 365 })
        .withMessage('Upcoming days must be between 1 and 365'),
    validationSchemas_1.handleValidationErrors
];
// Routes
// POST /api/calendar - Create a new calendar event (Admin only)
router.post('/', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin']), createEventValidation, calendarController_1.createCalendarEvent);
// GET /api/calendar - Get calendar events with filtering
router.get('/', authMiddleware_1.authenticateToken, getEventsValidation, calendarController_1.getCalendarEvents);
// GET /api/calendar/upcoming - Get upcoming events
router.get('/upcoming', authMiddleware_1.authenticateToken, (0, express_validator_1.query)('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365'), (0, express_validator_1.query)('academicYear')
    .optional()
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format "YYYY-YYYY"'), (0, express_validator_1.query)('targetAudience')
    .optional()
    .isIn(['all', 'students', 'teachers', 'parents', 'staff'])
    .withMessage('Invalid target audience'), validationSchemas_1.handleValidationErrors, calendarController_1.getUpcomingEvents);
// GET /api/calendar/holidays - Get holidays
router.get('/holidays', authMiddleware_1.authenticateToken, (0, express_validator_1.query)('academicYear')
    .optional()
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format "YYYY-YYYY"'), validationSchemas_1.handleValidationErrors, calendarController_1.getHolidays);
// GET /api/calendar/type/:eventType - Get events by type
router.get('/type/:eventType', authMiddleware_1.authenticateToken, getEventsByTypeValidation, calendarController_1.getEventsByType);
// GET /api/calendar/:id - Get a specific calendar event
router.get('/:id', authMiddleware_1.authenticateToken, getEventValidation, calendarController_1.getCalendarEventById);
// PUT /api/calendar/:id - Update a calendar event (Admin only)
router.put('/:id', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin']), updateEventValidation, calendarController_1.updateCalendarEvent);
// DELETE /api/calendar/:id - Delete (deactivate) a calendar event (Admin only)
router.delete('/:id', authMiddleware_1.authenticateToken, (0, authMiddleware_1.requireRole)(['admin']), (0, express_validator_1.param)('id')
    .isMongoId()
    .withMessage('Invalid event ID'), validationSchemas_1.handleValidationErrors, calendarController_1.deleteCalendarEvent);
exports.default = router;
//# sourceMappingURL=calendarRoutes.js.map