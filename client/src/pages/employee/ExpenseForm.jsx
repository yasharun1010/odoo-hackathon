import { useState } from "react";

export default function ExpenseForm() {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    const newExpense = {
      id: Date.now(),
      title,
      amount,
      description,
      status: "pending",
    };

    // Get old data
    const existing = JSON.parse(localStorage.getItem("expenses")) || [];

    // Add new expense
    const updated = [...existing, newExpense];

    localStorage.setItem("expenses", JSON.stringify(updated));

    alert("Expense submitted ✅");

    // reset form
    setTitle("");
    setAmount("");
    setDescription("");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Submit Expense</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <br /><br />

        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <br /><br />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <br /><br />

        <button type="submit">Submit</button>
      </form>
    </div>
  );
}