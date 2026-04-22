import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Browse } from './pages/Browse';
import { MovieDetail } from './pages/MovieDetail';
import { LiveTV } from './pages/LiveTV';
import { Account } from './pages/Account';
import { Player } from './pages/Player';
import { Admin } from './pages/Admin';
import { Search } from './pages/Search';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="browse/:category" element={<Browse />} />
          <Route path="search" element={<Search />} />
          <Route path="phim/:slug" element={<MovieDetail />} />
          <Route path="live" element={<LiveTV />} />
          <Route path="account" element={<Account />} />
          <Route path="admin" element={<Admin />} />
        </Route>
        {/* Player is outside Layout to be full screen without Navbar/Footer */}
        <Route path="/play/:slug/:episode?" element={<Player />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
