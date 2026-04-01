import os
BASE = r'c:\Users\BGHUSSEINSASH\Desktop\نظام ضريبة'

with open(os.path.join(BASE, 'index.html'), 'r', encoding='utf-8') as f:
    html = f.read()
with open(os.path.join(BASE, 'css', 'style.css'), 'r', encoding='utf-8') as f:
    css = f.read()
with open(os.path.join(BASE, 'js', 'app.js'), 'r', encoding='utf-8') as f:
    js = f.read()
print('Files read OK')

# ===================== HTML: Add Lottie Player CDN =====================
old_head = '<script src="https://unpkg.com/aos@2.3.4/dist/aos.js"></script>'
new_head = '''<script src="https://unpkg.com/aos@2.3.4/dist/aos.js"></script>
  <script src="https://unpkg.com/@lottiefiles/lottie-player@2.0.8/dist/lottie-player.js"></script>'''
html = html.replace(old_head, new_head, 1)
print('HTML: Lottie CDN added')

# ===================== HTML: Enhance Splash Screen =====================
old_splash = '''  <div class="splash-screen" id="splashScreen">
    <div class="splash-content">
      <div class="splash-logo"><i class="fas fa-landmark"></i></div>
      <h1>نظام الضرائب العراقي</h1>
      <p>الهيئة العامة للضرائب — وزارة المالية</p>
      <div class="splash-loader"><div class="splash-bar"></div></div>
    </div>
  </div>'''

new_splash = '''  <div class="splash-screen" id="splashScreen">
    <div class="splash-particles" id="splashParticles"></div>
    <div class="splash-3d-scene">
      <div class="splash-cube">
        <div class="cube-face front"><i class="fas fa-landmark"></i></div>
        <div class="cube-face back"><i class="fas fa-calculator"></i></div>
        <div class="cube-face right"><i class="fas fa-coins"></i></div>
        <div class="cube-face left"><i class="fas fa-chart-pie"></i></div>
        <div class="cube-face top"><i class="fas fa-shield-alt"></i></div>
        <div class="cube-face bottom"><i class="fas fa-file-invoice"></i></div>
      </div>
    </div>
    <div class="splash-content">
      <div class="splash-logo-animated">
        <div class="splash-ring ring-1"></div>
        <div class="splash-ring ring-2"></div>
        <div class="splash-ring ring-3"></div>
        <div class="splash-logo-inner"><i class="fas fa-landmark"></i></div>
      </div>
      <h1 class="splash-title-anim">نظام الضرائب العراقي</h1>
      <p class="splash-sub-anim">الهيئة العامة للضرائب — وزارة المالية</p>
      <div class="splash-loader"><div class="splash-bar"></div></div>
      <div class="splash-dots">
        <span></span><span></span><span></span>
      </div>
    </div>
  </div>'''
html = html.replace(old_splash, new_splash, 1)
print('HTML: Splash screen enhanced with 3D cube + rings')

# ===================== HTML: Auth Screen Animated Shapes =====================
old_auth_bg = '''    <div class="auth-bg">
      <div class="auth-bg-shape shape-1"></div>
      <div class="auth-bg-shape shape-2"></div>
      <div class="auth-bg-shape shape-3"></div>
    </div>'''

new_auth_bg = '''    <div class="auth-bg">
      <div class="auth-bg-shape shape-1"></div>
      <div class="auth-bg-shape shape-2"></div>
      <div class="auth-bg-shape shape-3"></div>
      <div class="auth-bg-shape shape-4"></div>
      <div class="auth-bg-shape shape-5"></div>
      <div class="auth-floating-icons">
        <div class="auth-float-icon fi-1"><i class="fas fa-calculator"></i></div>
        <div class="auth-float-icon fi-2"><i class="fas fa-coins"></i></div>
        <div class="auth-float-icon fi-3"><i class="fas fa-file-invoice-dollar"></i></div>
        <div class="auth-float-icon fi-4"><i class="fas fa-chart-line"></i></div>
        <div class="auth-float-icon fi-5"><i class="fas fa-landmark"></i></div>
        <div class="auth-float-icon fi-6"><i class="fas fa-shield-alt"></i></div>
        <div class="auth-float-icon fi-7"><i class="fas fa-balance-scale"></i></div>
        <div class="auth-float-icon fi-8"><i class="fas fa-money-bill-wave"></i></div>
      </div>
    </div>'''
html = html.replace(old_auth_bg, new_auth_bg, 1)
print('HTML: Auth floating icons added')

# ===================== HTML: Add 3D illustrations to welcome banner =====================
old_welcome = '''          <div class="welcome-banner animate-in">
            <div class="welcome-text">
              <h2>مرحباً، <span id="welcomeName">محمد</span> 👋</h2>
              <p>إليك ملخص النظام الضريبي لليوم</p>
            </div>
            <div class="welcome-date">
              <i class="fas fa-calendar-alt"></i>
              <span id="todayDate"></span>
            </div>
          </div>'''

new_welcome = '''          <div class="welcome-banner animate-in">
            <div class="welcome-3d-bg">
              <div class="welcome-orbit">
                <div class="orbit-dot od-1"></div>
                <div class="orbit-dot od-2"></div>
                <div class="orbit-dot od-3"></div>
              </div>
            </div>
            <div class="welcome-text">
              <h2 class="text-shimmer">مرحباً، <span id="welcomeName">محمد</span> 👋</h2>
              <p>إليك ملخص النظام الضريبي لليوم</p>
            </div>
            <div class="welcome-illustration">
              <div class="wi-3d-chart">
                <div class="wi-bar bar-1"></div>
                <div class="wi-bar bar-2"></div>
                <div class="wi-bar bar-3"></div>
                <div class="wi-bar bar-4"></div>
              </div>
            </div>
            <div class="welcome-date">
              <i class="fas fa-calendar-alt"></i>
              <span id="todayDate"></span>
            </div>
          </div>'''
