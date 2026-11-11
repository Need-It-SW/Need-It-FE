import React from 'react';
import { createRoot } from 'react-dom/client';
import ChatTest from './test/ChatTest';

const isChatTest = window.location.search.includes('chatTest=true');

createRoot(document.getElementById('root')).render(
  isChatTest ? (
    <ChatTest />
  ) : (
    <iframe
      title="NEED IT"
      src="/needit.html"
      style={{
        display: 'block',
        width: '100%',
        height: '100dvh',
        border: 0
      }}
    />
  )
);
