import React from "react";

export default function DashboardCards({ snapshot }) {
  const { netWorth = 0, monthlySavings = 0, healthScore = 0 } = snapshot || {};
  return (
    <section className="grid">
      <div className="card">
        <h3>Net Worth</h3>
        <div className="value">₹{netWorth.toLocaleString("en-IN")}</div>
      </div>
      <div className="card">
        <h3>Monthly Savings</h3>
        <div className="value">₹{monthlySavings.toLocaleString("en-IN")}</div>
      </div>
      <div className="card">
        <h3>Health Score</h3>
        <div className="value">{healthScore}/100</div>
      </div>
    </section>
  );
}
