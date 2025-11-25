// Test notification API with new format handling
const testNotificationAPI = async () => {
  const baseUrl = 'http://localhost:4052/api';
  
  // User credentials
  const loginData = {
    email: 'admin@macsoft.com',
    password: 'password'
  };

  try {
     const loginResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData)
    });

    const loginResult = await loginResponse.json();
 
    if (!loginResult.success) {
      throw new Error('Login failed');
    }

    const token = loginResult.token;
 
    // Test notification fetch
     const notificationResponse = await fetch(`${baseUrl}/notification`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!notificationResponse.ok) {
      throw new Error(`Notification fetch failed: ${notificationResponse.status}`);
    }

    const notificationData = await notificationResponse.json();
 
    if (notificationData.data && notificationData.data.length > 0) {
       const sample = notificationData.data[0];
     }

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

 
    if (transformedNotifications.length > 0) {
       const sample = transformedNotifications[0];
     }

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

 testNotificationAPI();