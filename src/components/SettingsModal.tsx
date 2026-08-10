import React, { useState } from 'react';
import { X, Key, Save } from 'lucide-react';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

interface SettingsModalProps {
  onClose: () => void;
  uid: string;
  initialApiKey?: string;
  onSave: (apiKey: string) => void;
}

export function SettingsModal({ onClose, uid, initialApiKey, onSave }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState(initialApiKey || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, { apiKey }, { merge: true });
      setSuccess(true);
      onSave(apiKey);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-zinc-100">
          <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
            <Key className="w-5 h-5 text-zinc-500" />
            Settings
          </h2>
          <button 
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-zinc-700 mb-1">
                Your Gemini API Key
              </label>
              <input
                type="password"
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all font-mono text-sm"
              />
              <p className="mt-1 text-xs text-zinc-500">
                If provided, your personal API key will be used for requests instead of the default app key.
              </p>
            </div>

            {error && <p className="text-sm text-rose-600 font-medium">{error}</p>}
            {success && <p className="text-sm text-emerald-600 font-medium">Settings saved successfully!</p>}

            <button
              type="submit"
              disabled={saving}
              className="w-full px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
