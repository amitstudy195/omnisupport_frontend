import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth, API_BASE_URL } from './AuthContext';

const SocketContext = createContext();

const getSocketUrl = () => {
  const backendUrl = API_BASE_URL.replace(/\/api\/?$/, '');
  return backendUrl;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [alerts, setAlerts] = useState([]); // Real-time on-screen notifications
  const { user } = useAuth();

  useEffect(() => {
    let socketInstance = null;

    if (user) {
      // Connect to the backend socket server
      const socketUrl = getSocketUrl();
      socketInstance = io(socketUrl, {
        withCredentials: true, // Send HTTP-only cookie with socket handshake
        transports: ['websocket', 'polling'],
      });

      setSocket(socketInstance);

      // Listen for socket errors (e.g., auth failure)
      socketInstance.on('connect_error', (err) => {
        console.error('Socket Connection Error:', err.message);
      });

      socketInstance.on('connect', () => {
        console.log('Socket client connected successfully');
      });

      // Listen for global new ticket alerts (Only relevant for Agents and Admins)
      if (user.role === 'agent' || user.role === 'admin') {
        socketInstance.on('newTicketAlert', (ticket) => {
          console.log('New Ticket Alert Received:', ticket);
          
          // Add warning alert
          const newAlert = {
            id: Date.now(),
            title: 'New Support Ticket Created',
            message: `"${ticket.title}" by ${ticket.customerId.name} (${ticket.priority} Priority)`,
            ticketId: ticket._id,
            timestamp: new Date()
          };

          setAlerts((prevAlerts) => [newAlert, ...prevAlerts]);

          // Play a subtle notification sound if possible
          try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav');
            audio.volume = 0.3;
            audio.play();
          } catch (e) {
            // Ignored if browser blocks audio
          }
        });
      }
    } else {
      // If user logs out, disconnect the socket
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }

    // Cleanup connection on component unmount / logout
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [user]);

  const clearAlert = (id) => {
    setAlerts((prevAlerts) => prevAlerts.filter(alert => alert.id !== id));
  };

  return (
    <SocketContext.Provider value={{ socket, alerts, clearAlert }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
export default SocketContext;
