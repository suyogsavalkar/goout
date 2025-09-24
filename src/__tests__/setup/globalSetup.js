// Global setup for Jest tests
module.exports = async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test-project.appspot.com';
  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456789';
  process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'test-app-id';
  
  // Set timezone for consistent date testing
  process.env.TZ = 'UTC';
  
  console.log('🧪 Global test setup complete');
};