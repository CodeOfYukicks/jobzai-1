import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';

// Declare the window.ENV property for TypeScript
declare global {
  interface Window {
    ENV?: {
      NEXT_PUBLIC_OPENAI_API_KEY?: string;
      NEXT_PUBLIC_OPENAI_API_URL?: string;
      [key: string]: string | undefined;
    };
  }
}

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Inject environment variables into window object for client-side access
    window.ENV = {
      NEXT_PUBLIC_OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      NEXT_PUBLIC_OPENAI_API_URL: process.env.NEXT_PUBLIC_OPENAI_API_URL,
    };
    
    console.log('Environment variables loaded into client side', {
      apiKey: window.ENV.NEXT_PUBLIC_OPENAI_API_KEY ? 
        `Present (starts with ${window.ENV.NEXT_PUBLIC_OPENAI_API_KEY.substring(0, 3)}...)` : 
        'Missing',
      apiUrl: window.ENV.NEXT_PUBLIC_OPENAI_API_URL || 'Using default'
    });
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp; 