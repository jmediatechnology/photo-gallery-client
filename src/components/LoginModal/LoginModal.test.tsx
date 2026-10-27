import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {vi} from "vitest";
import {LoginModal} from "./LoginModal.tsx";
import {postLogin} from "../../api/client.ts";
import {useAuth} from "../../context/AuthContext.tsx";
import {extractErrorMessage} from "../../api/error.ts";

vi.mock("../../api/client.ts", () => ({postLogin: vi.fn()}));
vi.mock("../../context/AuthContext.tsx", () => ({useAuth: vi.fn()}));
vi.mock("../../api/error.ts", () => ({extractErrorMessage: vi.fn()}));

const mockOnClose = vi.fn<() => void>();
const mockSetToken = vi.fn();

describe('LoginModal', () => {

    beforeEach(() => {
        vi.resetAllMocks();
        vi.mocked(useAuth).mockReturnValue(
            {setToken: mockSetToken} as unknown as ReturnType<typeof useAuth>
        );
    });

    describe('rendering', () => {
        test('renders heading, username and password fields and login button', () => {
            renderLoginModal();

            expect(screen.getByRole('heading', {name: 'Login'})).toBeInTheDocument();
            expect(usernameInput()).toBeInTheDocument();
            expect(passwordInput()).toBeInTheDocument();
            expect(loginButton()).toBeInTheDocument();
        });

        test('renders the fields inside a login form', () => {
            renderLoginModal();

            const form = loginForm();
            expect(form).toContainElement(usernameInput());
            expect(form).toContainElement(passwordInput());
            expect(form).toContainElement(loginButton());
        });

        test('focuses the username field on open', () => {
            renderLoginModal();

            expect(usernameInput()).toHaveFocus();
        });

        test('masks the password field', () => {
            renderLoginModal();

            expect(passwordInput()).toHaveAttribute('type', 'password');
        });

        test('exposes autocomplete hints for password managers', () => {
            renderLoginModal();

            expect(usernameInput()).toHaveAttribute('autocomplete', 'username');
            expect(passwordInput()).toHaveAttribute('autocomplete', 'current-password');
        });

        test('shows no error initially', () => {
            renderLoginModal();

            expect(screen.queryByText(/failed/i)).not.toBeInTheDocument();
        });
    });

    describe('login button availability', () => {
        test('is disabled when both fields are empty', () => {
            renderLoginModal();

            expect(loginButton()).toBeDisabled();
        });

        test('is disabled when only the username is filled', async () => {
            const user = userEvent.setup();
            renderLoginModal();

            await user.type(usernameInput(), 'julian');

            expect(loginButton()).toBeDisabled();
        });

        test('is disabled when only the password is filled', async () => {
            const user = userEvent.setup();
            renderLoginModal();

            await user.type(passwordInput(), 's3cret');

            expect(loginButton()).toBeDisabled();
        });

        test('is disabled when the username is only whitespace', async () => {
            const user = userEvent.setup();
            renderLoginModal();

            await fillInCredentials(user, '   ', 's3cret');

            expect(loginButton()).toBeDisabled();
        });

        test('is enabled when both fields are filled', async () => {
            const user = userEvent.setup();
            renderLoginModal();

            await fillInCredentials(user, 'julian', 's3cret');

            expect(loginButton()).toBeEnabled();
        });
    });

    describe('successful login', () => {
        test('posts the entered credentials', async () => {
            vi.mocked(postLogin).mockResolvedValue('jwt-token' as never);
            const user = userEvent.setup();
            renderLoginModal();

            await fillInCredentials(user, 'julian', 's3cret');
            await user.click(loginButton());

            expect(postLogin).toHaveBeenCalledExactlyOnceWith({username: 'julian', password: 's3cret'});
        });

        test('stores the token and closes the modal', async () => {
            vi.mocked(postLogin).mockResolvedValue('jwt-token' as never);
            const user = userEvent.setup();
            renderLoginModal();

            await fillInCredentials(user, 'julian', 's3cret');
            await user.click(loginButton());

            await waitFor(() => expect(mockOnClose).toHaveBeenCalledOnce());
            expect(mockSetToken).toHaveBeenCalledExactlyOnceWith('jwt-token');
        });
    });

    describe('submitting with Enter', () => {
        test('posts the credentials when Enter is pressed in the password field', async () => {
            vi.mocked(postLogin).mockResolvedValue('jwt-token' as never);
            const user = userEvent.setup();
            renderLoginModal();

            await fillInCredentials(user, 'julian', 's3cret');
            await user.type(passwordInput(), '{Enter}');

            expect(postLogin).toHaveBeenCalledExactlyOnceWith({username: 'julian', password: 's3cret'});
            await waitFor(() => expect(mockOnClose).toHaveBeenCalledOnce());
        });

        test('posts the credentials when Enter is pressed in the username field', async () => {
            vi.mocked(postLogin).mockResolvedValue('jwt-token' as never);
            const user = userEvent.setup();
            renderLoginModal();

            await fillInCredentials(user, 'julian', 's3cret');
            await user.type(usernameInput(), '{Enter}');

            expect(postLogin).toHaveBeenCalledExactlyOnceWith({username: 'julian', password: 's3cret'});
            await waitFor(() => expect(mockOnClose).toHaveBeenCalledOnce());
        });

        test('does not post when the password is empty', async () => {
            const user = userEvent.setup();
            renderLoginModal();

            await user.type(usernameInput(), 'julian{Enter}');

            expect(postLogin).not.toHaveBeenCalled();
        });

        test('does not post when the username is empty', async () => {
            const user = userEvent.setup();
            renderLoginModal();

            await user.type(passwordInput(), 's3cret{Enter}');

            expect(postLogin).not.toHaveBeenCalled();
        });

        test('does not post when the username is only whitespace', async () => {
            const user = userEvent.setup();
            renderLoginModal();

            await fillInCredentials(user, '   ', 's3cret');
            await user.type(passwordInput(), '{Enter}');

            expect(postLogin).not.toHaveBeenCalled();
        });

        test('does not close the modal when Enter is pressed with empty fields', async () => {
            const user = userEvent.setup();
            renderLoginModal();

            await user.keyboard('{Enter}');

            expect(mockOnClose).not.toHaveBeenCalled();
        });

        test('sends only one request when Enter is pressed repeatedly', async () => {
            const pending = deferred<string>();
            vi.mocked(postLogin).mockReturnValue(pending.promise as never);
            const user = userEvent.setup();
            renderLoginModal();

            await fillInCredentials(user, 'julian', 's3cret');
            await user.type(passwordInput(), '{Enter}{Enter}{Enter}');

            expect(postLogin).toHaveBeenCalledOnce();

            pending.resolve('jwt-token');
            await waitFor(() => expect(mockOnClose).toHaveBeenCalledOnce());
        });
    });

    // The disabled submit button already stops the browser from submitting.
    // These tests bypass the button to pin down the submit handler's own guard.
    describe('submit guard', () => {
        test('prevents the native form submission (page reload)', () => {
            renderLoginModal();

            const isNotPrevented = fireEvent.submit(loginForm());

            expect(isNotPrevented).toBe(false);
        });

        test('does not post when the form is submitted with empty fields', () => {
            renderLoginModal();

            fireEvent.submit(loginForm());

            expect(postLogin).not.toHaveBeenCalled();
        });

        test('does not post a second request when the form is submitted while pending', async () => {
            const pending = deferred<string>();
            vi.mocked(postLogin).mockReturnValue(pending.promise as never);
            const user = userEvent.setup();
            renderLoginModal();

            await fillInCredentials(user, 'julian', 's3cret');
            fireEvent.submit(loginForm());
            fireEvent.submit(loginForm());

            expect(postLogin).toHaveBeenCalledOnce();

            pending.resolve('jwt-token');
            await waitFor(() => expect(mockOnClose).toHaveBeenCalledOnce());
        });
    });

    describe('failed login', () => {
        test('shows the extracted error message', async () => {
            const failure = new Error('401');
            vi.mocked(postLogin).mockRejectedValue(failure);
            vi.mocked(extractErrorMessage).mockReturnValue('Invalid credentials');
            const user = userEvent.setup();
            renderLoginModal();

            await fillInCredentials(user, 'julian', 'wrong');
            await user.click(loginButton());

            expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
            expect(extractErrorMessage).toHaveBeenCalledWith(failure, 'Failed to login');
        });

        test('does not store a token or close the modal', async () => {
            vi.mocked(postLogin).mockRejectedValue(new Error('401'));
            vi.mocked(extractErrorMessage).mockReturnValue('Invalid credentials');
            const user = userEvent.setup();
            renderLoginModal();

            await fillInCredentials(user, 'julian', 'wrong');
            await user.click(loginButton());
            await screen.findByText('Invalid credentials');

            expect(mockSetToken).not.toHaveBeenCalled();
            expect(mockOnClose).not.toHaveBeenCalled();
        });

        test('re-enables the login button so the user can retry', async () => {
            vi.mocked(postLogin).mockRejectedValue(new Error('401'));
            vi.mocked(extractErrorMessage).mockReturnValue('Invalid credentials');
            const user = userEvent.setup();
            renderLoginModal();

            await fillInCredentials(user, 'julian', 'wrong');
            await user.click(loginButton());

            await waitFor(() => expect(loginButton()).toBeEnabled());
        });
    });

    describe('while a login request is pending', () => {
        test('disables the login button', async () => {
            const pending = deferred<string>();
            vi.mocked(postLogin).mockReturnValue(pending.promise as never);
            const user = userEvent.setup();
            renderLoginModal();

            await fillInCredentials(user, 'julian', 's3cret');
            await user.click(loginButton());

            expect(loginButton()).toBeDisabled();

            pending.resolve('jwt-token');
            await waitFor(() => expect(mockOnClose).toHaveBeenCalledOnce());
        });

        test('sends only one request when clicked repeatedly', async () => {
            const pending = deferred<string>();
            vi.mocked(postLogin).mockReturnValue(pending.promise as never);
            const user = userEvent.setup();
            renderLoginModal();

            await fillInCredentials(user, 'julian', 's3cret');
            await user.click(loginButton());
            await user.click(loginButton());
            await user.click(loginButton());

            expect(postLogin).toHaveBeenCalledOnce();

            pending.resolve('jwt-token');
            await waitFor(() => expect(mockOnClose).toHaveBeenCalledOnce());
        });
    });

    describe('closing', () => {
        test('closes when the close button is clicked', async () => {
            const user = userEvent.setup();
            renderLoginModal();

            await user.click(closeButton());

            expect(mockOnClose).toHaveBeenCalledOnce();
        });

        test('close button does not submit the login form', async () => {
            const user = userEvent.setup();
            renderLoginModal();

            await fillInCredentials(user, 'julian', 's3cret');
            await user.click(closeButton());

            expect(closeButton()).toHaveAttribute('type', 'button');
            expect(postLogin).not.toHaveBeenCalled();
        });

        test('closes when the overlay is clicked', async () => {
            const user = userEvent.setup();
            renderLoginModal();

            await user.click(screen.getByTestId('modal-overlay'));

            expect(mockOnClose).toHaveBeenCalledOnce();
        });

        test('does not close when clicking inside the modal content', async () => {
            const user = userEvent.setup();
            renderLoginModal();

            await user.click(screen.getByRole('heading', {name: 'Login'}));
            await user.click(usernameInput());

            expect(mockOnClose).not.toHaveBeenCalled();
        });
    });
});

function renderLoginModal() {
    return render(<LoginModal onClose={mockOnClose}/>);
}

function usernameInput() {
    return screen.getByRole('textbox', {name: /username/i});
}

function passwordInput() {
    return screen.getByLabelText(/password/i);
}

function loginForm() {
    return screen.getByRole('form', {name: 'Login'});
}

function loginButton() {
    return screen.getByRole('button', {name: 'Login'});
}

function closeButton() {
    return screen.getByRole('button', {name: 'Close'});
}

async function fillInCredentials(user: ReturnType<typeof userEvent.setup>, username: string, password: string) {
    await user.type(usernameInput(), username);
    await user.type(passwordInput(), password);
}

function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((res) => {
        resolve = res;
    });
    return {promise, resolve};
}
