import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  ShieldCheck,
  UserCircle,
  X,
} from "lucide-react";

type LoggedUser = {
  id: string;
  name: string;
  mobile: string;
};

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<LoggedUser | null>(null);

  const readUser = () => {
    try {
      const raw = localStorage.getItem("cyberShieldUser");

      if (raw) {
        setUser(JSON.parse(raw));
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    readUser();

    window.addEventListener("storage", readUser);
    window.addEventListener("cybershield-user-update", readUser);

    return () => {
      window.removeEventListener("storage", readUser);
      window.removeEventListener("cybershield-user-update", readUser);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const logout = () => {
    localStorage.removeItem("cyberShieldUser");

    setUser(null);

    window.dispatchEvent(
      new Event("cybershield-user-update")
    );

    navigate("/login");
  };

  const navClass = (path: string) => {
    return location.pathname === path
      ? "nav-item active"
      : "nav-item";
  };

  return (
    <header className="navbar">
      <Link to="/" className="logo">
        <ShieldCheck size={29} />
        <span>CyberShield AI</span>
      </Link>

      <nav
        className={
          menuOpen
            ? "nav-links nav-links-open"
            : "nav-links"
        }
      >
        <Link to="/" className={navClass("/")}>
          Home
        </Link>

        {user && (
          <>
            <Link
              to="/dashboard"
              className={navClass("/dashboard")}
            >
              Dashboard
            </Link>

            <Link
              to="/url-scanner"
              className={navClass("/url-scanner")}
            >
              URL Scanner
            </Link>

            <Link
              to="/email-scanner"
              className={navClass("/email-scanner")}
            >
              Email Scanner
            </Link>

            <Link
              to="/message-scanner"
              className={navClass("/message-scanner")}
            >
              Message Scanner
            </Link>

            <Link
              to="/assistant"
              className={navClass("/assistant")}
            >
              AI Assistant
            </Link>

            <Link
              to="/learning"
              className={navClass("/learning")}
            >
              Learn
            </Link>
          </>
        )}
      </nav>

      <div className="nav-actions">
        {user ? (
          <>
            <Link
              to="/profile"
              className="navbar-profile"
            >
              <UserCircle size={19} />
              <span>{user.name}</span>
            </Link>

            <button
              type="button"
              className="navbar-logout"
              onClick={logout}
            >
              Logout
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="btn-primary"
          >
            Login
          </Link>
        )}

        <button
          type="button"
          className="mobile-menu-btn"
          onClick={() =>
            setMenuOpen((current) => !current)
          }
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? (
            <X size={25} />
          ) : (
            <Menu size={25} />
          )}
        </button>
      </div>
    </header>
  );
}