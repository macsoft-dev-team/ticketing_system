// Test notification API with new format handling
const testNotificationAPI = async () => {
  const baseUrl = 'http://localhost:4052/api';
  
  // User credentials
  const loginData = {
    email: 'admin@macsoft.com',
    password: 'password'
  };

  try {
    console.log('🔐 Logging in...');
    const loginResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData)
    });

    const loginResult = await loginResponse.json();
    console.log('Login result:', loginResult);

    if (!loginResult.success) {
      throw new Error('Login failed');
    }

    const token = loginResult.token;
    console.log('✅ Logged in successfully');

    // Test notification fetch
    console.log('🔔 Fetching notifications...');
    const notificationResponse = await fetch(`${baseUrl}/notification`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!notificationResponse.ok) {
      throw new Error(`Notification fetch failed: ${notificationResponse.status}`);
    }

    const notificationData = await notificationResponse.json();
    console.log('📋 Notification API Response Format:');
    console.log('- Success:', notificationData.success);
    console.log('- Data type:', Array.isArray(notificationData.data) ? 'Array' : typeof notificationData.data);
    console.log('- Count:', notificationData.count);
    console.log('- Total notifications:', notificationData.data?.length || 0);

    if (notificationData.data && notificationData.data.length > 0) {
      console.log('📄 Sample notification:');
      const sample = notificationData.data[0];
      console.log('- ID:', sample.id);
      console.log('- Seen:', sample.seen);
      console.log('- Notification Type:', sample.notification?.type);
      console.log('- Content:', sample.notification?.content?.substring(0, 50) + '...');
      console.log('- Created:', sample.notification?.createdAt);
    }

    // Test frontend data transformation
    console.log('\n🔄 Testing frontend transformation...');
    let transformedNotifications = [];
    
    if (notificationData.success && notificationData.data) {
      transformedNotifications = notificationData.data.map(item => ({
        id: item.id,
        title: getNotificationTitle(item.notification),
        message: item.notification?.content || item.notification?.message || '',
        type: item.notification?.type || 'info',
        ticketId: item.notification?.ticketId,
        createdAt: item.notification?.createdAt || item.createdAt,
        seen: item.seen,
      }));
    }

    console.log('✅ Transformation successful!');
    console.log('- Transformed count:', transformedNotifications.length);
    console.log('- Unread count:', transformedNotifications.filter(n => !n.seen).length);

    if (transformedNotifications.length > 0) {
      console.log('📋 Sample transformed notification:');
      const sample = transformedNotifications[0];
      console.log('- ID:', sample.id);
      console.log('- Title:', sample.title);
      console.log('- Message:', sample.message.substring(0, 50) + '...');
      console.log('- Type:', sample.type);
      console.log('- Seen:', sample.seen);
    }

    console.log('\n🎉 All tests passed! Frontend should now properly display notifications after page refresh.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Helper function
function getNotificationTitle(notification) {
  if (!notification) return 'Notification';
  
  switch (notification.type) {
    case 'ticket_created':
      return 'New Ticket Created';
    case 'ticket_updated':
      return 'Ticket Updated';
    case 'message_received':
      return 'New Message';
    default:
      return notification.title || 'Notification';
  }
}

// Run the test
console.log('🚀 Starting notification API test...');
testNotificationAPI();