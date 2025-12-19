import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
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
import { TrendingUp, Users, DollarSign, CheckCircle } from 'lucide-react';

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

const StatCard = ({ title, value, icon: Icon, trend }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ mt: 1, fontWeight: 700 }}>
            {value}
          </Typography>
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, color: 'success.main' }}>
              <TrendingUp size={16} />
              <Typography variant="caption" sx={{ ml: 0.5 }}>
                {trend}
              </Typography>
            </Box>
          )}
        </Box>
        <Box
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            p: 1.5,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={24} />
        </Box>
      </Box>
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
      const response = await fetch(`${API_URL}/api/contacts`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setContactsCount(data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Chart configurations
  const revenueChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue',
        data: [12000, 19000, 15000, 25000, 22000, 30000],
        borderColor: '#002FA7',
        backgroundColor: 'rgba(0, 47, 167, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const contactsChartData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'New Contacts',
        data: [12, 19, 15, 25],
        backgroundColor: '#002FA7',
      },
    ],
  };

  const dealsChartData = {
    labels: ['Won', 'In Progress', 'Lost'],
    datasets: [
      {
        data: [45, 35, 20],
        backgroundColor: ['#10B981', '#002FA7', '#EF4444'],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#E4E4E7',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        Welcome back, {user?.name?.split(' ')[0]}
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Contacts"
            value={contactsCount}
            icon={Users}
            trend="+12% from last month"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Deals"
            value="23"
            icon={TrendingUp}
            trend="+5% from last month"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Revenue"
            value="$45,231"
            icon={DollarSign}
            trend="+18% from last month"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tasks Completed"
            value="156"
            icon={CheckCircle}
            trend="+8% from last month"
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Revenue Trend
              </Typography>
              <Box sx={{ height: 300 }}>
                <Line data={revenueChartData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Deals Status
              </Typography>
              <Box sx={{ height: 300 }}>
                <Doughnut data={dealsChartData} options={doughnutOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                New Contacts by Week
              </Typography>
              <Box sx={{ height: 300 }}>
                <Bar data={contactsChartData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
