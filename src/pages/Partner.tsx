import { useState, useEffect } from "react";
import {Link, useLocation, useNavigate} from "react-router";
import {supabase} from "../lib/supabase";
import appLogo from "../assets/app-icon.png";
import "./App.css";

export default function Partner() {
  const location = useLocation();
  
  const [amount, setAmount] = useState("");
  const [debt, setDebt] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [explanation, setExplanation] = useState("");
  const [userId, setUserId] = useState("");
  const [showAll, setShowAll] = useState(false);

  const dollarRegex = /^\d*\.?\d{0,2}$/;
  
  const partner = location.state.partner;
  const partnerId = location.state.partnerId;
  const navigate = useNavigate();

  useEffect(() => {
    async function init(){
      const {data:{session}} = await supabase.auth.getSession();
  
      if (!session){
        navigate("/login");
        return;
      }
       
      setUserId(session.user.id);
      fetchBalance(session.user.id, partnerId);
      fetchTransactions(session.user.id, partnerId);
    }
  init();
}, [navigate]);

  const fetchBalance = async (userId: string, partnerId: string) => {
    const [userA, userB] = userId < partnerId ? [userId, partnerId] : [partnerId, userId]; 

    const { data } = await supabase
      .from("debts")
      .select("balance")
      .eq("user_a", userA)
      .eq("user_b", userB)
      .maybeSingle();

    if (!data) {
      setDebt("0.00");
      return;
    }
    if(userA === userId){
      setDebt((parseFloat(data.balance)).toFixed(2).toString());
    }
    else{
      setDebt((parseFloat(data.balance) * -1).toFixed(2).toString());
    }
  }

  const fetchTransactions = async (userId: string, partnerId: string) => {
    const { data } = await supabase
      .from("transactions")
      .select("id, payee_id, recipient_id, creator_id, amount, explanation, created_at, approval")
      .or(`and(payee_id.eq.${userId},recipient_id.eq.${partnerId}),and(payee_id.eq.${partnerId},recipient_id.eq.${userId})`)
      .order("created_at", {ascending: false});

      if (data) setTransactions(data);
  }

  const handleTransaction = async (pay: boolean) => {
    if (amount && parseFloat(amount) > 0){  
   
      if (pay){
        await supabase.from("transactions").insert([{
          payee_id: userId,
          recipient_id: partnerId,
          creator_id: userId,
          amount: amount,
          explanation: explanation.trim() || "No explanation provided",
          approval: "false"
      }])
      }

      else{
        await supabase.from("transactions").insert([{
          payee_id: partnerId,
          recipient_id: userId,
          creator_id: userId,
          amount: amount,
          explanation: explanation.trim() || "No explanation provided",
          approval: "false"
      }])
      }

      setAmount("");
      setExplanation("");
      fetchTransactions(userId, partnerId);
    }
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (dollarRegex.test(value)) {
      setAmount(value);
    }
  };

  // checks if the transaction is approved, and if so, updates the debt accordingly
  const handleApproval = async (transaction: any, approval: boolean) => {
    let truedebt = "";

    if (approval){
      await supabase
      .from("transactions")
      .update({approval: "true"})
      .eq("id", transaction.id);

      const [userA, userB] = userId < partnerId ? [userId, partnerId] : [partnerId, userId];

      const { data: debtRecord } = await supabase
        .from("debts")
        .select("balance")
        .eq("user_a", userA)
        .eq("user_b", userB)
        .maybeSingle();

      const currentBalance = debtRecord ? parseFloat(debtRecord.balance) : 0;

      // adds the correct amount to the debt based on whether the user is the payee or recipient
      if (userA === transaction.payee_id) {
        truedebt = (currentBalance + parseFloat(transaction.amount)).toFixed(2).toString();
        // setDebt(truedebt);
      }
      if (userA === transaction.recipient_id){
        truedebt = (currentBalance - parseFloat(transaction.amount)).toFixed(2).toString();
        // setDebt((parseFloat(truedebt) * -1).toFixed(2).toString());
      }

      await supabase.from("debts").upsert({
        user_a: userA,
        user_b: userB,
        balance: truedebt,
        updated_at: new Date().toISOString()
      },
      {
        onConflict: "user_a,user_b"
      });

      fetchBalance(userId, partnerId);
      fetchTransactions(userId, partnerId);
    }

    else{
      await supabase
      .from("transactions")
      .update({approval: "declined"})
      .eq("id", transaction.id);

      fetchTransactions(userId, partnerId);
  } 
  }

  const showApproval = (transaction: any) => {
    if (transaction.approval === "false"){
      if(transaction.creator_id === userId){
        return "pending";
      }
      else{
        return "show";
      }
    }
    else if (transaction.approval === "declined"){
      return "declined";
    }
    else{
      return "approved";
    }
  }

  const correctHistory = (transaction: any) => {
    if(transaction.payee_id === userId){
      return (parseFloat(transaction.amount)).toFixed(2).toString();
    }
    else if (transaction.recipient_id === userId){
      return (parseFloat(transaction.amount) * -1).toFixed(2).toString();
    }
  }

  const handleShow = () => {
      setShowAll(!showAll);
  }

  const color = (transaction: any) => {
    if (transaction.approval === "declined"){
      return " declined";
    }

    if (transaction.payee_id === userId){
      return " green";
    }
    else{
      return " red";
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {dateStyle: "medium", timeStyle: "short"});
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    // Helper to assign a priority number:
    // Lower number = appears higher up
    const getPriority = (t: any) => {
      const status = showApproval(t);
      if (status === "show") return 1;     // 1. Highest priority: waiting for YOU to approve
      if (status === "pending") return 2;  // 2. Waiting for your partner to approve
      return 3;                            // 3. Settled/Done ("approved" and "declined")
    };

    const priorityA = getPriority(a);
    const priorityB = getPriority(b);

    // If they have different priorities, sort by priority
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // If they have the same priority, sort chronologically (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });


  return(
    <main className="container">
      <div className="Banner">
          <div className="BannerRow">
            <Link to="/" className="banner-logo-link">
              <img src={appLogo} alt="KeepTabs" className="banner-logo" />
            </Link>

            <div className="row">
              <h1 className="Username">{partner}</h1>
            </div>
        </div>
      </div>

      <div className="row">
        <h1 className={"total" + (parseFloat(debt) >= 0 ? " green" : " red")}>${debt}</h1>
      </div>

      <div className="transaction-row">
        <div className="column">
          <div className="row">
            <h2>$</h2>
            <input 
            className="transaction"
            type="text" 
            placeholder="00.00" 
            value={amount}
            onChange={handleAmountChange}
            inputMode="decimal"></input>
          </div>

          <div className="row">
            <button className="trans" onClick={() => handleTransaction(true)}><b>add</b></button>
            <button className="trans" onClick={() => handleTransaction(false)}><b>subtract</b></button>
          </div>
        </div>

        <div className="column">
          <div className="row">
            <textarea className="explanation" 
            placeholder="Reason" 
            rows={3} 
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}>
            </textarea>
          </div>
        </div>
      </div>

      <div className="row">
        <h2>Transaction History</h2>
      </div>
      <div className="column">
        {(sortedTransactions.length===0) && <p>No Transaction History</p>}
              {(showAll ? sortedTransactions.slice(0,20): sortedTransactions.slice(0,5)).map((transaction) => (
                
                <div className="row">
                  <div className="historyRow">
                    <div className="history">
                      <p className="explanationHist">{transaction.explanation}</p>
                      <p className={"transactionHist" + color(transaction)} id="transactionHist">${correctHistory(transaction)}</p>
                    </div>
                    
                    <div className="history">
                      <p className="date">{formatDate(transaction.created_at)}</p>
                      <div className="action">
                        {showApproval(transaction) === "show" && 
                        <button id="approve" onClick={() => handleApproval(transaction, true)}>Approve</button>}
                        
                        {showApproval(transaction) === "show" && 
                        <button id="deny" onClick={() => handleApproval(transaction, false)}>Deny</button>}
                      </div>

                      {showApproval(transaction) === "pending" && <p id="pending">Pending</p>}
                    </div>
                  </div>
                </div>
              ))}
      </div>
      <div className="row">
      {transactions.length > 5 && 
      <button id="more" onClick={() => handleShow()}>{showAll ? "Show Less" : "Show " + (transactions.length-5) + " more"}</button>}
      </div>
    </main>
  )
}