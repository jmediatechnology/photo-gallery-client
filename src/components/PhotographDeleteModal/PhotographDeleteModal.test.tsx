import {render, screen} from "@testing-library/react";
import {PhotographDeleteModal} from "./PhotographDeleteModal.tsx";
import type {PhotographDTO} from "../../types";
import {vi} from "vitest";
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

describe('PhotographDeleteModal', () => {
    test('PhotographDeleteModal', () => {

        render(
            <AuthProvider>
                <PhotographProvider>
                    <PhotographDeleteModal photo={mockPhoto} onClose={mockOnClose} />
                </PhotographProvider>
            </AuthProvider>
        );

        expect(screen.getByText('Are you sure you want to delete it?')).toBeInTheDocument();
    });
})
