import {render, screen} from "@testing-library/react";
import {Logo} from "./Logo.tsx";

describe('Logo', () => {
    test('should render', () => {
        render(<Logo />);
        expect(screen.getByAltText('Logo')).toBeInTheDocument();
    })
})
