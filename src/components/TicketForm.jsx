import React, { useState } from 'react';
import { API_BASE_URL } from '../context/AuthContext';
import { LifeBuoy, AlertCircle, CheckCircle2 } from 'lucide-react';

const TicketForm = ({ onTicketCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const response = await fetch(`${API_BASE_URL}/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, description, category, priority }),
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(true);
        setTitle('');
        setDescription('');
        setCategory('General');
        setPriority('Medium');
        if (onTicketCreated) {
          onTicketCreated(data.ticket);
        }
      } else {
        setError(data.message || 'Failed to submit ticket');
      }
    } catch (err) {
      setError('Connection to server failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel border border-slate-800 rounded-2xl p-6 shadow-xl relative min-h-0 max-h-full overflow-y-auto">
      {/* Visual Accent Gradient */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl"></div>

      <div className="flex items-center space-x-3 mb-6 overflow-auto">
        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
          <LifeBuoy className="w-5 h-5" />
        </div>
        <h3 className="font-extrabold text-slate-100 text-md tracking-wide">Submit Support Ticket</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center space-x-2 text-rose-400 bg-rose-500/10 border border-rose-500/25 p-3.5 rounded-xl text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center space-x-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 p-3.5 rounded-xl text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>Ticket submitted successfully! Live agents have been notified.</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            Subject
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief description of the issue"
            className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none transition-all duration-200"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2 text-xs text-slate-200 outline-none transition-all duration-200"
            >
              <option value="General">General Question</option>
              <option value="Technical">Technical Support</option>
              <option value="Billing">Billing & Invoice</option>
              <option value="Feedback">Feedback</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2 text-xs text-slate-200 outline-none transition-all duration-200"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            Describe the Issue
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="4"
            placeholder="Please detail your problem, including any steps to reproduce or error messages."
            className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all duration-200 resize-none"
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-800 hover:bg-indigo-500 active:scale-[0.97] text-white py-3 rounded-3xl font-bold tracking-wide transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/25"
        >
          {loading ? 'Submitting...' : 'Submit Ticket'}
        </button>
      </form>
    </div>
  );
};

export default TicketForm;
