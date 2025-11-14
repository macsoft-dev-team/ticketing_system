// Simple debug script to test notification fetching
// Run this in browser console

async function debugNotifications() {
    console.log('🔍 Starting notification debug...');
    
    // Check if we're authenticated
    const token = sessionStorage.getItem('token');
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    
    console.log('👤 Current user:', user);
    console.log('🔑 Token exists:', !!token);
    
    if (!token) {
        console.error('❌ No token found in sessionStorage');
        return;
    }
    
    // Test API call
    try {
        const baseUrl = import.meta.env?.VITE_API_URL || 'http://localhost:4052/api';
        const url = `${baseUrl}/notifications`;
        
        console.log('📡 Making request to:', url);
        console.log('📡 With headers:', {
            'Authorization': `Bearer ${token.substring(0, 20)}...`,
            'Content-Type': 'application/json'
        });
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        
        console.log('📨 Response status:', response.status);
        console.log('📨 Response ok:', response.ok);
        
        const responseText = await response.text();
        console.log('📨 Raw response:', responseText);
        
        if (response.ok) {
            try {
                const data = JSON.parse(responseText);
                console.log('✅ Parsed response:', data);
                
                if (data.success && Array.isArray(data.data)) {
                    console.log(`📋 Found ${data.data.length} notification recipients`);
                    data.data.forEach((item, index) => {
                        console.log(`📌 Notification ${index + 1}:`, {
                            id: item.id,
                            seen: item.seen,
                            notification: {
                                title: item.notification?.title,
                                description: item.notification?.description,
                                type: item.notification?.type,
                                createdAt: item.notification?.createdAt
                            }
                        });
                    });
                } else {
                    console.warn('⚠️ Unexpected response format:', data);
                }
            } catch (parseError) {
                console.error('❌ Failed to parse JSON:', parseError);
            }
        } else {
            console.error('❌ API request failed:', response.status, responseText);
        }
        
    } catch (error) {
        console.error('❌ Network error:', error);
    }
}

// Auto-run the debug
debugNotifications();