html = html.replace(old_welcome, new_welcome, 1)
print('HTML: Welcome banner 3D illustration added')

# ===================== HTML: Add animated icons to stat cards =====================
old_stat1 = '<div class="stat-icon blue"><i class="fas fa-coins"></i></div>'
new_stat1 = '<div class="stat-icon blue animated-icon"><i class="fas fa-coins"></i><div class="stat-pulse"></div></div>'

old_stat2 = '<div class="stat-icon green"><i class="fas fa-check-double"></i></div>'
new_stat2 = '<div class="stat-icon green animated-icon"><i class="fas fa-check-double"></i><div class="stat-pulse"></div></div>'

old_stat3 = '<div class="stat-icon orange"><i class="fas fa-hourglass-half"></i></div>'
new_stat3 = '<div class="stat-icon orange animated-icon"><i class="fas fa-hourglass-half"></i><div class="stat-pulse"></div></div>'

old_stat4 = '<div class="stat-icon purple"><i class="fas fa-file-invoice"></i></div>'
new_stat4 = '<div class="stat-icon purple animated-icon"><i class="fas fa-file-invoice"></i><div class="stat-pulse"></div></div>'

html = html.replace(old_stat1, new_stat1, 1)
html = html.replace(old_stat2, new_stat2, 1)
html = html.replace(old_stat3, new_stat3, 1)
html = html.replace(old_stat4, new_stat4, 1)
print('HTML: Stat card animated icons added')

# ===================== HTML: Add 3D animated icons to module cards =====================
old_mc = '''            <div class="module-card corporate" onclick="navigateTo('corporate')">
              <div class="module-icon"><i class="fas fa-building"></i></div>
              <h3>ضريبة دخل الشركات</h3>
              <p>أرباح الشركات، الإيرادات، واستقطاع الرواتب</p>
            </div>
            <div class="module-card land" onclick="navigateTo('land')">
              <div class="module-icon"><i class="fas fa-map-marked-alt"></i></div>
              <h3>ضريبة العرصات</h3>
              <p>الأراضي ضمن أمانة بغداد والأقضية والنواحي</p>
            </div>
            <div class="module-card property" onclick="navigateTo('property')">
              <div class="module-icon"><i class="fas fa-home"></i></div>
              <h3>ضريبة العقار</h3>
              <p>إيجار وبيع العقارات بمختلف أنواعها</p>
            </div>
            <div class="module-card profession" onclick="navigateTo('profession')">
              <div class="module-icon"><i class="fas fa-user-tie"></i></div>
              <h3>ضريبة المهنة</h3>
              <p>المحامين، الأطباء، التجار وأصحاب المحلات</p>
            </div>
            <div class="module-card sales" onclick="navigateTo('sales')">
              <div class="module-icon"><i class="fas fa-shopping-cart"></i></div>
              <h3>ضريبة المبيعات</h3>
              <p>خدمات الهاتف، السيارات، تذاكر السفر والمزيد</p>
            </div>'''

new_mc = '''            <div class="module-card corporate" onclick="navigateTo('corporate')" data-aos="zoom-in" data-aos-delay="0">
              <div class="module-3d-scene"><div class="module-3d-obj"><div class="m3d-face m3d-front"><i class="fas fa-building"></i></div><div class="m3d-face m3d-back"><i class="fas fa-chart-line"></i></div></div></div>
              <div class="module-icon"><i class="fas fa-building"></i></div>
              <h3>ضريبة دخل الشركات</h3>
              <p>أرباح الشركات، الإيرادات، واستقطاع الرواتب</p>
              <div class="module-card-glow"></div>
            </div>
            <div class="module-card land" onclick="navigateTo('land')" data-aos="zoom-in" data-aos-delay="80">
              <div class="module-3d-scene"><div class="module-3d-obj"><div class="m3d-face m3d-front"><i class="fas fa-map-marked-alt"></i></div><div class="m3d-face m3d-back"><i class="fas fa-map"></i></div></div></div>
              <div class="module-icon"><i class="fas fa-map-marked-alt"></i></div>
              <h3>ضريبة العرصات</h3>
              <p>الأراضي ضمن أمانة بغداد والأقضية والنواحي</p>
              <div class="module-card-glow"></div>
            </div>
            <div class="module-card property" onclick="navigateTo('property')" data-aos="zoom-in" data-aos-delay="160">
              <div class="module-3d-scene"><div class="module-3d-obj"><div class="m3d-face m3d-front"><i class="fas fa-home"></i></div><div class="m3d-face m3d-back"><i class="fas fa-key"></i></div></div></div>
              <div class="module-icon"><i class="fas fa-home"></i></div>
              <h3>ضريبة العقار</h3>
              <p>إيجار وبيع العقارات بمختلف أنواعها</p>
              <div class="module-card-glow"></div>
            </div>
            <div class="module-card profession" onclick="navigateTo('profession')" data-aos="zoom-in" data-aos-delay="240">
              <div class="module-3d-scene"><div class="module-3d-obj"><div class="m3d-face m3d-front"><i class="fas fa-user-tie"></i></div><div class="m3d-face m3d-back"><i class="fas fa-briefcase"></i></div></div></div>
              <div class="module-icon"><i class="fas fa-user-tie"></i></div>
              <h3>ضريبة المهنة</h3>
              <p>المحامين، الأطباء، التجار وأصحاب المحلات</p>
              <div class="module-card-glow"></div>
            </div>
            <div class="module-card sales" onclick="navigateTo('sales')" data-aos="zoom-in" data-aos-delay="320">
              <div class="module-3d-scene"><div class="module-3d-obj"><div class="m3d-face m3d-front"><i class="fas fa-shopping-cart"></i></div><div class="m3d-face m3d-back"><i class="fas fa-receipt"></i></div></div></div>
              <div class="module-icon"><i class="fas fa-shopping-cart"></i></div>
              <h3>ضريبة المبيعات</h3>
              <p>خدمات الهاتف، السيارات، تذاكر السفر والمزيد</p>
              <div class="module-card-glow"></div>
            </div>'''
