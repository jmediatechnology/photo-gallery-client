import {render, screen} from "@testing-library/react";
import {NavBar} from "./NavBar.tsx";
import {AuthProvider} from "../../auth/AuthContext.tsx";
import {PhotographProvider} from "../../context/PhotographContext.tsx";
import {PhotographSelectionProvider} from "../../context/PhotographSelectionContext.tsx";

describe('NavBar', () => {
    test('NavBar', () => {
        render(
            <AuthProvider>
                <PhotographProvider>
                    <PhotographSelectionProvider>
                        <NavBar />
                    </PhotographSelectionProvider>
                </PhotographProvider>
            </AuthProvider>
        );

        expect(screen.getByText('Login')).toBeInTheDocument();
    });
});
