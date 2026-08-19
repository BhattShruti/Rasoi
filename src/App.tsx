import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { RecipeDetail } from './pages/RecipeDetail';
import { Saved } from './pages/Saved';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-cream text-charcoal font-sans selection:bg-terracotta/10 selection:text-terracotta">
          {/* Navbar header */}
          <Navbar />
          
          {/* Main page content */}
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/recipe/:id" element={<RecipeDetail />} />
              <Route path="/saved" element={<Saved />} />
            </Routes>
          </main>

          {/* Editorial Footer */}
          <Footer />
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