html = html.replace(old_mc, new_mc, 1)
print('HTML: Module cards 3D objects added')

# ===================== HTML: Add animated section headers to all tax pages =====================
sections_data = [
    ('page-corporate', 'fa-building', 'ضريبة دخل الشركات', 'احتساب الضريبة على أرباح الشركات وفق قانون ١١٣ لسنة ١٩٨٢', '#1a2980', '#0f1b4d'),
    ('page-land', 'fa-map-marked-alt', 'ضريبة العرصات', 'احتساب ضريبة الأراضي ضمن حدود المحافظات العراقية', '#065f46', '#059669'),
    ('page-property', 'fa-home', 'ضريبة العقار', 'احتساب ضريبة إيجار وبيع العقارات بمختلف أنواعها', '#c2410c', '#ea580c'),
    ('page-profession', 'fa-user-tie', 'ضريبة المهنة', 'احتساب ضريبة المحامين والأطباء والتجار', '#5b21b6', '#7c3aed'),
    ('page-sales', 'fa-shopping-cart', 'ضريبة المبيعات', 'احتساب الضريبة على الخدمات والسلع المختلفة', '#991b1b', '#dc2626'),
    ('page-reports', 'fa-chart-bar', 'التقارير والتحليلات', 'استعراض وتحليل البيانات الضريبية بشكل تفصيلي', '#1e40af', '#3b82f6'),
    ('page-documents', 'fa-folder-open', 'إدارة المستندات', 'رفع وتنظيم المستندات والوثائق الضريبية', '#065f46', '#10b981'),
    ('page-notifications', 'fa-bell', 'الإشعارات والتنبيهات', 'متابعة التنبيهات والمواعيد الضريبية المهمة', '#d97706', '#f59e0b'),
    ('page-penalties', 'fa-gavel', 'حاسبة الغرامات', 'احتساب غرامات التأخر في السداد وفق القانون', '#dc2626', '#ef4444'),
    ('page-comparison', 'fa-balance-scale', 'مقارنة الضرائب', 'مقارنة تفصيلية بين أنواع الضرائب المختلفة', '#7c3aed', '#8b5cf6'),
    ('page-calendar', 'fa-calendar-alt', 'التقويم الضريبي', 'جدول المواعيد النهائية والأحداث الضريبية', '#0891b2', '#06b6d4'),
    ('page-audit', 'fa-clipboard-list', 'سجل التدقيق', 'تتبع جميع العمليات والأنشطة في النظام', '#4338ca', '#6366f1'),
    ('page-users', 'fa-users-cog', 'إدارة المستخدمين', 'إدارة حسابات المستخدمين والصلاحيات', '#0f766e', '#14b8a6'),
    ('page-settings', 'fa-cogs', 'الإعدادات', 'تخصيص إعدادات النظام والتفضيلات الشخصية', '#6b7280', '#9ca3af'),
    ('page-packages', 'fa-gem', 'الباقات والاشتراكات', 'استعراض وإدارة باقات الاشتراك', '#d4a017', '#f0c75e'),
    ('page-provinces', 'fa-map', 'المحافظات العراقية', 'استعراض بيانات جميع المحافظات الـ ١٨', '#0f1b4d', '#1a2980'),
]

for sec_id, icon, title, desc, c1, c2 in sections_data:
    target = f'id="{sec_id}">'
    animated_header = f'''id="{sec_id}">
          <div class="section-hero" style="--hero-c1:{c1};--hero-c2:{c2};" data-aos="fade-down">
            <div class="section-hero-bg">
              <div class="hero-particle hp-1"></div>
              <div class="hero-particle hp-2"></div>
              <div class="hero-particle hp-3"></div>
              <div class="hero-wave"></div>
            </div>
            <div class="section-hero-content">
              <div class="section-hero-icon-3d">
                <div class="hero-icon-ring"></div>
                <i class="fas {icon}"></i>
              </div>
              <div class="section-hero-text">
                <h2>{title}</h2>
                <p>{desc}</p>
              </div>
            </div>
          </div>'''
    html = html.replace(target, animated_header, 1)

print('HTML: Animated section headers added to all 16 pages')

# ===================== HTML: Add animated chatbot avatar =====================
old_chatbot_toggle = '<button class="chatbot-toggle" id="chatbotToggle" onclick="toggleChatbot()"><i class="fas fa-robot"></i></button>'
new_chatbot_toggle = '<button class="chatbot-toggle" id="chatbotToggle" onclick="toggleChatbot()"><div class="chatbot-toggle-anim"><i class="fas fa-robot"></i><div class="chatbot-pulse-ring"></div></div></button>'
if old_chatbot_toggle in html:
    html = html.replace(old_chatbot_toggle, new_chatbot_toggle, 1)
    print('HTML: Chatbot toggle animated')

# Write HTML
with open(os.path.join(BASE, 'index.html'), 'w', encoding='utf-8') as f:
    f.write(html)
print('HTML saved!')

