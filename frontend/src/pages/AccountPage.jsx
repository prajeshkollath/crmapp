import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { changePassword, updateUserProfile, resendVerificationEmail } from '../lib/firebase';
import { Header } from '../components/layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { useToast } from '../hooks/use-toast';
import { Toaster } from '../components/ui/toaster';
import { 
  User, 
  Mail, 
  Lock, 
  Shield,
  AlertCircle, 
  Loader2, 
  CheckCircle,
  AlertTriangle,
  LogOut
} from 'lucide-react';

const AccountPage = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  
  // Profile form state
  const [name, setName] = useState(user?.name || '');
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
  // Email verification
  const [verificationLoading, setVerificationLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    
    const { success, error } = await updateUserProfile({ displayName: name });
    
    if (success) {
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error || 'Failed to update profile',
      });
    }
    
    setProfileLoading(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    
    if (!newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    
    setPasswordLoading(true);
    const { success, error } = await changePassword(newPassword);
    
    if (success) {
      toast({
        title: 'Password changed',
        description: 'Your password has been changed successfully.',
      });
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordError(error || 'Failed to change password');
    }
    
    setPasswordLoading(false);
  };

  const handleResendVerification = async () => {
    setVerificationLoading(true);
    const { success, error } = await resendVerificationEmail();
    
    if (success) {
      toast({
        title: 'Verification email sent',
        description: 'Please check your inbox for the verification link.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error || 'Failed to send verification email',
      });
    }
    
    setVerificationLoading(false);
  };

  const handleLogout = async () => {
    await logout();
  };

  const isGoogleUser = user?.provider === 'google.com';

  return (
    <div className="px-6 py-6">
      <Toaster />
      
      <Header
        title="Account Settings"
        subtitle="Manage your account and preferences"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Account' },
        ]}
      />

      <div className="grid gap-6 max-w-3xl">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your account profile information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user?.picture} alt={user?.name} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {user?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{user?.name}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  {isGoogleUser ? (
                    <Badge variant="secondary" className="gap-1">
                      <svg className="h-3 w-3" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      </svg>
                      Google Account
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <Mail className="h-3 w-3" />
                      Email Account
                    </Badge>
                  )}
                  {user?.emailVerified ? (
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Unverified
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {!user?.emailVerified && !isGoogleUser && (
              <Alert className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>Please verify your email address to access all features.</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleResendVerification}
                    disabled={verificationLoading}
                  >
                    {verificationLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Resend verification'
                    )}
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  disabled={profileLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              
              <Button type="submit" disabled={profileLoading}>
                {profileLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                ) : (
                  'Save changes'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Card - Only for email users */}
        {!isGoogleUser && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              {passwordError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    disabled={passwordLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    disabled={passwordLoading}
                  />
                </div>
                
                <Button type="submit" disabled={passwordLoading}>
                  {passwordLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Changing...</>
                  ) : (
                    'Change password'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Security Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>
              Manage your account security settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">Sign out</p>
                  <p className="text-sm text-muted-foreground">Sign out of your account on this device</p>
                </div>
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountPage;
