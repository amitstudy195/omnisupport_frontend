import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import TicketForm from '../components/TicketForm';
import ChatWindow from '../components/ChatWindow';
import { LifeBuoy, CheckCircle2, RefreshCw, MessageSquareCode, Clock, Tag, ChevronRight } from 'lucide-react';

const CustomerDashboard = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');

  // Fetch customer's tickets
  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/tickets`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setTickets(data.tickets);
      }
    } catch (err) {
      console.error('Error fetching tickets:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Listen for real-time updates regarding customer's tickets
  useEffect(() => {
    if (socket) {
      socket.on('ticketStatusUpdated', (updatedTicket) => {
        setTickets((prevTickets) =>
          prevTickets.map((t) => (t._id === updatedTicket._id ? updatedTicket : t))
        );
        if (selectedTicket && selectedTicket._id === updatedTicket._id) {
          setSelectedTicket(updatedTicket);
        }
      });

      socket.on('ticketAssigned', (updatedTicket) => {
        setTickets((prevTickets) =>
          prevTickets.map((t) => (t._id === updatedTicket._id ? updatedTicket : t))
        );
        if (selectedTicket && selectedTicket._id === updatedTicket._id) {
          setSelectedTicket(updatedTicket);
        }
      });

      return () => {
        socket.off('ticketStatusUpdated');
        socket.off('ticketAssigned');
      };
    }
  }, [socket, selectedTicket]);

  const handleTicketCreated = (newTicket) => {
    setTickets((prevTickets) => [newTicket, ...prevTickets]);
    setSelectedTicket(newTicket);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'Medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default: return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      case 'In-Progress': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'Resolved': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'Closed': return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (statusFilter === 'All') return true;
    if (statusFilter === 'Active') return ['Open', 'In-Progress'].includes(ticket.status);
    if (statusFilter === 'Resolved') return ['Resolved', 'Closed'].includes(ticket.status);
    return ticket.status === statusFilter;
  });

  return (
    <div className="h-screen overflow-hidden bg-slate-950 flex flex-col">
      <Navbar />

      {/* Main Grid Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden">
        {/* Left Side: Creation form & List of Tickets (Cols 1-5) */}
        <div className="lg:col-span-5 flex flex-col space-y-6 h-full min-h-0 overflow-y-auto pr-2 pb-6">
          {/* Create Ticket section */}
          <TicketForm onTicketCreated={handleTicketCreated} />

          {/* Ticket Listing section */}
          <div className="glass-panel border border-slate-800 rounded-2xl p-5 shadow-xl flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-slate-200 text-sm uppercase tracking-wider">Your Support Requests</h3>
              <button 
                onClick={fetchTickets}
                disabled={loading}
                className="p-1.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex space-x-1.5 mb-4">
              {['All', 'Active', 'Resolved'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    statusFilter === filter
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/10'
                      : 'bg-slate-900 border-slate-850 text-slate-400 hover:border-slate-850 hover:bg-slate-850 hover:text-slate-300'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Tickets Stack */}
            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[300px] lg:max-h-none">
              {loading && tickets.length === 0 ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="text-center py-10 border border-slate-850/50 border-dashed rounded-xl">
                  <LifeBuoy className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No tickets found matching criteria.</p>
                </div>
              ) : (
                filteredTickets.map((ticket) => (
                  <button
                    key={ticket._id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex justify-between items-start cursor-pointer ${
                      selectedTicket?._id === ticket._id
                        ? 'bg-indigo-950/20 border-indigo-500/50 shadow-md shadow-indigo-500/5'
                        : 'bg-slate-900/40 border-slate-850 hover:border-slate-800 hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0 pr-4">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold">{ticket.category}</span>
                      </div>
                      <h4 className="font-bold text-slate-200 text-sm truncate">{ticket.title}</h4>
                      <p className="text-xs text-slate-400 truncate">{ticket.description}</p>
                      
                      {/* Assigned Agent info if present */}
                      <p className="text-[10px] text-slate-500 font-medium">
                        {ticket.assignedTo 
                          ? `Assigned to: ${ticket.assignedTo.name}` 
                          : 'Awaiting agent assignment'}
                      </p>
                    </div>

                    <div className="flex flex-col items-end justify-between h-full space-y-3">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                      <ChevronRight className={`w-4 h-4 text-slate-600 transition-transform ${selectedTicket?._id === ticket._id ? 'text-indigo-400 translate-x-0.5' : ''}`} />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Chat Window (Cols 6-12) */}
        <div className="lg:col-span-7 h-full flex flex-col justify-between pb-6">
          {selectedTicket ? (
            <div className="space-y-4">
              {/* Short summary of the ticket */}
              <div className="glass-panel border border-slate-800 p-5 rounded-2xl">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-base font-extrabold text-slate-100">{selectedTicket.title}</h2>
                  <span className={`text-[10px] font-extrabold border uppercase tracking-wider px-2.5 py-0.5 rounded ${getStatusColor(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/30 p-3 rounded-xl border border-slate-850/50">
                  {selectedTicket.description}
                </p>
                <div className="flex space-x-4 mt-3 text-xs text-slate-500 font-medium">
                  <span>Category: <strong className="text-slate-400">{selectedTicket.category}</strong></span>
                  <span>Priority: <strong className="text-slate-400">{selectedTicket.priority}</strong></span>
                  {selectedTicket.assignedTo && (
                    <span>Agent: <strong className="text-indigo-400">{selectedTicket.assignedTo.name}</strong></span>
                  )}
                </div>
              </div>

              {/* Chat view */}
              <ChatWindow
                ticketId={selectedTicket._id}
                ticketStatus={selectedTicket.status}
              />
            </div>
          ) : (
            <div className="h-full flex flex-col justify-center">
              <ChatWindow ticketId={null} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CustomerDashboard;
