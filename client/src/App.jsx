import { useState } from "react";
import ExpenseForm from "./pages/employee/ExpenseForm";
import ApprovalDashboard from "./pages/manager/ApprovalDashboard";

export default function App() {
  const [page, setPage] = useState("form");

  return (
    <div>
      <button onClick={() => setPage("form")}>Employee</button>
      <button onClick={() => setPage("approval")}>Manager</button>

      {page === "form" && <ExpenseForm />}
      {page === "approval" && <ApprovalDashboard />}
    </div>
  );
}