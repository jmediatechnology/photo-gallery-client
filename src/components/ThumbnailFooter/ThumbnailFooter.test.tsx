import {render, screen} from "@testing-library/react";
import {ThumbnailFooter} from "./ThumbnailFooter.tsx";
import {CircularArray} from "../../data-structures/CircularArray.ts";
import type {PhotographDTO} from "../../types";
import {vi} from "vitest";

const mockedPhotographs: CircularArray<PhotographDTO> = CircularArray.from([
    {
        uuid: '1',
        title: 'Alpha',
        description: 'Description of Alpha',
        filePath: '/images/alpha.jpg',
        createdAt: '2025-10-01 01:00:00',
        updatedAt: '2025-10-01 01:00:00',
    },
    {
        uuid: '2',
        title: 'Bravo',
        description: 'Description of Bravo',
        filePath: '/images/bravo.jpg',
        createdAt: '2025-10-02 02:00:00',
        updatedAt: '2025-10-02 02:00:00',
    },
    {
        uuid: '3',
        title: 'Charlie',
        description: 'Description of Charlie',
        filePath: '/images/charlie.jpg',
        createdAt: '2025-10-03 03:00:00',
        updatedAt: '2025-10-03 03:00:00',
    },
    {
        uuid: '4',
        title: 'Delta',
        description: 'Description of Delta',
        filePath: '/images/delta.jpg',
        createdAt: '2025-10-04 04:00:00',
        updatedAt: '2025-10-04 04:00:00',
    },
    {
        uuid: '5',
        title: 'Echo',
        description: 'Description of Echo',
        filePath: '/images/echo.jpg',
        createdAt: '2025-10-05 05:00:00',
        updatedAt: '2025-10-05 05:00:00',
    },
    {
        uuid: '6',
        title: 'Foxtrot',
        description: 'Description of Foxtrot',
        filePath: '/images/foxtrot.jpg',
        createdAt: '2025-10-06 06:00:00',
        updatedAt: '2025-10-06 06:00:00',
    },
    {
        uuid: '7',
        title: 'Golf',
        description: 'Description of Golf',
        filePath: '/images/golf.jpg',
        createdAt: '2025-10-07 07:00:00',
        updatedAt: '2025-10-07 07:00:00',
    },
    {
        uuid: '8',
        title: 'Hotel',
        description: 'Description of Hotel',
        filePath: '/images/hotel.jpg',
        createdAt: '2025-10-08 08:00:00',
        updatedAt: '2025-10-08 08:00:00',
    },
    {
        uuid: '9',
        title: 'India',
        description: 'Description of India',
        filePath: '/images/india.jpg',
        createdAt: '2025-10-09 09:00:00',
        updatedAt: '2025-10-09 09:00:00',
    },
]);

const mockOnSelect = vi.fn();


describe('ThumbnailFooter', () => {

    test('renders thumbnail footer div', () => {
        render(<ThumbnailFooter photographs={mockedPhotographs} offset={0} onSelect={mockOnSelect} />);
        expect(screen.queryByTestId('thumbnail-footer')).toBeInTheDocument();
    });


    test('renders 3 images on the left, 1 current offset image, and 3 next images when offset fits the middle', () => {
        render(<ThumbnailFooter photographs={mockedPhotographs} offset={3} onSelect={mockOnSelect} />);

        expect(screen.queryByRole('img', {name: 'Alpha'})).toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'Bravo'})).toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'Charlie'})).toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'Delta'})).toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'Echo'})).toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'Foxtrot'})).toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'Golf'})).toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'Hotel'})).not.toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'India'})).not.toBeInTheDocument();
    });

    test('renders image range containing 3 left, 1 current, and 3 next images when offset fits the middle and slides by one to the right', () => {
        render(<ThumbnailFooter photographs={mockedPhotographs} offset={4} onSelect={mockOnSelect} />);

        expect(screen.queryByRole('img', {name: 'Alpha'})).not.toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'Bravo'})).toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'Charlie'})).toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'Delta'})).toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'Echo'})).toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'Foxtrot'})).toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'Golf'})).toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'Hotel'})).toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'India'})).not.toBeInTheDocument();
    });

    test('renders 3 end images, 1 current image, and 3 next images when offset is zero', () => {
        render(<ThumbnailFooter photographs={mockedPhotographs} offset={0} onSelect={mockOnSelect} />);

        expect(screen.queryByRole('img', {name: 'Alpha'})).toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'Bravo'})).toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'Charlie'})).toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'Delta'})).toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'Echo'})).not.toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'Foxtrot'})).not.toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'Golf'})).toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'Hotel'})).toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'India'})).toBeInTheDocument();
    });

    test('renders 3 end images, 1 current image, and 3 next images when offset is one', () => {
        render(<ThumbnailFooter photographs={mockedPhotographs} offset={1} onSelect={mockOnSelect} />);

        expect(screen.queryByRole('img', {name: 'Alpha'})).toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'Bravo'})).toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'Charlie'})).toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'Delta'})).toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'Echo'})).toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'Foxtrot'})).not.toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'Golf'})).not.toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'Hotel'})).toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'India'})).toBeInTheDocument();
    });

    test('renders 3 end images, 1 current image, and 3 next images when offset is one', () => {
        render(<ThumbnailFooter photographs={mockedPhotographs} offset={1} onSelect={mockOnSelect} />);

        expect(screen.queryByRole('img', {name: 'Alpha'})).toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'Bravo'})).toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'Charlie'})).toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'Delta'})).toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'Echo'})).toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'Foxtrot'})).not.toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'Golf'})).not.toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'Hotel'})).toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'India'})).toBeInTheDocument();
    });

    test('renders 3 first images, 1 current, and 3 next images when offset is the last', () => {
        render(<ThumbnailFooter photographs={mockedPhotographs} offset={mockedPhotographs.length - 1} onSelect={mockOnSelect} />);

        expect(screen.queryByRole('img', {name: 'Alpha'})).toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'Bravo'})).toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'Charlie'})).toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'Delta'})).not.toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'Echo'})).not.toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'Foxtrot'})).toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'Golf'})).toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'Hotel'})).toBeInTheDocument();
        expect(screen.queryByRole('img', {name: 'India'})).toBeInTheDocument();
    });
})
