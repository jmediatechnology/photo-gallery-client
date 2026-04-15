import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PhotoGallery } from "./PhotoGallery";
import { vi, type Mock } from "vitest";
import { getPhotographs } from "../../api/client";
import {AuthProvider} from "../../auth/AuthContext.tsx";
import {PhotographProvider} from "../../photograph/PhotographContext.tsx";

vi.mock("../../api/client", () => ({
    getPhotographs: vi.fn()
}));

vi.mock("../../api/config", () => ({
    api: {
        url: (path: string) => `https://test.com${path}`
    }
}));

const mockedGetPhotographs = getPhotographs as Mock;

describe("PhotoGallery", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test("shows loading state initially", () => {
        mockedGetPhotographs.mockResolvedValue([]);

        render(
            <AuthProvider>
                <PhotographProvider>
                    <PhotoGallery />
                </PhotographProvider>
            </AuthProvider>
        );

        expect(screen.getByText(/Loading photographs.../i)).toBeInTheDocument();
    });

    test("renders photos after successful fetch", async () => {
        mockedGetPhotographs.mockResolvedValue([
            {
                uuid: "1",
                title: "Sunset",
                description: "Beautiful sunset",
                filePath: "/images/sunset.jpg"
            }
        ]);

        render(
            <AuthProvider>
                <PhotographProvider>
                    <PhotoGallery />
                </PhotographProvider>
            </AuthProvider>
        );

        await waitFor(() =>
            expect(screen.queryByText(/Loading photographs.../i)).not.toBeInTheDocument()
        );

        expect(screen.getByText("Sunset")).toBeInTheDocument();
        expect(screen.getByText("Beautiful sunset")).toBeInTheDocument();

        const img = screen.getByRole("img", { name: "Sunset" });
        expect(img).toHaveAttribute("src", "https://test.com/images/sunset.jpg");
    });

    test("shows error message when fetch fails", async () => {
        mockedGetPhotographs.mockRejectedValue(new Error("Network error"));

        render(
            <AuthProvider>
                <PhotographProvider>
                    <PhotoGallery />
                </PhotographProvider>
            </AuthProvider>
        );

        await waitFor(() =>
            expect(screen.getByText(/Network error/i)).toBeInTheDocument()
        );
    });

    test('shows modal when clicked on photograph and closes when clicked escape', async() => {
        mockedGetPhotographs.mockResolvedValue([
            {
                uuid: "1",
                title: "Sunset",
                description: "Beautiful sunset",
                filePath: "/images/sunset.jpg"
            },
            {
                uuid: "2",
                title: "Night",
                description: "Beautiful night",
                filePath: "/images/beautiful_night.jpg"
            },
        ]);

        const { container } = render(
            <AuthProvider>
                <PhotographProvider>
                    <PhotoGallery />
                </PhotographProvider>
            </AuthProvider>
        );

        await waitFor(() =>
            expect(screen.queryByText(/Loading photographs.../i)).not.toBeInTheDocument()
        );

        expect(screen.queryByTestId('modal-overlay')).not.toBeInTheDocument();
        expect(screen.getAllByText('Sunset')).toHaveLength(1);
        expect(screen.getByText('Beautiful sunset')).toBeInTheDocument();
        expect(screen.getByAltText('Sunset')).toBeInTheDocument();
        expect(screen.getByAltText('Night')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('img', { name: "Sunset" }));
        await waitFor(() => {
            expect(screen.queryByTestId('modal-overlay')).toBeInTheDocument();
            expect(screen.getAllByText('Sunset')).toHaveLength(2);
        });

        fireEvent.keyDown(container, {key: 'Escape', code: 'Escape'})
        await waitFor(() => {
            expect(screen.queryByTestId('modal-overlay')).not.toBeInTheDocument();
            expect(screen.getAllByText('Sunset')).toHaveLength(1);
        });
    });

    test('shows next photograph when pressed arrow right keyboard', async() => {
        mockedGetPhotographs.mockResolvedValue([
            {
                uuid: "1",
                title: "Sunset",
                description: "Beautiful sunset",
                filePath: "/images/sunset.jpg"
            },
            {
                uuid: "2",
                title: "Night",
                description: "Beautiful night",
                filePath: "/images/beautiful_night.jpg"
            },
        ]);

        const { container } = render(
            <AuthProvider>
                <PhotographProvider>
                    <PhotoGallery />
                </PhotographProvider>
            </AuthProvider>
        );

        await waitFor(() =>
            expect(screen.queryByText(/Loading photographs.../i)).not.toBeInTheDocument()
        );

        expect(screen.queryByTestId('modal-overlay')).not.toBeInTheDocument();
        expect(screen.getAllByText('Sunset')).toHaveLength(1);
        expect(screen.getByText('Beautiful sunset')).toBeInTheDocument();
        expect(screen.getByAltText('Sunset')).toBeInTheDocument();
        expect(screen.getByAltText('Night')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('img', { name: "Sunset" }));
        await waitFor(() => {
            expect(screen.queryByTestId('modal-overlay')).toBeInTheDocument();
            expect(screen.getAllByText('Sunset')).toHaveLength(2);
        });

        fireEvent.keyDown(container, {key: 'ArrowRight', code: 'ArrowRight'})
        await waitFor(() => {
            expect(screen.queryByTestId('modal-overlay')).toBeInTheDocument();
            expect(screen.getAllByText('Night')).toHaveLength(2);
            expect(screen.getAllByText('Sunset')).toHaveLength(1);
        });
    });
});
