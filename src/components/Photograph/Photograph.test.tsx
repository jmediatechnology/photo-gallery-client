import {render, screen} from '@testing-library/react';
import {Photograph} from "./Photograph.tsx";
import type {PhotographDTO} from "../../types";
import {vi} from "vitest";
import {PhotographProvider} from "../../photograph/PhotographContext.tsx";
import {AuthProvider} from "../../auth/AuthContext.tsx";

vi.mock("../../api/config", () => ({
    api: {
        url: (path: string) => `https://test.com${path}`
    }
}));

const mockPhoto = {
    uuid: '1234',
    filePath: '/images/beach.jpg',
    title: 'Summer Beach',
    description: 'Crystal clear water at sunset',
    createdAt: "",
    updatedAt: ""
} satisfies PhotographDTO;

const mockOnSelect = vi.fn();
const mockOnSelectEdit = vi.fn();
const mockOnSelectDelete = vi.fn();

describe('Photograph', () => {
    test('Photograph', () => {
        render(
            <AuthProvider>
                <PhotographProvider>
                    <Photograph photograph={mockPhoto} onSelect={mockOnSelect} onSelectForEdit={mockOnSelectEdit} onSelectForDelete={mockOnSelectDelete}/>
                </PhotographProvider>
            </AuthProvider>
        );

        expect(screen.getByText(mockPhoto.title)).toBeInTheDocument();
        expect(screen.getByText(mockPhoto.description)).toBeInTheDocument();

        const img = screen.getByAltText(mockPhoto.title);
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', 'https://test.com/images/beach.jpg');
    });
});
