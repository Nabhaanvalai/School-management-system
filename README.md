# EduSys

A comprehensive education management system with role-based access control for administrators, teachers, students, and parents.

## Project Structure

- `backend/` - Node.js/Express API server
- `frontend/` - React application
- `.kiro/specs/` - Project specifications and documentation

## Quick Start

1. Install dependencies:
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

2. Set up environment variables:
```bash
cp backend/.env.example backend/.env
```

3. Start development servers:
```bash
npm run dev
```

This will start both the backend server (port 3001) and frontend development server (port 3000).

## Development

- Backend API: http://localhost:3001
- Frontend App: http://localhost:3000
- Health Check: http://localhost:3001/health

## Features

- Role-based authentication (Admin, Teacher, Student, Parent)
- Student enrollment and management
- Grade and attendance tracking
- Parent-student relationships
- Secure API with JWT authentication