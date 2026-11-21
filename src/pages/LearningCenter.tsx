import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  KeyRound,
  Lock,
  MessageSquareWarning,
  Search,
  Shield,
  ShieldCheck,
  Smartphone,
  UserRoundCheck,
  Wifi,
} from "lucide-react";

type Lesson = {
  id: number;
  title: string;
  category: string;
  description: string;
  icon: React.ReactNode;
  points: string[];
  tips: string[];
};

const lessons: Lesson[] = [
  {
    id: 1,
    title: "Phishing Awareness",
    category: "Phishing",
    description:
      "Learn how phishing attacks work and how to identify fake emails, websites, and login pages.",
    icon: <AlertTriangle size={24} />,
    points: [
      "Phishing attackers often impersonate banks, companies, colleges, or government organizations.",
      "They may create urgency using messages such as 'Your account will be blocked' or 'Verify immediately'.",
      "Fake login pages are designed to steal usernames, passwords, OTPs, and banking information.",
      "Always inspect the sender email address and website domain before entering sensitive information.",
      "Avoid clicking suspicious links received through unknown or unexpected messages.",
    ],
    tips: [
      "Check the sender address carefully.",
      "Hover over links before clicking them.",
      "Never share OTP, PIN, or password through email.",
      "Use multi-factor authentication whenever available.",
    ],
  },
  {
    id: 2,
    title: "SMS & WhatsApp Scams",
    category: "Scams",
    description:
      "Understand common fraud techniques used through SMS, WhatsApp, and other messaging platforms.",
    icon: <MessageSquareWarning size={24} />,
    points: [
      "Scammers may pretend to be bank officials, delivery companies, friends, police officers, or customer support.",
      "Fraud messages often contain shortened links or unknown payment links.",
      "Some scams ask users to install screen-sharing or remote-access applications.",
      "Messages promising prizes, lottery winnings, refunds, or instant jobs should be verified independently.",
      "Never trust a request for money only because the message appears to come from a known contact.",
    ],
    tips: [
      "Call the person directly if a money request looks unusual.",
      "Do not open unknown APK or application files.",
      "Block and report suspicious numbers.",
      "Never share banking OTPs or UPI PINs.",
    ],
  },
  {
    id: 3,
    title: "Password Security",
    category: "Account Security",
    description:
      "Create stronger passwords and protect your online accounts from unauthorized access.",
    icon: <KeyRound size={24} />,
    points: [
      "Strong passwords should be long, unique, and difficult to guess.",
      "Avoid passwords based on your name, mobile number, birthday, or common words.",
      "Do not use the same password for multiple important accounts.",
      "Password managers can help generate and securely store unique passwords.",
      "Multi-factor authentication adds another layer of protection.",
    ],
    tips: [
      "Use at least 12 characters when possible.",
      "Mix uppercase, lowercase, numbers, and symbols.",
      "Do not reuse your email password elsewhere.",
      "Change passwords immediately if an account is compromised.",
    ],
  },
  {
    id: 4,
    title: "Safe Web Browsing",
    category: "Web Security",
    description:
      "Learn safer browsing habits and how to recognize risky websites and downloads.",
    icon: <Wifi size={24} />,
    points: [
      "Verify that the website domain is correct before entering personal information.",
      "HTTPS encrypts communication but does not automatically mean a website is trustworthy.",
      "Avoid downloading software from unknown or unofficial websites.",
      "Fake advertisements may redirect users to malware or phishing pages.",
      "Keep browsers and browser extensions updated.",
    ],
    tips: [
      "Use official websites for software downloads.",
      "Avoid clicking suspicious pop-ups.",
      "Remove browser extensions you do not use.",
      "Scan suspicious links before opening them.",
    ],
  },
  {
    id: 5,
    title: "OTP & Banking Fraud",
    category: "Banking",
    description:
      "Protect your banking details, OTPs, UPI PINs, and payment accounts from fraud.",
    icon: <Lock size={24} />,
    points: [
      "Banks normally do not ask customers to share OTPs, ATM PINs, CVVs, or UPI PINs.",
      "Fraudsters may create fake customer-care numbers and payment requests.",
      "A UPI collect request can deduct money when approved.",
      "Screen-sharing applications can expose banking information to attackers.",
      "Always verify payment details before confirming transactions.",
    ],
    tips: [
      "Never share an OTP with anyone.",
      "Do not approve unknown UPI collect requests.",
      "Use official banking apps.",
      "Immediately contact your bank if you notice suspicious transactions.",
    ],
  },
  {
    id: 6,
    title: "Mobile Security",
    category: "Device Security",
    description:
      "Keep your smartphone secure from malicious applications, unsafe permissions, and account theft.",
    icon: <Smartphone size={24} />,
    points: [
      "Install applications only from trusted app stores.",
      "Review app permissions before allowing access to contacts, messages, camera, or microphone.",
      "Keep your mobile operating system and applications updated.",
      "Use a strong screen lock and biometric protection when available.",
      "Avoid installing APK files received through unknown messages.",
    ],
    tips: [
      "Enable Find My Device.",
      "Avoid rooting or jailbreaking your primary phone.",
      "Remove unused applications.",
      "Check app permissions regularly.",
    ],
  },
  {
    id: 7,
    title: "Social Engineering",
    category: "Human Security",
    description:
      "Understand how attackers manipulate people instead of directly attacking computer systems.",
    icon: <UserRoundCheck size={24} />,
    points: [
      "Social engineering attacks rely on trust, fear, urgency, authority, or curiosity.",
      "Attackers may pretend to be employees, technical support, police officers, or managers.",
      "They may ask for confidential information or convince victims to perform unsafe actions.",
      "Public social-media information can help attackers create believable stories.",
      "Always verify unusual requests using an independent communication method.",
    ],
    tips: [
      "Verify identities before sharing sensitive information.",
      "Do not let urgency force you into making unsafe decisions.",
      "Limit unnecessary personal information on social media.",
      "Report suspicious requests to the relevant organization.",
    ],
  },
  {
    id: 8,
    title: "Cyber Hygiene",
    category: "General Security",
    description:
      "Follow everyday security habits that reduce the risk of malware, account compromise, and fraud.",
    icon: <ShieldCheck size={24} />,
    points: [
      "Keep operating systems, browsers, and applications updated.",
      "Use unique passwords and enable multi-factor authentication.",
      "Back up important files regularly.",
      "Avoid unknown links, attachments, QR codes, and downloads.",
      "Review account activity and security alerts regularly.",
    ],
    tips: [
      "Update devices regularly.",
      "Keep backups of important data.",
      "Use trusted antivirus or built-in security protection.",
      "Stay informed about common online scams.",
    ],
  },
];

