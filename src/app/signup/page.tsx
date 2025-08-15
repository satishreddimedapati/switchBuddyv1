'use client';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { signup } from "./actions";

export default function SignupPage() {

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <Logo />
            </div>
            <CardTitle className="font-headline text-3xl">Create an Account</CardTitle>
            <CardDescription>
              Start your journey with SwitchBuddy today.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={signup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" type="text" placeholder="Your Name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              <Button type="submit" className="w-full !mt-6 bg-primary text-primary-foreground hover:bg-primary/90">
                Create Account
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center text-sm">
            <p>
              Already have an account?&nbsp;
              <Link href="/" className="font-semibold text-primary underline-offset-4 hover:underline">
                Login
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
