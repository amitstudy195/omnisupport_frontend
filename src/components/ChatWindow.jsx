import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { Send, SendHorizontal, MessageCircle, AlertCircle, Calendar } from 'lucide-react';

const ChatWindow = ({ ticketId, ticketStatus }) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const messagesEndRef = useRef(null);

  // 1. Fetch message history & Setup Sockets
  useEffect(() => {
    if (!ticketId) return;

    // Reset messages and error
    setMessages([]);
    setError(null);

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/messages/${ticketId}`, {
          credentials: 'include',
        });
        const data = await response.json();
        if (data.success) {
          setMessages(data.messages);
        } else {
          setError(data.message || 'Failed to load conversation history');
        }
      } catch (err) {
        setError('Error connecting to API');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // 2. Setup socket room and listener
    if (socket) {
      // Join Room
      socket.emit('joinRoom', { ticketId });

      // Listen for incoming messages
      socket.on('newMessage', (message) => {
        // Prevent duplicate messages in state
        setMessages((prevMessages) => {
          if (prevMessages.some((msg) => msg._id === message._id)) {
            return prevMessages;
          }
          return [...prevMessages, message];
        });
      });

      // Cleanup on ticketId change or unmount
      return () => {
        socket.emit('leaveRoom', { ticketId });
        socket.off('newMessage');
      };
    }
  }, [ticketId, socket]);

  // 3. Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 4. Send message handler
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !socket || !ticketId) return;

    // Emit sendMessage event to backend
    socket.emit('sendMessage', {
      ticketId,
      message: inputText.trim(),
    });

    setInputText('');
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (!ticketId) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-900/10 border border-dashed border-slate-800 rounded-2xl">
        <MessageCircle className="w-12 h-12 text-slate-600 mb-3" />
        <h3 className="text-slate-300 font-bold text-lg">No Active Ticket</h3>
        <p className="text-slate-500 text-sm max-w-sm mt-1">
          Select a ticket from the sidebar to view details and start chatting in real time.
        </p>
      </div>
    );
  }

  const isClosed = ticketStatus === 'Closed' || ticketStatus === 'Resolved';

  return (
    <div className="flex flex-col min-h-0 flex-1 max-h-full glass-panel border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Chat Header */}
      <div className="px-6 py-4 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
          <div>
            <h4 className="font-bold text-slate-200 text-sm tracking-wide">Live Support Chat</h4>
            <span className="text-[10px] text-slate-400 font-medium">Ticket ID: {ticketId}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
            isClosed 
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          }`}>
            {ticketStatus}
          </span>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950/40">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs space-x-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <MessageCircle className="w-10 h-10 text-indigo-500/20 mb-2" />
            <p className="text-slate-500 text-xs">No messages yet. Send a message to start the conversation.</p>
          </div>
        )}

        {!loading && messages.map((msg, index) => {
          const isMe = msg.senderId._id === user._id || msg.senderId === user._id;
          
          return (
            <div key={msg._id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}>
              {/* Sender Name (only if not me, or for clarity) */}
              {!isMe && (
                <span className="text-[10px] text-slate-500 font-semibold px-1">
                  {msg.senderId?.name || 'User'} ({msg.senderRole})
                </span>
              )}

              {/* Message Bubble */}
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm relative leading-relaxed ${
                isMe
                  ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/10'
                  : 'bg-slate-900 text-slate-200 border border-slate-800/80 rounded-bl-none'
              }`}>
                {msg.message}
              </div>

              {/* Time Stamp */}
              <span className="text-[9px] text-slate-500 px-1 font-medium">
                {formatTime(msg.createdAt)}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSendMessage} className="p-4 bg-slate-900/40 border-t border-slate-800/80 flex items-center space-x-3">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isClosed}
          placeholder={
            isClosed 
              ? 'This ticket is closed. Further messages are disabled.' 
              : 'Type a message here...'
          }
          className="flex-1 bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={isClosed || !inputText.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white p-2.5 rounded-xl transition-all duration-200 cursor-pointer shadow-lg shadow-indigo-600/20 disabled:shadow-none disabled:text-slate-500"
        >
          <SendHorizontal className="w-4.5 h-4.5" />
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
