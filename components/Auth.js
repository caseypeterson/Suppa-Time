"use client";

import { useState } from 'react';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const auth = getAuth();
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 py-8 px-4">
      <div className="max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-blue-900 mb-6">
            {isLogin ? 'Login' : 'Register'}
          </h2>
          
          {error && <p className="text-red-500 mb-4">{error}</p>}
          
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              className="w-full p-3 border border-blue-200 rounded-lg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full p-3 border border-blue-200 rounded-lg"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="submit"
              className="w-full bg-emerald-600 text-white p-3 rounded-lg"
            >
              {isLogin ? 'Login' : 'Register'}
            </button>
          </div>
          
          <p className="mt-4 text-center">
            <button
              type="button"
              className="text-blue-600"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Need an account? Register' : 'Have an account? Login'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}