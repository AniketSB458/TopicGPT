import React, { useState, useEffect } from 'react';
import { X, Users, Lock, Activity, UserMinus, Database, RefreshCw } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, Timestamp } from 'firebase/firestore';

interface AdminModalProps {
  onClose: () => void;
}

export function AdminModal({ onClose }: AdminModalProps) {
  const [secret, setSecret] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeUsers, setActiveUsers] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [inactiveUsers, setInactiveUsers] = useState(0);
  const [usersList, setUsersList] = useState<{username: string, active: boolean, inactive: boolean}[]>([]);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'inactive'>('all');
  const [isLoading, setIsLoading] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      let activeCount = 0;
      let inactiveCount = 0;
      let totalCount = 0;
      const list: {username: string, active: boolean, inactive: boolean}[] = [];

      const now = new Date();
      // Active = active within last 5 minutes
      const activeThreshold = new Date(now.getTime() - 5 * 60 * 1000); 
      // Inactive = not active for 14 days
      const inactiveThreshold = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      querySnapshot.forEach((doc) => {
        totalCount++;
        const data = doc.data();
        const username = data.email || doc.id;
        
        let isActive = false;
        let isInactive = false;

        if (data.lastActiveAt) {
          const lastActive = (data.lastActiveAt as Timestamp).toDate();
          if (lastActive >= activeThreshold) {
            isActive = true;
            activeCount++;
          }
          if (lastActive < inactiveThreshold) {
            isInactive = true;
            inactiveCount++;
          }
        } else {
          // If no lastActiveAt, treat as inactive
          isInactive = true;
          inactiveCount++;
        }

        list.push({ username, active: isActive, inactive: isInactive });
      });

      setTotalUsers(totalCount);
      setActiveUsers(activeCount);
      setInactiveUsers(inactiveCount);
      setUsersList(list);
    } catch (err) {
      console.error('Failed to fetch users', err);
      setError('Failed to fetch users from database. Make sure you are an admin.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchUsers();
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (secret) {
      // In a real app we'd verify the secret with the backend, 
      // but here we just check if they are firestore admin.
      // We will let the firestore rules reject them if they aren't admin.
      setIsAuthenticated(true);
      setError('');
    }
  };

  const handleClearRecords = async () => {
    if (!window.confirm("Are you sure you want to clear local usage records?")) return;
    try {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('topicgpt_usage_')) {
          localStorage.removeItem(key);
        }
      }
      alert('Local usage records cleared.');
    } catch (e) {
      console.error(e);
    }
  };

  const filteredUsers = usersList.filter(user => {
    if (filterType === 'active') return user.active;
    if (filterType === 'inactive') return user.inactive;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-100">
          <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-zinc-500" />
            Admin Dashboard
            {isAuthenticated && (
              <button 
                onClick={fetchUsers} 
                disabled={isLoading}
                className="ml-2 p-1 text-zinc-400 hover:text-zinc-600 rounded-full transition-colors disabled:opacity-50"
                title="Refresh users"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            )}
          </h2>
          <button 
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {!isAuthenticated ? (
            <form onSubmit={handleLogin} className="space-y-4 max-w-md mx-auto">
              <p className="text-sm text-zinc-600 mb-4 leading-relaxed">
                Enter the admin secret to view real-time application metrics.
              </p>
              
              <div className="space-y-2">
                <label htmlFor="adminSecret" className="block text-sm font-medium text-zinc-700">
                  Admin Secret
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-zinc-400" />
                  </div>
                  <input
                    type="password"
                    id="adminSecret"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    placeholder="Enter secret..."
                    className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 outline-none transition-all font-mono text-sm"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-rose-600">{error}</p>}

              <button
                type="submit"
                className="w-full px-6 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium rounded-xl shadow-sm transition-all"
              >
                Authenticate
              </button>
            </form>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                  onClick={() => setFilterType('all')}
                  className={`p-4 rounded-xl border flex flex-col items-center transition-all ${filterType === 'all' ? 'border-zinc-900 bg-zinc-100 ring-2 ring-zinc-900/20' : 'border-zinc-100 bg-zinc-50 hover:bg-zinc-100'}`}
                >
                  <Database className={`w-6 h-6 mb-2 ${filterType === 'all' ? 'text-zinc-900' : 'text-zinc-400'}`} />
                  <span className="text-3xl font-semibold text-zinc-900">{totalUsers}</span>
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest mt-1">Total Users</span>
                </button>
                <button 
                  onClick={() => setFilterType('active')}
                  className={`p-4 rounded-xl border flex flex-col items-center transition-all ${filterType === 'active' ? 'border-emerald-500 bg-emerald-100 ring-2 ring-emerald-500/20' : 'border-emerald-100 bg-emerald-50 hover:bg-emerald-100'}`}
                >
                  <Activity className={`w-6 h-6 mb-2 ${filterType === 'active' ? 'text-emerald-600' : 'text-emerald-500'}`} />
                  <span className="text-3xl font-semibold text-emerald-700">{activeUsers}</span>
                  <span className="text-xs font-medium text-emerald-600 uppercase tracking-widest mt-1">Active Now</span>
                </button>
                <button 
                  onClick={() => setFilterType('inactive')}
                  className={`p-4 rounded-xl border flex flex-col items-center transition-all ${filterType === 'inactive' ? 'border-zinc-400 bg-zinc-200 ring-2 ring-zinc-500/20' : 'border-zinc-100 bg-zinc-50 hover:bg-zinc-100'}`}
                >
                  <UserMinus className={`w-6 h-6 mb-2 ${filterType === 'inactive' ? 'text-zinc-600' : 'text-zinc-400'}`} />
                  <span className="text-3xl font-semibold text-zinc-900">{inactiveUsers}</span>
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest mt-1">Inactive</span>
                </button>
              </div>

              <div className="border border-zinc-200 rounded-xl overflow-hidden">
                <div className="bg-zinc-50 px-4 py-3 border-b border-zinc-200 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-900">
                    {filterType === 'all' && 'All Registered Users'}
                    {filterType === 'active' && 'Active Users'}
                    {filterType === 'inactive' && 'Inactive Users'}
                  </h3>
                  <button 
                    onClick={handleClearRecords}
                    className="text-xs px-3 py-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-lg font-medium transition-colors"
                  >
                    Clear All Records
                  </button>
                </div>
                <div className="divide-y divide-zinc-100 max-h-64 overflow-y-auto">
                  {filteredUsers.length === 0 ? (
                    <div className="p-4 text-sm text-zinc-500 text-center">No users found.</div>
                  ) : (
                    filteredUsers.map((user, idx) => (
                      <div key={idx} className="p-4 flex items-center justify-between bg-white hover:bg-zinc-50 transition-colors">
                        <span className="text-sm font-medium text-zinc-700">{user.username}</span>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${user.active ? 'bg-emerald-500' : (user.inactive ? 'bg-rose-400' : 'bg-zinc-300')}`} />
                          <span className="text-xs font-medium text-zinc-500">
                            {user.active ? 'Active' : (user.inactive ? 'Inactive (>14d)' : 'Offline')}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
