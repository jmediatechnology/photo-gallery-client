import './App.css'
import {PhotoGallery} from "./components/PhotoGallery/PhotoGallery.tsx";
import {NavBar} from "./components/NavBar/NavBar.tsx";
import {AuthProvider} from "./auth/AuthContext.tsx";
import {PhotographProvider} from "./photograph/PhotographContext.tsx";

function App() {

  return (
      <AuthProvider>
          <PhotographProvider>
              <div>
                  <NavBar />
                  <PhotoGallery />
              </div>
          </PhotographProvider>
      </AuthProvider>
  )
}

export default App
