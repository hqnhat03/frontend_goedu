            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative flex items-center gap-2 h-auto py-1.5 px-2 rounded-full border-2 border-primary/20 p-0 overflow-hidden hover:border-primary/40 transition-all">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&h=150&auto=format&fit=crop"} alt={user?.name || "Admin"} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {user?.name ? user.name.substring(0, 2).toUpperCase() : "A"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start pr-1 text-left">
                      <span className="text-xs font-bold leading-none">{user?.name || "Quản trị viên"}</span>
                      <span className="text-[10px] text-muted-foreground leading-none mt-1 uppercase tracking-wider font-medium">Admin</span>
                    </div>
                    <ChevronDown className="size-3 text-muted-foreground mr-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name || "Quản trị viên"}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email || "admin@goedu.edu.vn"}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/admin/profile">
                        <User className="mr-2 h-4 w-4" />
                        <span>Thông tin cá nhân</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
