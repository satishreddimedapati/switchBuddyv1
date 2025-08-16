import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResumeTailorForm } from "./ResumeTailorForm";
import { NetworkingHub } from "./NetworkingHub";
import { FileText, Users } from "lucide-react";

export default function ResumeTailorPage() {
  return (
      <div className="flex flex-col gap-8 h-full">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            AI Tools & Networking
          </h1>
          <p className="text-muted-foreground">
            Optimize your resume and manage your professional network.
          </p>
        </div>
         <Tabs defaultValue="resume-tailor" className="flex-grow flex flex-col">
            <TabsList className="w-full sm:w-auto self-start">
                <TabsTrigger value="resume-tailor"><FileText className="mr-2 h-4 w-4"/>Resume Tailor</TabsTrigger>
                <TabsTrigger value="networking-hub"><Users className="mr-2 h-4 w-4"/>Networking Hub</TabsTrigger>
            </TabsList>
            <TabsContent value="resume-tailor" className="flex-grow mt-4">
                <ResumeTailorForm />
            </TabsContent>
            <TabsContent value="networking-hub" className="flex-grow mt-4">
                <NetworkingHub />
            </TabsContent>
        </Tabs>
      </div>
  );
}
