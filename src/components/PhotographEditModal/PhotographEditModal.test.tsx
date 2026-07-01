import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {PhotographEditModal} from "./PhotographEditModal.tsx";
import {afterEach, type Mock, vi} from "vitest";
import type {PhotographDTO} from "../../types";
import {AuthProvider} from "../../auth/AuthContext.tsx";
import {PhotographProvider} from "../../photograph/PhotographContext.tsx";
import {getPhotographs, patchPhotograph, postGenerateDescription} from '../../api/client';

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

vi.mock('../../api/client', () => ({
    getPhotographs: vi.fn(),
    patchPhotograph: vi.fn(),
    postGenerateDescription: vi.fn(),
}));

vi.mock('../../api/config', () => ({
    api: {
        url: (path: string) => `https://test.com${path}`
    }
}));

const mockedGetPhotographs = getPhotographs as Mock;
const mockedPatchPhotograph = patchPhotograph as Mock;
const mockedPostGenerateDescription = postGenerateDescription as Mock;

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

    beforeEach(() => {
        mockedGetPhotographs.mockResolvedValue([mockPhoto]);
        mockedPatchPhotograph.mockResolvedValue(mockPhoto);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    test('renders title description and buttons', () => {

        render(
            <AuthProvider>
                <PhotographProvider>
                    <PhotographEditModal photo={mockPhoto} onClose={mockOnClose} />
                </PhotographProvider>
            </AuthProvider>
        );

        const titleInput = screen.getByRole('textbox', { name: /title/i });
        const descriptionInput = screen.getByRole('textbox', { name: /description/i });
        const generateDescriptionButton = screen.getByRole('button', { name: 'Generate description' });
        const updateButton = screen.getByRole('button', { name: 'Update' });

        expect(titleInput).toHaveValue(mockPhoto.title);
        expect(descriptionInput).toHaveValue(mockPhoto.description);
        expect(generateDescriptionButton).toBeInTheDocument();
        expect(updateButton).toBeInTheDocument();
    });

    test('closes modal when update button is clicked', async() => {

        render(
            <AuthProvider>
                <PhotographProvider>
                    <PhotographEditModal photo={mockPhoto} onClose={mockOnClose} />
                </PhotographProvider>
            </AuthProvider>
        );

        const updateButton = screen.getByRole('button', { name: 'Update' });
        expect(updateButton).toBeInTheDocument();

        await userEvent.click(updateButton);

        await waitFor(() => {
            expect(patchPhotograph).toHaveBeenCalledTimes(1);
            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });
    });

    test('sets description input field when generate description is clicked', async() => {

        const mockedDescriptionDTO = { description: 'Super awesome description' };
        mockedPostGenerateDescription.mockResolvedValue(mockedDescriptionDTO);

        render(
            <AuthProvider>
                <PhotographProvider>
                    <PhotographEditModal photo={mockPhoto} onClose={mockOnClose} />
                </PhotographProvider>
            </AuthProvider>
        );

        const description = screen.getByText('Description');
        const descriptionInput = screen.getByRole('textbox', { name: /description/i });

        expect(description).toBeInTheDocument();
        expect(descriptionInput).toHaveValue(mockPhoto.description);

        const generateDescriptionButton = screen.getByRole('button', { name: 'Generate description' });
        expect(generateDescriptionButton).toBeInTheDocument();

        await userEvent.click(generateDescriptionButton);

        await waitFor(() => {
            expect(descriptionInput).not.toHaveValue(mockPhoto.description);
            expect(descriptionInput).toHaveValue(mockedDescriptionDTO.description);
        });
    });
});