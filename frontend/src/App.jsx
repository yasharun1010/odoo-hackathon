import { useEffect, useMemo, useState } from "react";
import { api } from "./api";

const EMPTY_AUTH = {
  company_name: "",
  country: "",
  currency: "USD",
  name: "",
  email: "",
  password: "",
};

const EMPTY_LOGIN = { email: "", password: "" };

const EMPTY_EXPENSE = {
  amount: "",
  currency: "USD",
  category: "",
  description: "",
  expense_date: "",
};

const EMPTY_USER = {
  name: "",
  email: "",
  password: "",
  role: "employee",
  manager_id: "",
  is_manager_approver: true,
};

const EMPTY_RULE = {
  rule_type: "none",
  threshold_percentage: 60,
  specific_approver_id: "",
};

function StatusPill({ status }) {
  const label = status?.toLowerCase() || "pending";
  return <span className={`pill pill-${label}`}>{label}</span>;
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      {subtitle ? <p>{subtitle}</p> : null}
    </div>
  );
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState(EMPTY_AUTH);
  const [loginForm, setLoginForm] = useState(EMPTY_LOGIN);
  const [expenseForm, setExpenseForm] = useState(EMPTY_EXPENSE);
  const [expenses, setExpenses] = useState([]);
  const [teamExpenses, setTeamExpenses] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [users, setUsers] = useState([]);
  const [userForm, setUserForm] = useState(EMPTY_USER);
  const [ruleForm, setRuleForm] = useState(EMPTY_RULE);
  const [steps, setSteps] = useState("manager,finance,director");
  const [exchangeBase, setExchangeBase] = useState("USD");
  const [exchangeSymbols, setExchangeSymbols] = useState("INR,EUR");
  const [exchangeResult, setExchangeResult] = useState(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager";

  const authCopy = useMemo(() => {
    return authMode === "login"
      ? {
          title: "Welcome back",
          subtitle: "Sign in to manage approvals and expenses.",
        }
      : {
          title: "Create your company",
          subtitle: "Spin up an admin account and start approvals.",
        };
  }, [authMode]);

  const clearSession = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
  };

  const loadDashboard = async (currentUser) => {
    const mine = await api.listExpenses(token, "mine");
    setExpenses(mine);

    if (currentUser.role === "manager") {
      const team = await api.listExpenses(token, "team");
      setTeamExpenses(team);
    }
    if (currentUser.role === "admin") {
      const all = await api.listExpenses(token, "all");
      setTeamExpenses(all);
      const companyUsers = await api.listUsers(token);
      setUsers(companyUsers);
      const rule = await api.getRule(token);
      setRuleForm({
        rule_type: rule.rule_type || "none",
        threshold_percentage: rule.threshold_percentage || 60,
        specific_approver_id: rule.specific_approver_id || "",
      });
      const stepsList = await api.getSteps(token);
      if (stepsList.length > 0) {
        setSteps(stepsList.map((step) => step.role).join(","));
      }
    }

    if (currentUser.role !== "employee") {
      const pending = await api.pendingApprovals(token);
      setPendingApprovals(pending);
    }
  };

  useEffect(() => {
    if (!token) {
      return;
    }
    api
      .me(token)
      .then((me) => {
        setUser(me);
        loadDashboard(me);
      })
      .catch(() => {
        clearSession();
      });
  }, [token]);

  const handleRegister = async () => {
    setBusy(true);
    setStatus("");
    try {
      const payload = {
        company_name: authForm.company_name,
        country: authForm.country,
        currency: authForm.currency,
        name: authForm.name,
        email: authForm.email,
        password: authForm.password,
      };
      const response = await api.register(payload);
      localStorage.setItem("token", response.token);
      setToken(response.token);
      setUser(response.user);
      setAuthForm(EMPTY_AUTH);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  };

  const handleLogin = async () => {
    setBusy(true);
    setStatus("");
    try {
      const response = await api.login(loginForm);
      localStorage.setItem("token", response.token);
      setToken(response.token);
      setUser(response.user);
      setLoginForm(EMPTY_LOGIN);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  };

  const handleExpense = async () => {
    setBusy(true);
    setStatus("");
    try {
      await api.createExpense(token, expenseForm);
      setExpenseForm(EMPTY_EXPENSE);
      if (user) {
        await loadDashboard(user);
      }
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDecision = async (expenseId, decision) => {
    setBusy(true);
    setStatus("");
    try {
      await api.decideApproval(token, expenseId, { decision });
      if (user) {
        await loadDashboard(user);
      }
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  };

  const handleCreateUser = async () => {
    setBusy(true);
    setStatus("");
    try {
      const payload = {
        ...userForm,
        manager_id: userForm.manager_id ? Number(userForm.manager_id) : null,
      };
      await api.createUser(token, payload);
      setUserForm(EMPTY_USER);
      if (user) {
        await loadDashboard(user);
      }
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateRule = async () => {
    setBusy(true);
    setStatus("");
    try {
      const payload = {
        rule_type: ruleForm.rule_type,
        threshold_percentage:
          ruleForm.rule_type === "none" ? undefined : Number(ruleForm.threshold_percentage),
        specific_approver_id:
          ruleForm.rule_type === "specific" || ruleForm.rule_type === "hybrid"
            ? Number(ruleForm.specific_approver_id)
            : undefined,
      };
      await api.updateRule(token, payload);
      if (user) {
        await loadDashboard(user);
      }
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateSteps = async () => {
    setBusy(true);
    setStatus("");
    try {
      const roles = steps
        .split(",")
        .map((role) => role.trim())
        .filter(Boolean);
      await api.updateSteps(token, { steps: roles });
      if (user) {
        await loadDashboard(user);
      }
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  };

  const handleExchange = async () => {
    setBusy(true);
    setStatus("");
    try {
      const result = await api.exchangeRate(exchangeBase, exchangeSymbols);
      setExchangeResult(result);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <p className="kicker">Reimbursement Studio</p>
          <h1>Expense Management HQ</h1>
        </div>
        <div className="topbar-actions">
          {user ? (
            <>
              <span className="user-pill">
                {user.name} · {user.role}
              </span>
              <button className="ghost" onClick={clearSession}>
                Sign out
              </button>
            </>
          ) : (
            <span className="user-pill muted">Not signed in</span>
          )}
        </div>
      </header>

      {status ? <div className="status">{status}</div> : null}

      <main className="grid">
        <section className="panel">
          {!user ? (
            <div className="card">
              <SectionHeader title={authCopy.title} subtitle={authCopy.subtitle} />
              <div className="toggle">
                <button
                  className={authMode === "login" ? "active" : ""}
                  onClick={() => setAuthMode("login")}
                >
                  Login
                </button>
                <button
                  className={authMode === "register" ? "active" : ""}
                  onClick={() => setAuthMode("register")}
                >
                  Register
                </button>
              </div>
              {authMode === "login" ? (
                <div className="form">
                  <label>
                    Email
                    <input
                      type="email"
                      value={loginForm.email}
                      onChange={(event) =>
                        setLoginForm({ ...loginForm, email: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Password
                    <input
                      type="password"
                      value={loginForm.password}
                      onChange={(event) =>
                        setLoginForm({ ...loginForm, password: event.target.value })
                      }
                    />
                  </label>
                  <button onClick={handleLogin} disabled={busy}>
                    Sign in
                  </button>
                </div>
              ) : (
                <div className="form">
                  <label>
                    Company name
                    <input
                      value={authForm.company_name}
                      onChange={(event) =>
                        setAuthForm({ ...authForm, company_name: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Country
                    <input
                      value={authForm.country}
                      onChange={(event) =>
                        setAuthForm({ ...authForm, country: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Default currency
                    <input
                      value={authForm.currency}
                      onChange={(event) =>
                        setAuthForm({ ...authForm, currency: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Admin name
                    <input
                      value={authForm.name}
                      onChange={(event) =>
                        setAuthForm({ ...authForm, name: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Admin email
                    <input
                      type="email"
                      value={authForm.email}
                      onChange={(event) =>
                        setAuthForm({ ...authForm, email: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Password
                    <input
                      type="password"
                      value={authForm.password}
                      onChange={(event) =>
                        setAuthForm({ ...authForm, password: event.target.value })
                      }
                    />
                  </label>
                  <button onClick={handleRegister} disabled={busy}>
                    Create company
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="card">
                <SectionHeader
                  title="Submit an expense"
                  subtitle="Amounts can be in any currency."
                />
                <div className="form">
                  <label>
                    Amount
                    <input
                      type="number"
                      value={expenseForm.amount}
                      onChange={(event) =>
                        setExpenseForm({ ...expenseForm, amount: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Currency
                    <input
                      value={expenseForm.currency}
                      onChange={(event) =>
                        setExpenseForm({ ...expenseForm, currency: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Category
                    <input
                      value={expenseForm.category}
                      onChange={(event) =>
                        setExpenseForm({ ...expenseForm, category: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Description
                    <textarea
                      rows="3"
                      value={expenseForm.description}
                      onChange={(event) =>
                        setExpenseForm({ ...expenseForm, description: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Date
                    <input
                      type="date"
                      value={expenseForm.expense_date}
                      onChange={(event) =>
                        setExpenseForm({
                          ...expenseForm,
                          expense_date: event.target.value,
                        })
                      }
                    />
                  </label>
                  <button onClick={handleExpense} disabled={busy}>
                    Submit expense
                  </button>
                </div>
              </div>

              <div className="card">
                <SectionHeader
                  title="Exchange rate quick check"
                  subtitle="Powered by exchangerate-api.com"
                />
                <div className="form inline">
                  <label>
                    Base
                    <input
                      value={exchangeBase}
                      onChange={(event) => setExchangeBase(event.target.value)}
                    />
                  </label>
                  <label>
                    Symbols
                    <input
                      value={exchangeSymbols}
                      onChange={(event) => setExchangeSymbols(event.target.value)}
                    />
                  </label>
                  <button onClick={handleExchange} disabled={busy}>
                    Fetch
                  </button>
                </div>
                {exchangeResult ? (
                  <div className="exchange-result">
                    <p>
                      Base <strong>{exchangeResult.base}</strong> · Updated{" "}
                      {exchangeResult.date || "recently"}
                    </p>
                    <div className="rate-grid">
                      {Object.entries(exchangeResult.rates).map(([code, value]) => (
                        <div key={code} className="rate-card">
                          <span>{code}</span>
                          <strong>{value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </section>

        <section className="panel wide">
          <div className="card">
            <SectionHeader title="My expenses" subtitle="Track status in real time." />
            <div className="table">
              <div className="table-row header">
                <span>ID</span>
                <span>Amount</span>
                <span>Category</span>
                <span>Status</span>
              </div>
              {expenses.length === 0 ? (
                <p className="empty">No expenses yet.</p>
              ) : (
                expenses.map((expense) => (
                  <div className="table-row" key={expense.id}>
                    <span>#{expense.id}</span>
                    <span>
                      {expense.amount} {expense.currency}
                    </span>
                    <span>{expense.category}</span>
                    <StatusPill status={expense.status} />
                  </div>
                ))
              )}
            </div>
          </div>

          {user && (isManager || isAdmin) ? (
            <div className="card">
              <SectionHeader
                title={isAdmin ? "All expenses" : "Team expenses"}
                subtitle="Monitor the pipeline."
              />
              <div className="table">
                <div className="table-row header">
                  <span>ID</span>
                  <span>Employee</span>
                  <span>Amount</span>
                  <span>Status</span>
                </div>
                {teamExpenses.length === 0 ? (
                  <p className="empty">No records found.</p>
                ) : (
                  teamExpenses.map((expense) => (
                    <div className="table-row" key={expense.id}>
                      <span>#{expense.id}</span>
                      <span>{expense.employee_id}</span>
                      <span>
                        {expense.amount} {expense.currency}
                      </span>
                      <StatusPill status={expense.status} />
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}

          {user && (isManager || isAdmin) ? (
            <div className="card">
              <SectionHeader
                title="Pending approvals"
                subtitle="Approve or reject in one click."
              />
              <div className="table">
                <div className="table-row header">
                  <span>ID</span>
                  <span>Amount</span>
                  <span>Category</span>
                  <span>Actions</span>
                </div>
                {pendingApprovals.length === 0 ? (
                  <p className="empty">No approvals waiting.</p>
                ) : (
                  pendingApprovals.map((approval) => (
                    <div className="table-row" key={approval.expense_id}>
                      <span>#{approval.expense_id}</span>
                      <span>
                        {approval.amount} {approval.currency}
                      </span>
                      <span>{approval.category}</span>
                      <div className="actions">
                        <button
                          className="approve"
                          onClick={() => handleDecision(approval.expense_id, "approve")}
                          disabled={busy}
                        >
                          Approve
                        </button>
                        <button
                          className="reject"
                          onClick={() => handleDecision(approval.expense_id, "reject")}
                          disabled={busy}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}

          {user && isAdmin ? (
            <div className="card">
              <SectionHeader
                title="Admin console"
                subtitle="Create users and tune approval rules."
              />
              <div className="admin-grid">
                <div className="form">
                  <h3>Create user</h3>
                  <label>
                    Name
                    <input
                      value={userForm.name}
                      onChange={(event) =>
                        setUserForm({ ...userForm, name: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Email
                    <input
                      type="email"
                      value={userForm.email}
                      onChange={(event) =>
                        setUserForm({ ...userForm, email: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Password
                    <input
                      type="password"
                      value={userForm.password}
                      onChange={(event) =>
                        setUserForm({ ...userForm, password: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Role
                    <select
                      value={userForm.role}
                      onChange={(event) =>
                        setUserForm({ ...userForm, role: event.target.value })
                      }
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="finance">Finance</option>
                      <option value="director">Director</option>
                      <option value="admin">Admin</option>
                    </select>
                  </label>
                  <label>
                    Manager ID
                    <input
                      value={userForm.manager_id}
                      onChange={(event) =>
                        setUserForm({ ...userForm, manager_id: event.target.value })
                      }
                    />
                  </label>
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={userForm.is_manager_approver}
                      onChange={(event) =>
                        setUserForm({
                          ...userForm,
                          is_manager_approver: event.target.checked,
                        })
                      }
                    />
                    Manager can approve
                  </label>
                  <button onClick={handleCreateUser} disabled={busy}>
                    Add user
                  </button>
                </div>

                <div className="form">
                  <h3>Approval rules</h3>
                  <label>
                    Rule type
                    <select
                      value={ruleForm.rule_type}
                      onChange={(event) =>
                        setRuleForm({ ...ruleForm, rule_type: event.target.value })
                      }
                    >
                      <option value="none">None</option>
                      <option value="percentage">Percentage</option>
                      <option value="specific">Specific approver</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </label>
                  {(ruleForm.rule_type === "percentage" ||
                    ruleForm.rule_type === "hybrid") && (
                    <label>
                      Threshold %
                      <input
                        type="number"
                        value={ruleForm.threshold_percentage}
                        onChange={(event) =>
                          setRuleForm({
                            ...ruleForm,
                            threshold_percentage: event.target.value,
                          })
                        }
                      />
                    </label>
                  )}
                  {(ruleForm.rule_type === "specific" ||
                    ruleForm.rule_type === "hybrid") && (
                    <label>
                      Specific approver ID
                      <input
                        type="number"
                        value={ruleForm.specific_approver_id}
                        onChange={(event) =>
                          setRuleForm({
                            ...ruleForm,
                            specific_approver_id: event.target.value,
                          })
                        }
                      />
                    </label>
                  )}
                  <button onClick={handleUpdateRule} disabled={busy}>
                    Save rule
                  </button>
                </div>

                <div className="form">
                  <h3>Approval sequence</h3>
                  <label>
                    Roles (comma separated)
                    <input
                      value={steps}
                      onChange={(event) => setSteps(event.target.value)}
                    />
                  </label>
                  <button onClick={handleUpdateSteps} disabled={busy}>
                    Update sequence
                  </button>
                </div>
              </div>

              <div className="user-list">
                <h3>Company users</h3>
                <div className="table compact">
                  <div className="table-row header">
                    <span>ID</span>
                    <span>Name</span>
                    <span>Role</span>
                  </div>
                  {users.map((companyUser) => (
                    <div className="table-row" key={companyUser.id}>
                      <span>{companyUser.id}</span>
                      <span>{companyUser.name}</span>
                      <span>{companyUser.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}

export default App;
