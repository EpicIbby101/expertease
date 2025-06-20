import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, LineChart, Users, Activity, Layers, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { BarChartBetter } from './_components/bar-chart-better';
import { TestPaymentButton } from './_components/test-payment-button';

export default async function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Page Header with Test Payment Button */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Your Dashboard</h1>
        <TestPaymentButton />
      </div>
      
      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,543</div>
            <p className="text-xs text-muted-foreground">+12.5% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+2 since last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <LineChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$8,942</div>
            <p className="text-xs text-muted-foreground">+22.5% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Visitors</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">573</div>
            <p className="text-xs text-muted-foreground">+48 in the last hour</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
        <BarChartBetter />
      </div>

      {/* Projects Section */}
      <div>
        <Card>
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Your Certificates</CardTitle>
              <CardDescription>Your achieved certificates will show here</CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/dashboard/projects">
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <div className="flex flex-1 items-center justify-center rounded-lg p-8">
                <div className="flex flex-col items-center text-center">
                  <h1 className="text-xl font-bold tracking-tight">You have no certificates</h1>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    If you have completed a course, please allow a few minutes for your certificate to be generated.
                  </p>
                  <Button>
                    <Link href="/dashboard/projects/new">Refresh</Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
