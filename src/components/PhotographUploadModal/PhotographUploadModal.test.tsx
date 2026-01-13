import {render, screen} from "@testing-library/react";
import {PhotographUploadModal} from "./PhotographUploadModal.tsx";
import {vi} from "vitest";
import {AuthProvider} from "../../auth/AuthContext.tsx";
import {PhotographProvider} from "../../photograph/PhotographContext.tsx";

const mockOnClose = vi.fn();

describe('PhotographUploadModal', () => {
    test('PhotographUploadModal', () => {
        render(
            <AuthProvider>
                <PhotographProvider>
                    <PhotographUploadModal onClose={mockOnClose} />
                </PhotographProvider>
            </AuthProvider>
        );

        expect(screen.getByText('Title')).toBeInTheDocument();
        expect(screen.getByText('Description')).toBeInTheDocument();
    });
});
