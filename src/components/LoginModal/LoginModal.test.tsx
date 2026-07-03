import {render, screen} from "@testing-library/react";
import {LoginModal} from "./LoginModal.tsx";
import {vi} from "vitest";
import {AuthProvider} from "../../auth/AuthContext.tsx";
import {PhotographProvider} from "../../context/PhotographContext.tsx";

const mockOnClose = vi.fn();

describe('LoginModal', () => {
    test('LoginModal', () => {

        render(
            <AuthProvider>
                <PhotographProvider>
                    <LoginModal onClose={mockOnClose}/>
                </PhotographProvider>
            </AuthProvider>
        );

        const usernameInput = screen.getByRole('textbox', { name: /username/i });
        const passwordInput = screen.getByLabelText(/password/i);
        const heading = screen.getByRole('heading', { name: 'Login' });

        expect(usernameInput).toBeInTheDocument();
        expect(passwordInput).toBeInTheDocument();
        expect(heading).toBeInTheDocument();
    });
})
