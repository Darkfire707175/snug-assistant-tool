import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Gamepad2, LogOut, Menu, Search, Trophy, User, Users, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { GAMES } from "@/games/registry";
import { useAuth } from "@/lib/auth";
import { useSound } from "@/lib/sound";
import { toast } from "sonner";

const NAV = [
  { to: "/", label: "Juegos", icon: Gamepad2 },
  { to: "/ranking", label: "Ranking", icon: Trophy },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function Navbar() {
  const { user, profile, signInWithGoogle, signOut, switchAccount } = useAuth();
  const { enabled, toggle } = useSound();
  const [openSearch, setOpenSearch] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpenSearch((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const initials = (profile?.display_name ?? "J").slice(0, 2).toUpperCase();

  const handleSignIn = async () => {
    const { error } = await signInWithGoogle();
    if (error) toast.error(error);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        <Link to="/" className="font-display text-lg font-bold tracking-wide sm:text-xl">
          🎮 <span className="text-gradient">GameZone</span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
              activeProps={{ className: "bg-surface-2 text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="neon"
            size="icon"
            aria-label="Buscar juegos"
            onClick={() => setOpenSearch(true)}
          >
            <Search />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={enabled ? "Desactivar sonido" : "Activar sonido"}
            onClick={toggle}
          >
            {enabled ? <Volume2 /> : <VolumeX />}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border border-border bg-surface py-1 pl-1 pr-3 transition-colors hover:bg-surface-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url ?? undefined} alt="" />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-[120px] truncate text-sm font-semibold sm:block">
                    {profile?.display_name}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/perfil" })}>
                  <User className="mr-2 h-4 w-4" /> Mi perfil
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    const { error } = await switchAccount();
                    if (error) toast.error(error);
                  }}
                >
                  <Users className="mr-2 h-4 w-4" /> Cambiar cuenta
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await signOut();
                    toast.success("Sesión cerrada");
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="hero" onClick={handleSignIn}>
              Entrar con Google
            </Button>
          )}

          <Sheet open={openMenu} onOpenChange={setOpenMenu}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menú">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 bg-background">
              <nav className="mt-10 flex flex-col gap-2">
                {NAV.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpenMenu(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 font-semibold text-muted-foreground hover:bg-surface hover:text-foreground"
                    activeProps={{ className: "bg-surface-2 text-foreground" }}
                    activeOptions={{ exact: item.to === "/" }}
                  >
                    <item.icon className="h-5 w-5" /> {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <CommandDialog open={openSearch} onOpenChange={setOpenSearch}>
        <CommandInput placeholder="Buscar un juego…" />
        <CommandList>
          <CommandEmpty>Ningún juego coincide.</CommandEmpty>
          <CommandGroup heading="Juegos">
            {GAMES.map((game) => (
              <CommandItem
                key={game.id}
                value={`${game.name} ${game.category}`}
                onSelect={() => {
                  setOpenSearch(false);
                  navigate({ to: "/juego/$slug", params: { slug: game.slug } });
                }}
              >
                <span className="mr-2">{game.icon}</span>
                {game.name}
                <span className="ml-auto text-xs text-muted-foreground">{game.category}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  );
}
