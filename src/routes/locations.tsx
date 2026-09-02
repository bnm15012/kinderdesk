import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/locations")({
  component: LocationsRedirect,
});

// Locations are managed under Schools > Branches.
// Redirect to keep a single source of truth.
function LocationsRedirect() {
  const navigate = useNavigate();
  useEffect(() => { navigate({ to: "/schools" }); }, []);
  return null;
}
