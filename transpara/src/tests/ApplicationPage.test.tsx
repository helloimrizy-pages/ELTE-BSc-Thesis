import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ApplicationPage } from "../pages/ApplicationPage";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import * as firestore from "firebase/firestore";

jest.mock("firebase/firestore", () => ({
  ...jest.requireActual("firebase/firestore"),
  getDoc: jest.fn(),
  doc: jest.fn(),
}));

const theme = createTheme();

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={["/apply/testJobId"]}>
        <Routes>
          <Route path="/apply/:jobId" element={ui} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );
};

describe("ApplicationPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders loading state initially", async () => {
    (firestore.getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        title: "Frontend Developer",
        isOpen: true,
        ownerUid: "owner123",
      }),
    });

    renderWithProviders(<ApplicationPage />);

    expect(screen.getByText(/loading job details/i)).toBeInTheDocument();

    await waitFor(() =>
      expect(
        screen.getByText(/apply for frontend developer/i)
      ).toBeInTheDocument()
    );
  });

  test("renders error if job does not exist", async () => {
    (firestore.getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => false,
    });

    renderWithProviders(<ApplicationPage />);

    await waitFor(() =>
      expect(
        screen.getByText(/unable to load job application/i)
      ).toBeInTheDocument()
    );
  });

  test("renders job closed message", async () => {
    (firestore.getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        title: "Backend Developer",
        isOpen: false,
      }),
    });

    renderWithProviders(<ApplicationPage />);

    await waitFor(() =>
      expect(screen.getByText(/job application closed/i)).toBeInTheDocument()
    );
  });
});
