"use client";
// components/Auth.js
import { auth } from '../app/firebase'; // Adjusted path to firebase.js
import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';



export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const auth = getAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted");
    const formData = { email, password }; // Add this
    console.log("Form data:", formData); // Add this
    try {
      if (isLogin) {
        console.log("Attempting login with:", email);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("Login successful:", userCredential.user);
      } else {
        console.log("Attempting registration with:", email);
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log("Registration successful:", userCredential.user);
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 py-8 px-4">
      <div className="max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg space-y-4">
          <h2 className="text-2xl font-bold text-blue-900 mb-6">
            {isLogin ? 'Login' : 'Register'}
          </h2>
          
          {error && <p className="text-red-500 mb-4">{error}</p>}
          
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
          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
            {isLogin ? 'Login' : 'Register'}
          </Button>
          
          <button
            type="button"
            className="w-full text-blue-600 mt-4"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Need an account? Register' : 'Have an account? Login'}
          </button>
        </form>
      </div>
    </div>
  );
}