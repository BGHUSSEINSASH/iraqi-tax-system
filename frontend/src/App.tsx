import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider, useApp } from './store/AppContext'
import { ToastProvider } from './components/ui'
import AppLayout from './components/AppLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Companies from './pages/Companies'
import Employees from './pages/Employees'
import MonthlyTax from './pages/MonthlyTax'
import AnnualTax from './pages/AnnualTax'
import CorporateTax from './pages/CorporateTax'
import ContractsTax from './pages/ContractsTax'
import PropertyTax from './pages/PropertyTax'
import LandTax from './pages/LandTax'
import ProfessionTax from './pages/ProfessionTax'
import SalesTax from './pages/SalesTax'
import Declarations from './pages/Declarations'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import OfficialForms from './pages/OfficialForms'
import Calendar from './pages/Calendar'
import LoginHistory from './pages/LoginHistory'
import Analytics from './pages/Analytics'
import Api from './pages/Api'
import ESignature from './pages/ESignature'
import Notifications from './pages/Notifications'
import Users from './pages/Users'
import Backup from './pages/Backup'
import Contact from './pages/Contact'
import Heatmap from './pages/Heatmap'
import Comparison from './pages/Comparison'
import Taxpayers from './pages/Taxpayers'
import Invoices from './pages/Invoices'
import Penalties from './pages/Penalties'
import Workflow from './pages/Workflow'
import Appointments from './pages/Appointments'
import Tasks from './pages/Tasks'
import Provinces from './pages/Provinces'
import Documents from './pages/Documents'
import AuditLog from './pages/AuditLog'
import Tickets from './pages/Tickets'
import Packages from './pages/Packages'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { currentUser } = useApp()
  if (!currentUser) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <AppLayout />
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="companies" element={<Companies />} />
              <Route path="employees" element={<Employees />} />
              
              {/* TAX MODULES */}
              <Route path="tax/monthly" element={<MonthlyTax />} />
              <Route path="tax/annual" element={<AnnualTax />} />
              <Route path="tax/corporate" element={<CorporateTax />} />
              <Route path="tax/contracts" element={<ContractsTax />} />
              <Route path="tax/property" element={<PropertyTax />} />
              <Route path="tax/land" element={<LandTax />} />
              <Route path="tax/profession" element={<ProfessionTax />} />
              <Route path="tax/sales" element={<SalesTax />} />
              
              {/* LEGACY TOOL PAGES */}
              <Route path="taxpayers" element={<Taxpayers />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="penalties" element={<Penalties />} />
              <Route path="workflow" element={<Workflow />} />
              <Route path="appointments" element={<Appointments />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="provinces" element={<Provinces />} />
              <Route path="documents" element={<Documents />} />

              {/* REPORTS & SUPPORT */}
              <Route path="declarations" element={<Declarations />} />
              <Route path="official-forms" element={<OfficialForms />} />
              <Route path="reports" element={<Reports />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="login-history" element={<LoginHistory />} />
              <Route path="api" element={<Api />} />
              <Route path="e-signature" element={<ESignature />} />
              <Route path="audit" element={<AuditLog />} />
              <Route path="tickets" element={<Tickets />} />
              <Route path="packages" element={<Packages />} />
              <Route path="settings" element={<Settings />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="users" element={<Users />} />
              <Route path="backup" element={<Backup />} />
              <Route path="contact" element={<Contact />} />
              <Route path="heatmap" element={<Heatmap />} />
              <Route path="comparison" element={<Comparison />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </ToastProvider>
    </AppProvider>
  )
}
