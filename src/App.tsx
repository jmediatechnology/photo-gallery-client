import './App.css'
import {PhotoGallery} from "./components/PhotoGallery/PhotoGallery.tsx";
import {NavBar} from "./components/NavBar/NavBar.tsx";
import {AuthProvider} from "./context/AuthContext.tsx";
import {PhotographProvider} from "./context/PhotographContext.tsx";
import {PhotographSelectionProvider} from "./context/PhotographSelectionContext.tsx";

function App() {

    return (
        <AuthProvider>
            <PhotographProvider>
                <PhotographSelectionProvider>
                    <div className="app">
                        <NavBar />
                        <PhotoGallery />
                    </div>
                </PhotographSelectionProvider>
            </PhotographProvider>
        </AuthProvider>
    )
}

export default App
