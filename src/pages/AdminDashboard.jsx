import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth, API_BASE_URL, fetchWithAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import ChatWindow from '../components/ChatWindow';
import { 
  BarChart3, RefreshCw, Users, Shield, 
  Clock, CheckCircle, FileText, AlertCircle, User
} from 'lucide-react';

const AdminDashboard = () => {
  const { socket } = useSocket();
  const { user } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [stats, setStats] = useState({
    tickets: { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 },
    priority: { high: 0, medium: 0, low: 0 },
    users: { agents: 0, customers: 0 }
  });
  const [loading, setLoading] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState('');

  // Fetch all tickets, agents list, and system metrics
  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch Tickets
      const ticketsRes = await fetchWithAuth(`${API_BASE_URL}/tickets`);
      const ticketsData = await ticketsRes.json();
      if (ticketsData.success) {
        setTickets(ticketsData.tickets);
      }

      // Fetch Agents
      const agentsRes = await fetchWithAuth(`${API_BASE_URL}/auth/agents`);
      const agentsData = await agentsRes.json();
      if (agentsData.success) {
        setAgents(agentsData.agents);
      }

      // Fetch Metrics Stats
      const statsRes = await fetchWithAuth(`${API_BASE_URL}/tickets/stats`);
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Socket updates for live updates on dashboard metrics and assignments
  useEffect(() => {
    if (socket) {
      // 1. Live ticket created
      socket.on('newTicketAlert', (ticket) => {
        setTickets((prev) => {
          if (prev.some((t) => t._id === ticket._id)) return prev;
          return [ticket, ...prev];
        });
        // Refresh metrics stats in the background
        refreshMetrics();
      });

      // 2. Live ticket reassigned / updated
      socket.on('ticketListUpdate', (updatedTicket) => {
        setTickets((prev) =>
          prev.map((t) => (t._id === updatedTicket._id ? updatedTicket : t))
        );
        if (selectedTicket && selectedTicket._id === updatedTicket._id) {
          setSelectedTicket(updatedTicket);
        }
        refreshMetrics();
      });

      // 3. Status updates
      socket.on('ticketStatusUpdated', (updatedTicket) => {
        setTickets((prev) =>
          prev.map((t) => (t._id === updatedTicket._id ? updatedTicket : t))
        );
        if (selectedTicket && selectedTicket._id === updatedTicket._id) {
          setSelectedTicket(updatedTicket);
        }
        refreshMetrics();
      });

      return () => {
        socket.off('newTicketAlert');
        socket.off('ticketListUpdate');
        socket.off('ticketStatusUpdated');
      };
    }
  }, [socket, selectedTicket]);

  const refreshMetrics = async () => {
    try {
      const statsRes = await fetchWithAuth(`${API_BASE_URL}/tickets/stats`);
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }
    } catch (e) {
      // Ignore background errors
    }
  };

  // Assign Ticket to a specific Agent
  const assignTicketToAgent = async (ticketId, agentId) => {
    if (!agentId) return;
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/tickets/${ticketId}/assign`, {
        method: 'PUT',
        body: JSON.stringify({ agentId }),
      });
      const data = await response.json();
      if (data.success) {
        setTickets((prev) =>
          prev.map((t) => (t._id === data.ticket._id ? data.ticket : t))
        );
        setSelectedTicket(data.ticket);
        setSelectedAgentId('');
        refreshMetrics();
      }
    } catch (err) {
      console.error('Error assigning ticket:', err.message);
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

  return (
    <div className="h-screen bg-slate-950 flex flex-col">
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col space-y-6 overflow-y-auto min-h-0">
        
        {/* Metric Cards Row */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel border border-slate-800 rounded-2xl p-5 shadow flex items-center space-x-4">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Tickets</span>
              <span className="text-2xl font-extrabold text-slate-200">{stats.tickets.total}</span>
            </div>
          </div>

          <div className="glass-panel border border-slate-800 rounded-2xl p-5 shadow flex items-center space-x-4">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Active Queue</span>
              <span className="text-2xl font-extrabold text-slate-200">
                {stats.tickets.open + stats.tickets.inProgress}
              </span>
            </div>
          </div>

          <div className="glass-panel border border-slate-800 rounded-2xl p-5 shadow flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Resolved</span>
              <span className="text-2xl font-extrabold text-slate-200">{stats.tickets.resolved}</span>
            </div>
          </div>

          <div className="glass-panel border border-slate-800 rounded-2xl p-5 shadow flex items-center space-x-4">
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Active Staff</span>
              <span className="text-2xl font-extrabold text-slate-200">{stats.users.agents} Agents</span>
            </div>
          </div>
        </section>

        {/* Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 items-start min-h-0">
          
          {/* Left Column: List of all tickets (Cols 1-5) */}
          <div className="lg:col-span-5 flex flex-col space-y-6 h-full min-h-0 overflow-y-auto pr-2 pb-6">
            <div className="glass-panel border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col">
              
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center space-x-2.5">
                  <BarChart3 className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-extrabold text-slate-200 text-sm uppercase tracking-wider">System Ticket Audit</h3>
                </div>
                <button 
                  onClick={fetchData}
                  disabled={loading}
                  className="p-1.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Tickets Audit List */}
              <div className="space-y-3 max-h-[480px] overflow-y-auto">
                {loading && tickets.length === 0 ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="text-center py-12 border border-slate-850/50 border-dashed rounded-xl">
                    <AlertCircle className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-semibold font-medium">No tickets exist in the system database.</p>
                  </div>
                ) : (
                  tickets.map((ticket) => (
                    <button
                      key={ticket._id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex flex-col space-y-2.5 cursor-pointer ${
                        selectedTicket?._id === ticket._id
                          ? 'bg-indigo-950/15 border-indigo-500/50 shadow-md shadow-indigo-500/5'
                          : 'bg-slate-900/40 border-slate-850 hover:border-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-start w-full">
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

                      <div className="space-y-0.5">
                        <h4 className="font-bold text-slate-200 text-sm truncate">{ticket.title}</h4>
                        <p className="text-xs text-slate-500">
                          Requester: <strong className="text-slate-400 font-medium">{ticket.customerId?.name || 'Customer'}</strong>
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-850/60 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                        <span>
                          {ticket.assignedTo 
                            ? `Assigned: ${ticket.assignedTo.name}` 
                            : 'Unassigned Queue'}
                        </span>
                        <span className="text-indigo-400 font-semibold hover:underline">Select & Audit</span>
                      </div>
                    </button>
                  ))
                )}
              </div>

            </div>
          </div>

          {/* Right Column: Chat Audit Window & Assign Tool (Cols 6-12) */}
          <div className="lg:col-span-7 h-full min-h-0 flex flex-col justify-between pb-6">
            {selectedTicket ? (
              <div className="space-y-4">
                {/* Admin Audit & Assignment controls */}
                <div className="glass-panel border border-slate-800 p-5 rounded-2xl">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h2 className="text-base font-extrabold text-slate-100">{selectedTicket.title}</h2>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                        Customer: <strong className="text-indigo-400">{selectedTicket.customerId.name}</strong> | Email: {selectedTicket.customerId.email}
                      </p>
                    </div>
                    <span className={`text-[10px] font-extrabold border uppercase tracking-wider px-2.5 py-0.5 rounded ${getStatusColor(selectedTicket.status)}`}>
                      {selectedTicket.status}
                    </span>
                  </div>

                  <p className="text-sm text-slate-300 bg-slate-950/30 p-3 rounded-xl border border-slate-850/50 mt-3 leading-relaxed">
                    {selectedTicket.description}
                  </p>

                  {/* Manual Assignment Form */}
                  <div className="flex items-center space-x-3 mt-4 pt-4 border-t border-slate-850/60">
                    <Shield className="w-4.5 h-4.5 text-indigo-400" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assign Support Agent:</span>
                    
                    <select
                      value={selectedAgentId}
                      onChange={(e) => setSelectedAgentId(e.target.value)}
                      className="bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none transition-all duration-200"
                    >
                      <option value="">-- Choose Agent --</option>
                      {agents.map((agent) => (
                        <option key={agent._id} value={agent._id}>
                          {agent.name}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => assignTicketToAgent(selectedTicket._id, selectedAgentId)}
                      disabled={!selectedAgentId}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:text-slate-500 disabled:cursor-not-allowed shadow shadow-indigo-600/20 disabled:shadow-none"
                    >
                      Assign
                    </button>

                    {selectedTicket.assignedTo && (
                      <span className="text-[11px] text-emerald-400 font-medium ml-2">
                        Currently: {selectedTicket.assignedTo.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Audit Chat Box */}
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

        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