export default function LearningCenter() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [expandedLesson, setExpandedLesson] = useState<number | null>(null);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);

  const categories = useMemo(() => {
    return ["All", ...Array.from(new Set(lessons.map((lesson) => lesson.category)))];
  }, []);

  const filteredLessons = useMemo(() => {
    const cleanSearch = search.trim().toLowerCase();

    return lessons.filter((lesson) => {
      const matchesCategory =
        category === "All" || lesson.category === category;

      const matchesSearch =
        !cleanSearch ||
        lesson.title.toLowerCase().includes(cleanSearch) ||
        lesson.description.toLowerCase().includes(cleanSearch) ||
        lesson.category.toLowerCase().includes(cleanSearch);

      return matchesCategory && matchesSearch;
    });
  }, [search, category]);

  const toggleLesson = (lessonId: number) => {
    setExpandedLesson((current) =>
      current === lessonId ? null : lessonId
    );
  };

  const toggleCompleted = (lessonId: number) => {
    setCompletedLessons((current) => {
      if (current.includes(lessonId)) {
        return current.filter((id) => id !== lessonId);
      }

      return [...current, lessonId];
    });
  };

  const progress = Math.round(
    (completedLessons.length / lessons.length) * 100
  );

  return (
    <main className="learning-container">
      <section className="learning-hero">
        <div className="learning-hero-icon">
          <BookOpen size={36} />
        </div>

        <div>
          <span className="section-label">Cyber Security Education</span>

          <h1>Cyber Security Learning Center</h1>

          <p>
            Learn practical cybersecurity concepts, common online threats,
            safe browsing habits, phishing awareness, banking security, and
            account protection.
          </p>
        </div>
      </section>

      <section className="learning-progress-card">
        <div className="learning-progress-head">
          <div>
            <span>Your Learning Progress</span>
            <strong>
              {completedLessons.length} / {lessons.length} Lessons Completed
            </strong>
          </div>

          <strong>{progress}%</strong>
        </div>

        <div className="learning-progress-bar">
          <div
            className="learning-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </section>

      <section className="learning-controls">
        <div className="learning-search">
          <Search size={19} />

          <input
            type="text"
            placeholder="Search cyber security lessons..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="learning-categories">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              className={category === item ? "active" : ""}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="learning-grid">
        {filteredLessons.map((lesson) => {
          const isExpanded = expandedLesson === lesson.id;
          const isCompleted = completedLessons.includes(lesson.id);

          return (
            <article
              key={lesson.id}
              className={`learning-card ${
                isCompleted ? "learning-card-completed" : ""
              }`}
            >
              <div className="learning-card-top">
                <div className="learning-icon">
                  {lesson.icon}
                </div>

                <div className="learning-card-title">
                  <span>{lesson.category}</span>
                  <h2>{lesson.title}</h2>
                </div>

                {isCompleted && (
                  <CheckCircle2
                    className="learning-complete-icon"
                    size={24}
                  />
                )}
              </div>

              <p className="learning-description">
                {lesson.description}
              </p>

              <button
                type="button"
                className="learning-expand-btn"
                onClick={() => toggleLesson(lesson.id)}
              >
                {isExpanded ? "Hide Lesson" : "Start Learning"}

                {isExpanded ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </button>

              {isExpanded && (
                <div className="learning-details">
                  <div className="learning-topic-box">
                    <h3>
                      <Shield size={18} />
                      What You Should Know
                    </h3>

                    <ul>
                      {lesson.points.map((point, index) => (
                        <li key={`${lesson.id}-point-${index}`}>
                          <ShieldCheck size={16} />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="learning-tip-box">
                    <h3>
                      <ShieldCheck size={18} />
                      Security Tips
                    </h3>

                    <ul>
                      {lesson.tips.map((tip, index) => (
                        <li key={`${lesson.id}-tip-${index}`}>
                          <CheckCircle2 size={16} />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    className={
                      isCompleted
                        ? "learning-completed-btn"
                        : "btn-primary learning-complete-btn"
                    }
                    onClick={() => toggleCompleted(lesson.id)}
                  >
                    <CheckCircle2 size={18} />

                    {isCompleted
                      ? "Completed - Click to Undo"
                      : "Mark Lesson as Completed"}
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </section>

      {filteredLessons.length === 0 && (
        <section className="empty-learning">
          <Search size={34} />
          <h2>No lessons found</h2>
          <p>
            Try another keyword or select a different category.
          </p>
        </section>
      )}

      <section className="security-note">
        <ShieldCheck size={28} />

        <div>
          <strong>CyberShield AI Security Reminder</strong>

          <p>
            No security tool can guarantee complete protection. Always verify
            suspicious messages, links, files, payment requests, and login
            pages before taking action.
          </p>
        </div>
      </section>
    </main>
  );
}