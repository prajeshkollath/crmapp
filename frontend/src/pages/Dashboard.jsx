import React, { useState, useEffect } from 'react';
import { Header } from '../components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  DollarSign, 
  CheckCircle, 
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const API_URL = process.env.REACT_APP_BACKEND_URL;

const StatCard = ({ title, value, change, changeType, icon: Icon, iconColor }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {change && (
            <div className={`flex items-center gap-1 text-sm ${
              changeType === 'increase' ? 'text-emerald-600' : 'text-red-500'
            }`}>
              {changeType === 'increase' ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              <span>{change}</span>
              <span className="text-muted-foreground">vs last month</span>
            </div>
          )}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconColor}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const Dashboard = ({ user }) => {
  const [contactsCount, setContactsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContactsCount();
  }, []);

  const fetchContactsCount = async () => {
    try {
      // Try to get from demo storage first
      const demoContacts = localStorage.getItem('crm_demo_contacts');
      if (demoContacts) {
        const contacts = JSON.parse(demoContacts);
        setContactsCount(contacts.length);
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/contacts`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setContactsCount(data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setContactsCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Chart configurations with modern colors
  const revenueChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Revenue',
        data: [12000, 19000, 15000, 25000, 22000, 30000, 28000, 35000, 32000, 40000, 38000, 45000],
        borderColor: 'hsl(262, 83%, 58%)',
        backgroundColor: 'hsla(262, 83%, 58%, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: 'hsl(262, 83%, 58%)',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
      },
    ],
  };

  const contactsChartData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'New Contacts',
        data: [12, 19, 15, 25],
        backgroundColor: 'hsl(262, 83%, 58%)',
        borderRadius: 6,
        barThickness: 32,
      },
      {
        label: 'Converted',
        data: [8, 12, 10, 18],
        backgroundColor: 'hsl(142, 76%, 36%)',
        borderRadius: 6,
        barThickness: 32,
      },
    ],
  };

  const dealsChartData = {
    labels: ['Won', 'In Progress', 'Lost'],
    datasets: [
      {
        data: [45, 35, 20],
        backgroundColor: [
          'hsl(142, 76%, 36%)',
          'hsl(262, 83%, 58%)',
          'hsl(0, 84%, 60%)',
        ],
        borderWidth: 0,
        spacing: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'hsl(222, 47%, 11%)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'hsl(214, 32%, 91%)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        border: {
          display: false,
        },
        grid: {
          color: 'hsl(214, 32%, 91%)',
          drawBorder: false,
        },
        ticks: {
          color: 'hsl(215, 16%, 47%)',
          font: {
            size: 12,
          },
        },
      },
      x: {
        border: {
          display: false,
        },
        grid: {
          display: false,
        },
        ticks: {
          color: 'hsl(215, 16%, 47%)',
          font: {
            size: 12,
          },
        },
      },
    },
  };

  const barChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
          boxHeight: 8,
          padding: 20,
          color: 'hsl(215, 16%, 47%)',
          font: {
            size: 12,
          },
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
          boxHeight: 8,
          padding: 20,
          color: 'hsl(215, 16%, 47%)',
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'hsl(222, 47%, 11%)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'hsl(214, 32%, 91%)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const firstName = user?.name?.split(' ')[0] || 'User';

  return (
    <div>
      <Header 
        title={`Welcome back, ${firstName}`}
        subtitle="Here's what's happening with your CRM today."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Dashboard' },
        ]}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Contacts"
          value={contactsCount || 248}
          change="+12.5%"
          changeType="increase"
          icon={Users}
          iconColor="bg-primary"
        />
        <StatCard
          title="Active Deals"
          value="23"
          change="+8.2%"
          changeType="increase"
          icon={Target}
          iconColor="bg-emerald-500"
        />
        <StatCard
          title="Revenue"
          value="$45,231"
          change="+18.7%"
          changeType="increase"
          icon={DollarSign}
          iconColor="bg-blue-500"
        />
        <StatCard
          title="Tasks Completed"
          value="156"
          change="-2.4%"
          changeType="decrease"
          icon={CheckCircle}
          iconColor="bg-amber-500"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-12 mb-6">
        {/* Revenue Chart - Takes 8 columns */}
        <Card className="lg:col-span-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Revenue Trend</CardTitle>
                <CardDescription>Monthly revenue over the past year</CardDescription>
              </div>
              <Badge variant="secondary" className="gap-1">
                <TrendingUp className="h-3 w-3" />
                +23.5%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <Line data={revenueChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Deals Status - Takes 4 columns */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Deal Pipeline</CardTitle>
            <CardDescription>Current deal distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] flex items-center justify-center">
              <div className="w-full max-w-[280px]">
                <Doughnut data={dealsChartData} options={doughnutOptions} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Contacts Chart - Full width */}
        <Card className="lg:col-span-12">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Contact Acquisition</CardTitle>
                <CardDescription>New contacts vs conversions by week</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Bar data={contactsChartData} options={barChartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
