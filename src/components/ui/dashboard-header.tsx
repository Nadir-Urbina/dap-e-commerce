import Link from "next/link";
import Image from "next/image";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthContext } from "@/components/auth-provider";

export function DashboardHeader() {
  const { user, userData, signOut } = useAuthContext();

  return (
    <div className="w-full flex-1">
      <div className="flex items-center justify-between">
        <form className="w-full md:w-2/3 lg:w-1/3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full bg-background pl-8"
            />
          </div>
        </form>

        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative hover:bg-[#1e1e1e] border border-transparent hover:border-[#333333]"
          >
            <Bell className="h-5 w-5 text-[#EFCD00]" />
            <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-600 ring-1 ring-white" />
            <span className="sr-only">Notifications</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-10 w-10 rounded-full border border-[#333333] hover:border-[#EFCD00]/50 hover:bg-[#1e1e1e]"
              >
                {user?.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt="User avatar"
                    fill
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-[#1e1e1e] text-[#EFCD00] font-semibold">
                    <span className="text-sm">
                      {userData?.firstName?.charAt(0) || user?.email?.charAt(0) || "U"}
                    </span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-[#333333] text-white">
              <DropdownMenuLabel>
                {userData ? `${userData.firstName} ${userData.lastName}` : (user?.email || "User Account")}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#333333]" />
              <DropdownMenuItem asChild className="hover:bg-[#292929] cursor-pointer">
                <Link href="/dashboard/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="hover:bg-[#292929] cursor-pointer">
                <Link href="/dashboard/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#333333]" />
              <DropdownMenuItem onClick={() => signOut()} className="hover:bg-[#292929] cursor-pointer">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
} 