import React, { useEffect, useState } from "react";
import ApprovalCard from "../components/ApprovalCard";

const ApprovalDashboard = () => {
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    // Dummy data with status
    setExpenses([
      {
        id: 1,
        title: "Dinner Expense",
        amount: 1200,
        description: "Team dinner at restaurant",
        status: "Pending",
      },
      {
        id: 2,
        title: "Travel Expense",
        amount: 3000,
        description: "Cab to client meeting",
        status: "Pending",
      },
    ]);
  }, []);

  // Approve
  const handleApprove = (id) => {
    setExpenses((prev) =>
      prev.map((exp) =>
        exp.id === id ? { ...exp, status: "Approved" } : exp
      )
    );
  };

  // Reject
  const handleReject = (id) => {
    setExpenses((prev) =>
      prev.map((exp) =>
        exp.id === id ? { ...exp, status: "Rejected" } : exp
      )
    );
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Pending Approvals</h1>

      {expenses.map((expense) => (
        <ApprovalCard
          key={expense.id}
          expense={expense}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      ))}
    </div>
  );
};

export default ApprovalDashboard;