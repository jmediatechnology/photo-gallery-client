import {render, screen} from '@testing-library/react';
import {PhotographEditModal} from "./PhotographEditModal.tsx";
import {vi} from "vitest";
import type {PhotographDTO} from "../../types";
import {AuthProvider} from "../../auth/AuthContext.tsx";
import {PhotographProvider} from "../../photograph/PhotographContext.tsx";

const mockPhoto = {
    uuid: '123',
    filePath: '/images/beach.jpg',
    title: 'Summer Beach',
    description: 'Crystal clear water at sunset',
    createdAt: "",
    updatedAt: ""
} satisfies PhotographDTO;
const mockOnClose = vi.fn();

describe('PhotographEditModal', () => {
    test('PhotographEditModal', () => {

        render(
            <AuthProvider>
                <PhotographProvider>
                    <PhotographEditModal photo={mockPhoto} onClose={mockOnClose} />
                </PhotographProvider>
            </AuthProvider>
        );

        expect(screen.getByText('Title')).toBeInTheDocument();
        expect(screen.getByText('Description')).toBeInTheDocument();
        expect(screen.getByText('Update')).toBeInTheDocument();
    });
});