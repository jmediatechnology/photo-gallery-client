import {act, fireEvent, render, screen} from "@testing-library/react";
import {PhotographShowModal} from "./PhotographShowModal.tsx";
import {afterEach, type Mock, vi} from "vitest";
import type {PhotographDTO} from "../../types";
import {getPhotographs} from "../../api/client";
import {AuthProvider} from "../../auth/AuthContext.tsx";
import {PhotographProvider} from "../../context/PhotographContext.tsx";

vi.mock("../../api/client", () => ({
    getPhotographs: vi.fn()
}));

vi.mock("../../api/config", () => ({
    api: {
        url: (path: string) => `https://test.com${path}`
    }
}));

const mockedGetPhotographs = getPhotographs as Mock;

const mockPhoto = {
    uuid: 'a6c4c05f-fd70-41b7-b7f5-731d28e18f2e',
    filePath: '/images/beach.jpg',
    title: 'Summer Beach',
    description: 'Crystal clear water at sunset',
    createdAt: "",
    updatedAt: ""
} satisfies PhotographDTO;

const mockPhotoB = {
    uuid: 'cbdef1d4-77fa-4c42-ad62-d4ea4ce60a39',
    filePath: '/images/winter.jpg',
    title: 'Winter',
    description: 'Snowy landscape',
    createdAt: "",
    updatedAt: ""
} satisfies PhotographDTO;

const mockOnClose = vi.fn();
const mockOnSelect = vi.fn();

describe('PhotographShowModal', () => {

    beforeEach(() => {
        mockedGetPhotographs.mockResolvedValue([]);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('renders the image with correctly', () => {

        render(
            <AuthProvider>
                <PhotographProvider>
                    <PhotographShowModal photo={mockPhoto} onClose={mockOnClose} onSelect={mockOnSelect} />
                </PhotographProvider>
            </AuthProvider>
        );

        const img = screen.getByAltText(mockPhoto.title);
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', 'https://test.com/images/beach.jpg');
        expect(img).toHaveClass('modal-image');

        expect(screen.getByTestId('action-footer')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Start slideshow' })).toBeInTheDocument();
    });

    it('displays title and description', () => {
        render(
            <AuthProvider>
                <PhotographProvider>
                    <PhotographShowModal photo={mockPhoto} onClose={mockOnClose} onSelect={mockOnSelect} />
                </PhotographProvider>
            </AuthProvider>
        );

        expect(screen.getByRole('heading', { name: mockPhoto.title })).toBeInTheDocument();
        expect(screen.getByText(mockPhoto.description)).toBeInTheDocument();
    });

    it('does not render description paragraph when description is missing', () => {
        const photoNoDesc = { ...mockPhoto, description: undefined } as PhotographDTO;

        render(
            <AuthProvider>
                <PhotographProvider>
                    <PhotographShowModal photo={photoNoDesc} onClose={mockOnClose} onSelect={mockOnSelect} />
                </PhotographProvider>
            </AuthProvider>
        );

        expect(screen.getByRole('heading', { name: mockPhoto.title })).toBeInTheDocument();
        expect(screen.queryByText(mockPhoto.description)).not.toBeInTheDocument();
    });

    it('calls onClose when clicking the overlay (outside modal-content)', () => {
        render(
            <AuthProvider>
                <PhotographProvider>
                    <PhotographShowModal photo={mockPhoto} onClose={mockOnClose} onSelect={mockOnSelect} />
                </PhotographProvider>
            </AuthProvider>
        );

        fireEvent.click(screen.getByTestId('modal-overlay') ?? document.querySelector('.modal-overlay')!);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('does NOT call onClose when clicking inside modal-content', () => {
        render(
            <AuthProvider>
                <PhotographProvider>
                    <PhotographShowModal photo={mockPhoto} onClose={mockOnClose} onSelect={mockOnSelect} />
                </PhotographProvider>
            </AuthProvider>
        );

        fireEvent.click(screen.getByAltText(mockPhoto.title));
        expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('calls onClose when Escape key is pressed', () => {
        render(
            <AuthProvider>
                <PhotographProvider>
                    <PhotographShowModal photo={mockPhoto} onClose={mockOnClose} onSelect={mockOnSelect} />
                </PhotographProvider>
            </AuthProvider>
        );

        fireEvent.keyDown(window, { key: 'Escape' });
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose for other keys', () => {
        render(
            <AuthProvider>
                <PhotographProvider>
                    <PhotographShowModal photo={mockPhoto} onClose={mockOnClose} onSelect={mockOnSelect} />
                </PhotographProvider>
            </AuthProvider>
        );

        fireEvent.keyDown(window, { key: 'Enter' });
        fireEvent.keyDown(window, { key: 'a' });
        expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('adds and removes the keydown listener on mount/unmount', () => {
        const addSpy = vi.spyOn(window, 'addEventListener');
        const removeSpy = vi.spyOn(window, 'removeEventListener');

        const { unmount } = render(
            <AuthProvider>
                <PhotographProvider>
                    <PhotographShowModal photo={mockPhoto} onClose={mockOnClose} onSelect={mockOnSelect} />
                </PhotographProvider>
            </AuthProvider>
        );

        expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

        unmount();

        expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

        addSpy.mockRestore();
        removeSpy.mockRestore();
    });

    it('toggles the ActionFooter Slideshow button', () => {
        render(
            <AuthProvider>
                <PhotographProvider>
                    <PhotographShowModal photo={mockPhoto} onClose={mockOnClose} onSelect={mockOnSelect} />
                </PhotographProvider>
            </AuthProvider>
        );

        fireEvent.click(screen.getByRole('button', { name: 'Start slideshow' }));
        expect(screen.getByRole('button', { name: 'Stop slideshow' })).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Stop slideshow' }));
        expect(screen.getByRole('button', { name: 'Start slideshow' })).toBeInTheDocument();
    });

    it('advances to the next photograph 5 seconds after starting the slideshow', async () => {
        mockedGetPhotographs.mockResolvedValue([mockPhoto, mockPhotoB]);

        await act(async () => {
            render(
                <AuthProvider>
                    <PhotographProvider>
                        <PhotographShowModal photo={mockPhoto} onClose={mockOnClose} onSelect={mockOnSelect} />
                    </PhotographProvider>
                </AuthProvider>
            );
        });

        vi.useFakeTimers();

        fireEvent.click(screen.getByRole('button', { name: 'Start slideshow' }));

        await act(() => vi.advanceTimersByTime(5000));

        expect(mockOnSelect).toHaveBeenCalledWith(mockPhotoB);

        vi.useRealTimers();
    });

    it('does not advance if the slideshow was stopped before the 5 second mark', async () => {
        mockedGetPhotographs.mockResolvedValue([mockPhoto, mockPhotoB]);

        await act(async () => {
            render(
                <AuthProvider>
                    <PhotographProvider>
                        <PhotographShowModal photo={mockPhoto} onClose={mockOnClose} onSelect={mockOnSelect} />
                    </PhotographProvider>
                </AuthProvider>
            );
        });

        vi.useFakeTimers();

        fireEvent.click(screen.getByRole('button', { name: 'Start slideshow' }));
        await act(() => vi.advanceTimersByTime(2000));

        fireEvent.click(screen.getByRole('button', { name: 'Stop slideshow' }));
        await act(() => vi.advanceTimersByTime(5000));

        expect(mockOnSelect).not.toHaveBeenCalled();

        vi.useRealTimers();
    });

});