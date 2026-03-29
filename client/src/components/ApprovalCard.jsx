export default function ApprovalCard({ expense, onApprove, onReject }) {
  return (
    <div style={{ border: "1px solid #ccc", padding: "15px", marginBottom: "10px" }}>
      <h3>{expense.title}</h3>
      <p>Amount: ₹{expense.amount}</p>
      <p>{expense.description}</p>
      <p>Status: {expense.status}</p>

      {expense.status === "pending" && (
        <>
          <button onClick={onApprove}>Approve</button>
          <button onClick={onReject} style={{ marginLeft: "10px" }}>
            Reject
          </button>
        </>
      )}
    </div>
  );
}