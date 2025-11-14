// Debug script to test conversation API
console.log('Environment variables:');
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('VITE_WS_URL:', import.meta.env.VITE_WS_URL);

// Test URL construction
const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const ticketId = '123';
const url = `${baseUrl}/conversation/${ticketId}`;
console.log('Constructed URL:', url);

// Expected: http://localhost:4052/api/conversation/123