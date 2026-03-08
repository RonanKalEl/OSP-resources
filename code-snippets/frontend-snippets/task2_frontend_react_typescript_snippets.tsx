/**
 * Task 2 Frontend Snippets
 * Stack: React + TypeScript + Tailwind CSS + shadcn/ui + React Router + TanStack Query v5 + Jotai
 *
 * Notes:
 * - These are reusable snippets, not a single running app.
 * - Copy the parts you need into your Vite project and adapt field names/routes/API URLs.
 * - All API calls use fetch for simplicity.
 */

// =====================================================
// 1) COMMON TYPES
// =====================================================

export type UserRole = "admin" | "staff" | "customer";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface Booking {
  id: number;
  customerName: string;
  bookingDate: string;
  quantity: number;
  status: "pending" | "confirmed" | "cancelled";
}

export interface ApiError {
  message: string;
  status?: number;
}

// =====================================================
// 2) API HELPER
// =====================================================

export async function apiRequest<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let message = "Request failed";
    try {
      const errorData = (await response.json()) as Partial<ApiError>;
      message = errorData.message || message;
    } catch {
      // Ignore JSON parse errors and keep fallback message.
    }

    throw {
      message,
      status: response.status,
    } satisfies ApiError;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

// =====================================================
// 3) TANSTACK QUERY SNIPPETS
// =====================================================

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useBookings() {
  return useQuery({
    queryKey: ["bookings"],
    queryFn: () => apiRequest<Booking[]>("/api/bookings"),
  });
}

export function useBookingById(id: string | undefined) {
  return useQuery({
    queryKey: ["booking", id],
    queryFn: () => apiRequest<Booking>(`/api/bookings/${id}`),
    enabled: Boolean(id),
  });
}

