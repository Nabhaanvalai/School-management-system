"use strict";
// Test setup file
// For now, we'll mock mongoose operations in individual tests
// In a production environment, you would use mongodb-memory-server or a test database
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockMongoose = void 0;
exports.mockMongoose = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    connection: {
        collections: {}
    }
};
//# sourceMappingURL=setup.js.map