# ===================== CSS: Massive Animation Additions =====================
animation_css = '''

/* ===================================================================
   ANIMATED VIDEOS / MOTION GRAPHICS / 3D ILLUSTRATIONS
   =================================================================== */

/* ========== SPLASH SCREEN — 3D Cube + Rings + Particles ========== */
.splash-particles {
  position: absolute; inset: 0; overflow: hidden; z-index: 0;
}
.splash-3d-scene {
  position: absolute; top: 15%; left: 50%; transform: translateX(-50%);
  perspective: 600px; z-index: 1;
}
.splash-cube {
  width: 60px; height: 60px; position: relative;
  transform-style: preserve-3d;
  animation: cubeRotate 6s linear infinite;
}
.cube-face {
  position: absolute; width: 60px; height: 60px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.2rem; color: rgba(212,160,23,0.6);
  background: rgba(212,160,23,0.06);
  border: 1px solid rgba(212,160,23,0.15);
  border-radius: 8px; backdrop-filter: blur(4px);
}
.cube-face.front  { transform: translateZ(30px); }
.cube-face.back   { transform: rotateY(180deg) translateZ(30px); }
.cube-face.right  { transform: rotateY(90deg) translateZ(30px); }
.cube-face.left   { transform: rotateY(-90deg) translateZ(30px); }
.cube-face.top    { transform: rotateX(90deg) translateZ(30px); }
.cube-face.bottom { transform: rotateX(-90deg) translateZ(30px); }

@keyframes cubeRotate {
  0%   { transform: rotateX(0) rotateY(0); }
  25%  { transform: rotateX(90deg) rotateY(90deg); }
  50%  { transform: rotateX(180deg) rotateY(180deg); }
  75%  { transform: rotateX(270deg) rotateY(270deg); }
  100% { transform: rotateX(360deg) rotateY(360deg); }
}

.splash-logo-animated {
  position: relative; width: 100px; height: 100px; margin: 0 auto 24px;
}
.splash-ring {
  position: absolute; inset: 0; border-radius: 50%;
  border: 2px solid transparent;
}
.splash-ring.ring-1 {
  border-top-color: var(--accent); border-bottom-color: var(--accent);
  animation: ringRotate 3s linear infinite;
}
.splash-ring.ring-2 {
  inset: 8px; border-left-color: var(--accent-light); border-right-color: var(--accent-light);
  animation: ringRotate 2s linear infinite reverse;
}
.splash-ring.ring-3 {
  inset: 16px; border-top-color: rgba(255,255,255,0.2); border-bottom-color: rgba(255,255,255,0.2);
  animation: ringRotate 4s linear infinite;
}
@keyframes ringRotate { to { transform: rotate(360deg); } }

.splash-logo-inner {
  position: absolute; inset: 22px; border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), var(--accent-light));
  display: flex; align-items: center; justify-content: center;
  font-size: 1.8rem; color: var(--primary-dark);
  box-shadow: 0 0 30px rgba(212,160,23,0.4);
  animation: logoPulse3D 2s ease-in-out infinite;
}
@keyframes logoPulse3D {
  0%,100% { transform: scale(1) rotateY(0); box-shadow: 0 0 30px rgba(212,160,23,0.4); }
  50% { transform: scale(1.08) rotateY(10deg); box-shadow: 0 0 50px rgba(212,160,23,0.6); }
}

.splash-title-anim {
  font-size: 1.7rem; font-weight: 900; color: #fff; margin-bottom: 6px;
  animation: textReveal 1s ease 0.5s both;
}
.splash-sub-anim {
  color: rgba(255,255,255,0.5); font-size: 0.88rem; margin-bottom: 28px;
  animation: textReveal 1s ease 0.8s both;
}
@keyframes textReveal {
  from { opacity: 0; transform: translateY(20px) scale(0.95); filter: blur(8px); }
  to   { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
}

.splash-dots {
  display: flex; justify-content: center; gap: 8px; margin-top: 16px;
}
.splash-dots span {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--accent);
  animation: dotBounce 1.4s ease-in-out infinite;
}
.splash-dots span:nth-child(2) { animation-delay: 0.16s; }
.splash-dots span:nth-child(3) { animation-delay: 0.32s; }
@keyframes dotBounce {
  0%,80%,100% { transform: scale(0.6); opacity: 0.3; }
  40% { transform: scale(1.2); opacity: 1; }
}

/* ========== AUTH SCREEN — Floating Icons + Enhanced Shapes ========== */
.auth-bg-shape {
  position: absolute; border-radius: 50%;
  background: radial-gradient(circle, rgba(212,160,23,0.08), transparent 70%);
  animation: shapeFloat 12s ease-in-out infinite;
}
.auth-bg-shape.shape-1 { width: 400px; height: 400px; top: -10%; left: -5%; animation-duration: 15s; }
.auth-bg-shape.shape-2 { width: 300px; height: 300px; bottom: 5%; right: -5%; animation-duration: 12s; animation-delay: -3s; }
.auth-bg-shape.shape-3 { width: 200px; height: 200px; top: 40%; left: 50%; animation-duration: 10s; animation-delay: -6s; }
.auth-bg-shape.shape-4 {
  width: 150px; height: 150px; top: 10%; right: 20%;
  background: radial-gradient(circle, rgba(37,65,178,0.08), transparent 70%);
  animation-duration: 18s; animation-delay: -2s;
}
.auth-bg-shape.shape-5 {
  width: 250px; height: 250px; bottom: 20%; left: 30%;
  background: radial-gradient(circle, rgba(255,255,255,0.03), transparent 60%);
  animation-duration: 20s; animation-delay: -8s;
}
@keyframes shapeFloat {
  0%,100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(30px, -20px) scale(1.05); }
  50% { transform: translate(-20px, 30px) scale(0.95); }
  75% { transform: translate(20px, 10px) scale(1.02); }
}

.auth-floating-icons {
  position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 1;
}
.auth-float-icon {
  position: absolute;
  width: 40px; height: 40px; border-radius: 10px;
  background: rgba(212,160,23,0.06);
  border: 1px solid rgba(212,160,23,0.1);
  display: flex; align-items: center; justify-content: center;
  color: rgba(212,160,23,0.25); font-size: 0.9rem;
  backdrop-filter: blur(4px);
  animation: iconFloat 8s ease-in-out infinite;
}
.auth-float-icon.fi-1 { top: 8%;  left: 12%; animation-duration: 9s; }
.auth-float-icon.fi-2 { top: 18%; right: 8%; animation-duration: 11s; animation-delay: -2s; }
.auth-float-icon.fi-3 { top: 45%; left: 5%;  animation-duration: 10s; animation-delay: -4s; }
.auth-float-icon.fi-4 { top: 65%; right: 15%;animation-duration: 8s;  animation-delay: -1s; }
.auth-float-icon.fi-5 { bottom: 15%; left: 20%; animation-duration: 12s; animation-delay: -5s; }
.auth-float-icon.fi-6 { top: 30%; left: 70%; animation-duration: 14s; animation-delay: -3s; }
.auth-float-icon.fi-7 { bottom: 30%; right: 5%; animation-duration: 9s; animation-delay: -6s; }
.auth-float-icon.fi-8 { top: 5%;  left: 45%; animation-duration: 13s; animation-delay: -7s; }

@keyframes iconFloat {
  0%,100% { transform: translateY(0) rotate(0deg); opacity: 0.4; }
  25%     { transform: translateY(-20px) rotate(10deg); opacity: 0.7; }
  50%     { transform: translateY(-8px) rotate(-5deg); opacity: 0.5; }
  75%     { transform: translateY(-25px) rotate(8deg); opacity: 0.8; }
}

/* ========== WELCOME BANNER — 3D Chart + Orbiting Dots ========== */
.welcome-3d-bg {
  position: absolute; inset: 0; overflow: hidden; pointer-events: none;
}
.welcome-orbit {
  position: absolute; top: 50%; right: 10%; width: 120px; height: 120px;
  transform: translate(50%, -50%);
  border: 1px dashed rgba(255,255,255,0.08);
  border-radius: 50%;
  animation: orbitSpin 15s linear infinite;
}
.orbit-dot {
  position: absolute; width: 8px; height: 8px; border-radius: 50%;
  background: var(--accent-light);
  box-shadow: 0 0 12px rgba(212,160,23,0.5);
}
.orbit-dot.od-1 { top: -4px; left: 50%; transform: translateX(-50%); }
.orbit-dot.od-2 { bottom: -4px; left: 50%; transform: translateX(-50%); animation: orbitPulse 2s ease infinite; }
.orbit-dot.od-3 { top: 50%; right: -4px; transform: translateY(-50%); animation: orbitPulse 2s ease 0.5s infinite; }
@keyframes orbitSpin { to { transform: translate(50%, -50%) rotate(360deg); } }
@keyframes orbitPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.5); } }

.welcome-illustration {
  position: relative; z-index: 1; display: flex; align-items: flex-end; gap: 6px; margin-left: 16px;
}
.wi-3d-chart {
  display: flex; align-items: flex-end; gap: 5px;
  perspective: 200px; transform: rotateX(5deg);
}
.wi-bar {
  width: 14px; border-radius: 4px 4px 0 0;
  background: linear-gradient(to top, rgba(212,160,23,0.4), rgba(212,160,23,0.8));
  box-shadow: 0 0 8px rgba(212,160,23,0.3);
  animation: barGrow 2s ease infinite;
  transform-origin: bottom;
}
.wi-bar.bar-1 { height: 28px; animation-delay: 0s; }
.wi-bar.bar-2 { height: 42px; animation-delay: 0.2s; }
.wi-bar.bar-3 { height: 34px; animation-delay: 0.4s; }
.wi-bar.bar-4 { height: 50px; animation-delay: 0.6s; }

@keyframes barGrow {
  0%,100% { transform: scaleY(1); }
  50% { transform: scaleY(0.6); }
}

.text-shimmer {
  background: linear-gradient(90deg, #fff 0%, #fff 40%, var(--accent-light) 50%, #fff 60%, #fff 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: shimmer 3s linear infinite;
}
@keyframes shimmer { to { background-position: -200% center; } }

/* ========== STAT CARDS — Pulse + Floating Animation ========== */
.animated-icon {
  position: relative; overflow: visible;
}
.stat-pulse {
  position: absolute; inset: -4px; border-radius: inherit;
  border: 2px solid currentColor; opacity: 0;
  animation: statPulse 2.5s ease-in-out infinite;
}
@keyframes statPulse {
  0% { transform: scale(1); opacity: 0.5; }
  100% { transform: scale(1.4); opacity: 0; }
}
.stat-card {
  animation: cardFloat 6s ease-in-out infinite;
}
.stat-card:nth-child(1) { animation-delay: 0s; }
.stat-card:nth-child(2) { animation-delay: 1.5s; }
.stat-card:nth-child(3) { animation-delay: 3s; }
.stat-card:nth-child(4) { animation-delay: 4.5s; }
@keyframes cardFloat {
  0%,100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
.stat-card:hover .animated-icon i {
  animation: iconBounce3D 0.6s ease;
}
@keyframes iconBounce3D {
  0% { transform: scale(1) rotateY(0); }
  30% { transform: scale(1.3) rotateY(180deg); }
  60% { transform: scale(0.9) rotateY(360deg); }
  100% { transform: scale(1) rotateY(360deg); }
}

/* ========== MODULE CARDS — 3D Flip Objects + Glow ========== */
.module-3d-scene {
  perspective: 400px;
  position: absolute; top: 10px; left: 10px;
  width: 32px; height: 32px; z-index: 2;
  opacity: 0.25;
}
.module-3d-obj {
  width: 100%; height: 100%;
  transform-style: preserve-3d;
  animation: m3dRotate 8s linear infinite;
}
.m3d-face {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.8rem; color: var(--accent);
  backface-visibility: hidden;
}
.m3d-face.m3d-back { transform: rotateY(180deg); }
@keyframes m3dRotate { to { transform: rotateY(360deg); } }

.module-card-glow {
  position: absolute; bottom: -50%; left: 50%; transform: translateX(-50%);
  width: 80%; height: 50%;
  background: radial-gradient(ellipse, rgba(212,160,23,0.08), transparent 70%);
  opacity: 0; transition: opacity 0.4s ease;
  pointer-events: none;
}
.module-card:hover .module-card-glow { opacity: 1; }

.module-card:hover .module-3d-obj {
  animation-duration: 2s;
}
.module-card:hover .module-3d-scene { opacity: 0.6; }

/* ========== SECTION HERO BANNERS — Motion Graphics ========== */
.section-hero {
  background: linear-gradient(135deg, var(--hero-c1), var(--hero-c2));
  border-radius: var(--radius); padding: 24px 28px;
  margin-bottom: 20px; position: relative; overflow: hidden;
  color: #fff;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
}
.section-hero-bg {
  position: absolute; inset: 0; overflow: hidden; pointer-events: none;
}
.hero-particle {
  position: absolute; width: 6px; height: 6px; border-radius: 50%;
  background: rgba(255,255,255,0.15);
  animation: heroParticle 6s ease-in-out infinite;
}
.hero-particle.hp-1 { top: 20%; left: 10%; animation-delay: 0s; }
.hero-particle.hp-2 { top: 60%; right: 15%; animation-delay: -2s; width: 4px; height: 4px; }
.hero-particle.hp-3 { bottom: 20%; left: 60%; animation-delay: -4s; width: 8px; height: 8px; }

@keyframes heroParticle {
  0%,100% { transform: translate(0, 0) scale(1); opacity: 0.2; }
  25% { transform: translate(40px, -30px) scale(1.5); opacity: 0.7; }
  50% { transform: translate(-20px, -50px) scale(0.8); opacity: 0.4; }
  75% { transform: translate(30px, -10px) scale(1.2); opacity: 0.6; }
}

.hero-wave {
  position: absolute; bottom: -2px; left: 0; right: 0; height: 30px;
  background: var(--bg-main);
  clip-path: polygon(0 60%, 5% 50%, 10% 55%, 15% 45%, 20% 50%, 
    25% 40%, 30% 48%, 35% 38%, 40% 45%, 45% 35%, 50% 42%, 
    55% 32%, 60% 40%, 65% 30%, 70% 38%, 75% 28%, 80% 35%, 
    85% 25%, 90% 32%, 95% 22%, 100% 30%, 100% 100%, 0 100%);
  animation: waveMove 4s ease-in-out infinite alternate;
}
@keyframes waveMove {
  to { clip-path: polygon(0 50%, 5% 40%, 10% 48%, 15% 38%, 20% 45%, 
    25% 35%, 30% 42%, 35% 32%, 40% 40%, 45% 30%, 50% 38%, 
    55% 28%, 60% 36%, 65% 26%, 70% 33%, 75% 23%, 80% 30%, 
    85% 20%, 90% 28%, 95% 18%, 100% 25%, 100% 100%, 0 100%); }
}

.section-hero-content {
  position: relative; z-index: 2; display: flex; align-items: center; gap: 20px;
}
.section-hero-icon-3d {
  position: relative; width: 52px; height: 52px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem;
}
.hero-icon-ring {
  position: absolute; inset: 0; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.2);
  animation: heroRingSpin 4s linear infinite;
}
.hero-icon-ring::before {
  content: ''; position: absolute; top: -3px; left: 50%; width: 6px; height: 6px;
  border-radius: 50%; background: #fff;
  transform: translateX(-50%);
  box-shadow: 0 0 8px rgba(255,255,255,0.6);
}
@keyframes heroRingSpin { to { transform: rotate(360deg); } }

.section-hero-icon-3d > i {
  position: relative; z-index: 1;
  animation: heroIconFloat 3s ease-in-out infinite;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,0.2));
}
@keyframes heroIconFloat {
  0%,100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-4px) scale(1.08); }
}

.section-hero-text h2 {
  font-size: 1.15rem; font-weight: 900; margin-bottom: 2px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.15);
}
.section-hero-text p {
  font-size: 0.78rem; color: rgba(255,255,255,0.65); font-weight: 400;
}

/* ========== CARD ANIMATIONS — Entrance + Hover ========== */
.card {
  animation: cardEntrance 0.5s ease both;
}
@keyframes cardEntrance {
  from { opacity: 0; transform: translateY(16px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.card:hover {
  box-shadow: var(--shadow-md), 0 0 0 1px rgba(212,160,23,0.06);
}

/* ========== CHATBOT — Pulsing Toggle ========== */
.chatbot-toggle-anim {
  position: relative; display: flex; align-items: center; justify-content: center;
}
.chatbot-pulse-ring {
  position: absolute; inset: -6px; border-radius: 50%;
  border: 2px solid var(--accent);
  animation: chatPulse 2s ease-in-out infinite;
}
@keyframes chatPulse {
  0%,100% { transform: scale(1); opacity: 0; }
  50% { transform: scale(1.3); opacity: 0.5; }
}

/* ========== SIDEBAR — Animated Active Indicator ========== */
.nav-item.active::before {
  animation: activeGlow 2s ease-in-out infinite alternate;
}
@keyframes activeGlow {
  from { box-shadow: 0 0 8px rgba(212,160,23,0.4); }
  to   { box-shadow: 0 0 16px rgba(212,160,23,0.7); }
}

/* ========== TABLE ROWS — Staggered Entrance ========== */
tbody tr {
  animation: rowSlide 0.4s ease both;
}
tbody tr:nth-child(1) { animation-delay: 0.05s; }
tbody tr:nth-child(2) { animation-delay: 0.1s; }
tbody tr:nth-child(3) { animation-delay: 0.15s; }
tbody tr:nth-child(4) { animation-delay: 0.2s; }
tbody tr:nth-child(5) { animation-delay: 0.25s; }
@keyframes rowSlide {
  from { opacity: 0; transform: translateX(20px); }
  to   { opacity: 1; transform: translateX(0); }
}

/* ========== TIMELINE — Animated Dots ========== */
.timeline-item::before {
  animation: timelineDotPulse 3s ease-in-out infinite;
}
@keyframes timelineDotPulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(212,160,23,0.3); }
  50% { box-shadow: 0 0 0 6px rgba(212,160,23,0); }
}

/* ========== NOTIFICATION ITEMS — Slide In ========== */
.notification-item {
  animation: notifSlide 0.5s ease both;
}
.notification-item:nth-child(1) { animation-delay: 0.1s; }
.notification-item:nth-child(2) { animation-delay: 0.2s; }
.notification-item:nth-child(3) { animation-delay: 0.3s; }
@keyframes notifSlide {
  from { opacity: 0; transform: translateX(30px); }
  to   { opacity: 1; transform: translateX(0); }
}

/* ========== WIZARD PROGRESS — Animated Steps ========== */
.wizard-dot.active {
  animation: wizardPulse 1.5s ease-in-out infinite;
}
@keyframes wizardPulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(212,160,23,0.4); }
  50% { box-shadow: 0 0 0 8px rgba(212,160,23,0); }
}

/* ========== REPORT ITEMS — Hover 3D Tilt ========== */
.report-item {
  transition: var(--transition);
}
.report-item:hover {
  transform: perspective(600px) rotateY(-2deg) translateX(-4px);
  box-shadow: 4px 4px 20px rgba(0,0,0,0.06);
}

/* ========== PROVINCE CARDS — 3D Hover ========== */
.province-card {
  transition: var(--transition);
  transform-style: preserve-3d;
}
.province-card:hover {
  transform: translateY(-6px) perspective(800px) rotateX(2deg) rotateY(-2deg);
}

/* ========== PACKAGE CARDS — Shine Effect ========== */
.package-card::before {
  content: ''; position: absolute; top: 0; left: -75%;
  width: 50%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
  transform: skewX(-25deg);
  transition: 0.8s ease;
  z-index: 5; pointer-events: none;
}
.package-card:hover::before { left: 125%; }

/* ========== BUTTONS — Ripple + Hover Scale ========== */
.btn { position: relative; overflow: hidden; }
.btn::after {
  content: ''; position: absolute; top: 50%; left: 50%;
  width: 0; height: 0; border-radius: 50%;
  background: rgba(255,255,255,0.2);
  transform: translate(-50%, -50%);
  transition: width 0.5s ease, height 0.5s ease;
}
.btn:active::after { width: 200px; height: 200px; }

/* ========== SEARCH MODAL — Backdrop Blur Entrance ========== */
.search-modal.open {
  animation: modalBlurIn 0.3s ease;
}
@keyframes modalBlurIn {
  from { backdrop-filter: blur(0); opacity: 0; }
  to   { backdrop-filter: blur(8px); opacity: 1; }
}

/* ========== TOAST — Slide + Bounce In ========== */
.toast.show {
  animation: toastBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes toastBounce {
  from { transform: translateX(120%); opacity: 0; }
  to   { transform: translateX(0); opacity: 1; }
}

/* ========== CHIP SELECTION — Pop Effect ========== */
.chip.active {
  animation: chipPop 0.3s ease;
}
@keyframes chipPop {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

/* ========== STATUS BADGES — Glow Animations ========== */
.status-badge.pending { animation: pendingGlow 2s ease-in-out infinite; }
@keyframes pendingGlow {
  0%,100% { box-shadow: 0 0 0 0 rgba(217,119,6,0.3); }
  50% { box-shadow: 0 0 8px 2px rgba(217,119,6,0.15); }
}
.status-badge.approved { animation: approvedGlow 2s ease-in-out infinite; }
@keyframes approvedGlow {
  0%,100% { box-shadow: 0 0 0 0 rgba(5,150,105,0.3); }
  50% { box-shadow: 0 0 8px 2px rgba(5,150,105,0.15); }
}

/* ========== CALENDAR CELLS — Hover Lift ========== */
.calendar-cell.has-event {
  animation: calEventPulse 3s ease-in-out infinite;
}
@keyframes calEventPulse {
  0%,100% { box-shadow: inset 0 0 0 0 rgba(212,160,23,0.1); }
  50% { box-shadow: inset 0 0 8px 0 rgba(212,160,23,0.2); }
}

/* ========== SETTINGS — Toggle Switch Animation ========== */
.switch-slider::before {
  transition: var(--transition-bounce);
}

/* ========== DARK MODE — Enhanced Animations ========== */
[data-theme="dark"] .splash-cube .cube-face {
  background: rgba(212,160,23,0.03); border-color: rgba(212,160,23,0.1);
}
[data-theme="dark"] .section-hero { box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
[data-theme="dark"] .hero-wave { background: var(--bg-main); }
[data-theme="dark"] .module-card-glow {
  background: radial-gradient(ellipse, rgba(212,160,23,0.05), transparent 70%);
}
[data-theme="dark"] .auth-float-icon {
  background: rgba(212,160,23,0.03); border-color: rgba(212,160,23,0.06);
  color: rgba(212,160,23,0.15);
}

/* ========== RESPONSIVE — Disable Heavy Animations on Mobile ========== */
@media (max-width: 768px) {
  .splash-3d-scene { display: none; }
  .welcome-orbit { display: none; }
  .welcome-illustration { display: none; }
  .module-3d-scene { display: none; }
  .auth-floating-icons { display: none; }
  .hero-particle { display: none; }
  .hero-wave { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}

'''

