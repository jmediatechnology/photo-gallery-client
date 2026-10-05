import {render, screen, waitFor} from "@testing-library/react";
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
            expect(loginButton()).toBeEnabled();
        });

        test('focuses the username field on open', () => {
            renderLoginModal();

            expect(usernameInput()).toHaveFocus();
        });

        test('masks the password field', () => {
            renderLoginModal();

            expect(passwordInput()).toHaveAttribute('type', 'password');
        });

        test('shows no error initially', () => {
            renderLoginModal();

            expect(screen.queryByText(/failed/i)).not.toBeInTheDocument();
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

            await user.click(screen.getByRole('button', {name: 'Close'}));

            expect(mockOnClose).toHaveBeenCalledOnce();
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

function loginButton() {
    return screen.getByRole('button', {name: 'Login'});
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
