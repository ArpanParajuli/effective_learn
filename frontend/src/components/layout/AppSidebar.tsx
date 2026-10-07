import { Link, useLocation } from 'react-router-dom'
import { PenTool, Network, BookOpen, LogOut } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { useAuth } from '@/context/AuthContext'
import { ModeToggle } from '@/components/mode-toggle'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function AppSidebar() {
  const location = useLocation()
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-border p-4 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:justify-center">
        <Link to="/" className="flex items-center gap-2.5 group overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm shadow-sm">
            E
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <span className="text-base font-bold tracking-tight text-foreground whitespace-nowrap">
              Effective<span className="text-muted-foreground font-normal">Learn</span>
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === '/'} tooltip="Subjects">
                  <Link to="/">
                    <BookOpen />
                    <span>Subjects</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === '/graph'} tooltip="Graph View">
                  <Link to="/graph">
                    <Network />
                    <span>Graph View</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Write Chapter">
                  <Link to="/write">
                    <PenTool />
                    <span>Write Chapter</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4 group-data-[collapsible=icon]:p-2">
        <div className="flex flex-col gap-4 group-data-[collapsible=icon]:items-center">
          <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center w-full">
            <span className="text-sm font-medium group-data-[collapsible=icon]:hidden">Theme</span>
            <ModeToggle />
          </div>

          {isAuthenticated && user ? (
            <div className="flex flex-col gap-2 w-full items-center">
              <div className="flex items-center gap-2 w-full group-data-[collapsible=icon]:justify-center">
                <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {user.name[0]}
                </div>
                <div className="flex flex-col text-xs group-data-[collapsible=icon]:hidden overflow-hidden">
                  <span className="font-semibold truncate">{user.name}</span>
                  <span className="text-muted-foreground truncate">{user.email}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="w-full group-data-[collapsible=icon]:w-8 justify-start group-data-[collapsible=icon]:justify-center text-red-500 hover:text-red-600 hover:bg-red-500/10"
                onClick={() => {
                  logout()
                  toast.info('You have signed out.')
                }}
              >
                <LogOut className="h-4 w-4 group-data-[collapsible=icon]:mr-0 mr-2" />
                <span className="group-data-[collapsible=icon]:hidden">Sign Out</span>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 w-full group-data-[collapsible=icon]:hidden">
              <Link to="/login" className="w-full">
                <Button variant="outline" size="sm" className="w-full">Sign In</Button>
              </Link>
              <Link to="/register" className="w-full">
                <Button size="sm" className="w-full">Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
