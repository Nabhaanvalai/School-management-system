// Test setup file
// For now, we'll mock mongoose operations in individual tests
// In a production environment, you would use mongodb-memory-server or a test database

export const mockMongoose = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  connection: {
    collections: {}
  }
};