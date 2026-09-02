import { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import {
  Building2,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  MapPin,
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Layout() {
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Accueil', end: true },
    { to: '/properties', label: 'Recherche' },
    { to: '/sale', label: 'Acheter' },
    { to: '/rent', label: 'Louer' },
    { to: '/agencies', label: 'Agences' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 text-white shadow-md shadow-indigo-500/20">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="bg-gradient-to-r from-foreground via-foreground to-indigo-600 bg-clip-text text-transparent">
              Immo-MyKajy
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3.5 py-2 transition-all duration-200',
                    isActive
                      ? 'bg-indigo-50 font-semibold text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop Auth / User */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <div className="flex items-center gap-1.5">
                <Link
                  to="/favorites"
                  title="Mes favoris"
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                    'rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30',
                  )}
                >
                  <span className="text-xs font-semibold">Favoris</span>
                </Link>
                <Link
                  to="/saved-searches"
                  title="Mes alertes"
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                    'rounded-full text-muted-foreground hover:text-indigo-600',
                  )}
                >
                  <span className="text-xs font-semibold">Alertes</span>
                </Link>
                <Link
                  to="/inquiries"
                  title="Demandes & Contacts"
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                    'rounded-full text-muted-foreground hover:text-indigo-600',
                  )}
                >
                  <span className="text-xs font-semibold">Demandes</span>
                </Link>
                <Link
                  to="/profile"
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'sm' }),
                    'rounded-full gap-2 border-border/80 shadow-xs',
                  )}
                >
                  <LayoutDashboard className="h-4 w-4 text-indigo-600" />
                  <span className="font-medium">{user?.firstName || 'Mon Profil'}</span>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  title="Se déconnecter"
                  className="rounded-full text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                    'rounded-full font-medium',
                  )}
                >
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className={cn(
                    buttonVariants({ size: 'sm' }),
                    'rounded-full bg-indigo-600 font-medium hover:bg-indigo-500 shadow-md shadow-indigo-600/20 text-white',
                  )}
                >
                  Déposer une annonce
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-foreground hover:bg-muted"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="border-b border-border bg-background/95 p-4 md:hidden backdrop-blur-xl">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-indigo-50 font-bold text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <div className="mt-4 border-t border-border pt-4 flex flex-col gap-2">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/favorites"
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(buttonVariants({ variant: 'outline' }), 'w-full justify-start text-xs')}
                    >
                      Mes Favoris
                    </Link>
                    <Link
                      to="/saved-searches"
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(buttonVariants({ variant: 'outline' }), 'w-full justify-start text-xs')}
                    >
                      Mes Recherches & Alertes
                    </Link>
                    <Link
                      to="/inquiries"
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(buttonVariants({ variant: 'outline' }), 'w-full justify-start text-xs')}
                    >
                      Demandes & Messages
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(buttonVariants({ variant: 'outline' }), 'w-full justify-start text-xs')}
                    >
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Mon Profil ({user?.email})
                    </Link>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full justify-start"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Se déconnecter
                    </Button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
                    >
                      Connexion
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(buttonVariants(), 'w-full bg-indigo-600 text-white')}
                    >
                      Inscription / Publier
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border/60 bg-card text-card-foreground">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
            {/* Col 1 : Brand & Mission */}
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-2 font-bold text-lg">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  <Building2 className="h-4 w-4" />
                </div>
                <span>Immo-MyKajy</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                La plateforme immobilière nouvelle génération. Vente, location, gestion d'agences et estimation transparente en temps réel.
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-indigo-500" /> Paris & Régions</span>
              </div>
            </div>

            {/* Col 2 : Navigation */}
            <div>
              <h4 className="font-semibold text-sm mb-4 tracking-wide uppercase text-foreground/80">Navigation</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <Link to="/" className="hover:text-indigo-600 transition-colors">Accueil</Link>
                </li>
                <li>
                  <Link to="/properties" className="hover:text-indigo-600 transition-colors">Toutes les annonces</Link>
                </li>
                <li>
                  <Link to="/sale" className="hover:text-indigo-600 transition-colors">Biens à vendre</Link>
                </li>
                <li>
                  <Link to="/rent" className="hover:text-indigo-600 transition-colors">Biens à louer</Link>
                </li>
                <li>
                  <Link to="/agencies" className="hover:text-indigo-600 transition-colors">Agences partenaires</Link>
                </li>
              </ul>
            </div>

            {/* Col 3 : Types de biens */}
            <div>
              <h4 className="font-semibold text-sm mb-4 tracking-wide uppercase text-foreground/80">Catégories</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <Link to="/properties?propertyType=appartement" className="hover:text-indigo-600 transition-colors">Appartements</Link>
                </li>
                <li>
                  <Link to="/properties?propertyType=maison" className="hover:text-indigo-600 transition-colors">Maisons & Villas</Link>
                </li>
                <li>
                  <Link to="/properties?propertyType=studio" className="hover:text-indigo-600 transition-colors">Studios</Link>
                </li>
                <li>
                  <Link to="/properties?propertyType=bureau" className="hover:text-indigo-600 transition-colors">Bureaux & Locaux</Link>
                </li>
                <li>
                  <Link to="/properties?propertyType=terrain" className="hover:text-indigo-600 transition-colors">Terrains</Link>
                </li>
              </ul>
            </div>

            {/* Col 4 : Professionnels & Contact */}
            <div>
              <h4 className="font-semibold text-sm mb-4 tracking-wide uppercase text-foreground/80">Espace Pro</h4>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Vous êtes une agence ou un agent indépendant ? Rejoignez le réseau Immo-MyKajy.
              </p>
              <div className="flex flex-col gap-2">
                <Link
                  to="/register"
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full justify-center')}
                >
                  Créer un compte Pro
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col md:flex-row items-center justify-between border-t border-border/60 pt-6 text-xs text-muted-foreground gap-4">
            <p>© {new Date().getFullYear()} Immo-MyKajy. Tous droits réservés.</p>
            <div className="flex items-center gap-6">
              <span className="hover:text-foreground cursor-pointer">Conditions générales</span>
              <span className="hover:text-foreground cursor-pointer">Politique de confidentialité</span>
              <span className="hover:text-foreground cursor-pointer">Mentions légales</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
