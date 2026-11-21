import {
  FormEvent,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  LoaderCircle,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";

import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import {
  db,
} from "../firebase/firebase";

type UserData = {
  id: string;
  name: string;
  mobile: string;
};

export default function Login() {
  const navigate =
    useNavigate();

  const [name, setName] =
    useState("");

  const [
    mobile,
    setMobile,
  ] = useState("");

  const [error, setError] =
    useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const handleLogin = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    const cleanName =
      name.trim();

    const cleanMobile =
      mobile.trim();

    if (
      cleanName.length < 2
    ) {
      setError(
        "Please enter a valid name."
      );
      return;
    }

    const mobileRegex =
      /^[6-9]\d{9}$/;

    if (
      !mobileRegex.test(
        cleanMobile
      )
    ) {
      setError(
        "Please enter a valid 10-digit mobile number."
      );
      return;
    }

    try {
      setLoading(true);

      const usersRef =
        collection(
          db,
          "users"
        );

      const userQuery =
        query(
          usersRef,
          where(
            "name",
            "==",
            cleanName
          ),
          where(
            "mobile",
            "==",
            cleanMobile
          )
        );

      const snapshot =
        await getDocs(
          userQuery
        );

      let userData:
        UserData;

      if (
        !snapshot.empty
      ) {
        const userDocument =
          snapshot.docs[0];

        const data =
          userDocument.data();

        userData = {
          id:
            userDocument.id,

          name:
            data.name,

          mobile:
            data.mobile,
        };
      } else {
        const documentReference =
          await addDoc(
            usersRef,
            {
              name:
                cleanName,

              mobile:
                cleanMobile,

              createdAt:
                serverTimestamp(),
            }
          );

        userData = {
          id:
            documentReference.id,

          name:
            cleanName,

          mobile:
            cleanMobile,
        };
      }

      localStorage.setItem(
        "cyberShieldUser",
        JSON.stringify(
          userData
        )
      );

      window.dispatchEvent(
        new Event(
          "cybershield-user-update"
        )
      );

      navigate(
        "/dashboard"
      );
    } catch (err) {
      console.error(
        "Firebase Login Error:",
        err
      );

      setError(
        "Unable to connect to Firebase."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <form
        className="auth-card"
        onSubmit={handleLogin}
      >
        <div className="login-logo">
          <ShieldCheck
            size={45}
          />
        </div>

        <h1>
          Welcome to
          CyberShield
        </h1>

        <p>
          Enter your name and
          mobile number to
          continue.
        </p>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <label>
          Full Name
        </label>

        <div className="input-box">
          <User size={20} />

          <input
            type="text"
            placeholder="Enter your full name"
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
          <Phone size={20} />

          <span className="country-code">
            +91
          </span>

          <input
            type="tel"
            placeholder="9876543210"
            value={mobile}
            maxLength={10}
            inputMode="numeric"
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

        <button
          type="submit"
          className="btn-primary full-btn"
          disabled={loading}
        >
          {loading ? (
            <>
              <LoaderCircle
                size={19}
                className="spin"
              />
              Checking...
            </>
          ) : (
            "Continue"
          )}
        </button>
      </form>
    </main>
  );
}