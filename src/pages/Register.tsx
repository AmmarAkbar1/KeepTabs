import { useState } from "react";
import {Link, useNavigate} from "react-router";
import {supabase} from "../lib/supabase";
import "./App.css";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    if (!username.trim() || !email.trim() || !password.trim()){
      setErrorMsg("Please fill in all fields");
      setLoading(false);
      return;
    }

    const {error} = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {username: username.trim(),},
      },
    });

    if (error){
      setErrorMsg(error.message);
      setLoading(false);
    }
    else{
      alert("Accound created successfully!");
      navigate("/", {replace: true});
    }
  }

    return(
        <main className="container centered">
        <h1 id="login">Create an Account</h1>
        {errorMsg && <p style={{color: "red"}}>{errorMsg}</p>}

        <form onSubmit={handleRegister} className="column">
          <input 
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required/>

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
            {loading ? "Creating Account..." : "Register"}
          </button> 

          <p>Already have an account? <Link to="/logIn">Log In</Link></p>

        </form>
        </main>
    )
}