import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Ticket, Clock, X, User, Paperclip } from 'lucide-react';
import { Badge } from '../../../ui/badge';
import useAuth from '../../../../lib/hooks/useAuth';
import { useSocket } from '../../../../lib/contexts/SocketContext';

const MessageBox = () => {
  const { user, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);
  const [unrepliedTickets, setUnrepliedTickets] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Socket context for real-time updates
  const { socket, isConnected } = useSocket();

  // Fetch unreplied messages from API using new endpoint
  const fetchUnrepliedTickets = async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL;
      
      // Determine audience based on user role
      // MACSOFT users see customer messages needing replies
      // CUSTOMER users see MACSOFT messages needing replies
      const isMacsoftUser = ['MACSOFT_ADMIN', 'MACSOFT_HEAD', 'MACSOFT_SUPPORT'].includes(user?.role);
      const audience = isMacsoftUser ? 'MACSOFT' : 'CUSTOMER';
      
      console.log(`MessageBox: Fetching unreplied messages for ${audience} audience (User role: ${user?.role})`);
      
      const response = await fetch(`${baseUrl}/messages/unreplied?audience=${audience}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
          // Group messages by ticket to show one entry per ticket with latest message
          const ticketsMap = new Map();
          
          result.data.forEach(message => {
            if (!ticketsMap.has(message.ticketId)) {
              ticketsMap.set(message.ticketId, {
                id: message.ticketId,
                ticketCode: message.ticketCode,
                subject: message.content.substring(0, 50) + (message.content.length > 50 ? '...' : ''),
                unrepliedCount: 1,
                lastMessageTime: formatRelativeTime(message.createdAt),
                customerName: message.senderName,
                lastMessage: message.content,
                senderRole: message.senderRole,
                hasAttachments: message.hasAttachments,
                messageId: message.messageId,
              });
            }
          });
          
          const transformedTickets = Array.from(ticketsMap.values());
          
          console.log(`✅ MessageBox: Successfully loaded ${transformedTickets.length} unreplied messages for ${audience} audience`);
          setUnrepliedTickets(transformedTickets);
          setUnreadCount(transformedTickets.length);
        } else {
          console.log('MessageBox: No messages data received or invalid format');
          setUnrepliedTickets([]);
          setUnreadCount(0);
        }
      } else {
        console.error('MessageBox: API request failed:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('MessageBox: Error response:', errorText);
      }
    } catch (error) {
      console.error('MessageBox: Error fetching unreplied messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchUnrepliedTickets();
  }, [token]);

  // Listen for new message socket events
  useEffect(() => {
    if (socket) {
      const handleNewMessage = (data) => {
        console.log('MessageBox: New message received, refreshing unreplied messages');
        // Refresh unreplied messages when new message arrives
        fetchUnrepliedTickets();
      };

      const handleMessageReply = (data) => {
        console.log('MessageBox: Message reply received, refreshing unreplied messages');
        // Refresh unreplied messages when reply is sent
        fetchUnrepliedTickets();
      };

      const handleConversation = (data) => {
        console.log('MessageBox: Conversation update received, refreshing unreplied messages');
        // Refresh when any conversation update occurs
        fetchUnrepliedTickets();
      };

      socket.on('newTicketMessage', handleNewMessage);
      socket.on('messageReply', handleMessageReply);
      socket.on('conversation', handleConversation);
      socket.on('ticket-message', handleNewMessage); // Also listen to ticket-message events

      return () => {
        socket.off('newTicketMessage', handleNewMessage);
        socket.off('messageReply', handleMessageReply);
        socket.off('conversation', handleConversation);
        socket.off('ticket-message', handleNewMessage);
      };
    }
  }, [socket]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Format relative time helper
  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH':
      case 'URGENT':
        return 'text-red-600 bg-red-50';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-50';
      case 'LOW':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Handle ticket click
  const handleTicketClick = (ticketId) => {
    navigate(`/tickets/${ticketId}#conversation`);
    setIsOpen(false);
    
    // Scroll to conversation section after navigation
    setTimeout(() => {
      const conversationElement = document.getElementById('conversation-section');
      if (conversationElement) {
        conversationElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 500);
  };

  // Mark all as read functionality
  const markAllAsRead = async () => {
    if (markingAllAsRead || unrepliedTickets.length === 0) return;
    
    setMarkingAllAsRead(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL;
      
      // Mark all unreplied tickets as read
      await Promise.all(
        unrepliedTickets.map(async (ticket) => {
          return fetch(`${baseUrl}/messages/mark-replied/${ticket.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
        })
      );

      // Refresh the list
      await fetchUnrepliedTickets();
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setMarkingAllAsRead(false);
      setIsOpen(false);
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    switch (role?.toUpperCase()) {
      case 'CUSTOMER_FIELD_ENGINEER':
        return 'bg-blue-100 text-blue-700';
      case 'CUSTOMER_SERVICE_HEAD':
        return 'bg-purple-100 text-purple-700';
      case 'MACSOFT_ADMIN':
        return 'bg-red-100 text-red-700';
      case 'MACSOFT_SUPPORT':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Message Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 cursor-pointer hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
        title="Unreplied Messages"
      >
        <MessageCircle className="w-5 h-5" />
        
        {/* Badge for unread count */}
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center text-xs bg-red-500 text-white border-2 border-white px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute -right-14 sm:right-0 mt-2 w-3/5 min-w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">Unreplied Messages</h3>
              <div
                className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
                title={isConnected ? 'Real-time connected' : 'Disconnected - using cached data'}
              />
            </div>
            <div className="flex items-center space-x-2">
            
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : unrepliedTickets.length === 0 ? (
              <div className="p-8 text-center text-gray-800">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50 animate-pulse" />
                <p className="text-sm">No unreplied messages</p>
                <p className="text-xs text-gray-400 mt-1">All tickets are up to date!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {unrepliedTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => handleTicketClick(ticket.id)}
                    className="p-3 hover:bg-gray-50 cursor-pointer transition-colors bg-blue-50"
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Ticket className="w-4 h-4 text-blue-600" />
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Ticket Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-semibold text-gray-900 truncate">
                              {ticket.ticketCode}
                            </span> 
                          </div>
                          {/* Unread indicator */}
                          <div className="flex items-center space-x-1 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>{ticket.lastMessageTime}</span>
                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 ml-2"></div>
                          </div>
                        </div>

                        {/* Subject */}
                        {ticket.subject && (
                          <p className="text-sm text-gray-800 mt-1 truncate">
                            {ticket.subject}  
                          </p>
                        )}

                                            

                        {/* Attachments indicator */}
                        {ticket.hasAttachments && (
                          <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
                            <Paperclip className="w-3 h-3" />
                            <span>Has attachments</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Sender Info */}
                    <div className="flex items-center gap-2 mt-2">
                      <User className="w-3 h-3 text-gray-400" />
                      <span className="text-xs flex-1 font-medium text-gray-700">{ticket.customerName}</span>
                      {ticket.senderRole && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${getRoleBadgeColor(ticket.senderRole)}`}>
                          {ticket.senderRole.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer 
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            {unrepliedTickets.length > 0 && (
              <button
                onClick={() => {
                  navigate('/tickets?filter=unreplied');
                  setIsOpen(false);
                }}
                className="w-full text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                View all unreplied messages
              </button>
            )}
          </div>*/}
        </div>
      )}
    </div>
  );
};

export default MessageBox;