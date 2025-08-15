import { Request, Response } from 'express';
import { AcademicCalendar, IAcademicCalendar } from '../models/AcademicCalendar';
import { UserRole } from '../models/User';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}

// Create a new calendar event
export const createCalendarEvent = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      eventType,
      startDate,
      endDate,
      isAllDay = true,
      startTime,
      endTime,
      location,
      priority = 'medium',
      isRecurring = false,
      recurringPattern,
      recurringEndDate,
      academicYear,
      targetAudience,
      classIds
    } = req.body;

    // Validate required fields
    if (!title || !description || !eventType || !startDate || !endDate || !academicYear || !targetAudience) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: title, description, eventType, startDate, endDate, academicYear, targetAudience'
      });
      return;
    }

    // Create new calendar event
    const calendarEvent = new AcademicCalendar({
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
      createdBy: req.user!.id
    });

    const savedEvent = await calendarEvent.save();

    res.status(201).json({
      success: true,
      message: 'Calendar event created successfully',
      data: savedEvent
    });
  } catch (error: any) {
    console.error('Error creating calendar event:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
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

// Get calendar events with filtering options
export const getCalendarEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      academicYear,
      eventType,
      targetAudience,
      classId,
      startDate,
      endDate,
      priority,
      isActive = 'true',
      upcoming,
      page = '1',
      limit = '50'
    } = req.query;

    // Build query object
    const query: any = {};

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
        { startDate: { $lte: new Date(endDate as string) } },
        { endDate: { $gte: new Date(startDate as string) } }
      ];
    } else if (startDate) {
      query.startDate = { $gte: new Date(startDate as string) };
    } else if (endDate) {
      query.endDate = { $lte: new Date(endDate as string) };
    }

    // Filter for upcoming events
    if (upcoming) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const daysAhead = parseInt(upcoming as string) || 7;
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + daysAhead);
      futureDate.setHours(23, 59, 59, 999);
      
      query.startDate = { $gte: today, $lte: futureDate };
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Execute query with pagination
    const events = await AcademicCalendar.find(query)
      .populate('createdBy', 'email role')
      .sort({ startDate: 1, priority: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const totalEvents = await AcademicCalendar.countDocuments(query);
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
  } catch (error: any) {
    console.error('Error retrieving calendar events:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving calendar events'
    });
  }
};

// Get a specific calendar event by ID
export const getCalendarEventById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const event = await AcademicCalendar.findById(id).populate('createdBy', 'email role');

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
  } catch (error: any) {
    console.error('Error retrieving calendar event:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving calendar event'
    });
  }
};

// Update a calendar event
export const updateCalendarEvent = async (req: RequestWithUser, res: Response): Promise<void> => {
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

    const updatedEvent = await AcademicCalendar.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    ).populate('createdBy', 'email role');

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
  } catch (error: any) {
    console.error('Error updating calendar event:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
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

// Delete (deactivate) a calendar event
export const deleteCalendarEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const event = await AcademicCalendar.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

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
  } catch (error: any) {
    console.error('Error deleting calendar event:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting calendar event'
    });
  }
};

// Get events by specific filters
export const getEventsByType = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventType } = req.params;
    const { academicYear } = req.query;

    const query: any = { eventType, isActive: true };
    
    if (academicYear) {
      query.academicYear = academicYear;
    }

    const events = await AcademicCalendar.find(query)
      .populate('createdBy', 'email role')
      .sort({ startDate: 1 });

    res.status(200).json({
      success: true,
      message: `${eventType} events retrieved successfully`,
      data: events
    });
  } catch (error: any) {
    console.error('Error retrieving events by type:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving events by type'
    });
  }
};

// Get holidays specifically
export const getHolidays = async (req: Request, res: Response): Promise<void> => {
  try {
    const { academicYear } = req.query;

    const query: any = { eventType: 'holiday', isActive: true };
    
    if (academicYear) {
      query.academicYear = academicYear;
    }

    const holidays = await AcademicCalendar.find(query)
      .populate('createdBy', 'email role')
      .sort({ startDate: 1 });

    res.status(200).json({
      success: true,
      message: 'Holidays retrieved successfully',
      data: holidays
    });
  } catch (error: any) {
    console.error('Error retrieving holidays:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving holidays'
    });
  }
};

// Get upcoming events
export const getUpcomingEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { days = '7', academicYear, targetAudience } = req.query;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const daysAhead = parseInt(days as string);
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + daysAhead);
    futureDate.setHours(23, 59, 59, 999);

    const query: any = {
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

    const events = await AcademicCalendar.find(query)
      .populate('createdBy', 'email role')
      .sort({ startDate: 1, priority: -1 });

    res.status(200).json({
      success: true,
      message: 'Upcoming events retrieved successfully',
      data: events
    });
  } catch (error: any) {
    console.error('Error retrieving upcoming events:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving upcoming events'
    });
  }
};