import { useState } from "react";
import {Link, useNavigate} from "react-router";
import {supabase} from "../lib/supabase";
import "./App.css";

export default function LogIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const {error} = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error){
      setErrorMsg(error.message);
      setLoading(false);
    }
    else{
      navigate("/", {replace: true})
    }
  }

    return(
        <main className="container centered">
        {/* <div className="centered"> */}
          <h1 id="login">Welcome to KeepTabs</h1>
          {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}

          <form onSubmit={handleLogIn} className="column">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required/>

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required/>

            <button type="submit" disabled={loading}>
              {loading ? "Loggin In..." : "Log In"}
            </button>
          </form>

          <p>Don't have an account? <Link to="/register">Register here</Link></p>
        {/* </div> */}
        </main>
    )
}