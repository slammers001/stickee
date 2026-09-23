import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/services/userService";
import { useEffect, useState } from "react";
import { User } from "lucide-react";

const GUEST_USER = { id: "", isGuest: true, displayName: "" };

export const UserProfile = () => {
  const [user, setUser] = useState(GUEST_USER);

  useEffect(() => {
    let active = true;
    getCurrentUser().then((currentUser) => {
      if (active) setUser(currentUser);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      <User className="h-4 w-4 text-muted-foreground" />
      <Badge variant="secondary" className="text-xs">
        {user.displayName}
      </Badge>
    </div>
  );
};
