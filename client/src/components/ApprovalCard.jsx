import React from "react";

const ApprovalCard = ({ expense, onApprove, onReject }) => {
  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: "15px",
        marginBottom: "10px",
      }}
    >
      <h3>{expense.title}</h3>
      <p>Amount: ₹{expense.amount}</p>
      <p>{expense.description}</p>

      {/* Status */}
      <p>
        Status:{" "}
        <strong
          style={{
            color:
              expense.status === "Approved"
                ? "green"
                : expense.status === "Rejected"
                ? "red"
                : "orange",
          }}
        >
          {expense.status}
        </strong>
      </p>

      {/* Show buttons only if Pending */}
      {expense.status === "Pending" && (
        <>
          <button onClick={() => onApprove(expense.id)}>Approve</button>

          <button
            onClick={() => onReject(expense.id)}
            style={{ marginLeft: "10px" }}
          >
            Reject
          </button>
        </>
      )}
    </div>
  );
};

export default ApprovalCard;