import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ActionFooter } from './ActionFooter.tsx';

describe('ActionFooter', () => {
    it('renders inside the action-footer container', () => {
        render(<ActionFooter isPlaying={false} onToggleSlideshow={vi.fn()} />);

        expect(screen.getByTestId('action-footer')).toBeInTheDocument();
    });

    it('shows a "Start slideshow" button when not playing', () => {
        render(<ActionFooter isPlaying={false} onToggleSlideshow={vi.fn()} />);

        const button = screen.getByRole('button', { name: 'Start slideshow' });
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute('aria-pressed', 'false');
        expect(button).not.toHaveClass('active');
    });

    it('shows a "Stop slideshow" button in the active state when playing', () => {
        render(<ActionFooter isPlaying={true} onToggleSlideshow={vi.fn()} />);

        const button = screen.getByRole('button', { name: 'Stop slideshow' });
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute('aria-pressed', 'true');
        expect(button).toHaveClass('active');
    });

    it('calls onToggleSlideshow exactly once per click', () => {
        const onToggleSlideshow = vi.fn();
        render(<ActionFooter isPlaying={false} onToggleSlideshow={onToggleSlideshow} />);

        fireEvent.click(screen.getByRole('button', { name: 'Start slideshow' }));

        expect(onToggleSlideshow).toHaveBeenCalledTimes(1);
    });

    it('does not flip its own aria label on click', () => {
        const onToggleSlideshow = vi.fn();
        const { rerender } = render(<ActionFooter isPlaying={false} onToggleSlideshow={onToggleSlideshow} />);

        //  ActionFooter just runs onToggleSlideshow on click.
        //  This shouldn't change isPlaying, because isPlaying is owned by the caller.
        fireEvent.click(screen.getByRole('button', { name: 'Start slideshow' }));

        // Still "Start slideshow" because ActionFooter has no state of its own —
        // isPlaying only changes when the parent re-renders it with a new prop.
        expect(screen.getByRole('button', { name: 'Start slideshow' })).toBeInTheDocument();

        rerender(<ActionFooter isPlaying={true} onToggleSlideshow={onToggleSlideshow} />);
        expect(screen.getByRole('button', { name: 'Stop slideshow' })).toBeInTheDocument();
    });
});
