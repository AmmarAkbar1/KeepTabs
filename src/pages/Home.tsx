import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { supabase } from "../lib/supabase";
import { notify } from "../lib/notifications";
import appLogo from "../assets/app-icon.png";
import "./App.css";

interface PartnerUser {
  id: string;
  username: string;
  email: string;
}

const AVATAR_COLORS = [
  "#2563eb", // blue
  "#7c3aed", // violet
  "#db2777", // pink
  "#059669", // emerald
  "#d97706", // amber
  "#0891b2", // cyan
  "#4f46e5", // indigo
];

function getAvatarColor(name: string): string {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function Home() {
  const [username, setUsername] = useState<string>("Loading...");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [partners, setPartners] = useState<PartnerUser[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownVisible(false);
      }
    }
    if (dropdownVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownVisible]);

  // Load user profile & ID
  useEffect(() => {
    async function loadUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", session.user.id)
        .single();

      if (profile && !error) {
        setUsername(profile.username);
      } else {
        setUsername(session.user.email?.split("@")[0] || "User");
      }
    }

    loadUser();
  }, [navigate]);

  // Fetch debts for current user
  async function fetchDebts(currentUid: string) {
    try {
      const { data: debts, error } = await supabase
        .from("debts")
        .select("user_a, user_b, balance")
        .or(`user_a.eq.${currentUid},user_b.eq.${currentUid}`);

      if (error) {
        console.error("Error fetching debts:", error);
        return;
      }

      const balMap: Record<string, number> = {};
      if (debts) {
        for (const d of debts) {
          const raw = parseFloat(d.balance) || 0;
          if (d.user_a === currentUid) {
            balMap[d.user_b] = raw;
          } else if (d.user_b === currentUid) {
            balMap[d.user_a] = -raw;
          }
        }
      }
      setBalances(balMap);
    } catch (err) {
      console.error("Failed to load debts", err);
    }
  }

  // Load partner profiles & debts
  useEffect(() => {
    async function loadData() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/login");
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, email")
          .neq("id", session.user.id)
          .order("username", { ascending: true });

        if (error) throw error;
        setPartners(data || []);
        await fetchDebts(session.user.id);
      } catch (err) {
        console.error("Error loading partners:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [navigate]);

  // Realtime listeners
  useEffect(() => {
    let txChannel: any;
    let debtsChannel: any;

    async function setupRealtimeListeners() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const currentUserId = session.user.id;

      // Listen to transactions table
      txChannel = supabase
        .channel("realtime-transactions")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "transactions",
          },
          (payload) => {
            const newTx = payload.new;
            if (newTx.recipient_id === currentUserId && newTx.creator_id !== currentUserId) {
              notify(
                "New Tab Request",
                `A partner requested \$${parseFloat(newTx.amount).toFixed(2)}: "${newTx.explanation || "No reason"}"`
              );
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "transactions",
          },
          (payload) => {
            const updatedTx = payload.new;
            if (updatedTx.payee_id === currentUserId && updatedTx.approval === "true") {
              notify(
                "Tab Approved! 🎉",
                `Your tab for \$${parseFloat(updatedTx.amount).toFixed(2)} was approved.`
              );
            }
          }
        )
        .subscribe();

      // Listen to debts changes to automatically update balance indicators
      debtsChannel = supabase
        .channel("realtime-debts-home")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "debts",
          },
          () => {
            fetchDebts(currentUserId);
          }
        )
        .subscribe();
    }

    setupRealtimeListeners();

    return () => {
      if (txChannel) supabase.removeChannel(txChannel);
      if (debtsChannel) supabase.removeChannel(debtsChannel);
    };
  }, []);

  function openPartner(partner: PartnerUser) {
    navigate("/Partner", {
      state: {
        partner: partner.username,
        partnerId: partner.id,
      },
    });
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );
    if (!confirmed) return;

    const { error } = await supabase.rpc("delete_user");

    if (error) {
      alert("Failed to delete account: " + error.message);
    } else {
      await supabase.auth.signOut();
      alert("Your account has been deleted.");
      navigate("/login");
    }
  };

  // Compute Net Balance summary
  const balanceValues = Object.values(balances);
  const totalNet = balanceValues.reduce((acc, v) => acc + v, 0);
  const totalOwed = balanceValues.filter((v) => v > 0).reduce((acc, v) => acc + v, 0);
  const totalOwing = balanceValues.filter((v) => v < 0).reduce((acc, v) => acc + Math.abs(v), 0);

  const isNetPositive = totalNet > 0.005;
  const isNetNegative = totalNet < -0.005;

  const formattedNet =
    isNetPositive
      ? `+$${totalNet.toFixed(2)}`
      : isNetNegative
      ? `-$${Math.abs(totalNet).toFixed(2)}`
      : "$0.00";

  // Filter partners by search
  const filteredPartners = partners.filter((p) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      (p.username && p.username.toLowerCase().includes(q)) ||
      (p.email && p.email.toLowerCase().includes(q))
    );
  });

  return (
    <main className="container home-page-container">
      {/* Top Banner Navigation */}
      <header className="Banner">
        <div className="BannerRow">
          <Link to="/" className="banner-logo-link">
            <img src={appLogo} alt="KeepTabs" className="banner-logo" />
          </Link>

          <div className="Dropdown" ref={dropdownRef}>
            <button
              className="user-profile-btn"
              onClick={() => setDropdownVisible(!dropdownVisible)}
              aria-label="User menu"
              type="button"
            >
              <div
                className="user-avatar-mini"
                style={{ backgroundColor: getAvatarColor(username) }}
              >
                {getInitials(username)}
              </div>
              <span className="Username">{username}</span>
              <span className="dropdown-chevron">&#8942;</span>
            </button>

            {dropdownVisible && (
              <div className="Dropdown-Content Show">
                <div className="dropdown-user-header">
                  <span className="dropdown-user-name">{username}</span>
                  <span className="dropdown-user-role">KeepTabs Member</span>
                </div>
                <hr />
                <button onClick={handleSignOut} className="dropdownBtn">
                  Sign Out
                </button>
                <hr />
                <button
                  className="dropdownBtn dropdown-delete-btn"
                  onClick={handleDeleteAccount}
                >
                  Delete Account
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Home Content */}
      <div className="home-content">
        {/* Net Balance Hero Card */}
        <section className="balance-hero-card">
          <div className="balance-hero-top">
            <span className="balance-hero-label">TOTAL BALANCE</span>
            <span
              className={`balance-hero-badge ${
                isNetPositive
                  ? "badge-positive"
                  : isNetNegative
                  ? "badge-negative"
                  : "badge-settled"
              }`}
            >
              {isNetPositive
                ? "Owed to you"
                : isNetNegative
                ? "You owe overall"
                : "All Settled"}
            </span>
          </div>

          <div
            className={`balance-hero-amount ${
              isNetPositive
                ? "amount-positive"
                : isNetNegative
                ? "amount-negative"
                : "amount-settled"
            }`}
          >
            {formattedNet}
          </div>

          <div className="balance-breakdown">
            <div className="breakdown-stat">
              <span className="breakdown-stat-label">You are owed</span>
              <span className="breakdown-stat-val text-green">
                +${totalOwed.toFixed(2)}
              </span>
            </div>
            <div className="breakdown-divider" />
            <div className="breakdown-stat">
              <span className="breakdown-stat-label">You owe</span>
              <span className="breakdown-stat-val text-red">
                -${totalOwing.toFixed(2)}
              </span>
            </div>
          </div>
        </section>

        {/* Partners Section Header & Search */}
        <section className="partners-section">
          <div className="section-header">
            <div className="section-title-wrap">
              <h2 className="section-title">Partners</h2>
              <span className="partner-count-badge">{partners.length}</span>
            </div>

            {/* Quick Search */}
            <div className="search-bar">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search partners..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Partner Cards List */}
          <div className="partnerlist">
            {loading ? (
              <div className="loading-state">
                <div className="spinner" />
                <p>Loading partners & balances...</p>
              </div>
            ) : filteredPartners.length === 0 ? (
              <div className="empty-state">
                <span className="empty-emoji">👥</span>
                <p className="empty-title">
                  {searchQuery ? "No matching partners" : "No other users yet"}
                </p>
                <p className="empty-subtitle">
                  {searchQuery
                    ? "Try adjusting your search query."
                    : "Invite friends or wait for users to sign up to start tracking tabs!"}
                </p>
              </div>
            ) : (
              filteredPartners.map((partner) => {
                const partnerBalance = balances[partner.id] || 0;
                const owesYou = partnerBalance > 0.005;
                const youOwe = partnerBalance < -0.005;

                return (
                  <button
                    key={partner.id}
                    className="partner-card"
                    onClick={() => openPartner(partner)}
                    type="button"
                  >
                    <div
                      className="partner-avatar"
                      style={{
                        backgroundColor: getAvatarColor(partner.username || partner.email),
                      }}
                    >
                      {getInitials(partner.username || partner.email)}
                    </div>

                    <div className="partner-details">
                      <p className="partner-name">{partner.username}</p>
                      <p className="partner-email">{partner.email}</p>
                    </div>

                    <div className="partner-balance-badge">
                      {owesYou && (
                        <div className="badge-wrapper">
                          <span className="balance-pill pill-green">
                            +${partnerBalance.toFixed(2)}
                          </span>
                          <span className="balance-sublabel text-green">owes you</span>
                        </div>
                      )}
                      {youOwe && (
                        <div className="badge-wrapper">
                          <span className="balance-pill pill-red">
                            -${Math.abs(partnerBalance).toFixed(2)}
                          </span>
                          <span className="balance-sublabel text-red">you owe</span>
                        </div>
                      )}
                      {!owesYou && !youOwe && (
                        <div className="badge-wrapper">
                          <span className="balance-pill pill-settled">
                            $0.00
                          </span>
                          <span className="balance-sublabel">settled</span>
                        </div>
                      )}
                      <span className="partner-arrow">›</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
