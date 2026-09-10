import {
  LoaderCircle,
  Phone,
  Save,
  User,
} from "lucide-react";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  doc,
  updateDoc,
} from "firebase/firestore";

import {
  db,
} from "../firebase/firebase";

type LoggedUser = {
  id: string;
  name: string;
  mobile: string;
};

export default function Profile() {
  const navigate =
    useNavigate();

  const [user, setUser] =
    useState<LoggedUser | null>(
      null
    );

  const [name, setName] =
    useState("");

  const [
    mobile,
    setMobile,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    try {
      const raw =
        localStorage.getItem(
          "cyberShieldUser"
        );

      const stored =
        raw
          ? JSON.parse(raw)
          : null;

      if (!stored?.id) {
        navigate(
          "/login"
        );

        return;
      }

      setUser(stored);
      setName(
        stored.name || ""
      );
      setMobile(
        stored.mobile || ""
      );
    } catch {
      navigate(
        "/login"
      );
    }
  }, [navigate]);

  const saveProfile =
    async (
      event:
        FormEvent
    ) => {
      event.preventDefault();

      if (!user) {
        return;
      }

      const cleanName =
        name.trim();

      const cleanMobile =
        mobile.trim();

      if (
        cleanName.length < 2
      ) {
        setError(
          "Enter a valid name."
        );

        return;
      }

      if (
        !/^[6-9]\d{9}$/.test(
          cleanMobile
        )
      ) {
        setError(
          "Enter a valid 10-digit mobile number."
        );

        return;
      }

      try {
        setLoading(true);
        setError("");
        setMessage("");

        await updateDoc(
          doc(
            db,
            "users",
            user.id
          ),
          {
            name:
              cleanName,

            mobile:
              cleanMobile,
          }
        );

        const updated = {
          ...user,

          name:
            cleanName,

          mobile:
            cleanMobile,
        };

        localStorage.setItem(
          "cyberShieldUser",
          JSON.stringify(
            updated
          )
        );

        setUser(
          updated
        );

        window.dispatchEvent(
          new Event(
            "cybershield-user-update"
          )
        );

        setMessage(
          "Profile updated successfully."
        );
      } catch {
        setError(
          "Unable to update profile."
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <main className="profile-page">
      <div className="profile-container">
        <form
          className="profile-card"
          onSubmit={
            saveProfile
          }
        >
          <div className="profile-avatar">
            <User size={40} />
          </div>

          <h1>
            My Profile
          </h1>

          <p>
            Manage your
            CyberShield AI
            information.
          </p>

          {error && (
            <div className="scanner-error">
              {error}
            </div>
          )}

          {message && (
            <div className="profile-success">
              {message}
            </div>
          )}

          <label>
            Full Name
          </label>

          <div className="input-box">
            <User size={20} />

            <input
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value
                )
              }
            />
          </div>

          <label>
            Mobile Number
          </label>

          <div className="input-box">
            <Phone
              size={20}
            />

            <span>
              +91
            </span>

            <input
              value={mobile}
              maxLength={10}
              onChange={(event) =>
                setMobile(
                  event.target.value.replace(
                    /\D/g,
                    ""
                  )
                )
              }
            />
          </div>

          <div className="profile-id-box">
            <span>
              User ID
            </span>

            <code>
              {user?.id}
            </code>
          </div>

          <button
            type="submit"
            className="btn-primary full-btn"
            disabled={
              loading
            }
          >
            {loading ? (
              <>
                <LoaderCircle
                  size={18}
                  className="spin"
                />

                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}