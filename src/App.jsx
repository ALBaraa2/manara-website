import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { getToken } from './lib/auth';

// الصفحة الرئيسية تُحمَّل مباشرة، وبقية الصفحات (خصوصاً لوحة التحكم) عند الحاجة فقط
import Home from './Component/Home';
import NotFound from './Component/NotFound';

const PostDetail = lazy(() => import('./Component/PostDetail'));
const PublicFormView = lazy(() => import('./Api/PublicFormView'));

const AdminLogin = lazy(() => import('./Api/AdminLogin'));
const AdminDashboard = lazy(() => import('./Api/AdminDashboard'));
const FormsList = lazy(() => import('./Api/FormsList'));
const CreateForm = lazy(() => import('./Api/CreateForm'));
const EditForm = lazy(() => import('./Api/EditForm'));
const FormSubmissions = lazy(() => import('./Api/FormSubmissions'));
const PostsList = lazy(() => import('./Api/PostsList'));
const PostForm = lazy(() => import('./Api/PostForm'));
const FieldVoicesAdmin = lazy(() => import('./Api/FieldVoicesAdmin'));
const FieldVoiceForm = lazy(() => import('./Api/FieldVoiceForm'));

// حماية مسارات الأدمن: التحقق من صلاحية التوكن ودور المستخدم يتم في AdminDashboard و axiosClient
const ProtectedRoute = ({ children }) => {
  return getToken() ? children : <Navigate to="/admin/login" replace />;
};

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#1a1a2e] text-gray-400 text-sm">...</div>
);

function App() {
  return (
    // reducedMotion="user": كل حركات framer-motion (التحريك والإزاحة) تُلغى لمن يفضّل تقليل الحركة، ويبقى التلاشي فقط
    <MotionConfig reducedMotion="user">
    <Router>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/posts/:slug" element={<PostDetail />} />
          <Route path="/forms/:slug" element={<PublicFormView />} />

          <Route path="/admin/login" element={<AdminLogin />} />

          <Route path="/admin/*" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="forms" replace />} />

            <Route path="forms" element={<FormsList />} />
            <Route path="forms/create" element={<CreateForm />} />
            <Route path="forms/edit/:slug" element={<EditForm />} />
            <Route path="forms/:slug/submissions" element={<FormSubmissions />} />

            <Route path="posts" element={<PostsList />} />
            <Route path="posts/create" element={<PostForm key="create" />} />
            <Route path="posts/edit/:slug" element={<PostForm key="edit" />} />

            <Route path="field-voices" element={<FieldVoicesAdmin />} />
            <Route path="field-voices/create" element={<FieldVoiceForm key="create" />} />
            <Route path="field-voices/edit/:id" element={<FieldVoiceForm key="edit" />} />

            <Route path="*" element={<NotFound variant="admin" />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
    </MotionConfig>
  );
}
export default App;
