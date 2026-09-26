import React, { useState } from 'react';
import { User } from '../types';
import { LogIn, X } from 'lucide-react';
import { signInWithGoogle, db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AuthModalProps {
  onClose: () => void;
  onLogin: (user: User) => void;
}

export function AuthModal({ onClose, onLogin }: AuthModalProps) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const user = await signInWithGoogle();
      
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      let role: 'student' | 'admin' = 'student';
      if (user.email === 'anyabandgar458@gmail.com') {
        role = 'admin';
      }

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          email: user.email,
          role,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastActiveAt: serverTimestamp(),
          freeSearchesUsed: 0
        });
      } else {
        role = userDoc.data().role as 'student' | 'admin';
      }

      onLogin({ username: user.email || user.uid, role, uid: user.uid });
    } catch (err: any) {
      console.error("Sign-in error details:", err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed before completing. Please try again.');
      } else if (err?.code === 'auth/popup-blocked') {
        setError('The sign-in popup was blocked by your browser. Please allow popups for this site.');
      } else if (err?.code === 'auth/cancelled-popup-request') {
        setError('A newer sign-in attempt was started.');
      } else {
        setError(err.message || 'Failed to sign in with Google. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-100">
          <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
            <LogIn className="w-5 h-5 text-zinc-500" />
            Sign In
          </h2>
          <button 
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="text-center mb-6">
            <p className="text-sm text-zinc-600">Please sign in to access your lecture notes and history.</p>
          </div>

          {error && <p className="text-sm text-rose-600 font-medium text-center">{error}</p>}

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'Signing In...' : 'Sign in with Google'}
          </button>
        </div>
      </div>
    </div>
  );
}
