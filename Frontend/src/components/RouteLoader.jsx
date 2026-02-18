import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './RouteLoader.css';

function RouteLoader() {
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Show loader when route changes
    setLoading(true);
    
    // Hide after short delay (simulating page transition)
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!loading) return null;

  return (
    <div className="route-loader">
      <img 
        src="/images/logos/Shopping Green.gif" 
        alt="Loading..." 
        className="route-loader-icon"
      />
    </div>
  );
}

export default RouteLoader;
