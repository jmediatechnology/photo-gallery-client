import {render, screen} from "@testing-library/react";
import {LoginModal} from "./LoginModal.tsx";
import {vi} from "vitest";
import {AuthProvider} from "../../auth/AuthContext.tsx";
import {PhotographProvider} from "../../photograph/PhotographContext.tsx";

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

        expect(screen.getByText('Username')).toBeInTheDocument();
        expect(screen.getByText('Password')).toBeInTheDocument();
        expect(screen.getByText('Login')).toBeInTheDocument();
    });
})
