import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {PhotographDeleteModal} from "./PhotographDeleteModal.tsx";
import type {PhotographDTO} from "../../types";
import {afterEach, type Mock, vi} from "vitest";
import {AuthProvider} from "../../auth/AuthContext.tsx";
import {PhotographProvider, usePhotographs} from "../../context/PhotographContext.tsx";
import {deletePhotograph, getPhotographs} from "../../api/client.ts";

vi.mock(import('../../auth/AuthContext'), async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useAuth: () => ({
            token: 'xxxx',
            username: 'test-user',
            roles: ['ROLE_ADMIN'],
            setToken: vi.fn()
        })
    };
});

vi.mock(import('../../context/PhotographContext'), async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        usePhotographs: vi.fn(),
    };
});

vi.mock('../../api/client', () => ({
    getPhotographs: vi.fn(),
    deletePhotograph: vi.fn(),
}));

const mockedUsePhotographs = usePhotographs as Mock;
const mockedGetPhotographs = getPhotographs as Mock;
const mockedDeletePhotograph = deletePhotograph as Mock;

const mockPhoto = {
    uuid: '123',
    filePath: '/images/beach.jpg',
    title: 'Summer Beach',
    description: 'Crystal clear water at sunset',
    createdAt: "",
    updatedAt: ""
} satisfies PhotographDTO;

const mockRemovePhotograph = vi.fn();
const mockOnClose = vi.fn();

describe('PhotographDeleteModal', () => {

    beforeEach(() => {
        mockedUsePhotographs.mockReturnValue({
            photographs: [],
            isLoading: false,
            error: '',
            addPhotograph: vi.fn(),
            editPhotograph: vi.fn(),
            removePhotograph: mockRemovePhotograph,
        });
        mockedGetPhotographs.mockResolvedValue([mockPhoto]);
        mockedDeletePhotograph.mockResolvedValue('');
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    test('renders delete modal', () => {
        render(
            <AuthProvider>
                <PhotographProvider>
                    <PhotographDeleteModal photo={mockPhoto} onClose={mockOnClose} />
                </PhotographProvider>
            </AuthProvider>
        );

        const headerText = screen.getByText(`Delete ${mockPhoto.title}?`);
        const image = screen.getByRole('img', { name: mockPhoto.title});
        const title = screen.getByText(mockPhoto.title);
        const description = screen.getByText(new RegExp(mockPhoto.description, 'i'));
        const yesButton = screen.getByRole('button', { name: 'YES' });
        const noButton = screen.getByRole('button', { name: 'NO' });

        expect(headerText).toBeInTheDocument();
        expect(image).toBeInTheDocument();
        expect(title).toBeInTheDocument();
        expect(description).toBeInTheDocument();
        expect(yesButton).toBeInTheDocument();
        expect(noButton).toBeInTheDocument();
    });

    test('closes modal when button no gets clicked', () => {
        render(
            <AuthProvider>
                <PhotographProvider>
                    <PhotographDeleteModal photo={mockPhoto} onClose={mockOnClose} />
                </PhotographProvider>
            </AuthProvider>
        );

        const noButton = screen.getByRole('button', { name: 'NO' });

        fireEvent.click(noButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('calls deletePhotograph when button yes gets clicked', async() => {
        render(
            <AuthProvider>
                <PhotographDeleteModal photo={mockPhoto} onClose={mockOnClose} />
            </AuthProvider>
        );

        const yesButton = screen.getByRole('button', { name: 'YES' });

        fireEvent.click(yesButton);

        await waitFor(() => {
            expect(deletePhotograph).toHaveBeenCalledTimes(1);
            expect(mockRemovePhotograph).toHaveBeenCalledTimes(1);
            expect(mockRemovePhotograph).toHaveBeenCalledWith(mockPhoto.uuid);
            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });

    });
});
