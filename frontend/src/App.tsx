import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { PatientDashboard } from './pages/patient/PatientDashboard';
import { HospitalDashboard } from './pages/hospital/HospitalDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserRole } from './api/types';

const MainContent: React.FC = () => {
  const { token, role } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginRolePreset, setLoginRolePreset] = useState<UserRole | undefined>(undefined);

  const handleOpenAuth = (presetRole?: UserRole) => {
    setLoginRolePreset(presetRole);
    setLoginModalOpen(true);
  };

  const handleAuthSuccess = (newRole: UserRole) => {
    setLoginModalOpen(false);
    if (newRole === 'patient') setCurrentTab('dashboard');
    else if (newRole === 'hospital_staff') setCurrentTab('hospital');
    else if (newRole === 'admin') setCurrentTab('admin');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        onOpenLoginModal={() => handleOpenAuth()}
      />

      <main className="flex-1">
        {!token || currentTab === 'landing' ? (
          <LandingPage
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenAuth={handleOpenAuth}
          />
        ) : role === 'patient' || currentTab === 'dashboard' ? (
          <PatientDashboard />
        ) : role === 'hospital_staff' || currentTab === 'hospital' ? (
          <HospitalDashboard />
        ) : role === 'admin' || currentTab === 'admin' ? (
          <AdminDashboard />
        ) : (
          <LandingPage
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenAuth={handleOpenAuth}
          />
        )}
      </main>

      {/* Login Modal */}
      {loginModalOpen && (
        <LoginPage
          defaultRole={loginRolePreset}
          onSuccess={handleAuthSuccess}
          onCancel={() => setLoginModalOpen(false)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
