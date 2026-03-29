import { useEffect, useState } from "react";
import ApprovalCard from "../../components/ApprovalCard";

export default function ApprovalDashboard() {
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("expenses")) || [];
    setExpenses(data);
  }, []);

  const updateStatus = (id, status) => {
    const updated = expenses.map((exp) =>
      exp.id === id ? { ...exp, status } : exp
    );

    setExpenses(updated);
    localStorage.setItem("expenses", JSON.stringify(updated));
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Manager Dashboard</h1>

      {expenses.map((expense) => (
        <ApprovalCard
          key={expense.id}
          expense={expense}
          onApprove={() => updateStatus(expense.id, "approved")}
          onReject={() => updateStatus(expense.id, "rejected")}
        />
      ))}
    </div>
  );
}