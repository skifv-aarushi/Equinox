import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegistrationHub from '../components/RegistrationHub';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@clerk/clerk-react', () => ({
    useUser:  vi.fn(),
    useClerk: vi.fn(),
}));

vi.mock('../context/TeamContext', () => ({
    useTeam: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
    default: {
        error:   vi.fn(),
        success: vi.fn(),
        loading: vi.fn(() => 'toast-id'),
    },
}));

vi.mock('../utils/api', () => ({
    createTeam: vi.fn(),
    joinTeam:   vi.fn(),
}));

import { useUser, useClerk } from '@clerk/clerk-react';
import { useTeam }           from '../context/TeamContext';

const mockApi = {};

// ─────────────────────────────────────────────────────────────────────────────
describe('Access Restricted block — non-VIT email', () => {
    beforeEach(() => {
        useClerk.mockReturnValue({ signOut: vi.fn() });
        useTeam.mockReturnValue({ api: mockApi, refreshTeam: vi.fn() });
        useUser.mockReturnValue({
            user: {
                primaryEmailAddress: { emailAddress: 'alice@gmail.com' },
                fullName: 'Alice',
            },
        });
    });

    test('renders Access Restricted heading', () => {
        render(<RegistrationHub />);
        expect(screen.getByText('Access Restricted')).toBeInTheDocument();
    });

    test('shows message about VIT students', () => {
        render(<RegistrationHub />);
        expect(screen.getByText(/only open to VIT students/i)).toBeInTheDocument();
    });

    test('displays the non-VIT email', () => {
        render(<RegistrationHub />);
        expect(screen.getByText('alice@gmail.com')).toBeInTheDocument();
    });

    test('renders the switch-account button', () => {
        render(<RegistrationHub />);
        expect(
            screen.getByRole('button', { name: /sign in with a different account/i })
        ).toBeInTheDocument();
    });

    test('does NOT show Create a Team or Join a Team panels', () => {
        render(<RegistrationHub />);
        expect(screen.queryByText('Create a Team')).not.toBeInTheDocument();
        expect(screen.queryByText('Join a Team')).not.toBeInTheDocument();
    });

    test('calls signOut with redirectUrl on button click', async () => {
        const signOut = vi.fn().mockResolvedValue(undefined);
        useClerk.mockReturnValue({ signOut });

        render(<RegistrationHub />);
        await userEvent.click(
            screen.getByRole('button', { name: /sign in with a different account/i })
        );

        expect(signOut).toHaveBeenCalledOnce();
        expect(signOut).toHaveBeenCalledWith({ redirectUrl: '/register' });
    });

    test('button is disabled and shows "Signing out…" while signing out', async () => {
        let resolve;
        const signOut = vi.fn().mockReturnValue(new Promise(r => { resolve = r; }));
        useClerk.mockReturnValue({ signOut });

        render(<RegistrationHub />);
        fireEvent.click(screen.getByRole('button', { name: /sign in with a different account/i }));

        await waitFor(() =>
            expect(screen.getByRole('button', { name: /signing out/i })).toBeDisabled()
        );

        resolve();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Registration panels — VIT email', () => {
    beforeEach(() => {
        useClerk.mockReturnValue({ signOut: vi.fn() });
        useTeam.mockReturnValue({ api: mockApi, refreshTeam: vi.fn() });
        useUser.mockReturnValue({
            user: {
                primaryEmailAddress: { emailAddress: 'alice@vitstudent.ac.in' },
                fullName: 'Alice Kumar',
            },
        });
    });

    test('shows both Create and Join panels', () => {
        render(<RegistrationHub />);
        expect(screen.getByText('Create a Team')).toBeInTheDocument();
        expect(screen.getByText('Join a Team')).toBeInTheDocument();
    });

    test('does NOT show Access Restricted block', () => {
        render(<RegistrationHub />);
        expect(screen.queryByText('Access Restricted')).not.toBeInTheDocument();
    });

    test('displays user email in read-only email fields', () => {
        render(<RegistrationHub />);
        const emailValues = screen.getAllByText('alice@vitstudent.ac.in');
        expect(emailValues.length).toBeGreaterThanOrEqual(2); // one per panel
    });

    test('pre-fills Full Name from Clerk profile', () => {
        render(<RegistrationHub />);
        const nameInputs = screen.getAllByDisplayValue('Alice Kumar');
        expect(nameInputs.length).toBeGreaterThan(0);
    });

    test('VTOP warning appears when checkbox is unchecked (default)', () => {
        const { container } = render(<RegistrationHub />);
        // Warning text spans multiple elements (<strong>not</strong>), so query by class
        const warnings = container.querySelectorAll('.rh-vtop__warning');
        expect(warnings.length).toBeGreaterThan(0);
    });

    test('VTOP warning disappears after checking the checkbox', async () => {
        const { container } = render(<RegistrationHub />);
        const checkboxes = screen.getAllByRole('checkbox');
        await userEvent.click(checkboxes[0]);
        const warnings = container.querySelectorAll('.rh-vtop__warning');
        expect(warnings.length).toBeLessThan(2);
    });

    test('team code input converts to uppercase', async () => {
        render(<RegistrationHub />);
        const codeInput = screen.getByPlaceholderText('XXXXXX');
        await userEvent.type(codeInput, 'abcdef');
        expect(codeInput.value).toBe('ABCDEF');
    });

    test('shows page heading "Join the Cosmos"', () => {
        render(<RegistrationHub />);
        expect(screen.getByText(/Join the/i)).toBeInTheDocument();
        expect(screen.getByText(/Cosmos/i)).toBeInTheDocument();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Edge case — empty email (loading state)', () => {
    test('shows Access Restricted when email is empty string', () => {
        useClerk.mockReturnValue({ signOut: vi.fn() });
        useTeam.mockReturnValue({ api: mockApi, refreshTeam: vi.fn() });
        useUser.mockReturnValue({
            user: { primaryEmailAddress: { emailAddress: '' }, fullName: '' },
        });

        render(<RegistrationHub />);
        expect(screen.getByText('Access Restricted')).toBeInTheDocument();
        // Shows '—' when email is empty
        expect(screen.getByText('—')).toBeInTheDocument();
    });
});
