import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth, API_BASE_URL, fetchWithAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import ChatWindow from '../components/ChatWindow';
import { RefreshCw, Play, CheckCircle2, UserCheck, HelpCircle, Inbox, User, AlertTriangle, Layers } from 'lucide-react';

const AgentDashboard = () => {
  const { socket } = useSocket();
  const { user } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('assigned'); // 'assigned' or 'queue'

  // Fetch all relevant tickets for this agent
  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(`${API_BASE_URL}/tickets`);
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

  // Listen to socket alerts for real-time ticket creation and assignment changes
  useEffect(() => {
    if (socket) {
      // 1. A new ticket is created by a customer -> add to queue
      socket.on('newTicketAlert', (ticket) => {
        setTickets((prev) => {
          if (prev.some((t) => t._id === ticket._id)) return prev;
          return [ticket, ...prev];
        });
      });

      // 2. A ticket was assigned or updated by someone
      socket.on('ticketListUpdate', (updatedTicket) => {
        setTickets((prev) =>
          prev.map((t) => (t._id === updatedTicket._id ? updatedTicket : t))
        );
        if (selectedTicket && selectedTicket._id === updatedTicket._id) {
          setSelectedTicket(updatedTicket);
        }
      });

      // 3. Status changes in the current room
      socket.on('ticketStatusUpdated', (updatedTicket) => {
        setTickets((prev) =>
          prev.map((t) => (t._id === updatedTicket._id ? updatedTicket : t))
        );
        if (selectedTicket && selectedTicket._id === updatedTicket._id) {
          setSelectedTicket(updatedTicket);
        }
      });

      socket.on('ticketAssigned', (updatedTicket) => {
        setTickets((prev) =>
          prev.map((t) => (t._id === updatedTicket._id ? updatedTicket : t))
        );
        if (selectedTicket && selectedTicket._id === updatedTicket._id) {
          setSelectedTicket(updatedTicket);
        }
      });

      return () => {
        socket.off('newTicketAlert');
        socket.off('ticketListUpdate');
        socket.off('ticketStatusUpdated');
        socket.off('ticketAssigned');
      };
    }
  }, [socket, selectedTicket]);

  // Claim/Self-Assign Ticket
  const claimTicket = async (ticketId) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/tickets/${ticketId}/assign`, {
        method: 'PUT',
      });
      const data = await response.json();
      if (data.success) {
        setTickets((prev) =>
          prev.map((t) => (t._id === data.ticket._id ? data.ticket : t))
        );
        setSelectedTicket(data.ticket);
      }
    } catch (err) {
      console.error('Error claiming ticket:', err.message);
    }
  };

  // Change Ticket Status
  const handleStatusChange = async (ticketId, status) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/tickets/${ticketId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (data.success) {
        setTickets((prev) =>
          prev.map((t) => (t._id === data.ticket._id ? data.ticket : t))
        );
        setSelectedTicket(data.ticket);
      }
    } catch (err) {
      console.error('Error updating status:', err.message);
    }
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

  // Filter tickets into:
  // - Assigned: Assigned to this agent
  // - Queue: Unassigned tickets (Open)
  const assignedTickets = tickets.filter(t => t.assignedTo && t.assignedTo._id === user._id);
  const queueTickets = tickets.filter(t => !t.assignedTo);

  const displayedTickets = activeTab === 'assigned' ? assignedTickets : queueTickets;

  return (
    <div className="h-screen overflow-hidden bg-slate-950 flex flex-col">
      <Navbar />

      {/* Main Grid Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden">
        {/* Left Side: Ticket Lists & Queues (Cols 1-5) */}
        <div className="lg:col-span-5 flex flex-col space-y-6 h-full overflow-y-auto pr-2 pb-6">
          
          <div className="glass-panel border border-slate-800 rounded-2xl p-5 shadow-xl flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center space-x-2.5">
                <Layers className="w-5 h-5 text-indigo-400" />
                <h3 className="font-extrabold text-slate-200 text-sm uppercase tracking-wider">Agent Workspace</h3>
              </div>
              <button 
                onClick={fetchTickets}
                disabled={loading}
                className="p-1.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Workplace Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl mb-5 border border-slate-900">
              <button
                onClick={() => setActiveTab('assigned')}
                className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  activeTab === 'assigned'
                    ? 'bg-slate-900 text-indigo-400 shadow border border-slate-850'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Assigned to You ({assignedTickets.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('queue')}
                className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  activeTab === 'queue'
                    ? 'bg-slate-900 text-emerald-400 shadow border border-slate-850'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Inbox className="w-4 h-4" />
                <span>Ticket Queue ({queueTickets.length})</span>
              </button>
            </div>

            {/* Tickets stack */}
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[450px] lg:max-h-none">
              {loading && tickets.length === 0 ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                </div>
              ) : displayedTickets.length === 0 ? (
                <div className="text-center py-12 border border-slate-850/50 border-dashed rounded-xl">
                  {activeTab === 'assigned' ? (
                    <>
                      <UserCheck className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 font-semibold">You have no active ticket assignments.</p>
                      <p className="text-[11px] text-slate-600 mt-1">Check the unassigned Ticket Queue to claim a request.</p>
                    </>
                  ) : (
                    <>
                      <Inbox className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 font-semibold">The ticket queue is currently empty.</p>
                      <p className="text-[11px] text-slate-600 mt-1">Customers will appear here in real time as tickets open.</p>
                    </>
                  )}
                </div>
              ) : (
                displayedTickets.map((ticket) => (
                  <div
                    key={ticket._id}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex flex-col space-y-3 ${
                      selectedTicket?._id === ticket._id
                        ? 'bg-indigo-950/10 border-indigo-500/40'
                        : 'bg-slate-900/40 border-slate-850 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex space-x-2">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase">{ticket.category}</span>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-200 text-sm">{ticket.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2">{ticket.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-850/50">
                      <span className="text-[10px] text-slate-500 font-semibold flex items-center">
                        <User className="w-3 h-3 text-indigo-400 mr-1" />
                        {ticket.customerId?.name || 'Customer'}
                      </span>

                      <div className="flex space-x-2">
                        {activeTab === 'queue' ? (
                          <button
                            onClick={() => claimTicket(ticket._id)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            Claim Ticket
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedTicket(ticket)}
                            className="bg-slate-800 hover:bg-slate-750 text-slate-200 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            Open Chat
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Chat Window & Controls (Cols 6-12) */}
        <div className="lg:col-span-7 h-full flex flex-col justify-between pb-6">
          {selectedTicket ? (
            <div className="space-y-4">
              {/* Ticket Details Panel */}
              <div className="glass-panel border border-slate-800 p-5 rounded-2xl">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-100">{selectedTicket.title}</h2>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                      Submitted by: <strong className="text-indigo-400">{selectedTicket.customerId.name}</strong> ({selectedTicket.customerId.email})
                    </p>
                  </div>
                  <span className={`text-[10px] font-extrabold border uppercase tracking-wider px-2.5 py-0.5 rounded ${getStatusColor(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                </div>
                
                <p className="text-sm text-slate-300 bg-slate-950/30 p-3 rounded-xl border border-slate-850/50 mt-3 leading-relaxed">
                  {selectedTicket.description}
                </p>

                {/* Status Toggle buttons (Only for tickets assigned to them) */}
                {selectedTicket.assignedTo?._id === user._id && (
                  <div className="flex flex-wrap gap-2 items-center mt-4 pt-3 border-t border-slate-850/60">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">Update Ticket Status:</span>
                    
                    {selectedTicket.status !== 'In-Progress' && (
                      <button
                        onClick={() => handleStatusChange(selectedTicket._id, 'In-Progress')}
                        className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        In-Progress
                      </button>
                    )}

                    {selectedTicket.status !== 'Resolved' && (
                      <button
                        onClick={() => handleStatusChange(selectedTicket._id, 'Resolved')}
                        className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Resolve Ticket
                      </button>
                    )}

                    {selectedTicket.status !== 'Closed' && (
                      <button
                        onClick={() => handleStatusChange(selectedTicket._id, 'Closed')}
                        className="bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center"
                      >
                        Close Ticket
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Chat View */}
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

export default AgentDashboard;
