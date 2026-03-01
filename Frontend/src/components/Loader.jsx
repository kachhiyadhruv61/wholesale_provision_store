import { useState, useEffect } from 'react';
import './Loader.css';

function Loader() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Hide loader after page loads
    const timer = setTimeout(() => {
      setShow(false);
    }, 2000); // Show for 2 seconds

    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="loader-overlay">
      <div className="loader-content">
        <img 
          src="/images/logos/Shopping Green.gif" 
          alt="Loading..." 
          className="loader-gif"
        />
        <p className="loader-text">Loading DK TRADERS...</p>
      </div>
    </div>
  );
}

export default Loader;