# Insert before PRINT section
print_marker = '/* ========== PRINT =========='
assert print_marker in css, 'Print marker not found'
css = css.replace(print_marker, animation_css + '\n' + print_marker, 1)
print('CSS: All animation styles added')

with open(os.path.join(BASE, 'css', 'style.css'), 'w', encoding='utf-8') as f:
    f.write(css)
print('CSS saved!')

# ===================== JS: Add Splash Particles + Page Transition Effects =====================
js_additions = '''

// ========== SPLASH PARTICLES GENERATOR ==========
function createSplashParticles() {
  var container = document.getElementById('splashParticles');
  if (!container) return;
  for (var i = 0; i < 30; i++) {
    var p = document.createElement('div');
    p.className = 'splash-particle-dot';
    p.style.cssText = 'position:absolute;width:' + (2 + Math.random()*4) + 'px;height:' + (2 + Math.random()*4) + 'px;' +
      'border-radius:50%;background:rgba(212,160,23,' + (0.1 + Math.random()*0.3) + ');' +
      'left:' + (Math.random()*100) + '%;top:' + (Math.random()*100) + '%;' +
      'animation:particleDrift ' + (4 + Math.random()*8) + 's ease-in-out infinite;' +
      'animation-delay:-' + (Math.random()*5) + 's;';
    container.appendChild(p);
  }
}

// ========== PAGE TRANSITION ANIMATION ==========
function animatePageTransition(page) {
  var section = document.getElementById('page-' + page);
  if (!section) return;
  // Animate all cards with staggered delay
  var cards = section.querySelectorAll('.card, .stat-card, .module-card, .province-card');
  cards.forEach(function(card, i) {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    setTimeout(function() {
      card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, 50 + i * 60);
  });
  // Animate hero banner
  var hero = section.querySelector('.section-hero');
  if (hero) {
    hero.style.opacity = '0';
    hero.style.transform = 'translateY(-10px) scale(0.98)';
    setTimeout(function() {
      hero.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      hero.style.opacity = '1';
      hero.style.transform = 'translateY(0) scale(1)';
    }, 30);
  }
}

// ========== 3D TILT EFFECT ON MODULE CARDS ==========
function init3DTilt() {
  document.querySelectorAll('.module-card').forEach(function(card) {
    card.addEventListener('mousemove', function(e) {
      var rect = card.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      var centerX = rect.width / 2;
      var centerY = rect.height / 2;
      var rotateX = (y - centerY) / centerY * -6;
      var rotateY = (x - centerX) / centerX * 6;
      card.style.transform = 'perspective(600px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateY(-8px)';
    });
    card.addEventListener('mouseleave', function() {
      card.style.transform = 'perspective(600px) rotateX(0) rotateY(0) translateY(0)';
    });
  });
}

// ========== ANIMATED NUMBER COUNTER (Enhanced) ==========
function animateValue(el, start, end, duration) {
  var startTime = null;
  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    var progress = Math.min((timestamp - startTime) / duration, 1);
    var eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    var val = Math.floor(start + (end - start) * eased);
    el.textContent = val.toLocaleString('ar-IQ');
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ========== INTERSECTION OBSERVER FOR SCROLL ANIMATIONS ==========
function initScrollAnimations() {
  if (!('IntersectionObserver' in window)) return;
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('scroll-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.card, .stat-card, .module-card, .province-card, .section-hero').forEach(function(el) {
    el.classList.add('scroll-animate');
    observer.observe(el);
  });
}

'''

