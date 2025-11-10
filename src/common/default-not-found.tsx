import React from "react";

export default function DefaultNotFound() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "2rem",
        textAlign: "center",
      }}>
      <h1
        style={{
          fontSize: "6rem",
          fontWeight: "bold",
          margin: "0",
          color: "#333",
        }}>
        404
      </h1>
      <h2
        style={{
          fontSize: "1.5rem",
          fontWeight: "500",
          margin: "1rem 0",
          color: "#666",
        }}>
        Page Not Found
      </h2>
      <p
        style={{
          fontSize: "1rem",
          color: "#888",
          marginBottom: "2rem",
        }}>
        The page you're looking for doesn't exist.
      </p>
      <a
        href="/"
        style={{
          padding: "0.75rem 1.5rem",
          backgroundColor: "#646cff",
          color: "white",
          textDecoration: "none",
          borderRadius: "0.5rem",
          fontSize: "1rem",
          fontWeight: "500",
          transition: "background-color 0.2s",
        }}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#535bf2")}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#646cff")}>
        Go back home
      </a>
    </div>
  );
}
