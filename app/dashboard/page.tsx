import { getUserRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, LineChart, Users, Activity, Layers, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { BarChartBetter } from './_components/bar-chart-better';
import { TestPaymentButton } from './_components/test-payment-button';

export default async function Dashboard() {
  const role = await getUserRole();
  
  switch (role) {
    case 'site_admin':
      redirect('/admin/dashboard');
    case 'company_admin':
      redirect('/company/dashboard');
    case 'trainee':
      redirect('/trainee/dashboard');
    default:
      redirect('/onboarding');
  }
}
