import { Link, Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div>
      {/* Navbar global */}
      <header style={{ background: '#1a1a1a', color: '#fff', padding: '16px 32px' }}>
        <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>🏛️ Museo Virtual</h2>
          <Link to="/" style={{ color: '#fff', textDecoration: 'none' }}>Inicio</Link>
          <Link to="/eventos" style={{ color: '#fff', textDecoration: 'none' }}>Eventos</Link>
          <Link to="/catalogo" style={{ color: '#fff', textDecoration: 'none' }}>Catálogo</Link>
        </nav>
      </header>

      {/* Aquí es donde React Router renderiza cada View según la URL */}
      <main style={{ padding: '20px' }}>
        <Outlet />
      </main>
    </div>
  );
}