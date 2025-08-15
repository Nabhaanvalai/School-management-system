import request from "supertest";
import app from "../../server";
import { AttendanceService } from '../../services/attendanceService';
import { AuthService } from "../../services/authService";

// Mock the services
jest.mock("../../services/attendanceService");
jest.mock("../../services/authService");

const MockedAttendanceService = AttendanceService as jest.Mocked<
  typeof AttendanceService
>;
const MockedAuthService = AuthService as jest.Mocked<typeof AuthService>;

describe("Attendance Routes", () => {
  const mockTeacherToken = "mock-teacher-token";
  const mockStudentToken = "mock-student-token";
  const mockAdminToken = "mock-admin-token";

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock JWT validation for teacher
    MockedAuthService.validateAccessToken.mockImplementation((token) => {
      if (token === mockTeacherToken) {
        return {
          isValid: true,
          payload: {
            userId: "teacher123",
            email: "teacher@school.com",
            role: "teacher",
          },
        };
      }
      if (token === mockStudentToken) {
        return {
          isValid: true,
          payload: {
            userId: "student123",
            email: "student@school.com",
            role: "student",
          },
        };
      }
      if (token === mockAdminToken) {
        return {
          isValid: true,
          payload: {
            userId: "admin123",
            email: "admin@school.com",
            role: "admin",
          },
        };
      }
      return { isValid: false };
    });

    // Mock user lookup
    MockedAuthService.getUserById.mockImplementation((userId) => {
      const users = {
        teacher123: { _id: "teacher123", isActive: true, role: "teacher" },
        student123: { _id: "student123", isActive: true, role: "student" },
        admin123: { _id: "admin123", isActive: true, role: "admin" },
      };
      return Promise.resolve(users[userId as keyof typeof users] as any);
    });
  });

  describe("POST /api/attendance/mark", () => {
    const validAttendanceData = {
      studentId: "student123",
      classId: "8-A",
      subject: "Mathematics",
      date: "2024-01-15",
      status: "present",
      academicYear: "2024-2025",
    };

    it("should mark attendance successfully for teacher", async () => {
      const mockAttendance = {
        _id: "attendance123",
        ...validAttendanceData,
        teacherId: "teacher123",
      };

      MockedAttendanceService.markAttendance.mockResolvedValue(
        mockAttendance as any
      );

      const response = await request(app)
        .post("/api/attendance/mark")
        .set("Authorization", `Bearer ${mockTeacherToken}`)
        .send(validAttendanceData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Attendance marked successfully");
      expect(response.body.data).toEqual(mockAttendance);
      expect(MockedAttendanceService.markAttendance).toHaveBeenCalledWith({
        ...validAttendanceData,
        teacherId: "teacher123",
        date: new Date(validAttendanceData.date),
      });
    });

    it("should mark attendance successfully for admin", async () => {
      const mockAttendance = {
        _id: "attendance123",
        ...validAttendanceData,
        teacherId: "admin123",
      };

      MockedAttendanceService.markAttendance.mockResolvedValue(
        mockAttendance as any
      );

      const response = await request(app)
        .post("/api/attendance/mark")
        .set("Authorization", `Bearer ${mockAdminToken}`)
        .send(validAttendanceData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it("should reject request from student", async () => {
      const response = await request(app)
        .post("/api/attendance/mark")
        .set("Authorization", `Bearer ${mockStudentToken}`)
        .send(validAttendanceData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Only teachers and admins can mark attendance"
      );
    });

    it("should reject request without authentication", async () => {
      const response = await request(app)
        .post("/api/attendance/mark")
        .send(validAttendanceData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should validate required fields", async () => {
      const invalidData = {
        studentId: "student123",
        // missing classId, subject, date, status, academicYear
      };

      const response = await request(app)
        .post("/api/attendance/mark")
        .set("Authorization", `Bearer ${mockTeacherToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });

    it("should handle service errors", async () => {
      MockedAttendanceService.markAttendance.mockRejectedValue(
        new Error("Teacher is not assigned to this class")
      );

      const response = await request(app)
        .post("/api/attendance/mark")
        .set("Authorization", `Bearer ${mockTeacherToken}`)
        .send(validAttendanceData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Teacher is not assigned to this class"
      );
    });
  });

  describe("GET /api/attendance/student/:id", () => {
    it("should allow student to view their own attendance", async () => {
      const mockResult = {
        records: [
          {
            _id: "attendance123",
            studentId: "student123",
            status: "present",
            date: "2024-01-15",
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1,
        },
      };

      MockedAttendanceService.getStudentAttendance.mockResolvedValue(
        mockResult as any
      );

      const response = await request(app)
        .get("/api/attendance/student/student123")
        .set("Authorization", `Bearer ${mockStudentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResult);
    });

    it("should prevent student from viewing other student attendance", async () => {
      const response = await request(app)
        .get("/api/attendance/student/other-student")
        .set("Authorization", `Bearer ${mockStudentToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Students can only view their own attendance"
      );
    });

    it("should allow teacher to view any student attendance", async () => {
      const mockResult = {
        records: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 },
      };

      MockedAttendanceService.getStudentAttendance.mockResolvedValue(
        mockResult as any
      );

      const response = await request(app)
        .get("/api/attendance/student/any-student")
        .set("Authorization", `Bearer ${mockTeacherToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should handle query parameters", async () => {
      const mockResult = {
        records: [],
        pagination: { page: 2, limit: 5, total: 0, pages: 0 },
      };

      MockedAttendanceService.getStudentAttendance.mockResolvedValue(
        mockResult as any
      );

      const response = await request(app)
        .get("/api/attendance/student/student123")
        .query({
          subject: "Mathematics",
          startDate: "2024-01-01",
          endDate: "2024-01-31",
          page: "2",
          limit: "5",
        })
        .set("Authorization", `Bearer ${mockTeacherToken}`);

      expect(response.status).toBe(200);
      expect(MockedAttendanceService.getStudentAttendance).toHaveBeenCalledWith(
        "student123",
        expect.objectContaining({
          subject: "Mathematics",
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-31"),
          page: 2,
          limit: 5,
        })
      );
    });
  });

  describe("GET /api/attendance/class/:classId/subject/:subject", () => {
    it("should allow teacher to view class attendance", async () => {
      const mockResult = {
        records: [
          {
            _id: "attendance123",
            classId: "8-A",
            subject: "Mathematics",
            status: "present",
          },
        ],
        pagination: { page: 1, limit: 50, total: 1, pages: 1 },
      };

      MockedAttendanceService.getClassAttendance.mockResolvedValue(
        mockResult as any
      );

      const response = await request(app)
        .get("/api/attendance/class/8-A/subject/Mathematics")
        .set("Authorization", `Bearer ${mockTeacherToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResult);
      expect(MockedAttendanceService.getClassAttendance).toHaveBeenCalledWith(
        "8-A",
        "Mathematics",
        expect.objectContaining({
          page: 1,
          limit: 50,
        })
      );
    });

    it("should reject request from student", async () => {
      const response = await request(app)
        .get("/api/attendance/class/8-A/subject/Mathematics")
        .set("Authorization", `Bearer ${mockStudentToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Only teachers and admins can view class attendance"
      );
    });

    it("should validate class ID format", async () => {
      const response = await request(app)
        .get("/api/attendance/class/invalid-class/subject/Mathematics")
        .set("Authorization", `Bearer ${mockTeacherToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });
  });

  describe("GET /api/attendance/student/:id/percentage", () => {
    it("should calculate attendance percentage", async () => {
      const mockResult = {
        totalDays: 20,
        presentDays: 16,
        absentDays: 4,
        percentage: 80,
      };

      MockedAttendanceService.calculateAttendancePercentage.mockResolvedValue(
        mockResult
      );

      const response = await request(app)
        .get("/api/attendance/student/student123/percentage")
        .set("Authorization", `Bearer ${mockTeacherToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResult);
    });
  });

  describe("PUT /api/attendance/:id", () => {
    it("should update attendance successfully", async () => {
      const mockUpdatedAttendance = {
        _id: "attendance123",
        status: "late",
        remarks: "Updated status",
      };

      MockedAttendanceService.updateAttendance.mockResolvedValue(
        mockUpdatedAttendance as any
      );

      const response = await request(app)
        .put("/api/attendance/attendance123")
        .set("Authorization", `Bearer ${mockTeacherToken}`)
        .send({
          status: "late",
          remarks: "Updated status",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockUpdatedAttendance);
      expect(MockedAttendanceService.updateAttendance).toHaveBeenCalledWith(
        "attendance123",
        "teacher123",
        {
          status: "late",
          remarks: "Updated status",
        }
      );
    });

    it("should validate status values", async () => {
      const response = await request(app)
        .put("/api/attendance/attendance123")
        .set("Authorization", `Bearer ${mockTeacherToken}`)
        .send({
          status: "invalid-status",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
    });
  });
});
