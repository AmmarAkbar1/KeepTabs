import {useState, useEffect} from "react";
import {useNavigate} from "react-router";
import {supabase} from "../lib/supabase";
import {notify} from "../lib/notifications";
import "./App.css";


export default function Home() {
  const [username, setUsername] = useState<string>("Loading...");
  const [DropdownVisible, setDropdownVisible] = useState(false);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function loadUser(){
      const {data:{session}} = await supabase.auth.getSession();

      if (!session){
        navigate("/login");
        return;
      }
      
      const {data: profile, error} = await supabase
        .from("profiles")
        .select("username")
        .eq("id", session.user.id)
        .single();

      if (profile && !error){
        setUsername(profile.username);
      }
      else{
        setUsername(session.user.email?.split("@")[0] || "User");
      }
    }

    loadUser();
  }, [navigate]);

  useEffect(() => {
    async function loadProfiles() {
      const {data:{session}} = await supabase.auth.getSession();

      if (!session){
        navigate("/login");
        return;
      }

      setLoading(true);
      setError("");
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, email")
          .neq("id", session.user.id)
          .order("username", { ascending: true });

        if (error) throw error;
        setPartners(data || []);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(String(err));
        }
      } finally {
        setLoading(false);
      }
    }

    loadProfiles();
  }, [navigate]);

  function openPartner(partner: {id: string; username: string}) {
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
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm("Are you sure you want to delete your account? This action cannot be undone.");
    if (!confirmed) return;

    const { error } = await supabase.rpc("delete_user");
    
    if (error) {
      alert("Failed to delete account: " + error.message);
    } 
    else {
      // Clear local session and redirect
      await supabase.auth.signOut();
      alert("Your account has been deleted.");
      navigate("/login");
    }
  };

  function show(){
    return DropdownVisible ? "Dropdown-Content Show" : "Dropdown-Content";
  }

  useEffect(() => {
  let channel: any;
  async function setupRealtimeListener() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const currentUserId = session.user.id;
    // Listen to changes on the transactions table
    channel = supabase
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
          // Notify if someone else created a tab where YOU are the recipient
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
          // Notify if your tab was approved
          if (updatedTx.payee_id === currentUserId && updatedTx.approval === "true") {
            notify(
              "Tab Approved! 🎉",
              `Your tab for \$${parseFloat(updatedTx.amount).toFixed(2)} was approved.`
            );
          }
        }
      )
      .subscribe();
  }
  setupRealtimeListener();
  // Cleanup on unmount
  return () => {
    if (channel) supabase.removeChannel(channel);
  };
}, []);

    return(
        <main className="container">
          <div className="Banner">
            <div className="BannerRow">
              <h1 className="title">KeepTabs</h1>

              <div className="row">
                <h1 className="Username">{username}</h1>
                <div className="Dropdown">
                  <button className="BannerBtn" onClick={() => setDropdownVisible(!DropdownVisible)}>&#8942;</button>
                  <div className={show()}>
                    <button onClick={handleSignOut} className="dropdownBtn">Sign Out</button>
                    <hr></hr>
                    <button className="dropdownBtn" onClick={handleDeleteAccount}>Delete Account</button>
                  </div>
                </div>
              </div>

            </div>
          </div>
          {/* <h1 className="welcome">Welcome to KeepTabs</h1> */}

          
            <h1>Other Users</h1>
            <div className="partnerlist">
              {(partners.length===0) && <p>No other user found</p>}
              {partners.map((partner) => (
                <button className="partner" onClick={() => openPartner(partner)}>
                  <p>{partner.username}</p>
                  <p className="email">{partner.email}</p>
                </button>
              ))}
          </div>
        </main>
    )
}