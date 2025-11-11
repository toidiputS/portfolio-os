import React, { useState } from 'react';
import { playAudio } from '../lib/audioUtils';
import welcomeAudio from '../assets/audio/welcome.mp3';

interface GreeterProps {
  onEmailSubmit: (email: string) => void;
}

const Greeter: React.FC<GreeterProps> = ({ onEmailSubmit }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateEmail(email)) {
      playAudio(welcomeAudio, 44100);
      onEmailSubmit(email);
    } else {
      setError('Please enter a valid email address.');
    }
  };

  const validateEmail = (email: string) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  return (
    <div className="greeter">
      <h1>Welcome</h1>
      <p>Please enter your email to continue</p>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
        />
        <button type="submit">Continue</button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default Greeter;
