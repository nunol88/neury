import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import logoMayslimpo from "@/assets/logo-mayslimpo.jpg";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/50 to-background p-4">
      <div className="text-center space-y-6 animate-fade-in">
        <img
          src={logoMayslimpo}
          alt="Mayslimpo"
          className="w-20 h-20 rounded-full object-cover shadow-lg border-2 border-border mx-auto"
        />
        <div>
          <h1 className="text-6xl font-bold text-primary mb-2">404</h1>
          <p className="text-xl text-foreground font-semibold">Página não encontrada</p>
          <p className="text-sm text-muted-foreground mt-1">
            O endereço <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{location.pathname}</code> não existe.
          </p>
        </div>
        <Button onClick={() => navigate("/")} size="lg" className="rounded-xl">
          Voltar ao início
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
