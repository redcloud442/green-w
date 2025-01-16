import React from "react";

export interface BankingEmailNotificationTemplateProps {
  accountHolderName: string;
  accountNumber: string;
  transactionDetails?: {
    date: string;
    description: string;
    amount: string;
    balance: string;
  };
  message: string;
  greetingPhrase: string;
  closingPhrase: string;
  signature: string;
}

const BankingEmailNotificationTemplate: React.FC<
  BankingEmailNotificationTemplateProps
> = ({
  accountHolderName,
  accountNumber,
  transactionDetails,
  message,
  greetingPhrase,
  closingPhrase,
  signature,
}) => {
  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        lineHeight: "1.6",
        color: "#333",
        maxWidth: "600px",
        margin: "0 auto",
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "8px",
      }}
    >
      <h1 style={{ fontSize: "20px", color: "#0056b3" }}>{greetingPhrase}</h1>
      <p>Dear {accountHolderName},</p>
      <p>{message}</p>
      {transactionDetails && (
        <div
          style={{
            backgroundColor: "#f9f9f9",
            padding: "15px",
            borderRadius: "8px",
            marginTop: "10px",
          }}
        >
          <h2 style={{ fontSize: "16px", color: "#0056b3" }}>
            Transaction Details
          </h2>
          <p>
            <strong>Account Username:</strong> {accountNumber}
          </p>
          <p>
            <strong>Date:</strong> {transactionDetails.date}
          </p>
          <p>
            <strong>Description:</strong> {transactionDetails.description}
          </p>
          <p>
            <strong>Amount:</strong> {transactionDetails.amount}
          </p>
          <p>
            <strong>Balance:</strong> {transactionDetails.balance}
          </p>
        </div>
      )}
      <p style={{ marginTop: "20px" }}>{closingPhrase}</p>
      <p style={{ marginTop: "10px", fontWeight: "bold" }}>{signature}</p>
      <footer
        style={{
          marginTop: "30px",
          fontSize: "12px",
          color: "#777",
          borderTop: "1px solid #ddd",
          paddingTop: "10px",
        }}
      >
        This is an automated message from your banking institution. Please do
        not reply to this email.
      </footer>
    </div>
  );
};

export default BankingEmailNotificationTemplate;