# Add CSS for particles drift and scroll animations
particle_css = '''
/* Particle drift for splash */
@keyframes particleDrift {
  0%,100% { transform: translate(0, 0); }
  25% { transform: translate(30px, -40px); }
  50% { transform: translate(-20px, -60px); }
  75% { transform: translate(40px, -20px); }
}
/* Scroll animation classes */
.scroll-animate { opacity: 0; transform: translateY(16px); transition: opacity 0.6s ease, transform 0.6s ease; }
.scroll-animate.scroll-visible { opacity: 1; transform: translateY(0); }
'''

# Append particle CSS to the animation section
css_file = open(os.path.join(BASE, 'css', 'style.css'), 'r', encoding='utf-8').read()
css_file = css_file.replace('@media (prefers-reduced-motion: reduce) {', particle_css + '\n@media (prefers-reduced-motion: reduce) {', 1)
with open(os.path.join(BASE, 'css', 'style.css'), 'w', encoding='utf-8') as f:
    f.write(css_file)
print('CSS: Particle + scroll animation CSS added')

# Insert JS additions before DOMContentLoaded
assert 'document.addEventListener(\'DOMContentLoaded\'' in js, 'DOMContentLoaded not found'
js = js.replace('document.addEventListener(\'DOMContentLoaded\'', js_additions + '\ndocument.addEventListener(\'DOMContentLoaded\'', 1)
print('JS: Animation functions added')

# Add initialization calls in DOMContentLoaded
old_init = '  // Initialize draggable widgets\n  setTimeout(initDraggableWidgets, 500);'
new_init = '''  // Initialize draggable widgets
  setTimeout(initDraggableWidgets, 500);

  // Initialize motion graphics & 3D animations
  createSplashParticles();
  setTimeout(init3DTilt, 800);
  setTimeout(initScrollAnimations, 1000);'''
js = js.replace(old_init, new_init, 1)
print('JS: Animation initializers added to DOMContentLoaded')

# Add page transition to navigateTo
old_nav_refresh = "  if (page === 'calendar') renderCalendar();"
new_nav_refresh = """  if (page === 'calendar') renderCalendar();
  animatePageTransition(page);"""
js = js.replace(old_nav_refresh, new_nav_refresh, 1)
print('JS: Page transition animation added to navigateTo')

with open(os.path.join(BASE, 'js', 'app.js'), 'w', encoding='utf-8') as f:
    f.write(js)
print('JS saved!')

print('\n=== ALL ANIMATION FILES UPDATED ===')
print(f'HTML: {len(html):,} chars')
print(f'CSS: {len(css_file):,} chars')
print(f'JS: {len(js):,} chars')
