
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getJobApplications } from "@/services/job-applications";
import { Award, Briefcase, Calendar, Search } from "lucide-react";

const icons: { [key: string]: React.ElementType } = {
  Briefcase,
  Calendar,
  Award,
  Search,
};

export default async function DashboardPage() {
  const jobApplications = await getJobApplications();

  const applicationsSent = jobApplications.filter(job => job.stage !== 'Wishlist').length;
  const interviewsScheduled = jobApplications.filter(job => job.stage === 'Interview').length;
  const offersReceived = jobApplications.filter(job => job.stage === 'Offer').length;
  const activeSearches = jobApplications.filter(job => job.stage !== 'Offer' && job.stage !== 'Rejected').length;

  const dashboardStats = [
    {
      title: "Applications Sent",
      value: applicationsSent.toString(),
      icon: "Briefcase",
    },
    {
      title: "Interviews Scheduled",
      value: interviewsScheduled.toString(),
      icon: "Calendar",
    },
    {
      title: "Offers Received",
      value: offersReceived.toString(),
      icon: "Award",
    },
    {
      title: "Active Searches",
      value: activeSearches.toString(),
      icon: "Search",
    },
  ];

  return (
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s a snapshot of your job search progress.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {dashboardStats.map((stat) => {
            const Icon = icons[stat.icon];
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {/* Placeholder for change, as we don't have historical data */}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
  );
}
