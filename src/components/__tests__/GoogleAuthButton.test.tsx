import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import GoogleAuthButton from '../GoogleAuthButton';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock des d├®pendances
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    signInWithGoogle: vi.fn().mockImplementation(() => Promise.resolve()),
  }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('GoogleAuthButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <GoogleAuthButton />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
  });

  it('shows loading state when clicked', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <GoogleAuthButton />
        </AuthProvider>
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole('button'));
    
    expect(screen.getByText('Connecting...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('navigates to dashboard on successful login', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <GoogleAuthButton />
        </AuthProvider>
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
}); 
