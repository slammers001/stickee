import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <img 
          src="/Stickee-Not-Found.png" 
          alt="Stickee Not Found" 
          className="mx-auto mb-8 max-w-md h-auto object-contain"
          onError={(e) => {
            console.error('Failed to load Stickee-Not-Found.png, checking file...');
            const target = e.target as HTMLImageElement;
            // Try with timestamp to bust cache
            target.src = `/Stickee-Not-Found.png?t=${Date.now()}`;
          }}
        />
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-blue-500 underline hover:text-blue-700">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
