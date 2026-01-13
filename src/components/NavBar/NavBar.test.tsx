import {render, screen} from "@testing-library/react";
import {NavBar} from "./NavBar.tsx";
import {AuthProvider} from "../../auth/AuthContext.tsx";
import {PhotographProvider} from "../../photograph/PhotographContext.tsx";

describe('NavBar', () => {
    test('NavBar', () => {
        render(
            <AuthProvider>
                <PhotographProvider>
                    <NavBar />
                </PhotographProvider>
            </AuthProvider>
        );

        expect(screen.getByText('Login')).toBeInTheDocument();
    })
})
