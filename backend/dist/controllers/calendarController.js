"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUpcomingEvents = exports.getHolidays = exports.getEventsByType = exports.deleteCalendarEvent = exports.updateCalendarEvent = exports.getCalendarEventById = exports.getCalendarEvents = exports.createCalendarEvent = void 0;
const AcademicCalendar_1 = require("../models/AcademicCalendar");
// Create a new calendar event
const createCalendarEvent = async (req, res) => {
    try {
        const { title, description, eventType, startDate, endDate, isAllDay = true, startTime, endTime, location, priority = 'medium', isRecurring = false, recurringPattern, recurringEndDate, academicYear, targetAudience, classIds } = req.body;
        // Validate required fields
        if (!title || !description || !eventType || !startDate || !endDate || !academicYear || !targetAudience) {
            res.status(400).json({
                success: false,
                message: 'Missing required fields: title, description, eventType, startDate, endDate, academicYear, targetAudience'
            });
            return;
        }
        // Create new calendar event
        const calendarEvent = new AcademicCalendar_1.AcademicCalendar({
            title,
            description,
            eventType,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            isAllDay,
            startTime,
            endTime,
            location,
            priority,
            isRecurring,
            recurringPattern,
            recurringEndDate: recurringEndDate ? new Date(recurringEndDate) : undefined,
            academicYear,
            targetAudience: Array.isArray(targetAudience) ? targetAudience : [targetAudience],
            classIds: classIds || [],
            createdBy: req.user.id
        });
        const savedEvent = await calendarEvent.save();
        res.status(201).json({
            success: true,
            message: 'Calendar event created successfully',
            data: savedEvent
        });
    }
    catch (error) {
        console.error('Error creating calendar event:', error);
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map((err) => err.message);
            res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: validationErrors
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error while creating calendar event'
        });
    }
};
exports.createCalendarEvent = createCalendarEvent;
// Get calendar events with filtering options
const getCalendarEvents = async (req, res) => {
    try {
        const { academicYear, eventType, targetAudience, classId, startDate, endDate, priority, isActive = 'true', upcoming, page = '1', limit = '50' } = req.query;
        // Build query object
        const query = {};
        // Filter by active status
        if (isActive !== 'all') {
            query.isActive = isActive === 'true';
        }
        // Filter by academic year
        if (academicYear) {
            query.academicYear = academicYear;
        }
        // Filter by event type
        if (eventType) {
            query.eventType = eventType;
        }
        // Filter by priority
        if (priority) {
            query.priority = priority;
        }
        // Filter by target audience
        if (targetAudience) {
            query.$or = [
                { targetAudience: 'all' },
                { targetAudience: targetAudience }
            ];
        }
        // Filter by class ID
        if (classId) {
            query.$or = [
                { targetAudience: 'all' },
                { targetAudience: 'students', classIds: { $in: [classId] } },
                { targetAudience: 'students', classIds: { $exists: false } },
                { targetAudience: 'students', classIds: { $size: 0 } }
            ];
        }
        // Filter by date range
        if (startDate && endDate) {
            query.$and = [
                { startDate: { $lte: new Date(endDate) } },
                { endDate: { $gte: new Date(startDate) } }
            ];
        }
        else if (startDate) {
            query.startDate = { $gte: new Date(startDate) };
        }
        else if (endDate) {
            query.endDate = { $lte: new Date(endDate) };
        }
        // Filter for upcoming events
        if (upcoming) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const daysAhead = parseInt(upcoming) || 7;
            const futureDate = new Date(today);
            futureDate.setDate(today.getDate() + daysAhead);
            futureDate.setHours(23, 59, 59, 999);
            query.startDate = { $gte: today, $lte: futureDate };
        }
        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Execute query with pagination
        const events = await AcademicCalendar_1.AcademicCalendar.find(query)
            .populate('createdBy', 'email role')
            .sort({ startDate: 1, priority: -1 })
            .skip(skip)
            .limit(limitNum);
        // Get total count for pagination
        const totalEvents = await AcademicCalendar_1.AcademicCalendar.countDocuments(query);
        const totalPages = Math.ceil(totalEvents / limitNum);
        res.status(200).json({
            success: true,
            message: 'Calendar events retrieved successfully',
            data: events,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalEvents,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            }
        });
    }
    catch (error) {
        console.error('Error retrieving calendar events:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving calendar events'
        });
    }
};
exports.getCalendarEvents = getCalendarEvents;
// Get a specific calendar event by ID
const getCalendarEventById = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await AcademicCalendar_1.AcademicCalendar.findById(id).populate('createdBy', 'email role');
        if (!event) {
            res.status(404).json({
                success: false,
                message: 'Calendar event not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Calendar event retrieved successfully',
            data: event
        });
    }
    catch (error) {
        console.error('Error retrieving calendar event:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving calendar event'
        });
    }
};
exports.getCalendarEventById = getCalendarEventById;
// Update a calendar event
const updateCalendarEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        // Remove fields that shouldn't be updated directly
        delete updateData.createdBy;
        delete updateData.createdAt;
        delete updateData.updatedAt;
        // Convert date strings to Date objects if provided
        if (updateData.startDate) {
            updateData.startDate = new Date(updateData.startDate);
        }
        if (updateData.endDate) {
            updateData.endDate = new Date(updateData.endDate);
        }
        if (updateData.recurringEndDate) {
            updateData.recurringEndDate = new Date(updateData.recurringEndDate);
        }
        // Ensure targetAudience is an array
        if (updateData.targetAudience && !Array.isArray(updateData.targetAudience)) {
            updateData.targetAudience = [updateData.targetAudience];
        }
        const updatedEvent = await AcademicCalendar_1.AcademicCalendar.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true
        }).populate('createdBy', 'email role');
        if (!updatedEvent) {
            res.status(404).json({
                success: false,
                message: 'Calendar event not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Calendar event updated successfully',
            data: updatedEvent
        });
    }
    catch (error) {
        console.error('Error updating calendar event:', error);
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map((err) => err.message);
            res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: validationErrors
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error while updating calendar event'
        });
    }
};
exports.updateCalendarEvent = updateCalendarEvent;
// Delete (deactivate) a calendar event
const deleteCalendarEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await AcademicCalendar_1.AcademicCalendar.findByIdAndUpdate(id, { isActive: false }, { new: true });
        if (!event) {
            res.status(404).json({
                success: false,
                message: 'Calendar event not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Calendar event deleted successfully',
            data: event
        });
    }
    catch (error) {
        console.error('Error deleting calendar event:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while deleting calendar event'
        });
    }
};
exports.deleteCalendarEvent = deleteCalendarEvent;
// Get events by specific filters
const getEventsByType = async (req, res) => {
    try {
        const { eventType } = req.params;
        const { academicYear } = req.query;
        const query = { eventType, isActive: true };
        if (academicYear) {
            query.academicYear = academicYear;
        }
        const events = await AcademicCalendar_1.AcademicCalendar.find(query)
            .populate('createdBy', 'email role')
            .sort({ startDate: 1 });
        res.status(200).json({
            success: true,
            message: `${eventType} events retrieved successfully`,
            data: events
        });
    }
    catch (error) {
        console.error('Error retrieving events by type:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving events by type'
        });
    }
};
exports.getEventsByType = getEventsByType;
// Get holidays specifically
const getHolidays = async (req, res) => {
    try {
        const { academicYear } = req.query;
        const query = { eventType: 'holiday', isActive: true };
        if (academicYear) {
            query.academicYear = academicYear;
        }
        const holidays = await AcademicCalendar_1.AcademicCalendar.find(query)
            .populate('createdBy', 'email role')
            .sort({ startDate: 1 });
        res.status(200).json({
            success: true,
            message: 'Holidays retrieved successfully',
            data: holidays
        });
    }
    catch (error) {
        console.error('Error retrieving holidays:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving holidays'
        });
    }
};
exports.getHolidays = getHolidays;
// Get upcoming events
const getUpcomingEvents = async (req, res) => {
    try {
        const { days = '7', academicYear, targetAudience } = req.query;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const daysAhead = parseInt(days);
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + daysAhead);
        futureDate.setHours(23, 59, 59, 999);
        const query = {
            startDate: { $gte: today, $lte: futureDate },
            isActive: true
        };
        if (academicYear) {
            query.academicYear = academicYear;
        }
        if (targetAudience) {
            query.$or = [
                { targetAudience: 'all' },
                { targetAudience: targetAudience }
            ];
        }
        const events = await AcademicCalendar_1.AcademicCalendar.find(query)
            .populate('createdBy', 'email role')
            .sort({ startDate: 1, priority: -1 });
        res.status(200).json({
            success: true,
            message: 'Upcoming events retrieved successfully',
            data: events
        });
    }
    catch (error) {
        console.error('Error retrieving upcoming events:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving upcoming events'
        });
    }
};
exports.getUpcomingEvents = getUpcomingEvents;
//# sourceMappingURL=calendarController.js.map