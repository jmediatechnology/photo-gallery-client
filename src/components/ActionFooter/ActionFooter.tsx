import './ActionFooter.css';
import { MdSlideshow, MdStop } from "react-icons/md";

interface ActionFooterProps {
    isPlaying: boolean;
    onToggleSlideshow: () => void;
}

export const ActionFooter = ({ isPlaying, onToggleSlideshow }: ActionFooterProps) => {
    return (
        <div data-testid="action-footer" className="action-footer">
            <button
                className={`action-footer-slideshow-toggle${isPlaying ? ' active' : ''}`}
                onClick={onToggleSlideshow}
                aria-label={isPlaying ? 'Stop slideshow' : 'Start slideshow'}
                aria-pressed={isPlaying}
            >
                {isPlaying ? <MdStop /> : <MdSlideshow />}
            </button>
        </div>
    );
};
