import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import AuthPage from "../components/Auth/AuthPage";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import userEvent from "@testing-library/user-event";
import * as authModule from "firebase/auth";

jest.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));
jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
}));
jest.mock("../firebase", () => ({
  auth: {},
  db: {},
}));

const theme = createTheme();

const renderWithProviders = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe("AuthPage", () => {
  test("renders login form by default", () => {
    renderWithProviders(<AuthPage />);
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i })
    ).toBeInTheDocument();
  });

  test("switches to signup form", async () => {
    renderWithProviders(<AuthPage />);
    userEvent.click(screen.getByText(/sign up/i));

    await waitFor(() => {
      expect(screen.getByText(/create an account/i)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
  });

  test("switches to reset password form", async () => {
    renderWithProviders(<AuthPage />);
    userEvent.click(screen.getByText(/forgot your password/i));

    await waitFor(() => {
      expect(screen.getByText(/reset password/i)).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: /send reset link/i })
    ).toBeInTheDocument();
  });

  test("can type and submit reset password email", async () => {
    const mockSendResetEmail = jest
      .spyOn(authModule, "sendPasswordResetEmail")
      .mockResolvedValueOnce();

    renderWithProviders(<AuthPage />);

    userEvent.click(screen.getByText(/forgot your password/i));

    await waitFor(() =>
      expect(screen.getByText(/reset password/i)).toBeInTheDocument()
    );

    const emailField = screen.getByLabelText(/email address/i);
    await userEvent.type(emailField, "test@example.com");

    const submitBtn = await screen.findByRole("button", {
      name: /send reset link/i,
    });

    userEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSendResetEmail).toHaveBeenCalledWith(
        expect.anything(),
        "test@example.com"
      );
    });
  });
});
