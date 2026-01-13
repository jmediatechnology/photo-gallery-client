import { render, screen } from "@testing-library/react";
import App from "./App";
import { getPhotographs } from "./api/client";
import { vi, type Mock } from "vitest";

vi.mock("./api/client", () => ({
    getPhotographs: vi.fn()
}));

const mockedGetPhotographs = getPhotographs as Mock;

describe("App", () => {
    beforeEach(() => {
        mockedGetPhotographs.mockResolvedValue([]);
    });

    test("renders App and loads PhotoGallery", () => {
        render(<App />);

        expect(screen.getByText(/Loading photographs.../i)).toBeInTheDocument();
    });
});