export interface CreateBookingInput {
  customerName: string;
  bookingDate: string;
  quantity: number;
}

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBookingInput) =>
      apiRequest<Booking>("/api/bookings", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useUpdateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CreateBookingInput> }) =>
      apiRequest<Booking>(`/api/bookings/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking", String(variables.id)] });
    },
  });
}

export function useDeleteBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      apiRequest<void>(`/api/bookings/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

// =====================================================
// 4) JOTAI STATE MANAGEMENT
// =====================================================

import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";

export const searchAtom = atom("");
export const selectedStatusAtom = atom<Booking["status"] | "all">("all");
export const currentUserAtom = atom<User | null>(null);

export function SearchStateExample() {
  const [search, setSearch] = useAtom(searchAtom);

  return (
    <input
      value={search}
      onChange={(event) => setSearch(event.target.value)}
      placeholder="Search..."
      className="w-full rounded-lg border px-3 py-2"
    />
  );
}

// =====================================================
// 5) SIMPLE VALIDATION HELPERS
// =====================================================

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isFutureOrToday(dateString: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const chosenDate = new Date(dateString);
  chosenDate.setHours(0, 0, 0, 0);

  return chosenDate >= today;
}

export function validateBookingForm(data: CreateBookingInput): string[] {
  const errors: string[] = [];

  if (!data.customerName.trim()) {
    errors.push("Customer name is required.");
  }

  if (!data.bookingDate.trim()) {
    errors.push("Booking date is required.");
  } else if (!isFutureOrToday(data.bookingDate)) {
    errors.push("Booking date cannot be in the past.");
  }

  if (!Number.isInteger(data.quantity) || data.quantity < 1) {
    errors.push("Quantity must be a whole number of at least 1.");
  }

  return errors;
}

// =====================================================
// 6) REUSABLE PAGE WRAPPER
// =====================================================

import { ReactNode } from "react";

export function PageContainer({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

// =====================================================
// 7) REUSABLE STATUS BADGE
// =====================================================

import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: Booking["status"] }) {
  const statusClasses: Record<Booking["status"], string> = {
    pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
    confirmed: "bg-green-100 text-green-800 hover:bg-green-100",
    cancelled: "bg-red-100 text-red-800 hover:bg-red-100",
  };

  return <Badge className={statusClasses[status]}>{status}</Badge>;
}

// =====================================================
// 8) LOADING / EMPTY / ERROR STATES
// =====================================================

export function LoadingState({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="rounded-xl border p-6 text-sm text-muted-foreground">
      {text}
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-dashed p-8 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {message}
    </div>
  );
}

// =====================================================
// 9) BOOKINGS TABLE
// =====================================================

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export function BookingsTable({
  rows,
  onView,
  onDelete,
}: {
  rows: Booking[];
  onView: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  if (rows.length === 0) {
    return <EmptyState title="No bookings found" description="Try changing your search or filters." />;
  }

  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((booking) => (
            <TableRow key={booking.id}>
              <TableCell>{booking.id}</TableCell>
              <TableCell>{booking.customerName}</TableCell>
              <TableCell>{booking.bookingDate}</TableCell>
              <TableCell>{booking.quantity}</TableCell>
              <TableCell>
                <StatusBadge status={booking.status} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => onView(booking.id)}>
                    View
                  </Button>
                  <Button variant="destructive" onClick={() => onDelete(booking.id)}>
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// =====================================================
// 10) FILTER BAR
// =====================================================

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function BookingFilters() {
  const [search, setSearch] = useAtom(searchAtom);
  const [status, setStatus] = useAtom(selectedStatusAtom);

  return (
    <div className="grid gap-3 rounded-xl border p-4 md:grid-cols-[1fr_200px]">
      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search by customer name"
      />

      <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
        <SelectTrigger>
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="confirmed">Confirmed</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

// =====================================================
// 11) FILTERED DATA HELPER
// =====================================================

export function filterBookings(
  bookings: Booking[],
  search: string,
  status: Booking["status"] | "all",
): Booking[] {
  return bookings.filter((booking) => {
    const matchesSearch = booking.customerName
      .toLowerCase()
      .includes(search.trim().toLowerCase());

    const matchesStatus = status === "all" || booking.status === status;

    return matchesSearch && matchesStatus;
  });
}

// =====================================================
// 12) MAIN LIST PAGE EXAMPLE
// =====================================================

import { useNavigate } from "react-router-dom";

export function BookingsPage() {
  const navigate = useNavigate();
  const { data, isPending, isError, error } = useBookings();
  const deleteBooking = useDeleteBooking();

  const search = useAtomValue(searchAtom);
  const status = useAtomValue(selectedStatusAtom);

  if (isPending) {
    return <LoadingState text="Loading bookings..." />;
  }

  if (isError) {
    return <ErrorState message={(error as ApiError).message || "Could not load bookings."} />;
  }

  const filteredRows = filterBookings(data ?? [], search, status);

  return (
    <PageContainer
      title="Bookings"
      description="Manage, search and review booking records."
    >
      <div className="space-y-4">
        <BookingFilters />
        <BookingsTable
          rows={filteredRows}
          onView={(id) => navigate(`/bookings/${id}`)}
          onDelete={(id) => deleteBooking.mutate(id)}
        />
      </div>
    </PageContainer>
  );
}

// =====================================================
// 13) FORM EXAMPLE (CREATE)
// =====================================================

import { FormEvent, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export function CreateBookingForm() {
  const createBooking = useCreateBooking();
  const [formData, setFormData] = useState<CreateBookingInput>({
    customerName: "",
    bookingDate: "",
    quantity: 1,
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateBookingForm(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setSuccessMessage("");
      return;
    }

    setErrors([]);

    createBooking.mutate(formData, {
      onSuccess: () => {
        setSuccessMessage("Booking created successfully.");
        setFormData({ customerName: "", bookingDate: "", quantity: 1 });
      },
      onError: (error) => {
        setErrors([(error as ApiError).message || "Could not create booking."]);
        setSuccessMessage("");
      },
    });
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Create booking</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.length > 0 ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <ul className="list-disc pl-5">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {successMessage}
            </div>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="customerName">Customer name</Label>
            <Input
              id="customerName"
              value={formData.customerName}
              onChange={(event) =>
                setFormData((previous) => ({ ...previous, customerName: event.target.value }))
              }
              placeholder="Enter full name"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bookingDate">Booking date</Label>
            <Input
              id="bookingDate"
              type="date"
              value={formData.bookingDate}
              onChange={(event) =>
                setFormData((previous) => ({ ...previous, bookingDate: event.target.value }))
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              value={formData.quantity}
              onChange={(event) =>
                setFormData((previous) => ({
                  ...previous,
                  quantity: Number(event.target.value),
                }))
              }
            />
          </div>

          <Button type="submit" disabled={createBooking.isPending}>
            {createBooking.isPending ? "Saving..." : "Create booking"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// =====================================================
// 14) DETAIL PAGE WITH ROUTE PARAM
// =====================================================

import { useParams } from "react-router-dom";

export function BookingDetailPage() {
  const { bookingId } = useParams();
  const { data, isPending, isError, error } = useBookingById(bookingId);

  if (isPending) {
    return <LoadingState text="Loading booking details..." />;
  }

  if (isError) {
    return <ErrorState message={(error as ApiError).message || "Could not load booking details."} />;
  }

  if (!data) {
    return <EmptyState title="Booking not found" description="The requested booking does not exist." />;
  }

  return (
    <PageContainer title={`Booking #${data.id}`} description="Detailed record view.">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border p-4">
          <p><span className="font-medium">Customer:</span> {data.customerName}</p>
          <p><span className="font-medium">Date:</span> {data.bookingDate}</p>
          <p><span className="font-medium">Quantity:</span> {data.quantity}</p>
          <div className="mt-2">
            <StatusBadge status={data.status} />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

// =====================================================
// 15) CONFIRM DELETE DIALOG
// =====================================================

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function DeleteBookingDialog({
  bookingId,
  onConfirm,
}: {
  bookingId: number;
  onConfirm: (bookingId: number) => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete booking?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. Booking #{bookingId} will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => onConfirm(bookingId)}>
            Confirm delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// =====================================================
// 16) SIMPLE DASHBOARD CARD GRID
// =====================================================

export interface DashboardStat {
  label: string;
  value: string | number;
}

export function StatsGrid({ stats }: { stats: DashboardStat[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// =====================================================
// 17) PROTECTED ROUTE EXAMPLE
// =====================================================

import { Navigate, Outlet } from "react-router-dom";

export function ProtectedRoute({
  allowedRoles,
}: {
  allowedRoles: UserRole[];
}) {
  const currentUser = useAtomValue(currentUserAtom);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/unauthorised" replace />;
  }

  return <Outlet />;
}

// =====================================================
// 18) LOGIN FORM EXAMPLE
// =====================================================

interface LoginInput {
  email: string;
  password: string;
}

export function LoginPage() {
  const setCurrentUser = useSetAtom(currentUserAtom);
  const [formData, setFormData] = useState<LoginInput>({ email: "", password: "" });
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!isValidEmail(formData.email)) {
      setError("Enter a valid email address.");
      return;
    }

    try {
      const user = await apiRequest<User>("/api/login", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      setCurrentUser(user);
    } catch (apiError) {
      setError((apiError as ApiError).message || "Login failed.");
    }
  }

  return (
    <PageContainer title="Login" description="Sign in to access your account.">
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error ? <ErrorState message={error} /> : null}

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(event) =>
                  setFormData((previous) => ({ ...previous, email: event.target.value }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(event) =>
                  setFormData((previous) => ({ ...previous, password: event.target.value }))
                }
              />
            </div>

            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  );
}

// =====================================================
// 19) ROUTER SETUP EXAMPLE
// =====================================================

import { createBrowserRouter } from "react-router-dom";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <BookingsPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute allowedRoles={["admin", "staff"]} />,
    children: [
      {
        path: "/bookings/:bookingId",
        element: <BookingDetailPage />,
      },
    ],
  },
]);

// =====================================================
// 20) PAGINATION HELPER
// =====================================================

export function paginate<T>(items: T[], currentPage: number, pageSize: number): T[] {
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  return items.slice(start, end);
}

// =====================================================
// 21) SORTING HELPER
// =====================================================

export function sortBookingsByDate(bookings: Booking[], newestFirst = true): Booking[] {
  return [...bookings].sort((a, b) => {
    const aTime = new Date(a.bookingDate).getTime();
    const bTime = new Date(b.bookingDate).getTime();
    return newestFirst ? bTime - aTime : aTime - bTime;
  });
}

// =====================================================
// 22) SIMPLE RESPONSIVE NAVBAR
// =====================================================

import { Link, NavLink } from "react-router-dom";

export function AppNavbar() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="text-lg font-bold">
          My System
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <NavLink to="/" className="hover:underline">
            Home
          </NavLink>
          <NavLink to="/login" className="hover:underline">
            Login
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

// =====================================================
// 23) SIMPLE SEARCH + STATS DASHBOARD PAGE
// =====================================================

export function DashboardPage() {
  const { data, isPending, isError, error } = useBookings();

  if (isPending) {
    return <LoadingState text="Loading dashboard..." />;
  }

  if (isError) {
    return <ErrorState message={(error as ApiError).message || "Could not load dashboard."} />;
  }

  const bookings = data ?? [];

  const stats: DashboardStat[] = [
    { label: "Total bookings", value: bookings.length },
    {
      label: "Confirmed",
      value: bookings.filter((booking) => booking.status === "confirmed").length,
    },
    {
      label: "Pending",
      value: bookings.filter((booking) => booking.status === "pending").length,
    },
    {
      label: "Cancelled",
      value: bookings.filter((booking) => booking.status === "cancelled").length,
    },
  ];

  return (
    <PageContainer title="Dashboard" description="Summary information for staff users.">
      <StatsGrid stats={stats} />
    </PageContainer>
  );
}

// =====================================================
// 24) CHECKLIST OF LIKELY TASK 2 FRONTEND FEATURES
// =====================================================

/**
 * Useful snippets included above:
 * - Typed interfaces
 * - API helper with error handling
 * - useQuery / useMutation hooks
 * - Jotai atoms
 * - Validation helpers
 * - Create form
 * - Table display
 * - Search and filter bar
 * - Detail page with route params
 * - Delete confirmation dialog
 * - Status badges
 * - Dashboard cards
 * - Protected routes
 * - Login form
 * - Sorting and pagination helpers
 * - Responsive navbar
 * - Loading / empty / error states
 */
