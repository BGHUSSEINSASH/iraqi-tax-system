
// --- Live Number Formatting ---
document.addEventListener('input', function(e) {
  if (e.target && e.target.classList.contains('money-input')) {
    var raw = e.target.value.replace(/,/g, '').replace(/\D/g, '');
    if (raw !== '') {
      var num = parseInt(raw, 10);
      e.target.value = num.toLocaleString('en-US');
    } else {
      e.target.value = '';
    }
  }
});

/* ============================================
   Iraqi Tax System — App Logic v3.0
   ============================================ */

// ========== DEMO USER ACCOUNTS ==========

// ========== PACKAGE SYSTEM ==========
var PACKAGES = {
  basic: {
    name: 'تأسيس',
    icon: 'fa-seedling',
    pages: ['dashboard','corporate','profession','notifications','packages']
  },
  professional: {
    name: 'المهني',
    icon: 'fa-rocket',
    pages: ['dashboard','corporate','profession','notifications','settings','packages']
  },
  enterprise: {
    name: 'الشاملة',
    icon: 'fa-building',
    pages: ['dashboard','corporate','profession','notifications','settings','packages']
  }
};

function getUserPackage() {
  var session = JSON.parse(localStorage.getItem('taxSession') || sessionStorage.getItem('taxSession') || 'null');
  if (!session) return 'basic';
  if (session.role === 'مدير النظام') return 'enterprise';
  return session.package || localStorage.getItem('userPackage_' + session.username) || 'basic';
}

function setUserPackage(pkg) {
  var session = JSON.parse(localStorage.getItem('taxSession') || sessionStorage.getItem('taxSession') || 'null');
  if (session) {
    session.package = pkg;
    localStorage.setItem('userPackage_' + session.username, pkg);
    if (localStorage.getItem('taxSession')) localStorage.setItem('taxSession', JSON.stringify(session));
    if (sessionStorage.getItem('taxSession')) sessionStorage.setItem('taxSession', JSON.stringify(session));
  }
  localStorage.setItem('selectedPackage', pkg);
}

function canAccessPage(page) {
  var pkg = getUserPackage();
  var allowed = PACKAGES[pkg] ? PACKAGES[pkg].pages : PACKAGES.basic.pages;
  return allowed.indexOf(page) !== -1;
}

function isAdmin() {
  var session = JSON.parse(localStorage.getItem('taxSession') || sessionStorage.getItem('taxSession') || 'null');
  return !!session && session.role === 'مدير النظام';
}

function updateSidebarLocks() {
  document.querySelectorAll('.nav-item[data-page]').forEach(function(item) {
    var page = item.getAttribute('data-page');
    if (!canAccessPage(page)) {
      item.classList.add('locked');
    } else {
      item.classList.remove('locked');
    }
  });
  var badge = document.getElementById('sidebarPackageBadge');
  if (badge) {
    var pkg = getUserPackage();
    var info = PACKAGES[pkg] || PACKAGES.basic;
    badge.className = 'sidebar-package-badge ' + pkg;
    badge.innerHTML = '<i class="fas ' + info.icon + '"></i> ' + info.name;
  }
}

function updateModuleCardLocks() {
  var modulePages = {corporate:'corporate',profession:'profession'};
  document.querySelectorAll('.module-card').forEach(function(card) {
    var cls = card.className.split(' ');
    for (var c of cls) {
      if (modulePages[c] && !canAccessPage(modulePages[c])) {
        card.classList.add('locked');
      } else if (modulePages[c]) {
        card.classList.remove('locked');
      }
    }
  });
}

function selectPackage(pkg) {
  setUserPackage(pkg);
  document.getElementById('packagesScreen').style.display = 'none';
  document.getElementById('appContainer').style.display = 'flex';
  updateSidebarLocks();
  updateModuleCardLocks();
  renderPackagesPage();
  showToast('تم اختيار ' + PACKAGES[pkg].name + ' بنجاح');
  addAuditEntry('اختيار باقة', PACKAGES[pkg].name);
}

function renderPackagesPage() {
  var currentPkg = getUserPackage();
  var info = PACKAGES[currentPkg] || PACKAGES.basic;
  var infoDiv = document.getElementById('currentPackageInfo');
  if (infoDiv) {
    infoDiv.innerHTML = '<div><h3><i class="fas ' + info.icon + '"></i> باقتك الحالية: ' + info.name + '</h3><p>يمكنك الترقية في أي وقت للحصول على ميزات إضافية</p></div>' +
      (currentPkg !== 'enterprise' ? '<button class="btn btn-warning" onclick="showUpgradePackages()"><i class="fas fa-arrow-up"></i> ترقية الباقة</button>' : '<span style="color:rgba(255,255,255,0.6);">أعلى باقة</span>');
  }
  var grid = document.getElementById('packagesGridInline');
  if (grid) {
    grid.innerHTML = '';
    ['basic','professional','enterprise'].forEach(function(pk) {
      var p = PACKAGES[pk];
      var isCurrent = pk === currentPkg;
      grid.innerHTML += '<div class="package-card' + (isCurrent ? ' featured' : '') + '" style="padding:24px;cursor:' + (isCurrent ? 'default' : 'pointer') + ';" ' + (!isCurrent ? 'onclick="selectPackage(\'' + pk + '\')"' : '') + '>' +
        '<div class="package-icon ' + (pk === 'basic' ? 'basic' : pk === 'professional' ? 'pro' : 'ent') + '-icon"><i class="fas ' + p.icon + '"></i></div>' +
        '<h3>' + p.name + '</h3>' +
        '<p style="font-size:0.82rem;color:var(--text-muted);">' + p.pages.length + ' صفحة متاحة</p>' +
        (isCurrent ? '<div style="margin-top:12px;padding:8px 16px;background:var(--success);color:#fff;border-radius:20px;font-size:0.8rem;font-weight:700;">الباقة الحالية</div>' : '<div style="margin-top:12px;padding:8px 16px;border:2px solid var(--border);border-radius:20px;font-size:0.8rem;font-weight:600;color:var(--text-secondary);">اختيار هذه الباقة</div>') +
        '</div>';
    });
  }
}

function showUpgradePackages() {
  document.getElementById('appContainer').style.display = 'none';
  document.getElementById('packagesScreen').style.display = 'flex';
}

// ========== REGISTRATION SYSTEM ==========
function getAllUsers() {
  var defaults = {
    admin: { password: 'admin123', name: 'مدير النظام', role: 'مدير النظام', avatar: 'م', package: 'enterprise' },
    accountant: { password: '123456', name: 'محمد أحمد', role: 'محاسب ضريبي', avatar: 'م', package: 'professional' }
  };
  var registered = JSON.parse(localStorage.getItem('registeredUsers') || '{}');
  return Object.assign({}, defaults, registered);
}

function switchAuthTab(tab) {
  document.getElementById('authLoginForm').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('authRegisterForm').style.display = tab === 'register' ? 'block' : 'none';
  document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
  document.getElementById('tabRegister').classList.toggle('active', tab === 'register');
}

function handleRegister(e) {
  e.preventDefault();
  var fullName = document.getElementById('regFullName').value.trim();
  var email = document.getElementById('regEmail').value.trim();
  var phone = document.getElementById('regPhone').value.trim();
  var province = document.getElementById('regProvince').value;
  var username = document.getElementById('regUsername').value.trim();
  var password = document.getElementById('regPassword').value;
  var confirm = document.getElementById('regPasswordConfirm').value;
  var errorEl = document.getElementById('registerError');
  var errorMsg = document.getElementById('registerErrorMsg');
  errorEl.style.display = 'none';

  if (!fullName || !email || !phone || !province || !username || !password) {
    errorMsg.textContent = 'يرجى ملء جميع الحقول';
    errorEl.style.display = 'flex'; return;
  }
  if (username.length < 3) {
    errorMsg.textContent = 'اسم المستخدم يجب أن يكون ٣ أحرف على الأقل';
    errorEl.style.display = 'flex'; return;
  }
  if (password.length < 6) {
    errorMsg.textContent = 'كلمة المرور يجب أن تكون ٦ أحرف على الأقل';
    errorEl.style.display = 'flex'; return;
  }
  if (password !== confirm) {
    errorMsg.textContent = 'كلمة المرور وتأكيدها غير متطابقين';
    errorEl.style.display = 'flex'; return;
  }
  var allUsers = getAllUsers();
  if (allUsers[username]) {
    errorMsg.textContent = 'اسم المستخدم مستخدم مسبقاً، اختر اسماً آخر';
    errorEl.style.display = 'flex'; return;
  }

  var registered = JSON.parse(localStorage.getItem('registeredUsers') || '{}');
  registered[username] = {
    password: password, name: fullName, role: 'مستخدم',
    avatar: fullName.charAt(0), email: email, phone: phone,
    province: province, package: 'basic', active: true, createdAt: new Date().toISOString()
  };
  localStorage.setItem('registeredUsers', JSON.stringify(registered));

  var session = { username: username, name: fullName, role: 'مستخدم', avatar: fullName.charAt(0), package: 'basic' };
  localStorage.setItem('taxSession', JSON.stringify(session));

  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('packagesScreen').style.display = 'flex';

  showToast('تم إنشاء الحساب بنجاح! اختر باقتك الآن');
}

// ========== ALL 18 IRAQI PROVINCES DATA ==========
var ALL_PROVINCES = {
  baghdad: { name: 'بغداد', icon: 'fa-mosque', population: '٨.١ مليون', districts: ['الكرخ','الرصافة','الأعظمية','الكاظمية','المنصور','الكرادة','المدائن','أبو غريب','الطارمية'], prices: { residential: 500000, commercial: 1200000, agricultural: 100000, industrial: 800000 } },
  basra: { name: 'البصرة', icon: 'fa-ship', population: '٢.٩ مليون', districts: ['مركز البصرة','الفاو','أبو الخصيب','شط العرب','القرنة','الزبير'], prices: { residential: 300000, commercial: 800000, agricultural: 80000, industrial: 600000 } },
  nineveh: { name: 'نينوى', icon: 'fa-landmark', population: '٣.٧ مليون', districts: ['مركز الموصل','تلكيف','الحمدانية','سنجار','تلعفر'], prices: { residential: 200000, commercial: 500000, agricultural: 60000, industrial: 400000 } },
  erbil: { name: 'أربيل', icon: 'fa-city', population: '١.٩ مليون', districts: ['مركز أربيل','شقلاوة','سوران','ميركه سور'], prices: { residential: 400000, commercial: 1000000, agricultural: 90000, industrial: 700000 } },
  najaf: { name: 'النجف', icon: 'fa-mosque', population: '١.٥ مليون', districts: ['مركز النجف','الكوفة','المناذرة'], prices: { residential: 350000, commercial: 900000, agricultural: 70000, industrial: 500000 } },
  karbala: { name: 'كربلاء', icon: 'fa-mosque', population: '١.٢ مليون', districts: ['مركز كربلاء','الهندية','عين التمر'], prices: { residential: 350000, commercial: 900000, agricultural: 75000, industrial: 550000 } },
  kirkuk: { name: 'كركوك', icon: 'fa-oil-can', population: '١.٦ مليون', districts: ['مركز كركوك','الحويجة','داقوق','دبس'], prices: { residential: 250000, commercial: 600000, agricultural: 65000, industrial: 450000 } },
  sulaymaniyah: { name: 'السليمانية', icon: 'fa-mountain', population: '٢.١ مليون', districts: ['مركز السليمانية','حلبجة','رانية','دوكان','بنجوين'], prices: { residential: 300000, commercial: 750000, agricultural: 70000, industrial: 500000 } },
  dhiqar: { name: 'ذي قار', icon: 'fa-water', population: '٢.١ مليون', districts: ['الناصرية','الرفاعي','الشطرة','سوق الشيوخ','الجبايش'], prices: { residential: 180000, commercial: 400000, agricultural: 50000, industrial: 300000 } },
  babel: { name: 'بابل', icon: 'fa-monument', population: '٢.٠ مليون', districts: ['الحلة','المحاويل','المسيب','الهاشمية','القاسم'], prices: { residential: 220000, commercial: 500000, agricultural: 55000, industrial: 350000 } },
  diyala: { name: 'ديالى', icon: 'fa-tree', population: '١.٧ مليون', districts: ['بعقوبة','المقدادية','خانقين','بلدروز','الخالص'], prices: { residential: 190000, commercial: 420000, agricultural: 50000, industrial: 320000 } },
  anbar: { name: 'الأنبار', icon: 'fa-desert', population: '١.٨ مليون', districts: ['الرمادي','الفلوجة','هيت','حديثة','القائم','عنه','راوه'], prices: { residential: 170000, commercial: 380000, agricultural: 45000, industrial: 280000 } },
  wasit: { name: 'واسط', icon: 'fa-seedling', population: '١.٤ مليون', districts: ['الكوت','النعمانية','الحي','بدرة','الصويرة'], prices: { residential: 170000, commercial: 380000, agricultural: 48000, industrial: 290000 } },
  maysan: { name: 'ميسان', icon: 'fa-water', population: '١.١ مليون', districts: ['العمارة','المجر الكبير','علي الغربي','قلعة صالح'], prices: { residential: 160000, commercial: 350000, agricultural: 42000, industrial: 270000 } },
  muthanna: { name: 'المثنى', icon: 'fa-sun', population: '٠.٨ مليون', districts: ['السماوة','الرميثة','الخضر','السلمان'], prices: { residential: 150000, commercial: 320000, agricultural: 40000, industrial: 250000 } },
  qadisiyyah: { name: 'القادسية', icon: 'fa-wheat-awn', population: '١.٣ مليون', districts: ['الديوانية','عفك','الشامية','الحمزة'], prices: { residential: 160000, commercial: 350000, agricultural: 45000, industrial: 260000 } },
  saladin: { name: 'صلاح الدين', icon: 'fa-fort-awesome', population: '١.٦ مليون', districts: ['تكريت','سامراء','بلد','الدور','الشرقاط','بيجي'], prices: { residential: 180000, commercial: 400000, agricultural: 48000, industrial: 300000 } },
  duhok: { name: 'دهوك', icon: 'fa-mountain', population: '١.٣ مليون', districts: ['مركز دهوك','زاخو','العمادية','سيميل','بردرش'], prices: { residential: 280000, commercial: 650000, agricultural: 65000, industrial: 450000 } }
};

function renderProvincesPage() {
  var grid = document.getElementById('provincesGrid');
  if (!grid) return;
  grid.innerHTML = '';
  Object.keys(ALL_PROVINCES).forEach(function(key) {
    var p = ALL_PROVINCES[key];
    grid.innerHTML += '<div class="province-card" onclick="selectProvinceFromPage(\'' + key + '\')">' +
      '<div class="province-card-icon"><i class="fas ' + p.icon + '"></i></div>' +
      '<h4>' + p.name + '</h4>' +
      '<p><i class="fas fa-users" style="margin-left:4px;"></i> ' + p.population + '</p>' +
      '<p><i class="fas fa-map-pin" style="margin-left:4px;"></i> ' + p.districts.length + ' قضاء/ناحية</p>' +
      '<div class="province-stats">' +
        '<div class="province-stat"><strong>' + (p.prices.residential/1000) + 'K</strong><span>سكني</span></div>' +
        '<div class="province-stat"><strong>' + (p.prices.commercial/1000) + 'K</strong><span>تجاري</span></div>' +
        '<div class="province-stat"><strong>' + (p.prices.agricultural/1000) + 'K</strong><span>زراعي</span></div>' +
      '</div></div>';
  });
}

function selectProvinceFromPage(province) {
  selectProvince(province);
}


const USERS = {
  admin: { password: 'admin123', name: 'مدير النظام', role: 'مدير النظام', avatar: 'م' },
  accountant: { password: '123456', name: 'محمد أحمد', role: 'محاسب ضريبي', avatar: 'م' }
};

// ========== LOGIN SYSTEM ==========
function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errorEl = document.getElementById('loginError');
  const errorMsg = document.getElementById('loginErrorMsg');
  const btn = document.getElementById('loginBtn');

  if (!username || !password) {
    errorMsg.textContent = 'يرجى إدخال اسم المستخدم وكلمة المرور';
    errorEl.style.display = 'flex';
    return;
  }

  // Show loading
  btn.querySelector('.login-btn-text').style.display = 'none';
  btn.querySelector('.login-btn-loading').style.display = 'inline-flex';
  btn.disabled = true;
  errorEl.style.display = 'none';

  setTimeout(function() {
    var allUsers = getAllUsers();
    var user = allUsers[username];
    if (user && user.password === password) {
      const remember = document.getElementById('rememberMe').checked;
      const session = { username: username, name: user.name, role: user.role, avatar: user.avatar, package: user.package || 'basic' };
      if (remember) {
        localStorage.setItem('taxSession', JSON.stringify(session));
      } else {
        sessionStorage.setItem('taxSession', JSON.stringify(session));
      }
      showApp(session);
    } else {
      errorMsg.textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة';
      errorEl.style.display = 'flex';
    }
    btn.querySelector('.login-btn-text').style.display = 'inline';
    btn.querySelector('.login-btn-loading').style.display = 'none';
    btn.disabled = false;
  }, 800);
}

function togglePassword() {
  const input = document.getElementById('loginPassword');
  const icon = document.getElementById('passwordIcon');
  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'fas fa-eye-slash';
  } else {
    input.type = 'password';
    icon.className = 'fas fa-eye';
  }
}

function fillDemo(user, pass) {
  document.getElementById('loginUsername').value = user;
  document.getElementById('loginPassword').value = pass;
}

function showApp(session) {
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('packagesScreen').style.display = 'none';
  document.getElementById('appContainer').style.display = 'flex';
  // Update user info
  document.getElementById('userDisplayName').textContent = session.name;
  document.getElementById('userRole').textContent = session.role;
  document.getElementById('userAvatar').textContent = session.avatar;
  document.getElementById('headerAvatar').textContent = session.avatar;
  document.getElementById('welcomeName').textContent = session.name.split(' ')[0];
  // Sync stored users into USERS
  var stored = localStorage.getItem('taxUsers');
  if (stored) { var u = JSON.parse(stored); Object.keys(u).forEach(function(k) { USERS[k] = u[k]; }); }
  // Update package UI
  setTimeout(function() { updateSidebarLocks(); updateModuleCardLocks(); renderPackagesPage();  }, 100);
}

function handleLogout() {
  localStorage.removeItem('taxSession');
  sessionStorage.removeItem('taxSession');
  document.getElementById('authScreen').style.display = 'flex';
  document.getElementById('appContainer').style.display = 'none';
  document.getElementById('packagesScreen').style.display = 'none';
  document.getElementById('loginForm').reset();
  document.getElementById('loginError').style.display = 'none';
}

function checkSession() {
  const session = JSON.parse(localStorage.getItem('taxSession') || sessionStorage.getItem('taxSession') || 'null');
  if (session) {
    showApp(session);
  } else {
    document.getElementById('authScreen').style.display = 'flex';
  }
}

// ========== ANIMATED COUNTERS ==========
function animateCounters() {
  document.querySelectorAll('.counter').forEach(function(el) {
    var target = parseInt(el.getAttribute('data-target'));
    if (!target || el.dataset.animated === 'true') return;
    el.dataset.animated = 'true';
    var duration = 2000;
    var start = 0;
    var startTime = null;
    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = Math.floor(eased * target);
      el.textContent = current.toLocaleString('ar-IQ');
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}

// ========== RIPPLE EFFECT ==========
function addRipple(e) {
  var btn = e.currentTarget;
  var rect = btn.getBoundingClientRect();
  var ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.left = (e.clientX - rect.left) + 'px';
  ripple.style.top = (e.clientY - rect.top) + 'px';
  btn.appendChild(ripple);
  setTimeout(function() { ripple.remove(); }, 600);
}
function initRippleEffect() {
  document.querySelectorAll('.btn, .nav-item, .module-card, .header-btn').forEach(function(el) {
    el.style.position = 'relative';
    el.style.overflow = 'hidden';
    el.removeEventListener('click', addRipple);
    el.addEventListener('click', addRipple);
  });
}

// ========== TOP PROGRESS BAR ==========
function showProgressBar() {
  var bar = document.getElementById('progressBar');
  if (!bar) return;
  bar.style.width = '0%';
  bar.style.opacity = '1';
  bar.style.transition = 'none';
  requestAnimationFrame(function() {
    bar.style.transition = 'width 0.4s ease';
    bar.style.width = '70%';
    setTimeout(function() {
      bar.style.transition = 'width 0.3s ease';
      bar.style.width = '100%';
      setTimeout(function() {
        bar.style.transition = 'opacity 0.3s ease';
        bar.style.opacity = '0';
      }, 200);
    }, 300);
  });
}

// ========== NAVIGATION ==========
const pageTitles = {
  dashboard: 'لوحة التحكم', corporate: 'ضريبة الشركات', land: 'ضريبة العرصات',
  property: 'ضريبة العقار', profession: 'ضريبة المهنة', sales: 'ضريبة المبيعات',
  reports: 'التقارير والتحليلات', documents: 'المستندات', notifications: 'الإشعارات',
  penalties: 'حاسبة الغرامات', comparison: 'مقارنة الضرائب', calendar: 'التقويم الضريبي',
  audit: 'سجل العمليات', users: 'إدارة المستخدمين', settings: 'الإعدادات',
  contact: 'تواصل معنا — الحسابات الختامية'
};
const breadcrumbs = {
  dashboard: 'الرئيسية', corporate: 'الرئيسية / الضرائب / الشركات',
  land: 'الرئيسية / الضرائب / العرصات', property: 'الرئيسية / الضرائب / العقار',
  profession: 'الرئيسية / الضرائب / المهنة', sales: 'الرئيسية / الضرائب / المبيعات',
  reports: 'الرئيسية / التقارير', documents: 'الرئيسية / المستندات', notifications: 'الرئيسية / الإشعارات',
  penalties: 'الرئيسية / أدوات / الغرامات', comparison: 'الرئيسية / أدوات / المقارنة',
  calendar: 'الرئيسية / أدوات / التقويم', audit: 'الرئيسية / إدارة / سجل العمليات',
  users: 'الرئيسية / إدارة / المستخدمين', settings: 'الرئيسية / الإعدادات',
  contact: 'الرئيسية / تواصل معنا'
};

function navigateTo(page) {
  if (!canAccessPage(page)) {
    showToast('هذه الميزة غير متوفرة في باقتك الحالية. يرجى الترقية.', true);
    return;
  }
  showProgressBar();
  document.querySelectorAll('.page-section').forEach(function(s) { s.classList.remove('active'); });
  var target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
  var navItem = document.querySelector('.nav-item[data-page="' + page + '"]');
  if (navItem) navItem.classList.add('active');
  document.getElementById('page-title').textContent = pageTitles[page] || page;
  document.getElementById('breadcrumb').textContent = breadcrumbs[page] || '';
  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
  window.scrollTo({ top: 0, behavior: 'instant' });
  var mc = document.querySelector('.main-content');
  if (mc) mc.scrollTo({ top: 0, behavior: 'instant' });
  var pc = document.querySelector('.page-content');
  if (pc) pc.scrollTo({ top: 0, behavior: 'instant' });
  // Refresh dynamic pages
  if (page === 'users') renderUsersTable();
  if (page === 'audit') renderAuditLog();
  if (page === 'calendar') renderCalendar();
  animatePageTransition(page);
  if (page === 'packages') renderPackagesPage();
  if (page === 'provinces') 
  if (page === 'dashboard') setTimeout(animateCounters, 300);
  if (page === 'invoices') renderInvoices();
  if (page === 'taxpayers') renderTaxpayers();
  if (page === 'attachments') renderAttachments();
  if (page === 'heatmap') renderHeatmap();
  if (page === 'kpi') renderKPI();
  if (page === 'reportbuilder') initReportBuilder();
  if (page === 'workflow') renderWorkflow();
  if (page === 'tickets') renderTickets();
  if (page === 'appointments') renderAppointments();
  if (page === 'esignature') renderESignature();
  if (page === 'tasks') renderTasks();
  if (page === 'loginhistory') renderLoginHistory();
  if (page === 'backup') renderBackups();
  if (page === 'api') renderApiDashboard();
  // Re-init AOS
  if (typeof AOS !== 'undefined') AOS.refresh();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('show');
}

function switchTab(event, tabId) {
  var container = event.target.closest('.page-section');
  container.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
  container.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
  event.target.classList.add('active');
  var panel = document.getElementById(tabId);
  if (panel) panel.classList.add('active');
}

// ========== UTILITIES ==========
function formatNumber(num) {
  if (isNaN(num) || num === null) return '0';
  return Number(num).toLocaleString('en-US');
}
function fmtMoney(v) { return formatNumber(Math.round(Number(v) || 0)); }
function parseArabicNumber(str) {
  if (!str) return 0;
  var val = String(str).replace(/[٠-٩]/g, function(d) { return d.charCodeAt(0) - 1632; })
    .replace(/[۰-۹]/g, function(d) { return d.charCodeAt(0) - 1776; })
    .replace(/,/g, '').replace(/٬/g, '');
  return parseFloat(val) || 0;
}
function getVal(id) { return parseArabicNumber(document.getElementById(id).value); }
function setText(id, text) { document.getElementById(id).textContent = text; }
function setVal(id, value) { document.getElementById(id).value = value; }

// ========== TOAST ==========
function showToast(message, isError) {
  var toast = document.getElementById('toast');
  var msg = document.getElementById('toastMsg');
  msg.textContent = message;
  toast.querySelector('i').className = isError ? 'fas fa-exclamation-circle' : 'fas fa-check-circle';
  toast.className = 'toast show' + (isError ? ' error' : '');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(function() { toast.className = 'toast'; }, 3500);
}

function triggerUpload() { document.getElementById('fileInput') && document.getElementById('fileInput').click(); }

// ========== BILLING TOGGLE (PACKAGES) ==========
function toggleBillingCycle() {
  var isYearly = document.getElementById('pkgBillingToggle').checked;
  document.querySelectorAll('.package-price .price-amount').forEach(function(el) {
    var monthly = el.getAttribute('data-monthly');
    var yearly = el.getAttribute('data-yearly');
    if (monthly && yearly) el.textContent = isYearly ? yearly : monthly;
  });
  document.querySelectorAll('.package-price .price-period').forEach(function(el) {
    var monthly = el.getAttribute('data-monthly');
    var yearly = el.getAttribute('data-yearly');
    if (monthly && yearly) el.textContent = isYearly ? yearly : monthly;
  });
  var mLabel = document.getElementById('pkgMonthlyLabel');
  var yLabel = document.getElementById('pkgYearlyLabel');
  if (mLabel) mLabel.style.fontWeight = isYearly ? '400' : '700';
  if (yLabel) yLabel.style.fontWeight = isYearly ? '700' : '400';
}

// ========== CONTACT FORM ==========
function submitContactForm() {
  var name = document.getElementById('contactName').value.trim();
  var phone = document.getElementById('contactPhone').value.trim();
  var email = document.getElementById('contactEmail').value.trim();
  var service = document.getElementById('contactService').value;
  var details = document.getElementById('contactDetails').value.trim();
  if (!name) { showToast('يرجى إدخال اسم الشركة أو المكلف', true); return; }
  if (!phone) { showToast('يرجى إدخال رقم الهاتف', true); return; }
  if (!service) { showToast('يرجى اختيار نوع الخدمة المطلوبة', true); return; }
  var requests = JSON.parse(localStorage.getItem('contactRequests') || '[]');
  requests.push({ name: name, phone: phone, email: email, service: service, details: details, date: new Date().toISOString() });
  localStorage.setItem('contactRequests', JSON.stringify(requests));
  document.getElementById('contactSuccessMsg').style.display = 'block';
  showToast('تم إرسال طلبك بنجاح! سنتواصل معك قريباً');
  addAuditEntry('طلب تواصل', 'طلب إعداد حسابات ختامية من: ' + name);
}

// ========== CHIP SELECTION ==========
function selectChip(chip, inputId, value) {
  chip.parentElement.querySelectorAll('.chip').forEach(function(c) { c.classList.remove('active'); });
  chip.classList.add('active');
  document.getElementById(inputId).value = value;
}

// ========== CORPORATE TAX — PROFIT TAX ==========
function calculateCorporateProfitTax() {
  var revenue = getVal('corpRevenue');
  var expenses = getVal('corpExpenses');
  var activity = document.getElementById('corpActivity') ? document.getElementById('corpActivity').value : 'other';
  
  if (!revenue) { showToast('يرجى إدخال إيراد الشركة', true); return; }
  var netProfit = revenue - (expenses || 0);
  if (netProfit <= 0) { showToast('الربح الصافي سالب أو صفر، لا توجد ضريبة مستحقة', true); return; }
  
  var rate = activity === 'oil' ? 0.35 : 0.15;
  var tax = netProfit * rate;

  setText('corpProfitRevenue', formatNumber(revenue) + ' د.ع');
  setText('corpProfitExpenses', formatNumber(expenses || 0) + ' د.ع');
  setText('corpProfitNet', formatNumber(netProfit) + ' د.ع');
  
  // Set rate visually in HTML
  var rateElement = document.getElementById('corpProfitResultBox').querySelector('strong[style*="background: var(--primary-light)"]');
  if(rateElement) rateElement.textContent = (rate * 100) + '٪';
  
  setText('corpProfitTaxDue', formatNumber(Math.round(tax)) + ' د.ع');
  document.getElementById('corpProfitResultBox').style.display = 'block';
  showToast('تم احتساب ضريبة أرباح الشركة بنجاح');
}

// ========== SALARY TAX CONSTANTS ==========
var SALARY_ANNUAL_EXEMPTION = 5000000;
var SALARY_BRACKETS = [
  { limit: 250000, rate: 0.03 },
  { limit: 500000, rate: 0.05 },
  { limit: 1000000, rate: 0.10 },
  { limit: Infinity, rate: 0.15 }
];

// ========== CORPORATE TAX — EMPLOYEE TAX (EXCEL/MODAL) ==========

/* ===== SNAPSHOTS ENGINE ===== */
var taxSnapshots = JSON.parse(localStorage.getItem('taxSnapshots') || '[]');

function saveTaxSnapshots() {
  localStorage.setItem('taxSnapshots', JSON.stringify(taxSnapshots));
}

function closeMonthlyTax() {
  var year = document.getElementById('closeTaxYear_Year') ? document.getElementById('closeTaxYear_Year').value : new Date().getFullYear();
  if(typeof checkYearLocked !== 'undefined' && checkYearLocked(year)) {
      showToast('السنة المالية ' + year + ' مقفلة ولا يمكن التعديل عليها', true);
      return;
  }
  var month = document.getElementById('closeTaxMonth_Month').value;

  if (!confirm('تأكيد إقفال وتجميد بيانات رواتب الموظفين لشهر ' + month + ' لسنة ' + year + '؟\n سيتم ترحيل البيانات وحسابها تراكمياً.\n سيتم حفظ لقطة مؤقتة ولا يمكن فتح قفلها إلا من قبل مدير النظام.')) return;

  // Remove existing snapshot for this month to overwrite
  taxSnapshots = taxSnapshots.filter(function(s) { return !(String(s.year) === String(year) && String(s.month) === String(month)); });

  globalEmployees.forEach(function(e) {
    var snapE = Object.assign({}, e);
    snapE.months = 1; // Force 1 month for the snapshot
    var math = doExcelMathForEmployee(snapE);
    taxSnapshots.push({ empId: e.id, origId: e.origId || e.id, type: 'company', year: year, month: month, math: math, input: snapE, lockedBy: (function(){ var s=JSON.parse(localStorage.getItem('taxSession')||sessionStorage.getItem('taxSession')||'null'); return s?s.name:'غير معروف'; })(), lockedAt: new Date().toISOString() });
  });

  contractEmployees.forEach(function(e) {
    var snapE = Object.assign({}, e);
    snapE.months = 1;
    var math = doExcelMathForEmployee(snapE);
    taxSnapshots.push({ empId: e.id, origId: e.origId || e.id, type: 'contract', year: year, month: month, math: math, input: snapE, lockedBy: (function(){ var s=JSON.parse(localStorage.getItem('taxSession')||sessionStorage.getItem('taxSession')||'null'); return s?s.name:'غير معروف'; })(), lockedAt: new Date().toISOString() });
  });

  saveTaxSnapshots();
  showToast('تم إقفال الشهر بنجاح وتجميد اللقطات.');
  if(typeof addAuditEntry === 'function') addAuditEntry('إقفال شهر', year + ' - شهر ' + month + ' (' + globalEmployees.length + ' موظف شركة / ' + contractEmployees.length + ' عقد)');
  renderEmployeeList();
  if(typeof renderContractEmployeeList === 'function') renderContractEmployeeList();
  if(typeof renderMonthLockStatus === 'function') renderMonthLockStatus();
}

function renderMonthLockStatus() {
  var statusEl = document.getElementById('monthLockStatus');
  if (!statusEl) return;
  var year = document.getElementById('closeTaxYear_Year') ? document.getElementById('closeTaxYear_Year').value : new Date().getFullYear();
  var lockedMonths = {};
  taxSnapshots.forEach(function(s) { if (String(s.year) === String(year)) lockedMonths[String(s.month)] = true; });
  var yearLocked = (typeof lockedYears !== 'undefined') && lockedYears.indexOf(String(year)) !== -1;
  var admin = isAdmin();
  var chips = '';
  for (var m = 1; m <= 12; m++) {
    var isLocked = !!lockedMonths[String(m)] || yearLocked;
    var border = isLocked ? '#10b981' : '#e2e8f0';
    var bg = isLocked ? '#ecfdf5' : '#f8fafc';
    var txt = isLocked ? '#065f46' : '#94a3b8';
    var action = '';
    if (isLocked && admin && !yearLocked) {
      action = '<button onclick="unlockMonth(\'' + year + '\',' + m + ')" title="فتح قفل الشهر (مدير النظام فقط)" style="margin-right:5px;border:none;background:#fee2e2;color:#b91c1c;border-radius:8px;padding:2px 7px;font-size:0.7rem;cursor:pointer;font-weight:700;"><i class="fas fa-unlock"></i> فتح</button>';
    } else if (isLocked && !admin) {
      action = '<i class="fas fa-shield-alt" style="margin-right:5px;color:#cbd5e1;font-size:0.72rem;" title="لا يمكن فتح القفل إلا من قبل مدير النظام"></i>';
    }
    chips += '<span style="display:inline-block;margin:3px;padding:3px 10px;border-radius:12px;font-size:0.78rem;font-weight:700;border:1px solid ' + border + ';background:' + bg + ';color:' + txt + ';">' + m + ' ' + (isLocked ? '<i class="fas fa-lock"></i>' : '<i class="fas fa-lock-open"></i>') + action + '</span>';
  }
  var note = 'الأخضر = مٌقفل ومُجمّد. المقفلة تُحتسب تراكمياً في الكشف السنوي.';
  if (yearLocked) note += ' هذه السنة مقفلة بالكامل.';
  else if (!admin) note += ' فتح القفل متاح لمدير النظام فقط.';
  statusEl.innerHTML = 'أشهر ' + year + ' المثبتة: ' + (chips || 'لا يوجد') + '<div style="margin-top:6px;font-size:0.8rem;color:#6b7280;">' + note + '</div>';
}

function unlockMonth(year, month) {
  if (!isAdmin()) {
    showToast('فتح قفل الشهر متاح لمدير النظام فقط', true);
    if(typeof addAuditEntry === 'function') addAuditEntry('محاولة فتح قفل مرفوضة', year + ' - شهر ' + month + ' (غير مصرح)');
    return;
  }
  if (!confirm('هل أنت متأكد من فتح قفل شهر ' + month + ' لسنة ' + year + '؟\nسيتم إلغاء تجميد بيانات الموظفين لهذا الشهر ويصبح قابلاً لإعادة الإقفال.')) return;
  var before = taxSnapshots.length;
  taxSnapshots = taxSnapshots.filter(function(s) { return !(String(s.year) === String(year) && String(s.month) === String(month)); });
  saveTaxSnapshots();
  renderEmployeeList();
  if(typeof renderContractEmployeeList === 'function') renderContractEmployeeList();
  if(typeof renderMonthLockStatus === 'function') renderMonthLockStatus();
  showToast('تم فتح قفل شهر ' + month + ' لسنة ' + year + ' بنجاح');
  if(typeof addAuditEntry === 'function') addAuditEntry('فتح قفل شهر', year + ' - شهر ' + month + ' (إزالة ' + (before - taxSnapshots.length) + ' لقطة)');
}

function clearAllSnapshots() {
  if (!isAdmin()) {
    showToast('تفريغ جميع الإقفالات متاح لمدير النظام فقط', true);
    if(typeof addAuditEntry === 'function') addAuditEntry('محاولة تفريغ الإقفالات مرفوضة', 'غير مصرح');
    return;
  }
  if (confirm('تنبيه: سيتم مسح جميع الإقفالات الشهرية السابقة (تصفير). هل أنت متأكد؟')) {
    taxSnapshots = [];
    saveTaxSnapshots();
    renderEmployeeList();
    if(typeof renderContractEmployeeList === 'function') renderContractEmployeeList();
    if(typeof renderMonthLockStatus === 'function') renderMonthLockStatus();
    showToast('تمت إعادة ضبط محرك اللقطات.');
    if(typeof addAuditEntry === 'function') addAuditEntry('تفريغ جميع الإقفالات', 'تصفير محرك اللقطات');
  }
}

function getEmpYTD(empId, year) {
  var personId = empId;
  var found = globalEmployees.concat(contractEmployees).find(function(e) { return String(e.id) === String(empId); });
  if (found && found.origId) personId = found.origId;
  var snps = taxSnapshots.filter(function(s) {
    if (String(s.year) !== String(year)) return false;
    var sPerson = String(s.origId || s.empId);
    return sPerson === String(personId) || String(s.empId) === String(empId);
  });
  var totGross = 0, totDed = 0, totTaxable = 0, totTax = 0, count = 0;
  snps.forEach(function(s) {
    totGross += s.math.annualGross; // It was 1 month, so annual === monthly
    totDed += s.math.annualDed;
    totTaxable += s.math.annualTaxable;
    totTax += s.math.annualTax;
    count++;
  });
  return { gross: totGross, ded: totDed, taxable: totTaxable, tax: totTax, count: count };
}
/* ======================== */

var PAYROLL_ALLOWANCE_SINGLE = 2500000 / 12;
var PAYROLL_ALLOWANCE_MARRIED_HOUSEWIFE = 4500000 / 12;
var PAYROLL_ALLOWANCE_WIDOWED_DIVORCED = 3200000 / 12;
var PAYROLL_ALLOWANCE_PER_CHILD = 200000 / 12;
var PAYROLL_ALLOWANCE_OVER63 = 300000 / 12;
var PAYROLL_INSURANCE_MONTHLY_CAP = 166667;
var PAYROLL_RETIREMENT_BASE_CAP = 1750000;
var PAYROLL_MONTHLY_BRACKETS = [
  { limit: 20833, rate: 0.03 },
  { limit: 41667, rate: 0.05 },
  { limit: 83333, rate: 0.10 },
  { limit: Infinity, rate: 0.15 }
];

var globalEmployees = [];
var contractEmployees = [];
var currentEmpType = "company";
var currentDd4aEmployeeId = null;

function hydrateStoredEmployeeRecord(record) {
  var base = Object.assign({}, record || {});
  base.childNames = Array.isArray(base.childNames) ? base.childNames : [];
  base.child = parseInt(base.child, 10) || 0;
  base.months = Math.max(1, Math.min(12, parseInt(base.months, 10) || 12));
  base.salary = Number(base.salary) || 0;
  base.allow = Number(base.allow) || 0;
  base.cashHous = Number(base.cashHous) || 0;
  base.ins = Number(base.ins) || 0;
  base.alimony = Number(base.alimony) || 0;
  return Object.assign(base, doExcelMathForEmployee(base));
}

function loadStoredEmployees() {
  try {
    var stored = JSON.parse(localStorage.getItem('companyEmployeesData') || '[]');
    globalEmployees = Array.isArray(stored) ? stored.map(hydrateStoredEmployeeRecord) : [];
    var storedCont = JSON.parse(localStorage.getItem('contractEmployeesData') || '[]');
    contractEmployees = Array.isArray(storedCont) ? storedCont.map(hydrateStoredEmployeeRecord) : [];
  } catch (e) {
    globalEmployees = [];
    contractEmployees = [];
  }
}
function saveStoredEmployees() {
  try {
    localStorage.setItem('companyEmployeesData', JSON.stringify(globalEmployees));
    localStorage.setItem('contractEmployeesData', JSON.stringify(contractEmployees));
  } catch (e) { console.error('Error saving', e); }
}
loadStoredEmployees();

function calculateMonthlyAllowance(nationality, residency, marital, children, over63) {
  if (nationality === 'foreign') return 0;
  if (residency === 'nonresident') return 0;
  var allowance = PAYROLL_ALLOWANCE_SINGLE;
  if (marital === 'married_housewife') allowance = PAYROLL_ALLOWANCE_MARRIED_HOUSEWIFE;
  else if (marital === 'widowed' || marital === 'divorced') allowance = PAYROLL_ALLOWANCE_WIDOWED_DIVORCED;
  allowance += Math.max(children, 0) * PAYROLL_ALLOWANCE_PER_CHILD;
  if (over63) allowance += PAYROLL_ALLOWANCE_OVER63;
  return allowance;
}

function calculateProgressiveTax(taxableAmount, brackets) {
  if (taxableAmount <= 0) return 0;
  var tax = 0;
  var remaining = taxableAmount;
  if (remaining > 83333) { tax += (remaining - 83333) * 0.15; remaining = 83333; }
  if (remaining > 41667) { tax += (remaining - 41667) * 0.10; remaining = 41667; }
  if (remaining > 20833) { tax += (remaining - 20833) * 0.05; remaining = 20833; }
  if (remaining > 0) { tax += remaining * 0.03; }
  return tax;
}

window.renderChildNameInputs = function(existingNames) {
  existingNames = Array.isArray(existingNames) ? existingNames : [];
  var count = parseInt(document.getElementById('empModChild').value, 10) || 0;
  var container = document.getElementById('empModChildNamesContainer');
  var namesDiv = document.getElementById('empModChildNames');
  if (!container || !namesDiv) return;
  if (count <= 0) {
    container.style.display = 'none';
    namesDiv.innerHTML = '';
    return;
  }
  var currentNames = [];
  for (var j = 0; j < 20; j++) {
    var existingEl = document.getElementById('empModChildName_' + j);
    if (existingEl) currentNames.push(existingEl.value);
  }
  if (existingNames.length > 0) currentNames = existingNames;
  container.style.display = 'block';
  namesDiv.innerHTML = '';
  for (var i = 0; i < count; i++) {
    var value = currentNames[i] || '';
    namesDiv.innerHTML += '<div class="form-group"><input type="text" id="empModChildName_' + i + '" class="table-input" placeholder="اسم الطفل ' + (i + 1) + '" value="' + value + '"></div>';
  }
};

function getEmpModalInputs() {
  var childCount = parseInt(document.getElementById('empModChild').value, 10) || 0;
  var childNames = [];
  for (var i = 0; i < childCount; i++) {
    var childEl = document.getElementById('empModChildName_' + i);
    childNames.push(childEl ? childEl.value : '');
  }
  return {
    name: document.getElementById('empModName').value || 'موظف غير مسمى',
    nat: document.getElementById('empModNat').value,
    res: document.getElementById('empModRes').value,
    gender: document.getElementById('empModGender').value,
    birthDate: document.getElementById('empModBirthDate').value,
    civilId: document.getElementById('empModCivilId').value,
    phone: document.getElementById('empModPhone').value,
    email: document.getElementById('empModEmail').value,
    sec: document.getElementById('empModSec').value,
    startDate: document.getElementById('empModStartDate').value,
    endDate: document.getElementById('empModEndDate').value,
    mainEmployer: document.getElementById('empModMainEmployer').value,
    jobTitle: document.getElementById('empModJobTitle').value,
    employerName: document.getElementById('empModEmployerName').value,
    employerId: document.getElementById('empModEmployerId').value,
    province: document.getElementById('empModProvince').value,
    city: document.getElementById('empModCity').value,
    neighborhood: document.getElementById('empModNeighborhood').value,
    street: document.getElementById('empModStreet').value,
    houseNo: document.getElementById('empModHouseNo').value,
    marital: document.getElementById('empModMarital').value,
    marriageDate: document.getElementById('empModMarriageDate').value,
    spouseName: document.getElementById('empModSpouseName').value,
    divorceDate: document.getElementById('empModDivorceDate').value,
    spouseCivilId: document.getElementById('empModSpouseCivilId').value,
    spouseDisabled: document.getElementById('empModSpouseDisabled').value,
    spouseEmpName: document.getElementById('empModSpouseEmpName').value,
    spouseEmployed: document.getElementById('empModSpouseEmployed') ? document.getElementById('empModSpouseEmployed').value : 'no',
    incomeMerge: document.getElementById('empModIncomeMerge') ? document.getElementById('empModIncomeMerge').value : 'no',
    spouseEmpId: document.getElementById('empModSpouseEmpId') ? document.getElementById('empModSpouseEmpId').value : '',
    child: childCount,
    childNames: childNames,
    over63: document.getElementById('empMod63').value,
    months: Math.max(1, Math.min(12, parseInt(document.getElementById('empModMonths').value, 10) || 12)),
    salary: parseArabicNumber(document.getElementById('empModSalary').value) || 0,
    allow: parseArabicNumber(document.getElementById('empModAllow').value) || 0,
    cashHous: parseArabicNumber(document.getElementById('empModCashHous').value) || 0,
    inKind: document.getElementById('empModInKind').value,
    ins: parseArabicNumber(document.getElementById('empModIns').value) || 0,
    alimony: parseArabicNumber(document.getElementById('empModAlimony').value) || 0
  };
}


// ========== UNIFIED TAX CORE (calcMonthly) ==========
function calcMonthly(inp) {
  var L = parseFloat(inp.salary) || 0;
  var M = parseFloat(inp.taxableAllow) || 0;
  var N = parseFloat(inp.housingFoodCash) || 0;
  var housingInKind = inp.housingInKind || 'none';
  var sector = inp.sector || 'private';
  var residency = inp.residency || 'resident';
  var maritalStatus = inp.maritalStatus || 'single';
  var childrenCount = Math.min(parseInt(inp.childrenCount, 10) || 0, 6);
  var isOver63 = inp.isOver63 === true || inp.isOver63 === 'yes';
  var T = parseFloat(inp.lifeInsurance) || 0;
  var U = parseFloat(inp.alimony) || 0;

  var P = housingInKind === 'furnished' || housingInKind === '0.20' ? L * 0.20 : 
          housingInKind === 'unfurnished' || housingInKind === '0.10' ? L * 0.10 : 0;
  
  var Q = L + M + N + P;
  var R = sector === 'private' || sector === 'القطاع الخاص' ? Math.min(N, L * 0.30) : 0;
  var S = Math.min(L + M + N, 1750000) * 0.05;
  var V = R + S + Math.min(T, 166667) + U;
  
  var W = 0;
  if (residency !== 'nonresident' && residency !== 'غير مقيم') {
    var baseAllowance = 208333.33; 
    if (maritalStatus === 'married_housewife' || maritalStatus === 'married_spouse_no_income') {
      baseAllowance = 375000;
    } else if (maritalStatus === 'widowed' || maritalStatus === 'divorced') {
      baseAllowance = 266666.67; 
    }
    var childAllowance = childrenCount * 16666.67;
    var ageAllowance = isOver63 ? 25000 : 0;
    W = baseAllowance + childAllowance + ageAllowance;
  }
  
  var X = Math.max(0, Q - V - W);
  var Y = 0;
  if (X > 0) {
    if (X <= 20833.33) { Y = X * 0.03; }
    else if (X <= 41666.67) { Y = (20833.33 * 0.03) + ((X - 20833.33) * 0.05); }
    else if (X <= 83333.33) { Y = (20833.33 * 0.03) + (20833.34 * 0.05) + ((X - 41666.67) * 0.10); }
    else { Y = (20833.33 * 0.03) + (20833.34 * 0.05) + (41666.66 * 0.10) + ((X - 83333.33) * 0.15); }
  }
  
  var AA = Q - P - Y - S;

  return {
    gross: Q, exempt30: R, retirement: S, deductions: V, allowances: W,
    taxable: X, tax: Y, net: AA, inKind: P
  };
}
// ====================================================

function doExcelMathForEmployee(inp) {
  var months = Math.max(1, Math.min(12, parseInt(inp.months, 10) || 12));
  var unified = calcMonthly({
    salary: inp.salary, taxableAllow: inp.allow, housingFoodCash: inp.cashHous,
    housingInKind: inp.inKind, sector: inp.sec === 'private' ? 'private' : 'government',
    residency: inp.res, maritalStatus: inp.marital, childrenCount: inp.child,
    isOver63: inp.over63 === 'yes', lifeInsurance: inp.ins, alimony: inp.alimony
  });

  return {
    annualGross: unified.gross * months,
    annualDed: unified.deductions * months,
    annualTaxable: unified.taxable * months,
    annualTax: unified.tax * months,
    monthlyTax: unified.tax, monthlyNet: unified.net, monthlyAllowance: unified.allowances,
    retirement: unified.retirement, insurance: Math.min(parseFloat(inp.ins) || 0, 166667),
    privateExempt: unified.exempt30, inKindValue: unified.inKind, annualNet: unified.net * months
  };
}


window.calcEmpModalPreview = function() {
  if (!document.getElementById('empModName')) return null;
  var employeeData = getEmpModalInputs();
  var math = doExcelMathForEmployee(employeeData);
  document.getElementById('livePreviewGross').textContent = formatNumber(Math.round(math.annualGross)) + ' د.ع';
  document.getElementById('livePreviewDed').textContent = formatNumber(Math.round(math.annualDed)) + ' د.ع';
  document.getElementById('livePreviewTaxable').textContent = formatNumber(Math.round(math.annualTaxable)) + ' د.ع';
  document.getElementById('livePreviewTax').textContent = formatNumber(Math.round(math.annualTax)) + ' د.ع';
  return math;
};

var currentEmpStep = 1;
var totalEmpSteps = 5;

window.switchEmpStep = function(step) {
  currentEmpStep = step;
  document.querySelectorAll('.emp-step-pane').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.emp-step-btn').forEach(function(b) { b.classList.remove('active'); });
  
  var activePane = document.getElementById('empStep' + step);
  if (activePane) activePane.classList.add('active');
  
  var buttons = document.querySelectorAll('.emp-step-btn');
  if (buttons[step - 1]) buttons[step - 1].classList.add('active');
  
  document.getElementById('empStepIndicator').textContent = 'الخطوة ' + step + ' من ' + totalEmpSteps;
  
  document.getElementById('empPrevBtn').style.display = step > 1 ? 'inline-block' : 'none';
  if (step < totalEmpSteps) {
    document.getElementById('empNextBtn').style.display = 'inline-block';
    document.getElementById('empSaveBtn').style.display = 'none';
  } else {
    document.getElementById('empNextBtn').style.display = 'none';
    document.getElementById('empSaveBtn').style.display = 'inline-block';
    calcEmpModalPreview();
  }
};

window.nextEmpStep = function(dir) {
  var newStep = currentEmpStep + dir;
  if (newStep >= 1 && newStep <= totalEmpSteps) {
    switchEmpStep(newStep);
  }
};

window.openEmployeeModal = function(editId, type) {
  currentEmpType = type || 'company';
  var modal = document.getElementById('employeeExcelModal');
  if (!modal) return;
  var targetArray = currentEmpType === 'contract' ? contractEmployees : globalEmployees;
  var employee = editId ? targetArray.find(function(item) { return item.id === editId; }) : null;

  document.getElementById('empModEditId').value = employee ? employee.id : '';
  document.getElementById('empModName').value = employee ? employee.name : '';
  document.getElementById('empModNat').value = employee ? employee.nat : 'iraqi';
  document.getElementById('empModRes').value = employee ? employee.res : '';
  document.getElementById('empModGender').value = employee ? employee.gender : 'male';
  document.getElementById('empModBirthDate').value = employee ? employee.birthDate : '';
  document.getElementById('empModCivilId').value = employee ? employee.civilId : '';
  document.getElementById('empModPhone').value = employee ? employee.phone : '';
  document.getElementById('empModEmail').value = employee ? employee.email : '';
  document.getElementById('empModSec').value = employee ? employee.sec : 'government';
  document.getElementById('empModStartDate').value = employee ? employee.startDate : '';
  document.getElementById('empModEndDate').value = employee ? employee.endDate : '';
  document.getElementById('empModMainEmployer').value = employee ? employee.mainEmployer : 'yes';
  document.getElementById('empModJobTitle').value = employee ? employee.jobTitle : '';
  document.getElementById('empModEmployerName').value = employee ? employee.employerName : '';
  document.getElementById('empModEmployerId').value = employee ? employee.employerId : '';
  document.getElementById('empModProvince').value = employee ? employee.province : '';
  document.getElementById('empModCity').value = employee ? employee.city : '';
  document.getElementById('empModNeighborhood').value = employee ? employee.neighborhood : '';
  document.getElementById('empModStreet').value = employee ? employee.street : '';
  document.getElementById('empModHouseNo').value = employee ? employee.houseNo : '';
  document.getElementById('empModMarital').value = employee ? employee.marital : 'single';
  document.getElementById('empModMarriageDate').value = employee ? employee.marriageDate : '';
  document.getElementById('empModSpouseName').value = employee ? employee.spouseName : '';
  document.getElementById('empModDivorceDate').value = employee ? employee.divorceDate : '';
  document.getElementById('empModSpouseCivilId').value = employee ? employee.spouseCivilId : '';
  document.getElementById('empModSpouseDisabled').value = employee ? employee.spouseDisabled : 'no';
  document.getElementById('empModSpouseEmpName').value = employee ? employee.spouseEmpName : '';
  if (document.getElementById('empModSpouseEmployed')) document.getElementById('empModSpouseEmployed').value = employee ? (employee.spouseEmployed || 'no') : 'no';
  if (document.getElementById('empModIncomeMerge')) document.getElementById('empModIncomeMerge').value = employee ? (employee.incomeMerge || 'no') : 'no';
  if (document.getElementById('empModSpouseEmpId')) document.getElementById('empModSpouseEmpId').value = employee ? (employee.spouseEmpId || '') : '';
  document.getElementById('empModChild').value = employee ? employee.child : 0;
  document.getElementById('empMod63').value = employee ? employee.over63 : 'no';
  document.getElementById('empModMonths').value = employee ? employee.months : 12;
  document.getElementById('empModSalary').value = employee ? fmtMoney(employee.salary) : '0';
  document.getElementById('empModAllow').value = employee ? fmtMoney(employee.allow) : '0';
  document.getElementById('empModCashHous').value = employee ? fmtMoney(employee.cashHous) : '0';
  document.getElementById('empModInKind').value = employee ? employee.inKind : 'none';
  document.getElementById('empModIns').value = employee ? fmtMoney(employee.ins) : '0';
  document.getElementById('empModAlimony').value = employee ? fmtMoney(employee.alimony) : '0';
  renderChildNameInputs(employee ? employee.childNames : []);
  switchEmpStep(1);
  modal.style.display = 'flex';
  calcEmpModalPreview();
};

window.closeEmployeeModal = function() {
  var modal = document.getElementById('employeeExcelModal');
  if (modal) modal.style.display = 'none';
};

window.saveEmployeeFromModal = function() {
  var inputs = getEmpModalInputs();
  if (!inputs.res) { showToast('يرجى تحديد الإقامة الضريبية للموظف إجبارياً', true); return; }
  
  var math = doExcelMathForEmployee(inputs);
  var merged = Object.assign({}, inputs, math);
  var editId = document.getElementById('empModEditId').value;
  var targetArray = currentEmpType === 'contract' ? contractEmployees : globalEmployees;
  
  function hasFinancialChange(oldRec, newInput) {
    return Math.abs((Number(oldRec.salary) || 0) - (Number(newInput.salary) || 0)) > 0.5 ||
           Math.abs((Number(oldRec.allow) || 0) - (Number(newInput.allow) || 0)) > 0.5 ||
           Math.abs((Number(oldRec.cashHous) || 0) - (Number(newInput.cashHous) || 0)) > 0.5 ||
           Math.abs((Number(oldRec.ins) || 0) - (Number(newInput.ins) || 0)) > 0.5 ||
           Math.abs((Number(oldRec.alimony) || 0) - (Number(newInput.alimony) || 0)) > 0.5 ||
           String(oldRec.inKind || 'none') !== String(newInput.inKind || 'none');
  }
  
  if (editId) {
    var oldRec = targetArray.find(function(item) { return item.id === editId; });
    if (oldRec && hasFinancialChange(oldRec, inputs)) {
      // تغيير الراتب = إضافة موظف جديد للشهر الجديد مع الإبقاء على السجل القديم
      merged.id = 'EMP_' + Date.now();
      merged.origId = oldRec.origId || oldRec.id;
      merged.version = (Number(oldRec.version) || 0) + 1;
      merged.versionOf = oldRec.id;
      merged.salaryChangeDate = new Date().toISOString().slice(0, 10);
      targetArray.push(merged);
      showToast('تم رفع الراتب — أُضيف الموظف كسجل جديد (إصدار ' + merged.version + ') والسجل القديم محفوظ');
    } else {
      merged.id = editId;
      merged.origId = oldRec ? (oldRec.origId || editId) : editId;
      merged.version = oldRec ? (Number(oldRec.version) || 0) : 1;
      for (var i = 0; i < targetArray.length; i++) {
        if (targetArray[i].id === editId) {
          targetArray[i] = merged;
          break;
        }
      }
    }
  } else {
    merged.id = 'EMP_' + Date.now();
    merged.origId = merged.id;
    merged.version = 1;
    targetArray.push(merged);
  }
  
  saveStoredEmployees();
  closeEmployeeModal();
  if (currentEmpType === 'contract') {
    renderContractEmployeeList();
    showEmployeeDD4A(merged, true);
  } else {
    renderEmployeeList();
    showEmployeeDD4A(merged, false);
  }
  showToast('تم الحفظ بنجاح');
}
;

window.removeExtEmployee = function(id) {
  var rec = globalEmployees.concat(contractEmployees).find(function(item) { return item.id === id; });
  var origId = rec ? (rec.origId || id) : id;
  globalEmployees = globalEmployees.filter(function(item) { return (item.origId || item.id) !== origId; });
  contractEmployees = contractEmployees.filter(function(item) { return (item.origId || item.id) !== origId; });
  saveStoredEmployees();
  renderEmployeeList();
  if (typeof renderContractEmployeeList === 'function') renderContractEmployeeList();
  showToast('تم حذف الموظف — تبقّى سجلاته في الأشهر المقفلة');
};

function buildEmployeeDD4AHtml(employee) {
  var currentYear = document.getElementById('closeTaxYear_Year') ? document.getElementById('closeTaxYear_Year').value : new Date().getFullYear();
  var math = doExcelMathForEmployee(employee);
  var ytd = getEmpYTD(employee.id, currentYear);

  var isYTD = ytd && ytd.count > 0;
  var annualTaxable = isYTD ? Math.round(ytd.taxable) : Math.round(math.annualTaxable);
  var annualTax = isYTD ? Math.round(ytd.tax) : Math.round(math.annualTax);
  var annualGross = isYTD ? Math.round(ytd.gross) : Math.round(math.annualGross);
  var annualDed = isYTD ? Math.round(ytd.ded) : Math.round(math.annualDed);
  var mathStr = isYTD ? 'تحاسب شهري (' + ytd.count + ' أشهر)' : 'تحاسب سنوي (12 شهر إفتراضاً)';

  function box(flag) {
    return flag ? '<span style="display:inline-block;width:12px;height:12px;border:1px solid #000;text-align:center;line-height:12px;font-size:10px;margin-right:2px;position:relative;top:2px;">&#10003;</span>' : '<span style="display:inline-block;width:12px;height:12px;border:1px solid #000;margin-right:2px;position:relative;top:2px;"></span>';
  }

  function fmtLine(val, width) {
    var v = val ? val : '&nbsp;';
    return '<span style="display:inline-block; border-bottom:1px solid #000; padding:0 5px; min-width:' + (width || '100px') + '; text-align:center; font-weight:bold;">' + v + '</span>';
  }

  var childRows = '';
  for (var i = 0; i < 6; i++) {
    childRows += '<tr>' +
      '<td style="border:1px solid #000;padding:4px;text-align:center;">' + (i + 1) + '</td>' +
      '<td style="border:1px solid #000;padding:4px;">' + ((employee.childNames && employee.childNames[i]) ? employee.childNames[i] : '') + '</td>' +
      '<td style="border:1px solid #000;padding:4px;text-align:center;">' + (i < employee.child ? '—' : '') + '</td>' +
      '<td style="border:1px solid #000;padding:4px;text-align:center;">' + (i < employee.child ? '—' : '') + '</td>' +
      '<td style="border:1px solid #000;padding:4px;text-align:center;">' + (i < employee.child ? '—' : '') + '</td>' +
      '<td style="border:1px solid #000;padding:4px;text-align:center;">' + (i < employee.child ? '—' : '') + '</td>' +
      '<td style="border:1px solid #000;padding:4px;text-align:center;">' + (i < employee.child ? 'ج' : '') + '</td>' +
      '</tr>';
  }

  var taxableColumn = annualTaxable <= 250000 ? 'a' : annualTaxable <= 500000 ? 'b' : annualTaxable <= 1000000 ? 'c' : 'd';
  var bracketStart = taxableColumn === 'a' ? 0 : taxableColumn === 'b' ? 250000 : taxableColumn === 'c' ? 500000 : 1000000;
  var bracketRate = taxableColumn === 'a' ? 0.03 : taxableColumn === 'b' ? 0.05 : taxableColumn === 'c' ? 0.10 : 0.15;
  var baseTax = taxableColumn === 'a' ? 0 : taxableColumn === 'b' ? 7500 : taxableColumn === 'c' ? 20000 : 70000;
  var row3Amount = Math.max(0, annualTaxable - bracketStart);
  var row5Amount = Math.round(row3Amount * bracketRate);
  
  // Enforce invariant: 
  var row7Amount = annualTax;

  // Let's calculate the "Settlement" if this is a YTD real sum but the linear brackets calculate a different strict sum.
  var strictLinearD14Tax = baseTax + (row3Amount * bracketRate);
  var settlementDiff = annualTax - strictLinearD14Tax; 
  var settlementDisplay = '';
  if (Math.abs(settlementDiff) > 2) {
     var diffWord = settlementDiff > 0 ? 'مطلوب (غير مدفوع)' : 'فائض (يُردّ أو يُرحّل)';
     settlementDisplay = '<div style="margin-top:10px; padding:10px; border:1px solid #dc2626; color:#dc2626; background:#fef2f2; font-weight:bold;">تسوية سنوية: تم استيفاء مبلغ مختلف تفاضلياً لتغيّر الدخل خلال السنة. الفارق: ' + formatNumber(Math.abs(settlementDiff)) + ' د.ع ' + diffWord + '</div>';
  }

  function bCell(key, value) { return taxableColumn === key ? formatNumber(Math.round(value)) : ''; }

  var page1 = `
    <div class="page-break" style="width:210mm; height:296mm; margin:0 auto; padding:9mm; background:#fff; color:#000; font-family:Arial,sans-serif; font-size:13.5px; line-height:1.4; direction:rtl; box-sizing:border-box; border:1px solid #fff; page-break-after:always; position:relative; overflow:hidden;">
      <div style="display:flex; justify-content:space-between; margin-bottom:10px; align-items:center;">
        <div style="font-size:11px; line-height:1.3;">رقم الاستمارة: 1<br>السنة المالية: ${new Date().getFullYear()}<br>الصفحة: 1</div>
        <div style="text-align:center; font-size:15px; flex-grow:1;"><strong>الاستمارة ض. د / 14</strong><br>خاصة بالمنتسبين الخاضعين للضريبة بطريق الاستقطاع المباشر</div>
        <div style="font-size:11px; text-align:right; line-height:1.3;">جمهورية العراق<br> وزارة المالية<br> الهيئة العامة للضرائب</div>
      </div>


      
      <div style="margin-bottom:9px;">
        <div style="display:flex; gap:10px; margin-bottom:6px;">
          <div>1- اسم المنتسب الثلاثي واللقب: ${fmtLine(employee.name, '250px')}</div>
          <div>الجنسية: ${fmtLine(employee.nat === 'iraqi' ? 'عراقي' : 'أجنبي', '80px')}</div>
          <div>الجنس: ${fmtLine(employee.gender === 'male' ? 'ذكر' : 'أنثى', '50px')}</div>
        </div>
        <div style="display:flex; gap:10px; margin-bottom:6px;">
          <div>محل الاقامة الدائم: ${fmtLine((employee.province || '') + ' ' + (employee.city || ''), '200px')}</div>
          <div>محلة: ${fmtLine(employee.neighborhood, '50px')}</div>
          <div>زقاق: ${fmtLine(employee.street, '50px')}</div>
          <div>دار: ${fmtLine(employee.houseNo, '50px')}</div>
        </div>
        <div style="display:flex; gap:10px; margin-bottom:6px;">
          <div>تاريخ الولادة: ${fmtLine(employee.birthDate, '100px')}</div>
          <div>رقم هوية الاحوال المدنية أو البطاقة الوطنية: ${fmtLine(employee.civilId, '150px')}</div>
        </div>
      </div>
<div style="margin-bottom:9px;">
        <div style="display:flex; gap:10px; margin-bottom:6px;">
          <div>2- العنوان الوظيفي: ${fmtLine(employee.jobTitle, '150px')}</div>
          <div>اليوم الاول لبدء العمل: ${fmtLine(employee.startDate, '100px')} الى ${fmtLine(employee.endDate, '100px')}</div>
        </div>
        <div style="display:flex; gap:10px; margin-bottom:6px;">
          <div>اسم صاحب العمل: ${fmtLine(employee.employerName, '250px')}</div>
          <div>هل هو صاحب العمل الرئيسي؟ نعم ${box(employee.mainEmployer === 'yes')} كلا ${box(employee.mainEmployer !== 'yes')}</div>
        </div>
        <div style="margin-bottom:6px;">
          الرقم التعريفي لصاحب العمل: ${fmtLine(employee.employerId, '150px')}
        </div>
        <div style="margin-bottom:6px;">
          اذا كان المنتسب هو الزوجة: هل زوجك عاجز عن العمل وليس له دخل خاضع للضريبة؟ نعم ${box(employee.gender === 'female' && employee.spouseDisabled === 'yes')} كلا ${box(!(employee.gender === 'female' && employee.spouseDisabled === 'yes'))}
        </div>
      </div>

      <div style="margin-bottom:9px;">
        <div style="margin-bottom:6px;">3- الحالة الاجتماعية: ${fmtLine(employee.marital === 'single' ? 'أعزب' : employee.marital === 'divorced' ? 'مطلق' : employee.marital === 'widowed' ? 'أرمل' : 'متزوج', '100px')}</div>
        <div style="display:flex; gap:10px; margin-bottom:6px;">
          <div style="width:300px;">أ. اذا كان متزوجاً، تاريخ الزواج: ${fmtLine(employee.marriageDate, '100px')}</div>
          <div>اسم الزوجة (الزوج): ${fmtLine(employee.spouseName, '150px')}</div>
        </div>
        <div style="display:flex; gap:10px; margin-bottom:6px;">
          <div style="width:300px;">ب. اذا كان مطلقاً، تاريخ الطلاق: ${fmtLine(employee.divorceDate, '100px')}</div>
          <div>رقم هوية الأحوال المدنية للزوجة (الزوج): ${fmtLine(employee.spouseCivilId, '150px')}</div>
        </div>
        <div style="margin-bottom:6px;">
          ج. اذا كان أرملاً، تاريخ وفاة الزوجة (الزوج): ${fmtLine('', '150px')}
        </div>
        <div style="margin-bottom:6px;">
          د. هل الزوجة ربة بيت وليس لها دخل؟ نعم ${box(employee.marital === 'married_housewife')} كلا ${box(employee.marital !== 'married_housewife')} 
          <span style="font-size:10.5px;">(اذا كان الجواب (نعم) انتقل الى الفقرة (4))</span>
        </div>
        <div style="margin-bottom:6px;">
          هـ. هل الزوجة (الزوج) منتسب؟ نعم ${box(employee.spouseEmployed === 'yes')} كلا ${box(employee.spouseEmployed !== 'yes')}
        </div>
        <div style="margin-bottom:6px;">
          هل تطلب أنت وزوجتك (زوجك) دمج المدخولات؟ نعم ${box(employee.incomeMerge === 'yes')} كلا ${box(employee.incomeMerge !== 'yes')}
          <span style="font-size:10.5px;">[اذا كان الجواب (نعم) يوقع الزوج]</span>
        </div>
        <div style="display:flex; justify-content:space-around; margin:8px 0;">
          <div style="text-align:center;">توقيع الزوج<br><br>التاريخ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
          <div style="text-align:center;">توقيع الزوجة<br><br>التاريخ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
        </div>
        <div style="margin-bottom:6px;">
          معلومات عن صاحب عمل الزوجة (الزوج) الرئيسي<br>
          اسم صاحب العمل: ${fmtLine(employee.spouseEmpName, '200px')} 
          &nbsp;&nbsp; الرقم التعريفي لصاحب العمل: ${fmtLine(employee.spouseEmpId || '', '150px')}
        </div>
      </div>

      <div style="margin-bottom:9px;">
        <div style="margin-bottom:4px;">4- معلومات حول الأولاد الذين يحق للمنتسب طلب السماح القانوني عنهم :</div>
        <div style="font-size:10px; line-height:1.35; margin-bottom:6px;">
          الأولاد المستحقون هم: أ) البنات غير المتزوجات دون سن 18 عاماً ، ب) البنات في سن 18 عاماً فما فوق من ذوات الدخول السنوية اقل من 200,000 دينار ، ج) الأبناء دون سن 18 عاماً ، د) الأبناء بين 19 - 25 (داخل) عاماً من ذوي الدخول السنوية دون 200,000 دينار والمستمرين على الدراسة في المرحلة الاعدادية او الجامعة او الدراسات العليا ، هـ) الأبناء غير القادرين على الكسب بسبب الإعاقة العقلية او الجسدية
        </div>
        <table style="width:100%; border-collapse:collapse; text-align:center; font-size:11.5px;" border="1">
          <tr style="background:#f9f9f9;">
            <th style="padding:3px;">ت</th>
            <th style="padding:3px;">اسم الولد او البنت</th>
            <th style="padding:3px;">الجنس</th>
            <th style="padding:3px;">رقم هوية الأحوال المدنية</th>
            <th style="padding:3px;">تاريخ الميلاد</th>
            <th style="padding:3px;">الدخل السنوي (دينار)</th>
            <th style="padding:3px;">سبب استحقاق السماح القانوني (أ،ب،ج،د،هـ)</th>
          </tr>
          ${childRows}
        </table>
        <div style="font-size:10.5px; margin-top:3px;">* استخدم استمارة ثانية في حالة اكثر من 6 أولاد.</div>
        <div style="margin-top:8px;">
          اني الموقع ادناه، اقر ان البيانات المسجلة في هذه الاستمارة صحيحة ودقيقة بحسب معلوماتي واتحمل المسئولية القانونية خلاف ذلك.
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:8px;">
          <div>توقيع الموظف ________________________</div>
          <div>التاريخ _______/_______/_____________</div>
        </div>
      </div>

      <div style="border-top:2px solid #000; padding-top:6px; margin-top:6px; font-size:10px; line-height:1.4;">
        <strong>ملاحظة</strong>
        <ol style="margin:4px 0; padding-right:20px;">
          <li>يجب ملئ هذه الاستمارة بنسختين.</li>
          <li>عند عدم ملئ الجزء 3 او 4 بالكامل يحجب سماح الزوجة والاولاد.</li>
          <li>عند حدوث تغير في الوضع الاجتماعي خلال السنة ، يبلغ المحاسب بذلك.</li>
        </ol>
        اذا كنت تعمل لدى اكثر من صاحب عمل ، فان صاحب العمل الرئيسي هو الذي تختاره لمنحك السماح القانوني وبقية التنزيلات ، بينما لا يحق ذلك لصاحب العمل الاخر ، ما عدا التوقيفات التقاعدية او حصة الضمان الاجتماعي فتنزل لدى كل صاحب عمل.<br>
        ان دمج المدخولات يسمح به فقط في حالة كون احد الزوجين يملك دخلا سنويا اقل من 2,500,000 دينار وان يقدم طلب الدمج قبل 31 كانون الثاني من السنة المعنية في هذه الحالة يجب استقطاع الضريبة من راتب احد الزوجين ذو الدخل الاعلى ولا يتم استقطاع اي ضريبة من راتب الزوج الاخر.
      </div>
    </div>
  `;

  var page2 = `
    <div class="page-break" style="width:210mm; height:296mm; margin:0 auto; padding:10mm; background:#fff; color:#000; font-family:Arial,sans-serif; font-size:13px; line-height:1.5; direction:rtl; box-sizing:border-box; border:1px solid #ddd; overflow:hidden;">
      <div style="text-align:center; font-size:16px; font-weight:bold; margin-bottom:5px;">الاستمارة ض. د / 14</div>
      ${settlementDisplay}
      <div style="text-align:center; font-size:11px; margin-bottom:5px; color:#666; font-weight:bold;">${mathStr}</div>
      <div style="text-align:center; font-size:13px; margin-bottom:15px;">حساب ضريبة الدخل تُملأ من قبل المحاسب (في نهاية السنة)</div>
      
      <table style="width:100%; border-collapse:collapse; font-size:13px;" border="1">
        <tr>
          <th style="padding:6px; width:75%;">الدخل</th>
          <th style="padding:6px; width:25%; text-align:center;">دينار</th>
        </tr>
        <tr>
          <td style="padding:6px;">1 أ) مجموع الرواتب والاجور المدفوعة خلال السنة</td>
          <td style="padding:6px; text-align:center; font-weight:bold;">${formatNumber(Math.round(employee.salary * employee.months))}</td>
        </tr>
        <tr>
          <td style="padding:6px;">1 ب) مجموع المخصصات للملابس والسكن والإقامة والطعام والنقل والخطرة المدفوعة خلال السنة بالنسبة لمستخدمي القطاع الخاص واجمالي المخصصات المستلمة من قبل موظفي الدولة والقطاع العام والمختلط</td>
          <td style="padding:6px; text-align:center; font-weight:bold;">${formatNumber(Math.round(employee.cashHous * employee.months))}</td>
        </tr>
        <tr>
          <td style="padding:6px;">1 ج) مجموع المخصصات والمزايا الأخرى الخاضعة للضريبة المدفوعة خلال السنة</td>
          <td style="padding:6px; text-align:center; font-weight:bold;">${formatNumber(Math.round(employee.allow * employee.months))}</td>
        </tr>
        <tr>
          <td style="padding:6px;">1 د) مزايا عينية</td>
          <td style="padding:6px; text-align:center; font-weight:bold;">${formatNumber(Math.round(math.inKindValue * employee.months))}</td>
        </tr>
        <tr>
          <td style="padding:6px;">1 هـ) مكافآت مدفوعة للمنتسب ومدخولات أخرى من صاحب العمل</td>
          <td style="padding:6px; text-align:center; font-weight:bold;">0</td>
        </tr>
        <tr>
          <td style="padding:6px;">1 و) مدخولات إضافية من الاولاد ومن دمج دخل الزوجة (الزوج) عند تحقق الشروط</td>
          <td style="padding:6px; text-align:center; font-weight:bold;">0</td>
        </tr>
        <tr style="background:#f4f4f4;">
          <td style="padding:6px; font-weight:bold;">(1) اجمالي الدخل</td>
          <td style="padding:6px; text-align:center; font-weight:bold;">${formatNumber(Math.round(math.annualGross))}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding:6px; text-align:center; font-weight:bold; background:#eaeaea;">ينزل ما يلي</td>
        </tr>
        <tr>
          <td style="padding:6px;">2 أ) مجموع السماح القانوني المستحق خلال السنة</td>
          <td style="padding:6px; text-align:center; font-weight:bold;">${formatNumber(Math.round(math.monthlyAllowance * employee.months))}</td>
        </tr>
        <tr>
          <td style="padding:6px;">2 ب) التوقيفات التقاعدية والضمان الاجتماعي المدفوع خلال السنة</td>
          <td style="padding:6px; text-align:center; font-weight:bold;">${formatNumber(Math.round(math.retirement * employee.months))}</td>
        </tr>
        <tr>
          <td style="padding:6px;">2 ج) التنزيلات الواردة في المادة (8) من قانون ضريبة الدخل (113) لسنة 1982 م *</td>
          <td style="padding:6px; text-align:center; font-weight:bold;">${formatNumber(Math.round((math.insurance + employee.alimony) * employee.months))}</td>
        </tr>
        <tr>
          <td style="padding:6px;">2 د) المبلغ من (1ب) بما لا يتجاوز 30 % من المبلغ في السطر (1 أ)</td>
          <td style="padding:6px; text-align:center; font-weight:bold;">${formatNumber(Math.round(math.privateExempt * employee.months))}</td>
        </tr>
        <tr>
          <td style="padding:6px;">2 هـ) المبالغ المعفاة اذا تم تضمينها في جزء الدخل (1) اعلاه</td>
          <td style="padding:6px; text-align:center; font-weight:bold;">0</td>
        </tr>
        <tr style="background:#f4f4f4;">
          <td style="padding:6px; font-weight:bold;">(2) اجمالي التنزيلات</td>
          <td style="padding:6px; text-align:center; font-weight:bold;">${formatNumber(Math.round(math.annualDed))}</td>
        </tr>
        <tr style="background:#eef2ff;">
          <td style="padding:8px 6px; font-weight:bold; font-size:14px;">(3) الدخل الخاضع للضريبة " السطر(1) ناقصا السطر(2) "</td>
          <td style="padding:8px 6px; text-align:center; font-weight:bold; font-size:15px; color:#b91c1c;">${formatNumber(Math.round(math.annualTaxable))}</td>
        </tr>
        <tr>
          <td style="padding:6px; font-weight:bold;">مقدار الضريبة</td>
          <td style="padding:8px 6px; text-align:center; font-weight:bold; font-size:15px; color:#15803d;">${formatNumber(Math.round(math.annualTax))}</td>
        </tr>
      </table>

      <div style="margin-top:15px; font-size:12px;">
        <ul style="margin:0; padding-right:20px; line-height:1.6;">
          <li>تذكر تفاصيل التنزيلات ومبالغها</li>
          <li>اذا كانت الاستمارة تخص احد الزوجين ذو دخل سنوي اقل من 2500000 دينا ويتم دمج دخله مع دخل الزوج الاخر، يتم ارسال المعلومات من هذه الاستمارة الى صاحب العمل الرئيسي للزوج الاخر لغرض احتساب المبلغ الصحيح لضريبة الاستقطاع المباشر لتلك السنة.</li>
          <li>اذا لم تكن صاحب العمل الرئيسي للمنتسب تحجب التنزيلات والسماحات القانونية المنصوص عليها في (2 أ) و (2 ج).</li>
        </ul>
      </div>

      <div style="margin-top:20px; font-weight:bold;">حساب ضريبة الدخل للسنة :</div>
      <div style="margin-top:5px; font-size:12px;">
        اذا كان الدخل الخاضع للضريبة من السطر (3) اعلاه :
        <ul style="margin:5px 0; padding-right:20px; line-height:1.6;">
          <li>لا يتجاوز 250,000 دينار، ادخله في السطر 1 من العمود أ من الجدول ادناه</li>
          <li>اكثر من 250,000 ولا يتجاوز 500,000 دينار، ادخله في السطر 1 من العمود ب من الجدول ادناه</li>
          <li>اكثر من 500,000 ولا يتجاوز 1,000,000 دينار، ادخله في السطر 1 من العمود ج من الجدول ادناه</li>
          <li>اكثر من 1,000,000 ، ادخله في السطر 1 من العمود د من الجدول ادناه</li>
        </ul>
      </div>

      <table style="width:90%; margin:15px auto; border-collapse:collapse; text-align:center; font-size:12px;" border="1">
        <tr style="background:#f9f9f9;">
          <th style="padding:4px; width:40px;"></th>
          <th style="padding:4px;">أ</th>
          <th style="padding:4px;">ب</th>
          <th style="padding:4px;">ج</th>
          <th style="padding:4px;">د</th>
        </tr>
        <tr>
          <td style="padding:4px; font-weight:bold;">1</td>
          <td style="padding:4px;">${bCell('a', annualTaxable)}</td>
          <td style="padding:4px;">${bCell('b', annualTaxable)}</td>
          <td style="padding:4px;">${bCell('c', annualTaxable)}</td>
          <td style="padding:4px;">${bCell('d', annualTaxable)}</td>
        </tr>
        <tr style="color:#666;">
          <td style="padding:4px;">2</td>
          <td style="padding:4px;">صفر دينار</td>
          <td style="padding:4px;">250,000</td>
          <td style="padding:4px;">500,000</td>
          <td style="padding:4px;">1,000,000</td>
        </tr>
        <tr>
          <td style="padding:4px; font-weight:bold;">3</td>
          <td style="padding:4px;">${bCell('a', row3Amount)}</td>
          <td style="padding:4px;">${bCell('b', row3Amount)}</td>
          <td style="padding:4px;">${bCell('c', row3Amount)}</td>
          <td style="padding:4px;">${bCell('d', row3Amount)}</td>
        </tr>
        <tr style="color:#666;">
          <td style="padding:4px;">4</td>
          <td style="padding:4px;">%3</td>
          <td style="padding:4px;">%5</td>
          <td style="padding:4px;">%10</td>
          <td style="padding:4px;">%15</td>
        </tr>
        <tr>
          <td style="padding:4px; font-weight:bold;">5</td>
          <td style="padding:4px;">${bCell('a', row5Amount)}</td>
          <td style="padding:4px;">${bCell('b', row5Amount)}</td>
          <td style="padding:4px;">${bCell('c', row5Amount)}</td>
          <td style="padding:4px;">${bCell('d', row5Amount)}</td>
        </tr>
        <tr style="color:#666;">
          <td style="padding:4px;">6</td>
          <td style="padding:4px;">صفر دينار</td>
          <td style="padding:4px;">7,500 دينار</td>
          <td style="padding:4px;">20,000 دينار</td>
          <td style="padding:4px;">70,000 دينار</td>
        </tr>
        <tr>
          <td style="padding:4px; font-weight:bold;">7</td>
          <td style="padding:4px; font-weight:bold;">${bCell('a', row7Amount)}</td>
          <td style="padding:4px; font-weight:bold;">${bCell('b', row7Amount)}</td>
          <td style="padding:4px; font-weight:bold;">${bCell('c', row7Amount)}</td>
          <td style="padding:4px; font-weight:bold;">${bCell('d', row7Amount)}</td>
        </tr>
      </table>

      <div style="display:flex; justify-content:space-between; margin-top:40px;">
        <div style="text-align:center;">
          توقيع المحاسب __________________ <br><br>
          التاريخ &nbsp; &nbsp;/&nbsp; &nbsp;/&nbsp; &nbsp; &nbsp;
        </div>
        <div style="text-align:center;">
          توقيع المدير __________________ <br><br>
          التاريخ &nbsp; &nbsp;/&nbsp; &nbsp;/&nbsp; &nbsp; &nbsp;
        </div>
      </div>
    </div>
  `;

  return page1 + page2;
}
function showEmployeeDD4A(employee, fromContract) {
  var printArea = document.getElementById('dd4aPrintableArea');
  var hint = document.getElementById('dd4aPreviewHint');
  if (!printArea) return;
  printArea.innerHTML = buildEmployeeDD4AHtml(employee);
  printArea.style.display = 'block';
  if (hint) hint.style.display = 'none';
  currentDd4aEmployeeId = employee.id;
  if (!fromContract) {
    printArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

window.printEmployeeDD4A = function(id) {
  var employee = globalEmployees.find(function(item) { return item.id === id; });
  if (!employee) {
    showToast('تعذر العثور على بيانات الموظف', true);
    return;
  }
  showEmployeeDD4A(employee);
  showToast('تم عرض استمارة ض.د/14');
};


window.printSpecificEmployeeDD4A = function(empId, type) {
  var targetArray = type === 'contract' ? contractEmployees : globalEmployees;
  var employee = targetArray.find(function(item) { return item.id === empId; });
  if (!employee) {
    showToast('تعذر العثور على بيانات الموظف', true);
    return;
  }
  var html = buildEmployeeDD4AHtml(employee);
  var printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>طباعة استمارة ض.د/14 للموظف</title>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
      <style>
        body { margin: 0; padding: 0; background: #fff; font-family: 'Tajawal', Arial, sans-serif; display: flex; flex-direction: column; align-items: center; }
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { background: white; margin: 0; padding: 0; }
          .page-break { page-break-after: always; margin: 0 !important; border: none !important; box-shadow: none !important; overflow: hidden !important; }
        }
        .page-break { box-sizing: border-box; }
      </style>
    </head>
    <body onload="setTimeout(function(){ window.print(); window.close(); }, 500);">
      ${html}
    </body>
    </html>
  `);
  printWindow.document.close();
};

window.exportContractD14All = function() {
  if (!contractEmployees.length) {
    showToast('يرجى إدخال بيانات الموظفين أولاً', true);
    return;
  }
  var allHtml = contractEmployees.map(function(employee) { 
    return buildEmployeeDD4AHtml(employee); 
  }).join('');
  
  var printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>طباعة استمارات ض.د/14 لعقود الشركة</title>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
      <style>
        body { margin: 0; padding: 0; background: #fff; font-family: 'Tajawal', Arial, sans-serif; display: flex; flex-direction: column; align-items: center; }
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { background: white; margin: 0; padding: 0; }
          .page-break { page-break-after: always; margin: 0 !important; border: none !important; box-shadow: none !important; overflow: hidden !important; }
          div[style*="page-break-after:always"] { page-break-after: always; }
        }
        .page-break { box-sizing: border-box; }
      </style>
    </head>
    <body onload="setTimeout(function(){ window.print(); window.close(); }, 1500);">
      ${allHtml}
    </body>
    </html>
  `);
  printWindow.document.close();
};

window.printCurrentEmployeeDD4A = function() {
  if (!currentDd4aEmployeeId) {
    showToast('اختر موظفاً أولاً من زر استمارة', true);
    return;
  }
  
  var targetArray = globalEmployees; // fallback
  var employee = targetArray.find(function(item) { return item.id === currentDd4aEmployeeId; });
  if (!employee && typeof contractEmployees !== 'undefined') {
    employee = contractEmployees.find(function(item) { return item.id === currentDd4aEmployeeId; });
  }

  if (!employee) {
    showToast('تعذر العثور على بيانات الموظف', true);
    return;
  }
  
  var html = buildEmployeeDD4AHtml(employee);
  
  var printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>طباعة استمارة ض.د/14 للموظف</title>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
      <style>
        body { margin: 0; padding: 0; background: #fff; font-family: 'Tajawal', Arial, sans-serif; display: flex; flex-direction: column; align-items: center; }
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { background: white; margin: 0; padding: 0; }
          .page-break { page-break-after: always; margin: 0 !important; border: none !important; box-shadow: none !important; overflow: hidden !important; }
        }
        .page-break { box-sizing: border-box; }
      </style>
    </head>
    <body onload="setTimeout(function(){ window.print(); window.close(); }, 500);">
      ${html}
    </body>
    </html>
  `);
  printWindow.document.close();
};

window.exportCurrentEmployeeDD4APdf = function() {
  if (!currentDd4aEmployeeId) {
    showToast('اختر موظفاً أولاً من زر استمارة', true);
    return;
  }
  var employee = globalEmployees.find(function(item) { return item.id === currentDd4aEmployeeId; });
  var printArea = document.getElementById('dd4aPrintableArea');
  if (!employee || !printArea) {
    showToast('تعذر تجهيز الاستمارة', true);
    return;
  }
  if (typeof html2pdf === 'undefined') {
    showToast('مكتبة PDF غير متاحة حالياً', true);
    return;
  }
  html2pdf().set({ margin: 8, filename: 'استمارة_ض_د_14_' + (employee.name || 'employee') + '.pdf', html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } }).from(printArea).save();
};

window.renderEmployeeList = function() {
  var tbody = document.getElementById('empTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  var totalGross = 0;
  var totalDed = 0;
  var totalTaxable = 0;
  var totalAnnual = 0;
  
  var currentYear = document.getElementById('closeTaxYear_Year') ? document.getElementById('closeTaxYear_Year').value : new Date().getFullYear();
  
  globalEmployees.forEach(function(employee, index) {
    var ytd = getEmpYTD(employee.id, currentYear);
    var currentMath = doExcelMathForEmployee(employee); // for current month
    
    // We add current projection if no snapshots to help out
    var displayAnnTax = ytd.count > 0 ? ytd.tax : currentMath.annualTax;
    var displayMonths = ytd.count > 0 ? ytd.count + ' مقفل' : 'توقعي';
    var displayGross = ytd.count > 0 ? ytd.gross : currentMath.annualGross;
    
    totalGross += displayGross;
    totalDed += (ytd.count > 0 ? ytd.ded : currentMath.annualDed);
    totalTaxable += (ytd.count > 0 ? ytd.taxable : currentMath.annualTaxable);
    totalAnnual += displayAnnTax;
    
    var sectorLabel = employee.sec === 'private' ? 'خاص' : 'حكومي';
    var row = document.createElement('tr');
    row.innerHTML = '<td>' + (index + 1) + '</td>' +
      '<td style="font-weight:bold;">' + employee.name + '</td>' +
      '<td><span class="status-badge" style="background:#e0f2fe;color:#0369a1;">' + sectorLabel + '</span></td>' +
      '<td>' + formatNumber(Math.round(displayGross)) + '</td>' +
      '<td>' + formatNumber(Math.round(currentMath.monthlyTax)) + '</td>' + // The modified table structure
      '<td style="color:#64748b;font-weight:bold;">' + displayMonths + '</td>' +
      '<td>' + formatNumber(Math.round(currentMath.monthlyTax)) + '</td>' +
      '<td style="color:#28a745;font-weight:bold;">' + formatNumber(Math.round(displayAnnTax)) + '</td>' +
      '<td style="white-space:nowrap;">' +
      '<button class="btn btn-sm btn-info" onclick="openEmployeeModal(\'' + employee.id + '\')"><i class="fas fa-edit"></i></button> ' +
      '<button class="btn btn-sm btn-danger" onclick="removeExtEmployee(\'' + employee.id + '\')"><i class="fas fa-trash"></i></button>' +
      '</td>';
    tbody.appendChild(row);
  });
  setText('tblTotGross', formatNumber(Math.round(totalGross)));
  setText('tblTotDed', formatNumber(Math.round(totalDed)));
  setText('tblTotTaxable', formatNumber(Math.round(totalTaxable)));
  setText('tblTotAnnual', formatNumber(Math.round(totalAnnual)) + ' د.ع');
};

window.exportEmployeeTableToExcel = function() {
  if (typeof XLSX === 'undefined') {
    showToast('مكتبة Excel غير متاحة حالياً', true);
    return;
  }
  var table = document.getElementById('newExcelEmployeeTable');
  if (!table) {
    showToast('تعذر العثور على جدول الموظفين', true);
    return;
  }
  var wb = XLSX.utils.table_to_book(table, { sheet: 'حسابات الموظفين' });
  XLSX.writeFile(wb, 'employee_tax_results.xlsx');
};

window.exportD14Excel = function() {
  if (typeof XLSX === 'undefined') {
    showToast('مكتبة Excel غير متاحة حالياً', true);
    return;
  }
  if (!globalEmployees || globalEmployees.length === 0) {
    showToast('يرجى إدخال بيانات الموظفين أولاً', true);
    return;
  }
  var exportData = [];
  globalEmployees.forEach(function(emp, idx) {
    var math = doExcelMathForEmployee(emp);
    exportData.push({
      "ت": idx + 1,
      "اسم الموظف": emp.name || "",
      "القطاع": emp.sec === 'private' ? 'خاص' : 'حكومي',
      "مقيم": emp.res === 'resident' ? 'نعم' : 'كلا',
      "الحالة الزوجية": emp.marital === 'single' ? 'أعزب' : (emp.marital === 'married_housewife' || emp.marital === 'married_working' ? 'متزوج' : (emp.marital === 'widowed' ? 'أرمل' : 'مطلق')),
      "عدد الأولاد": emp.child || 0,
      "أشهر العمل": emp.months || 12,
      "الراتب الاسمي الشهري": emp.salary || 0,
      "المخصصات الشهرية الخاضعة": emp.allow || 0,
      "إجمالي الدخل السنوي": math.annualGross || 0,
      "التنزيلات السنوية (تقاعد/تأمين)": math.annualDed || 0,
      "الوعاء الضريبي (الصافي)": math.annualTaxable || 0,
      "الضريبة الشهرية": math.monthlyTax || 0,
      "الضريبة السنوية": math.annualTax || 0,
      "صاحب العمل": emp.employerName || "",
      "العنوان الوظيفي": emp.jobTitle || ""
    });
  });
  
  var ws = XLSX.utils.json_to_sheet(exportData);
  // Add some column widths
  ws['!cols'] = [
    { wch: 5 }, { wch: 25 }, { wch: 10 }, { wch: 10 }, { wch: 15 },
    { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 20 }, { wch: 20 },
    { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 }
  ];
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "الكشف السنوي ض.د14");
  XLSX.writeFile(wb, 'الكشف_السنوي_ض_د14_لجميع_الموظفين.xlsx');
  showToast('تم تصدير استمارة ض.د/14 (Excel) بنجاح');
};

window.printComprehensiveEmployeeReport = function() {
  if (!globalEmployees || globalEmployees.length === 0) {
    showToast('يرجى إدخال بيانات الموظفين أولاً', true);
    return;
  }
  var html = `
    <html dir="rtl" lang="ar">
    <head>
      <title>البرونت التفصيلي الشامل لموظفي الشركة</title>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Tajawal', Arial, sans-serif; padding: 20px; background: #fff; color: #111; font-size: 13px; line-height: 1.5; }
        .header { text-align: center; margin-bottom: 25px; border-bottom: 3px double #1e3a8a; padding-bottom: 15px; }
        .header h1 { margin: 0 0 10px; font-size: 26px; color: #1e3a8a; font-weight: 900; }
        .header p { margin: 4px 0; font-size: 14px; color: #4b5563; font-weight: 700; }
        
        .emp-card { border: 2px solid #94a3b8; margin-bottom: 30px; page-break-inside: avoid; border-radius: 12px; overflow: hidden; background: #f8fafc; }
        .emp-header { background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: #fff; padding: 12px 18px; font-weight: bold; font-size: 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1d4ed8; }
        .emp-body { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; padding: 15px; }
        
        .emp-section { background: #fff; border: 1px solid #cbd5e1; padding: 12px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.02); }
        .emp-section h4 { margin: 0 0 12px 0; font-size: 14px; color: #1e40af; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; }
        
        .row { display: flex; justify-content: space-between; margin-bottom: 6px; border-bottom: 1px dashed #f1f5f9; padding-bottom: 4px; }
        .row span:first-child { color: #64748b; font-weight: 700; }
        .val { font-weight: bold; color: #0f172a; text-align: left; }
        
        .totals-table { width: 100%; border-collapse: collapse; margin-top: 30px; border-radius: 8px; overflow: hidden; }
        .totals-table th, .totals-table td { border: 1px solid #cbd5e1; padding: 12px; text-align: center; }
        .totals-table th { background: #1e3a8a; color: #fff; font-weight: 700; font-size: 14px; }
        .totals-table td { background: #fff; font-size: 15px; }
        
        @media print {
          body { padding: 0; background: #fff; }
          .emp-card { margin-bottom: 20px; border-color: #000; background: #fff; }
          .emp-header { background: #eee !important; color: #000 !important; -webkit-print-color-adjust: exact; border-color: #000; }
          .emp-section { border-color: #999; box-shadow: none; }
          .totals-table th { background: #ddd !important; color: #000 !important; -webkit-print-color-adjust: exact; }
          .row span { color: #000 !important; }
        }
      </style>
    </head>
    <body onload="window.print(); window.close();">
      <div class="header">
        <h1>السجل الأساسي الشامل - ضريبة الدخل لموظفي الشركة</h1>
        <p>يتضمن كافة البيانات الشخصية والوظيفية والمالية التفصيلية لغرض التدقيق الضريبي</p>
        <p style="background: #eef2ff; display: inline-block; padding: 5px 15px; border-radius: 20px; border: 1px solid #c7d2fe;">تاريخ الاستخراج: ${new Date().toLocaleDateString('ar-IQ')} | العدد الكلي: ${globalEmployees.length} موظف</p>
      </div>
  `;

  
  var totGross = 0, totDed = 0, totTaxable = 0, totMonth = 0, totAnn = 0;
  var currentYear = document.getElementById('closeTaxYear_Year') ? document.getElementById('closeTaxYear_Year').value : new Date().getFullYear();
  
  globalEmployees.forEach(function(emp, idx) {
    var math = doExcelMathForEmployee(emp);
    var ytd = getEmpYTD(emp.id, currentYear);
    
    // Fallbacks if not locked:
    var annualGross = ytd.count > 0 ? ytd.gross : math.annualGross;
    var annualDed = ytd.count > 0 ? ytd.ded : math.annualDed;
    var annualTaxable = ytd.count > 0 ? ytd.taxable : math.annualTaxable;
    var annualTax = ytd.count > 0 ? ytd.tax : math.annualTax;
    
    totGross += annualGross;
    totDed += annualDed;
    totTaxable += annualTaxable;
    totMonth += math.monthlyTax;
    totAnn += annualTax;
    
    var maritalStr = emp.marital === 'single' ? 'أعزب' : (emp.marital === 'married_housewife' ? 'متزوج (بلا دخل)' : (emp.marital === 'married_working' ? 'متزوج (منتسب)' : (emp.marital === 'widowed' ? 'أرمل' : 'مطلق')));
    var secStr = emp.sec === 'private' ? 'خاص' : 'حكومي';
    var natStr = emp.nat === 'iraqi' ? 'عراقي' : 'أجنبي';
    var resStr = emp.res === 'resident' ? 'مقيم' : 'غير مقيم';
    
    var inKindStr = emp.inKind === 'furnished' ? 'مؤثث (٢٠٪)' : (emp.inKind === 'unfurnished' ? 'غير مؤثث (١٠٪)' : 'لا يوجد');

    html += `
    <div class="emp-card">
      <div class="emp-header">
        <span><i class="fas fa-id-badge"></i> متسلسل: ${idx + 1} | اسم الموظف: ${emp.name || 'غير محدد'}</span>
        <span>القطاع: ${secStr}</span>
      </div>
      <div class="emp-body">
        
        <!-- القسم الأول -->
        <div class="emp-section">
          <h4>1. البيانات الشخصية والسكن</h4>
          <div class="row"><span>الميلاد:</span> <span class="val">${emp.birthDate || '-'}</span></div>
          <div class="row"><span>الجنس / الجنسية:</span> <span class="val">${emp.gender === 'female' ? 'أنثى' : 'ذكر'} / ${natStr}</span></div>
          <div class="row"><span>الهوية / البطاقة:</span> <span class="val">${emp.civilId || '-'}</span></div>
          <div class="row"><span>الهاتف:</span> <span class="val" dir="ltr">${emp.phone || '-'}</span></div>
          <div class="row"><span>الإقامة الضريبية:</span> <span class="val">${resStr}</span></div>
          <div class="row"><span>المحافظة والمدينة:</span> <span class="val">${emp.province || '-'} - ${emp.city || '-'}</span></div>
          <div class="row"><span>تفاصيل السكن:</span> <span class="val">${emp.neighborhood || '-'} - م:${emp.street || '-'}</span></div>
        </div>

        <!-- القسم الثاني -->
        <div class="emp-section">
          <h4>2. الوظيفة والحالة العائلية</h4>
          <div class="row"><span>جهة العمل:</span> <span class="val">${emp.employerName || '-'}</span></div>
          <div class="row"><span>صاحب عمل رئيسي:</span> <span class="val">${emp.mainEmployer === 'yes' ? 'نعم (يستحق سماحات)' : 'كلا (يحجب)'}</span></div>
          <div class="row"><span>العنوان الوظيفي:</span> <span class="val">${emp.jobTitle || '-'}</span></div>
          <div class="row"><span>الأشهر المقفلة بالسجل (للسنة):</span> <span class="val" style="color:#2563eb;">${ytd.count > 0 ? ytd.count + ' شهراً مقفلاً' : 'لم تُقفل (حساب تقديري)'}</span></div>
          <div class="row"><span>الحالة الزوجية:</span> <span class="val">${maritalStr}</span></div>
          <div class="row"><span>اسم الزوج(ة):</span> <span class="val">${emp.spouseName || '-'}</span></div>
          <div class="row"><span>عدد الأولاد (للسماح):</span> <span class="val">${emp.child || 0}</span></div>
          <div class="row"><span>الموظف أتم الـ 63عاما:</span> <span class="val">${emp.over63 === 'yes' ? 'نعم' : 'كلا'}</span></div>
        </div>

        <!-- القسم الثالث -->
        <div class="emp-section">
          <h4>3. المالية والنتيجة الضريبية (بالدينار)</h4>
          <div class="row"><span>الراتب الاسمي المتكرر (آخر شهر):</span> <span class="val">${formatNumber(emp.salary)}</span></div>
          <div class="row"><span>مخصصات أخرى:</span> <span class="val">${formatNumber(emp.allow)}</span></div>
          <div class="row"><span>السكن العيني:</span> <span class="val">${inKindStr}</span></div>
          
          <div class="row" style="background:#e0e7ff; padding:4px 6px; margin-top:8px; border-bottom:0; border-radius:4px;">
            <span>الوعاء الإجمالي الكلي:</span> <span class="val">${formatNumber(Math.round(annualGross))}</span>
          </div>
          <div class="row" style="background:#fee2e2; padding:4px 6px; border-bottom:0; border-radius:4px; margin-top:4px;">
            <span>مجموع التنزيلات المنفَذة قانوناً:</span> <span class="val">${formatNumber(Math.round(annualDed))}</span>
          </div>
          <div class="row" style="background:#fef3c7; padding:4px 6px; border-bottom:0; border-radius:4px; margin-top:4px;">
            <span>الوعاء الخاضع (الصافي) التراكمي:</span> <span class="val" style="color:#b45309;">${formatNumber(Math.round(annualTaxable))}</span>
          </div>
          <div class="row" style="background:#dcfce7; padding:8px 6px; border-bottom:0; border-radius:4px; margin-top:4px;">
            <span style="font-size:14px;">الضريبة المستحقة (تراكمي لآخر اللقطات):</span> <span class="val" style="color:#166534; font-size:16px;">${formatNumber(Math.round(annualTax))}</span>
          </div>
        </div>
        
      </div>
    </div>
    `;
  });


  html += `
      <h3 style="margin-top:40px; text-align:center; color:#1e3a8a; border-bottom:2px solid; display:inline-block; padding-bottom:5px;">الإجماليات الكلية لعموم الشركة (خلاصة السجل)</h3>
      <table class="totals-table">
        <thead>
          <tr>
            <th>إجمالي الموظفين</th>
            <th>إجمالي الدخول السنوية</th>
            <th>إجمالي التنزيلات السنوية</th>
            <th>الوعاء الضريبي الموحد (الصافي)</th>
            <th>مجموع الخصم الضريبي الشهري</th>
            <th>الضريبة السنوية الكلية المستحقة</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="font-weight:900;">${globalEmployees.length}</td>
            <td style="font-weight:bold;">${formatNumber(Math.round(totGross))}</td>
            <td style="font-weight:bold;">${formatNumber(Math.round(totDed))}</td>
            <td style="font-weight:900; color:#b91c1c;">${formatNumber(Math.round(totTaxable))}</td>
            <td style="font-weight:bold;">${formatNumber(Math.round(totMonth))}</td>
            <td style="font-weight:900; color:#15803d; font-size:18px;">${formatNumber(Math.round(totAnn))} د.ع</td>
          </tr>
        </tbody>
      </table>
      
      <div style="display:flex; justify-content:space-around; margin-top:70px; font-size:16px;">
        <div style="text-align:center;">
          <strong>إعداد وتدقيق المحاسب المختص</strong><br><br><br>
          <div style="width:250px; border-bottom:2px dashed #999; margin:auto;"></div>
        </div>
        <div style="text-align:center;">
          <strong>مصادقة المدير المفوّض / مدير الإدارة</strong><br><br><br>
          <div style="width:250px; border-bottom:2px dashed #999; margin:auto;"></div><br>
          <span style="font-size:12px; color:#666;">التوقيع والختم</span>
        </div>
      </div>
    </body>
    </html>
  `;
  
  var printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
};


window.renderContractEmployeeList = function() {
  var tbody = document.getElementById('contEmpTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  var currentYear = document.getElementById('closeTaxYear_Year') ? document.getElementById('closeTaxYear_Year').value : new Date().getFullYear();
  
  var totalGross = 0;
  var totalDed = 0;
  var totalTaxable = 0;
  var totalAnnual = 0;

  contractEmployees.forEach(function(employee, index) {
    var ytd = getEmpYTD(employee.id, currentYear);
    var currentMath = doExcelMathForEmployee(employee);
    
    var displayAnnTax = ytd.count > 0 ? ytd.tax : currentMath.annualTax;
    var displayMonths = ytd.count > 0 ? ytd.count + ' مقفل' : 'توقعي';
    var displayGross = ytd.count > 0 ? ytd.gross : currentMath.annualGross;
    
    totalGross += displayGross;
    totalDed += (ytd.count > 0 ? ytd.ded : currentMath.annualDed);
    totalTaxable += (ytd.count > 0 ? ytd.taxable : currentMath.annualTaxable);
    totalAnnual += displayAnnTax;

    var sectorLabel = employee.sec === 'private' ? 'خاص' : 'حكومي';
    var row = document.createElement('tr');
    row.innerHTML = '<td>' + (index + 1) + '</td>' +
      '<td style="font-weight:bold;">' + employee.name + '</td>' +
      '<td><span class="status-badge" style="background:#e0f2fe;color:#0369a1;">' + sectorLabel + '</span></td>' +
      '<td>' + formatNumber(Math.round(displayGross)) + '</td>' +
      '<td>' + formatNumber(Math.round(currentMath.monthlyTax)) + '</td>' + 
      '<td style="color:#64748b;font-weight:bold;">' + displayMonths + '</td>' +
      '<td>' + formatNumber(Math.round(currentMath.monthlyTax)) + '</td>' +
      '<td style="color:#28a745;font-weight:bold;">' + formatNumber(Math.round(displayAnnTax)) + '</td>' +
      '<td style="white-space:nowrap;">' +
      '<button class="btn btn-sm btn-info" onclick="openEmployeeModal(\'' + employee.id + '\', \'contract\')"><i class="fas fa-edit"></i></button> ' +
      '<button class="btn btn-sm btn-danger" onclick="removeContractExtEmployee(\'' + employee.id + '\')"><i class="fas fa-trash"></i></button>' +
      '</td>';
    tbody.appendChild(row);
  });
};
window.removeContractExtEmployee = function(id) {
  if (confirm('تأكيد حذف موظف العقد؟')) {
    contractEmployees = contractEmployees.filter(function(item) { return item.id !== id; });
    saveStoredEmployees();
    if(typeof renderContractEmployeeList === 'function') renderContractEmployeeList();
    showToast('تم حذف موظف العقد');
  }
};
window.openContractEmpModal = function() {
  openEmployeeModal(null, 'contract');
};

function addCompanyEmployeeRow() {
  openEmployeeModal();
}

function removeCompanyEmployeeRow() {}

function exportFormD14() {
  var currentYear = document.getElementById('closeTaxYear_Year') ? document.getElementById('closeTaxYear_Year').value : new Date().getFullYear();
  var emps = getMergedEmployeesForYear(currentYear);
  if (!emps.length) {
    showToast('لا توجد بيانات موظفين أو لقطات لهذه السنة', true);
    return;
  }
  var allHtml = emps.map(function(employee) { 
    return buildEmployeeDD4AHtml(employee); 
  }).join('');

  
  var printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>طباعة استمارات ض.د/14 للجميع (PDF)</title>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
      <style>
        body { margin: 0; padding: 0; background: #fff; font-family: 'Tajawal', Arial, sans-serif; display: flex; flex-direction: column; align-items: center; }
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { background: white; margin: 0; padding: 0; }
          .page-break { page-break-after: always; margin: 0 !important; border: none !important; box-shadow: none !important; overflow: hidden !important; }
          div[style*="page-break-after:always"] { page-break-after: always; }
        }
        .page-break { box-sizing: border-box; }
      </style>
    </head>
    <body onload="setTimeout(function(){ window.print(); window.close(); }, 1500);">
      ${allHtml}
    </body>
    </html>
  `);
  printWindow.document.close();
}

function exportAnnualMemo() {
  
  if (typeof html2pdf === 'undefined') {
    showToast('مكتبة PDF غير متاحة حالياً', true);
    return;
  }
  var totalMonthly = 0;
  var totalAnnual = 0;
  var html = '<div style="direction:rtl;font-family:Tajawal,sans-serif;padding:30px;">' +
    '<div style="text-align:center;margin-bottom:30px;"><h2>المذكرة السنوية</h2><p>ملخص ضريبة رواتب الموظفين للسنة المالية</p></div>' +
    '<table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#065f46;color:#fff;">' +
    '<th style="border:1px solid #333;padding:10px;">ت</th><th style="border:1px solid #333;padding:10px;">اسم الموظف</th><th style="border:1px solid #333;padding:10px;">الراتب الشهري</th><th style="border:1px solid #333;padding:10px;">الضريبة الشهرية</th><th style="border:1px solid #333;padding:10px;">الضريبة السنوية</th></tr></thead><tbody>';
  globalEmployees.forEach(function(employee, index) {
    totalMonthly += employee.monthlyTax;
    totalAnnual += employee.annualTax;
    html += '<tr><td style="border:1px solid #ccc;padding:8px;text-align:center;">' + (index + 1) + '</td>' +
      '<td style="border:1px solid #ccc;padding:8px;">' + employee.name + '</td>' +
      '<td style="border:1px solid #ccc;padding:8px;text-align:center;">' + formatNumber(Math.round(employee.salary)) + '</td>' +
      '<td style="border:1px solid #ccc;padding:8px;text-align:center;">' + formatNumber(Math.round(employee.monthlyTax)) + ' د.ع</td>' +
      '<td style="border:1px solid #ccc;padding:8px;text-align:center;">' + formatNumber(Math.round(employee.annualTax)) + ' د.ع</td></tr>';
  });
  html += '<tr style="background:#f0fdf4;font-weight:bold;"><td colspan="3" style="border:1px solid #ccc;padding:10px;">المجموع</td><td style="border:1px solid #ccc;padding:10px;text-align:center;">' + formatNumber(Math.round(totalMonthly)) + ' د.ع</td><td style="border:1px solid #ccc;padding:10px;text-align:center;">' + formatNumber(Math.round(totalAnnual)) + ' د.ع</td></tr></tbody></table></div>';
  var memoEl = document.createElement('div');
  memoEl.innerHTML = html;
  document.body.appendChild(memoEl);
  html2pdf().set({ margin: 10, filename: 'المذكرة_السنوية.pdf', jsPDF: { direction: 'rtl' } }).from(memoEl).save().then(function() { document.body.removeChild(memoEl); });
}

// ========== ANNUAL STATEMENT (الكشف السنوي) ==========
function exportAnnualStatement() {
  
  if (typeof XLSX === 'undefined') {
    showToast('مكتبة XLSX غير متاحة', true);
    return;
  }

  var currentYear = document.getElementById('closeTaxYear_Year') ? document.getElementById('closeTaxYear_Year').value : new Date().getFullYear();
  var emps = getMergedEmployeesForYear(currentYear);
  if (!emps.length) { showToast('لا توجد بيانات للموظفين لهذه السنة', true); return; }
  var employerName = '';
  var employerId = '';
  if (emps.length > 0 && emps[0].employerName) {
    employerName = emps[0].employerName;
    employerId = emps[0].employerId || '';
  }

  var wb = XLSX.utils.book_new();
  var rows = [];

  function calcYTDForRow(e) {
    var math = doExcelMathForEmployee({
      nat: e.nat, res: e.res, marital: e.marital, child: e.child, over63: e.over63,
      salary: e.salary, allow: e.allow, cashHous: e.cashHous, inKind: e.inKind,
      ins: e.ins, alimony: e.alimony, months: e.months, sec: e.sec
    });
    var ytd = getEmpYTD(e.id, currentYear);
    var isYTD = ytd && ytd.count > 0;
    return {
      income: isYTD ? ytd.gross : math.annualGross,
      deductions: isYTD ? ytd.ded : math.annualDed,
      taxable: isYTD ? ytd.taxable : math.annualTaxable,
      liability: isYTD ? ytd.tax : math.annualTax,
      paid: isYTD ? ytd.tax : math.monthlyTax * (e.months || 12),
      months: isYTD ? ytd.count : (e.months || 12)
    };
  }

  // Row 0: الهيدر الرسمي (مطابق لاستمارة ض.د/14)
  rows.push(['جمهورية العراق','وزارة المالية','الهيئة العامة للضرائب','','','الاستمارة ض. د / 14','','','خاصة بالمنتسبين الخاضعين للضريبة بطريق الاستقطاع المباشر','','','رقم الاستمارة :','1','السنة المالية : ' + currentYear]);
  // Row 1: اسم رب العمل
  rows.push(['','','','','','','اسم رب العمل : ' + employerName,'','','','','','','','']);
  // Row 2: الرقم التعريفي + صفحة
  rows.push(['','','','','','','الرقم التعريفي لرب العمل : ' + employerId,'','','','','','صفحة :','1']);
  // Row 3: عنوان الجدول
  rows.push(['','','','','','','','','جدول استقطاع ضريبة الدخل','','','','','','']);
  // Row 4: السنة المالية
  rows.push(['','','','','','','','السنة المالية ' + currentYear,'','','','','','','']);
  // Row 5: أرقام الأعمدة
  rows.push(['2','ا','ت','1','2','3','4','5','6','7','8','9','10','11','12']);
  // Row 6: عناوين الأعمدة
  rows.push(['اسم المستخدم','','#','رقم الاضبارة ض.د/14','اسم المستخدم','رقم هوية الاحوال المدنية','اجمالي الدخل','اجمالي المبالغ المنزلة','الدخل الخاضع للضريبة','الاستحقاق الضريبي','الضريبة المدفوعة خلال السنة','الضريبة غير المدفوعة','الضريبة الزائدة','فترة العمل من  /   /       الى  /  /','رب العمل']);

  var GROUP_SIZE = 20;
  var grandTotal = { income: 0, deductions: 0, taxable: 0, liability: 0 };
  var groupStart = 0;

  function addSubtotal(income, deductions, taxable, liability) {
    return ['المجموع الفرعي','','','','المجموع الفرعي','',income,deductions,taxable,liability,'','','','',''];
  }

  for (var i = 0; i < emps.length; i++) {
    var e = emps[i];
    var empStart = e.startDate || '';
    var empEnd = e.endDate || '';
    var workPeriod = empStart + ' الى ' + empEnd;

    var calc = calcYTDForRow(e);
    var annualIncome = calc.income;
    var annualDeductions = calc.deductions;
    var taxableIncome = calc.taxable;
    var taxLiability = calc.liability;
    var taxPaid = calc.paid;
    var unpaidTax = Math.max(0, taxLiability - taxPaid);
    var excessTax = Math.max(0, taxPaid - taxLiability);

    grandTotal.income += annualIncome;
    grandTotal.deductions += annualDeductions;
    grandTotal.taxable += taxableIncome;
    grandTotal.liability += taxLiability;

    var regNumber = 'DD14-' + currentYear + '-' + String(i + 1).padStart(3, '0');

    rows.push([
      '',
      i + 1,
      i + 1,
      regNumber,
      e.name || '',
      e.civilId || '',
      Math.round(annualIncome),
      Math.round(annualDeductions),
      Math.round(taxableIncome),
      Math.round(taxLiability),
      Math.round(taxPaid),
      Math.round(unpaidTax),
      Math.round(excessTax),
      workPeriod,
      e.employerName || employerName
    ]);

    // Add subtotal every 20 rows
    if ((i + 1) % GROUP_SIZE === 0 || i === emps.length - 1) {
      rows.push(addSubtotal(
        Math.round(grandTotal.income),
        Math.round(grandTotal.deductions),
        Math.round(grandTotal.taxable),
        Math.round(grandTotal.liability)
      ));
      grandTotal = { income: 0, deductions: 0, taxable: 0, liability: 0 };
    }
  }

  // Grand total row
  var totalPaid = 0, totalUnpaid = 0, totalExcess = 0;
  emps.forEach(function(e) {
    var calc = calcYTDForRow(e);
    totalPaid += calc.paid;
    totalUnpaid += Math.max(0, calc.liability - calc.paid);
    totalExcess += Math.max(0, calc.paid - calc.liability);
  });
  var grandIncome = 0, grandDed = 0, grandTaxable = 0, grandLiability = 0;
  emps.forEach(function(e) {
    var c2 = calcYTDForRow(e);
    grandIncome += c2.income; grandDed += c2.deductions; grandTaxable += c2.taxable; grandLiability += c2.liability;
  });

  rows.push(['الجموع الكلي', emps.length, '', '', 'الجموع الكلي', '',
    Math.round(grandIncome), Math.round(grandDed), Math.round(grandTaxable),
    Math.round(grandLiability), Math.round(totalPaid), Math.round(totalUnpaid), Math.round(totalExcess), '', '']);

  var ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths
  ws['!cols'] = [
    { wch: 12 }, { wch: 6 }, { wch: 6 }, { wch: 20 }, { wch: 22 },
    { wch: 18 }, { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 16 },
    { wch: 22 }, { wch: 18 }, { wch: 16 }, { wch: 28 }, { wch: 20 }
  ];

  // Set RTL
  ws['!cols'].forEach(function(c) { c.wch = c.wch; });

  XLSX.utils.book_append_sheet(wb, ws, 'الكشف السنوي ' + currentYear);
  XLSX.writeFile(wb, 'الكشف_السنوي_' + currentYear + '_' + (employerName || 'الشركة').replace(/\s/g, '_') + '.xlsx');
  showToast('تم تصدير الكشف السنوي بنجاح — ' + emps.length + ' موظف');
  addAuditEntry('تصدير الكشف السنوي', emps.length + ' موظف');
}


function normalizeMaritalStatus(val) {
  if (!val) return 'single';
  var s = String(val).trim().replace(/أ/g, 'ا').replace(/إ/g,'ا').replace(/ة/g,'ه');
  if (s.indexOf('اعزب') !== -1) return 'single';
  if (s.indexOf('ارمل') !== -1) return 'widowed';
  if (s.indexOf('مطلق') !== -1) return 'divorced';
  if (s.indexOf('زوجة تعمل') !== -1) return 'married_working';
  if (s.indexOf('ربه بيت') !== -1 || s.indexOf('ربة بيت') !== -1) return 'married_housewife';
  if (s.indexOf('متزوج') !== -1) return 'married_working'; // fallback for 'متزوج'
  return 'single';
}
function normalizeSector(val) {
  if (!val) return 'government';
  if (String(val).indexOf('خاص') !== -1) return 'private';
  return 'government';
}
function normalizeResidence(val) {
  if (!val) return 'resident'; // But rule 5.7 says make it mandatory. In import, we fallback to resident.
  if (String(val).indexOf('غير مقيم') !== -1) return 'nonresident';
  return 'resident';
}

function normalizeImportedEmployee(e) {
  // Use mapping or existing logic and normalize
  e.marital = normalizeMaritalStatus(e.marital);
  e.sec = normalizeSector(e.sec);
  e.res = normalizeResidence(e.res);
  return e;
}

function importAnnualStatement(inputEl) {
  if (!inputEl || !inputEl.files || !inputEl.files[0]) return;
  if (typeof XLSX === 'undefined') {
    showToast('مكتبة XLSX غير متاحة', true);
    return;
  }

  var file = inputEl.files[0];
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var data = new Uint8Array(e.target.result);
      var wb = XLSX.read(data, { type: 'array' });
      var ws = wb.Sheets[wb.SheetNames[0]];
      var rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

      // ---- قالب إضافة موظف جديد (نفس حقول نافذة إضافة موظف) ----
      var tplHeaderRow = -1;
      for (var th = 0; th < rows.length; th++) {
        if (rows[th].some(function(cell) { return String(cell).indexOf('اسم الموظف الثلاثي') >= 0; })) {
          tplHeaderRow = th;
          break;
        }
      }
      if (tplHeaderRow !== -1) {
        var tplImported = 0, tplSkipped = 0;
        for (var tr = tplHeaderRow + 1; tr < rows.length; tr++) {
          var trow = rows[tr];
          if (!trow || !trow.length) continue;
          var tname = String(trow[0] || '').trim();
          if (!tname) { tplSkipped++; continue; }
          var tRes = String(trow[2] || '').trim();
          if (!tRes) { showToast('يجب تعبئة عمود "الاقامة" لكل صف (مقيم / غير مقيم)', true); return; }
          var existing = globalEmployees.find(function(e) { return e.name === tname && String(e.civilId || '') === String(trow[5] || '').trim(); });
          if (existing) { tplSkipped++; continue; }
          var tMaritalRaw = String(trow[20] || 'single').trim();
          var tMarital = 'single';
          if (tMaritalRaw.indexOf('ربة بيت') >= 0 || tMaritalRaw.indexOf('ربه بيت') >= 0 || tMaritalRaw === 'married_housewife') tMarital = 'married_housewife';
          else if (tMaritalRaw.indexOf('مطلق') >= 0 || tMaritalRaw === 'divorced') tMarital = 'divorced';
          else if (tMaritalRaw.indexOf('أرمل') >= 0 || tMaritalRaw.indexOf('ارمل') >= 0 || tMaritalRaw === 'widowed') tMarital = 'widowed';
          else if (tMaritalRaw.indexOf('متزوج') >= 0 || tMaritalRaw === 'married_working') tMarital = 'married_working';
          var tEmp = {
            id: 'EMP_' + Date.now() + '_' + tr,
            origId: 'EMP_' + Date.now() + '_' + tr,
            version: 1,
            name: tname,
            nat: String(trow[1] || 'iraqi').trim() === 'foreign' ? 'foreign' : 'iraqi',
            res: normalizeResidence(tRes),
            gender: String(trow[3] || 'male').trim() === 'female' ? 'female' : 'male',
            birthDate: String(trow[4] || '').trim(),
            civilId: String(trow[5] || '').trim(),
            phone: String(trow[6] || '').trim(),
            email: String(trow[7] || '').trim(),
            sec: normalizeSector(trow[8]),
            startDate: String(trow[9] || '').trim(),
            endDate: String(trow[10] || '').trim(),
            mainEmployer: String(trow[11] || 'yes').trim(),
            jobTitle: String(trow[12] || '').trim(),
            employerName: String(trow[13] || '').trim(),
            employerId: String(trow[14] || '').trim(),
            province: String(trow[15] || '').trim(),
            city: String(trow[16] || '').trim(),
            neighborhood: String(trow[17] || '').trim(),
            street: String(trow[18] || '').trim(),
            houseNo: String(trow[19] || '').trim(),
            marital: tMarital,
            marriageDate: String(trow[21] || '').trim(),
            spouseName: String(trow[22] || '').trim(),
            divorceDate: String(trow[23] || '').trim(),
            spouseCivilId: String(trow[24] || '').trim(),
            spouseDisabled: String(trow[25] || 'no').trim() === 'yes' ? 'yes' : 'no',
            spouseEmpName: String(trow[26] || '').trim(),
            spouseEmployed: String(trow[27] || 'no').trim() === 'yes' ? 'yes' : 'no',
            incomeMerge: String(trow[28] || 'no').trim() === 'yes' ? 'yes' : 'no',
            spouseEmpId: String(trow[29] || '').trim(),
            child: Math.max(0, parseInt(trow[30], 10) || 0),
            over63: String(trow[31] || 'no').trim() === 'yes' ? 'yes' : 'no',
            months: Math.max(1, Math.min(12, parseInt(trow[32], 10) || 12)),
            salary: parseFloat(String(trow[33] || '0').replace(/,/g, '')) || 0,
            allow: parseFloat(String(trow[34] || '0').replace(/,/g, '')) || 0,
            cashHous: parseFloat(String(trow[35] || '0').replace(/,/g, '')) || 0,
            inKind: String(trow[36] || 'none').trim(),
            ins: parseFloat(String(trow[37] || '0').replace(/,/g, '')) || 0,
            alimony: parseFloat(String(trow[38] || '0').replace(/,/g, '')) || 0,
            childNames: [],
            importedFromTemplate: true
          };
          tEmp.childNames = [];
          if (tEmp.child > 0) {
            for (var ci = 0; ci < tEmp.child && ci < 6; ci++) {
              var cn = rows[tr] && rows[tr][39 + ci] ? String(rows[tr][39 + ci]).trim() : '';
              tEmp.childNames.push(cn);
            }
          }
          globalEmployees.push(Object.assign(tEmp, doExcelMathForEmployee(tEmp)));
          tplImported++;
        }
        renderEmployeeList();
        showToast('تم استيراد ' + tplImported + ' موظف من القالب' + (tplSkipped > 0 ? ' — تم تخطي ' + tplSkipped + ' صف' : ''));
        addAuditEntry('استيراد قالب موظفين', tplImported + ' موظف');
        return;
      }

      // Find the header row that contains "اجمالي الدخل"
      var headerRowIdx = -1;
      for (var h = 0; h < rows.length; h++) {
        if (rows[h].some(function(cell) { return String(cell).indexOf('اجمالي الدخل') >= 0 || String(cell).indexOf('اجمالى الدخل') >= 0; })) {
          headerRowIdx = h;
          break;
        }
      }

      if (headerRowIdx === -1) {
        showToast('لم يتم التعرف على تنسيق الكشف السنوي', true);
        return;
      }

      var imported = 0;
      var skipped = 0;
      for (var r = headerRowIdx + 1; r < rows.length; r++) {
        var row = rows[r];
        if (!row || row.length < 10) continue;

        var name = String(row[4] || '').trim();
        if (!name || name === 'المجموع الفرعي' || name === 'الجموع الكلي' || name === '') {
          skipped++;
          continue;
        }

        var existingEmp = globalEmployees.find(function(e) { return e.name === name; });
        if (existingEmp) {
          skipped++;
          continue;
        }

        var civilId = String(row[5] || '').trim();
        var annualIncome = parseFloat(row[6]) || 0;
        var annualDed = parseFloat(row[7]) || 0;
        var taxableIncome = parseFloat(row[8]) || 0;
        var taxLiability = parseFloat(row[9]) || 0;
        var taxPaid = parseFloat(row[10]) || 0;
        var regNumber = String(row[3] || '').trim();

        // Derive monthly salary: annualGross / 12 (approximate)
        var monthlyGross = Math.round(annualIncome / 12);

        var newEmp = {
          id: 'EMP_' + Date.now() + '_' + r,
          name: name,
          civilId: civilId,
          nat: 'iraqi',
          res: 'resident',
          gender: 'male',
          birthDate: '',
          phone: '',
          email: '',
          province: '',
          city: '',
          neighborhood: '',
          street: '',
          houseNo: '',
          sec: 'government',
          jobTitle: '',
          startDate: '',
          endDate: '',
          mainEmployer: 'yes',
          employerName: row[14] || '',
          employerId: '',
          marital: 'single',
          marriageDate: '',
          spouseName: '',
          spouseCivilId: '',
          divorceDate: '',
          spouseDisabled: 'no',
          spouseEmpName: '',
          child: 0,
          childNames: [],
          over63: 'no',
          months: 12,
          salary: monthlyGross,
          allow: 0,
          cashHous: 0,
          inKind: 'none',
          ins: 0,
          alimony: 0,
          regNumber: regNumber,
          // Store the imported tax values
          annualGross: annualIncome,
          annualDed: annualDed,
          annualTaxable: taxableIncome,
          annualTax: taxLiability,
          monthlyTax: Math.round(taxLiability / 12),
          importedFromDD14: true
        };

        globalEmployees.push(newEmp);
        imported++;
      }

      renderEmployeeList();
      showToast('تم استيراد ' + imported + ' موظف من الكشف السنوي' + (skipped > 0 ? ' — تم تخطي ' + skipped + ' صف' : ''));
      addAuditEntry('استيراد الكشف السنوي', imported + ' موظف');

    } catch (err) {
      showToast('خطأ في قراءة الملف: ' + err.message, true);
    }
  };
  reader.readAsArrayBuffer(file);
  inputEl.value = '';
}

// ========== ANNUAL STATEMENT PREVIEW & PRINT (مطابق لـ الكشف السنوي ض د.xlsx) ==========
function buildAnnualStatementHtml(forPrint) {
  var currentYear = document.getElementById('closeTaxYear_Year') ? document.getElementById('closeTaxYear_Year').value : new Date().getFullYear();
  var emps = getCombinedEmployees();
  if (!emps.length) return null;

  var employerName = emps[0].employerName || '';
  var employerId = emps[0].employerId || '';

  var html = '';
  if (forPrint) {
    html += '<style>';
    html += '@media print { body * { visibility:hidden; } #annualStatementPrintArea, #annualStatementPrintArea * { visibility:visible; } #annualStatementPrintArea { position:absolute; left:0; top:0; width:100%; margin:0; padding:0; } @page { size: A4 portrait; margin: 0; } }';
    html += '.page-break { page-break-after: always; box-sizing: border-box; }';
    html += '</style>';
  }
  html += '<div id="annualStatementPrintArea" style="direction:rtl;font-family:\'Tajawal\',Arial,sans-serif;font-size:12px;color:#000;background:#fff;' + (forPrint ? '' : 'padding:8px;overflow-x:auto;') + '">';
  
  html += `
   <div class="page-break" style="width:210mm; min-height:285mm; margin:0 auto; padding:15mm; background:#fff; color:#000; direction:rtl; box-sizing:border-box; border:1px solid #ddd;">
     <div style="text-align:center; font-size:16px; font-weight:bold; margin-bottom:5px;">هيئة الضرائب العامة - الكشف السنوي الشامل الموحد</div>
     <div style="text-align:center; font-size:12px; margin-bottom:15px;">السنة المالية: ${currentYear}</div>
     <div style="margin-bottom:15px; font-size:14px;"><strong>اسم جهة العمل (الشركة):</strong> ${employerName} <br> <strong>الرقم التعريفي:</strong> ${employerId}</div>
     <table style="width:100%; border-collapse:collapse; text-align:center; font-size:11px;" border="1">
       <tr style="background:#f3f4f6; font-weight:bold;">
         <td style="padding:5px;">ت</td>
         <td style="padding:5px;">اسم الموظف</td>
         <td style="padding:5px;">إجمالي الدخل</td>
         <td style="padding:5px;">التنزيلات والسماحات</td>
         <td style="padding:5px;">الوعاء الضريبي</td>
         <td style="padding:5px;">الضريبة السنوية المستحقة</td>
         <td style="padding:5px;">المسدد خلال السنة</td>
         <td style="padding:5px;">غير المسدد</td>
         <td style="padding:5px;">الفائض (الزائد)</td>
       </tr>
  `;

  var totalIncome = 0, totalDed = 0, totalTaxable = 0, totalLiab = 0, totalPaid = 0, totalUnpaid = 0, totalExcess = 0;
  
  emps.forEach(function(e, i) {
    var ytd = getEmpYTD(e.id, currentYear);
    var isYTD = ytd && ytd.count > 0;
    var math = doExcelMathForEmployee(e);
    
    var income = isYTD ? ytd.gross : math.annualGross;
    var deductions = isYTD ? ytd.ded : math.annualDed;
    var taxable = isYTD ? ytd.taxable : math.annualTaxable;
    var liab = isYTD ? ytd.tax : math.annualTax;
    var paid = liab;
    
    var strictLiab = math.annualTax; 
    var unpaid = Math.max(0, liab - strictLiab);
    var excess = Math.max(0, strictLiab - liab);
    if(isYTD) { unpaid = 0; excess = 0; paid = liab; }

    totalIncome += income; totalDed += deductions; totalTaxable += taxable;
    totalLiab += liab; totalPaid += paid; totalUnpaid += unpaid; totalExcess += excess;

    html += `<tr>
      <td style="padding:5px;">${i + 1}</td>
      <td style="padding:5px; text-align:right;">${e.name || 'بدون اسم'}</td>
      <td style="padding:5px; direction:ltr;">${formatNumber(Math.round(income))}</td>
      <td style="padding:5px; direction:ltr;">${formatNumber(Math.round(deductions))}</td>
      <td style="padding:5px; direction:ltr;">${formatNumber(Math.round(taxable))}</td>
      <td style="padding:5px; direction:ltr; font-weight:bold;">${formatNumber(Math.round(liab))}</td>
      <td style="padding:5px; direction:ltr;">${formatNumber(Math.round(paid))}</td>
      <td style="padding:5px; direction:ltr; color:#dc2626;">${formatNumber(Math.round(unpaid))}</td>
      <td style="padding:5px; direction:ltr; color:#16a34a;">${formatNumber(Math.round(excess))}</td>
    </tr>`;
  });

  html += `
     <tr style="background:#f3f4f6; font-weight:bold;">
       <td colspan="2" style="padding:5px;">المجموع الإجمالي</td>
       <td style="padding:5px; direction:ltr;">${formatNumber(Math.round(totalIncome))}</td>
       <td style="padding:5px; direction:ltr;">${formatNumber(Math.round(totalDed))}</td>
       <td style="padding:5px; direction:ltr;">${formatNumber(Math.round(totalTaxable))}</td>
       <td style="padding:5px; direction:ltr; color:#000;">${formatNumber(Math.round(totalLiab))}</td>
       <td style="padding:5px; direction:ltr; color:#000;">${formatNumber(Math.round(totalPaid))}</td>
       <td style="padding:5px; direction:ltr; color:#dc2626;">${formatNumber(Math.round(totalUnpaid))}</td>
       <td style="padding:5px; direction:ltr; color:#16a34a;">${formatNumber(Math.round(totalExcess))}</td>
     </tr>
     </table>
     
     <div style="display:flex; justify-content:space-between; margin-top:40px; font-size:14px; font-weight:bold;">
        <div>توقيع المحاسب <br><br> ____________________</div>
        <div>توقيع المدير المفوض <br><br> ____________________</div>
     </div>
   </div>
   </div>
  `;
  return html;
}


function renderAnnualStatementPreview() {
  if (!globalEmployees.length) {
    showToast('يرجى إدخال بيانات الموظفين أولاً', true);
    return;
  }
  var container = document.getElementById('annualStatementPreview');
  var hint = document.getElementById('annualStatementHint');
  if (!container) return;
  var html = buildAnnualStatementHtml(false);
  if (!html) { showToast('لا توجد بيانات', true); return; }
  container.innerHTML = html;
  container.style.display = 'block';
  if (hint) hint.style.display = 'none';
  showToast('تم تحديث معاينة الكشف السنوي — ' + globalEmployees.length + ' موظف');
}

function printAnnualStatement() {
  if (!globalEmployees.length) {
    showToast('يرجى إدخال بيانات الموظفين أولاً', true);
    return;
  }
  var html = buildAnnualStatementHtml(true);
  if (!html) return;
  var pw = window.open('', '_blank');
  pw.document.write('<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8">');
  pw.document.write('<title>الكشف السنوي — ضريبة الدخل</title>');
  pw.document.write('<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">');
  pw.document.write(`
    <style>
      body { margin: 0; padding: 0; background: #eaedf2; font-family: 'Tajawal', Arial, sans-serif; display: flex; flex-direction: column; align-items: center; }
      .page-break {
        width: 297mm;
        min-height: 209mm;
        background: #fff;
        margin: 10mm 0;
        box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        padding: 10mm;
        box-sizing: border-box;
        position: relative;
        page-break-after: always;
        direction: rtl;
      }
      @media print {
        @page { size: A4 landscape; margin: 0; }
        body { background: transparent; display: block; margin: 0; padding: 0; }
        .page-break { margin: 0; box-shadow: none; border: none; page-break-after: always; min-height: 210mm; }
      }
      table { border-collapse: collapse; width: 100%; white-space: nowrap; }
      th, td { border: 1px solid #333; padding: 6px; text-align: center; font-size: 13px; }
      th { background: #f3f4f6 !important; -webkit-print-color-adjust: exact; color-adjust: exact; font-weight: bold; }
      .totals-table th { background: #1e3a8a !important; color: #fff !important; }
    </style>
  `);
  pw.document.write('</head><body onload="setTimeout(function(){window.print();window.close();},500);">');
  pw.document.write(html);
  pw.document.write('</body></html>');
  pw.document.close();
}



function saveUsers(users) { localStorage.setItem('taxUsers', JSON.stringify(users)); }

function renderUsersTable() {
  var users = getUsers();
  var tbody = document.getElementById('usersTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  Object.keys(users).forEach(function(username) {
    var u = users[username];
    tbody.innerHTML += '<tr><td><strong>' + username + '</strong></td><td>' + u.name +
      '</td><td>' + u.role + '</td><td><span class="status-badge ' + (u.active !== false ? 'approved' : 'rejected') + '">' +
      (u.active !== false ? 'نشط' : 'معطّل') + '</span></td><td>' +
      (username !== 'admin' ? '<button class="btn btn-sm btn-danger" onclick="deleteUser(\'' + username + '\')"><i class="fas fa-trash"></i></button>' : '<span style="color:var(--text-light)">مدير</span>') +
      '</td></tr>';
  });
}

function showAddUserForm() {
  var session = JSON.parse(localStorage.getItem('taxSession') || sessionStorage.getItem('taxSession') || 'null');
  if (!session || session.role !== 'مدير النظام') { showToast('هذه الميزة متاحة للمدير فقط', true); return; }
  document.getElementById('addUserForm').style.display = 'block';
}

function addNewUser() {
  var username = document.getElementById('newUsername').value.trim();
  var fullName = document.getElementById('newFullName').value.trim();
  var password = document.getElementById('newPassword').value;
  var role = document.getElementById('newRole').value;
  if (!username || !fullName || !password) { showToast('يرجى ملء جميع الحقول', true); return; }
  if (username.length < 3) { showToast('اسم المستخدم يجب أن يكون ٣ أحرف على الأقل', true); return; }
  var users = getUsers();
  if (users[username]) { showToast('اسم المستخدم موجود مسبقاً', true); return; }
  users[username] = { password: password, name: fullName, role: role, avatar: fullName.charAt(0), active: true };
  saveUsers(users);
  USERS[username] = users[username];
  renderUsersTable();
  document.getElementById('addUserForm').style.display = 'none';
  showToast('تمت إضافة المستخدم بنجاح');
  addAuditEntry('إضافة مستخدم', username + ' - ' + role);
}

function deleteUser(username) {
  var users = getUsers();
  delete users[username];
  delete USERS[username];
  saveUsers(users);
  renderUsersTable();
  showToast('تم حذف المستخدم');
  addAuditEntry('حذف مستخدم', username);
}

// ========== 7. AUDIT LOG ==========
var auditLog = JSON.parse(localStorage.getItem('auditLog') || '[]');

function addAuditEntry(action, details) {
  var session = JSON.parse(localStorage.getItem('taxSession') || sessionStorage.getItem('taxSession') || 'null');
  var entry = {
    id: auditLog.length + 1,
    action: action,
    user: session ? session.name : 'غير معروف',
    details: details || '',
    time: new Date().toLocaleString('ar-IQ')
  };
  auditLog.unshift(entry);
  if (auditLog.length > 200) auditLog = auditLog.slice(0, 200);
  localStorage.setItem('auditLog', JSON.stringify(auditLog));
  renderAuditLog();
}

function renderAuditLog() {
  var tbody = document.getElementById('auditLogBody');
  if (!tbody) return;
  if (auditLog.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-table">لا توجد عمليات مسجلة</td></tr>';
    return;
  }
  tbody.innerHTML = auditLog.slice(0, 50).map(function(e) {
    return '<tr><td>' + e.id + '</td><td>' + e.action + '</td><td>' + e.user + '</td><td>' + e.details + '</td><td>' + e.time + '</td></tr>';
  }).join('');
}

function clearAuditLog() {
  auditLog = [];
  localStorage.removeItem('auditLog');
  renderAuditLog();
  showToast('تم مسح سجل العمليات');
}

// ========== 8. PENALTIES CALCULATOR ==========
var penaltyTypes = {
  late_payment: { name: 'تأخر في الدفع', ratePerMonth: 0.05, description: '٥٪ عن كل شهر تأخير (بحد أقصى ٥٠٪)' },
  late_declaration: { name: 'تأخر في تقديم الإقرار', ratePerMonth: 0.025, description: '٢.٥٪ عن كل شهر' },
  tax_evasion: { name: 'تهرب ضريبي', rateFlat: 1.0, description: 'غرامة تعادل الضريبة المتهرب منها' },
  false_info: { name: 'معلومات كاذبة', rateFlat: 0.5, description: '٥٠٪ من مبلغ الضريبة' },
  no_records: { name: 'عدم مسك سجلات', rateFlat: 0.25, description: '٢٥٪ من مبلغ الضريبة المقدرة' }
};

function calculatePenalty() {
  var type = document.getElementById('penaltyType').value;
  var originalTax = getVal('penaltyOriginalTax');
  if (!originalTax) { showToast('يرجى إدخال مبلغ الضريبة', true); return; }
  var penaltyInfo = penaltyTypes[type];
  var penalty = 0, daysLate = 0, rateDisplay = '';
  if (penaltyInfo.rateFlat !== undefined) {
    penalty = originalTax * penaltyInfo.rateFlat;
    rateDisplay = (penaltyInfo.rateFlat * 100) + '٪';
    daysLate = 0;
  } else {
    var dueDate = document.getElementById('penaltyDueDate').value;
    var payDate = document.getElementById('penaltyPayDate').value;
    if (!dueDate || !payDate) { showToast('يرجى إدخال تواريخ الاستحقاق والدفع', true); return; }
    var d1 = new Date(dueDate), d2 = new Date(payDate);
    daysLate = Math.max(0, Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)));
    var monthsLate = Math.ceil(daysLate / 30);
    var totalRate = Math.min(monthsLate * penaltyInfo.ratePerMonth, 0.5);
    penalty = originalTax * totalRate;
    rateDisplay = (totalRate * 100).toFixed(1) + '٪';
  }
  setText('penaltyTypeResult', penaltyInfo.name);
  setText('penaltyDays', daysLate > 0 ? daysLate + ' يوم' : 'لا ينطبق');
  setText('penaltyRate', rateDisplay);
  setText('penaltyOriginal', formatNumber(originalTax) + ' د.ع');
  setText('penaltyAmount', formatNumber(Math.round(penalty)) + ' د.ع');
  document.getElementById('penaltyResult').style.display = 'block';
  showToast('تم حساب الغرامة بنجاح');
  addAuditEntry('حساب غرامة', penaltyInfo.name + ' - ' + formatNumber(Math.round(penalty)) + ' د.ع');
}

// ========== 9. AUTO NOTIFICATIONS ==========
function toggleBrowserNotifications() {
  var enabled = document.getElementById('settingNotifications').checked;
  if (enabled && 'Notification' in window) {
    Notification.requestPermission().then(function(permission) {
      if (permission === 'granted') {
        showToast('تم تفعيل إشعارات المتصفح');
        localStorage.setItem('browserNotifications', 'true');
      } else {
        document.getElementById('settingNotifications').checked = false;
        showToast('لم يتم السماح بالإشعارات', true);
      }
    });
  } else {
    localStorage.setItem('browserNotifications', 'false');
  }
}

function sendBrowserNotification(title, body) {
  if (localStorage.getItem('browserNotifications') === 'true' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body: body, icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" font-size="80">🏛</text></svg>' });
  }
}

function checkPaymentReminders() {
  var now = new Date();
  var events = getTaxEvents();
  events.forEach(function(ev) {
    var evDate = new Date(ev.date);
    var diff = Math.ceil((evDate - now) / (1000 * 60 * 60 * 24));
    if (diff > 0 && diff <= 7) {
      sendBrowserNotification('تذكير ضريبي', ev.title + ' - متبقي ' + diff + ' أيام');
    }
  });
}

// ========== 10. SETTINGS ==========
function changeFontSize(size) {
  document.body.style.fontSize = size + 'px';
  localStorage.setItem('fontSize', size);
}

function toggleAutoSave() {
  var enabled = document.getElementById('settingAutoSave').checked;
  localStorage.setItem('autoSave', enabled ? 'true' : 'false');
  showToast(enabled ? 'تم تفعيل الحفظ التلقائي' : 'تم إيقاف الحفظ التلقائي');
}

function exportAllData() {
  var data = {};
  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i);
    data[key] = localStorage.getItem(key);
  }
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'tax_system_backup_' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('تم تصدير البيانات بنجاح');
}

function clearAllData() {
  if (confirm('هل أنت متأكد من مسح جميع البيانات المحفوظة؟ لا يمكن التراجع عن هذا الإجراء.')) {
    var session = localStorage.getItem('taxSession');
    localStorage.clear();
    if (session) localStorage.setItem('taxSession', session);
    showToast('تم مسح جميع البيانات المحفوظة');
  }
}

function loadSettings() {
  var fontSize = localStorage.getItem('fontSize');
  if (fontSize) {
    document.body.style.fontSize = fontSize + 'px';
    var sel = document.getElementById('settingFontSize');
    if (sel) sel.value = fontSize;
  }
  var autoSave = localStorage.getItem('autoSave');
  var settingAutoSave = document.getElementById('settingAutoSave');
  if (settingAutoSave) settingAutoSave.checked = autoSave !== 'false';
  var notifSetting = document.getElementById('settingNotifications');
  if (notifSetting) notifSetting.checked = localStorage.getItem('browserNotifications') === 'true';
}

// ========== 11. AOS ANIMATIONS ==========
function initAOS() {
  if (typeof AOS !== 'undefined') {
    AOS.init({ duration: 600, easing: 'ease-out', once: true, offset: 50 });
  }
}

// ========== 12. SPLASH SCREEN ==========
function handleSplashScreen() {
  var splash = document.getElementById('splashScreen');
  var auth = document.getElementById('authScreen');
  if (splash) {
    setTimeout(function() {
      splash.classList.add('hidden');
      if (auth) auth.style.display = 'flex';
      setTimeout(function() { splash.style.display = 'none'; }, 600);
    }, 2200);
  }
}

// ========== 13. INTERACTIVE IRAQ MAP (Province Selection) ==========
function selectProvince(province) {
  var sel = document.getElementById('landProvince');
  if (sel) {
    sel.value = province;
    updateLandDistricts();
    navigateTo('land');
    showToast('تم اختيار محافظة ' + sel.options[sel.selectedIndex].text);
  }
}

// ========== 14. DRAGGABLE WIDGETS ==========
function initDraggableWidgets() {
  var cards = document.querySelectorAll('#page-dashboard .card, #page-dashboard .stat-card');
  cards.forEach(function(card) {
    card.setAttribute('draggable', 'true');
    card.addEventListener('dragstart', function(e) {
      e.dataTransfer.effectAllowed = 'move';
      card.style.opacity = '0.5';
      window._draggedCard = card;
    });
    card.addEventListener('dragend', function() {
      card.style.opacity = '1';
      window._draggedCard = null;
    });
    card.addEventListener('dragover', function(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
    card.addEventListener('drop', function(e) {
      e.preventDefault();
      if (window._draggedCard && window._draggedCard !== card && card.parentNode === window._draggedCard.parentNode) {
        var parent = card.parentNode;
        var allCards = Array.from(parent.children);
        var dragIdx = allCards.indexOf(window._draggedCard);
        var dropIdx = allCards.indexOf(card);
        if (dragIdx < dropIdx) { parent.insertBefore(window._draggedCard, card.nextSibling); }
        else { parent.insertBefore(window._draggedCard, card); }
      }
    });
  });
}

// ========== 15. AUTO-SAVE DRAFTS ==========
var autoSaveFields = ['corpName','corpTaxId','corpRevenue','corpExpenses','corpDepreciation','corpOtherExp',
  'landArea','landPrice','propSalePrice','propRentAmount','profName','profId','profIncome','profExpenses',
  'salesAmount','penaltyOriginalTax'];

function autoSaveDrafts() {
  if (localStorage.getItem('autoSave') === 'false') return;
  var drafts = {};
  autoSaveFields.forEach(function(id) {
    var el = document.getElementById(id);
    if (el && el.value) drafts[id] = el.value;
  });
  localStorage.setItem('taxDrafts', JSON.stringify(drafts));
}

function loadDrafts() {
  var drafts = JSON.parse(localStorage.getItem('taxDrafts') || '{}');
  Object.keys(drafts).forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.value = drafts[id];
  });
}

function setupAutoSave() {
  setInterval(autoSaveDrafts, 15000);
  autoSaveFields.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('change', autoSaveDrafts);
  });
}

// ========== 16. TAX COMPARISON ==========
var comparisonChart = null;

function generateComparison() {
  var year1 = document.getElementById('compYear1').value;
  var year2 = document.getElementById('compYear2').value;
  // Simulated data for comparison
  var taxTypes = [
    { name: 'ضريبة الشركات', y1: getRandomTax(40, 60), y2: getRandomTax(45, 65) },
    { name: 'ضريبة العرصات', y1: getRandomTax(10, 20), y2: getRandomTax(12, 22) },
    { name: 'ضريبة العقار', y1: getRandomTax(15, 30), y2: getRandomTax(18, 32) },
    { name: 'ضريبة المهنة', y1: getRandomTax(8, 18), y2: getRandomTax(10, 20) },
    { name: 'ضريبة المبيعات', y1: getRandomTax(5, 15), y2: getRandomTax(7, 17) }
  ];
  setText('compHeader1', year1);
  setText('compHeader2', year2);
  var tbody = document.getElementById('comparisonBody');
  tbody.innerHTML = taxTypes.map(function(t) {
    var change = t.y2 - t.y1;
    var pct = t.y1 > 0 ? ((change / t.y1) * 100).toFixed(1) : '0';
    var arrow = change >= 0 ? '<i class="fas fa-arrow-up" style="color:var(--success)"></i>' : '<i class="fas fa-arrow-down" style="color:var(--danger)"></i>';
    return '<tr><td><strong>' + t.name + '</strong></td><td>' + formatNumber(t.y1 * 1000000) + ' د.ع</td><td>' +
      formatNumber(t.y2 * 1000000) + ' د.ع</td><td>' + arrow + ' ' + formatNumber(Math.abs(change) * 1000000) + '</td><td>' +
      (change >= 0 ? '+' : '') + pct + '٪</td></tr>';
  }).join('');
  // Chart
  if (typeof Chart !== 'undefined') {
    var ctx = document.getElementById('comparisonChart');
    if (comparisonChart) comparisonChart.destroy();
    comparisonChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: taxTypes.map(function(t) { return t.name; }),
        datasets: [
          { label: year1, data: taxTypes.map(function(t) { return t.y1; }), backgroundColor: 'rgba(26,35,126,0.6)', borderRadius: 6 },
          { label: year2, data: taxTypes.map(function(t) { return t.y2; }), backgroundColor: 'rgba(255,214,0,0.7)', borderRadius: 6 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: { y: { beginAtZero: true, title: { display: true, text: 'مليون د.ع' } } }
      }
    });
  }
  document.getElementById('comparisonResults').style.display = 'block';
  showToast('تم إنشاء المقارنة');
  addAuditEntry('مقارنة ضرائب', year1 + ' مع ' + year2);
}

function getRandomTax(min, max) { return Math.round((Math.random() * (max - min) + min) * 10) / 10; }

// ========== 17. TAX CALENDAR ==========
var calendarDate = new Date();
var arabicMonths = ['كانون الثاني','شباط','آذار','نيسان','أيار','حزيران','تموز','آب','أيلول','تشرين الأول','تشرين الثاني','كانون الأول'];
var arabicDays = ['أحد','إثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'];

function getTaxEvents() {
  var year = calendarDate.getFullYear();
  return [
    { date: year + '-01-31', title: 'آخر موعد لتقديم إقرار ضريبة الدخل السنوي', type: 'urgent' },
    { date: year + '-03-31', title: 'موعد دفع ضريبة الشركات — الربع الأول', type: 'urgent' },
    { date: year + '-04-15', title: 'تقديم كشف الرواتب الفصلي', type: '' },
    { date: year + '-06-30', title: 'موعد دفع ضريبة الشركات — الربع الثاني', type: 'urgent' },
    { date: year + '-07-01', title: 'بدء السنة المالية الجديدة', type: 'done' },
    { date: year + '-09-30', title: 'موعد دفع ضريبة الشركات — الربع الثالث', type: 'urgent' },
    { date: year + '-10-15', title: 'تقديم إقرار ضريبة العقار', type: '' },
    { date: year + '-12-31', title: 'موعد دفع ضريبة الشركات — الربع الرابع', type: 'urgent' },
    { date: year + '-12-31', title: 'نهاية السنة المالية', type: '' }
  ];
}

function renderCalendar() {
  var grid = document.getElementById('calendarGrid');
  var eventsDiv = document.getElementById('calendarEvents');
  var titleEl = document.getElementById('calendarMonthTitle');
  if (!grid) return;

  var month = calendarDate.getMonth();
  var year = calendarDate.getFullYear();
  titleEl.textContent = arabicMonths[month] + ' ' + year;

  var firstDay = new Date(year, month, 1).getDay();
  var daysInMonth = new Date(year, month + 1, 0).getDate();
  var today = new Date();
  var events = getTaxEvents();
  var eventDates = {};
  events.forEach(function(ev) {
    var d = new Date(ev.date);
    if (d.getMonth() === month && d.getFullYear() === year) {
      eventDates[d.getDate()] = ev;
    }
  });

  var html = arabicDays.map(function(d) { return '<div class="calendar-header-cell">' + d + '</div>'; }).join('');

  // Previous month days
  var prevDays = new Date(year, month, 0).getDate();
  for (var p = firstDay - 1; p >= 0; p--) {
    html += '<div class="calendar-cell other-month">' + (prevDays - p) + '</div>';
  }
  // Current month days
  for (var d = 1; d <= daysInMonth; d++) {
    var isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    var hasEvent = eventDates[d];
    html += '<div class="calendar-cell' + (isToday ? ' today' : '') + (hasEvent ? ' has-event' : '') + '">' + d + '</div>';
  }
  // Next month days
  var totalCells = firstDay + daysInMonth;
  var remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (var n = 1; n <= remaining; n++) {
    html += '<div class="calendar-cell other-month">' + n + '</div>';
  }
  grid.innerHTML = html;

  // Month events
  var monthEvents = events.filter(function(ev) { var d = new Date(ev.date); return d.getMonth() === month && d.getFullYear() === year; });
  if (monthEvents.length === 0) {
    eventsDiv.innerHTML = '<p style="color:var(--text-light);text-align:center;padding:20px;">لا توجد مواعيد ضريبية لهذا الشهر</p>';
  } else {
    eventsDiv.innerHTML = monthEvents.map(function(ev) {
      var d = new Date(ev.date);
      return '<div class="calendar-event-item ' + (ev.type || '') + '"><div><strong>' + ev.title + '</strong><br><small style="color:var(--text-light)">' + d.getDate() + ' ' + arabicMonths[d.getMonth()] + '</small></div></div>';
    }).join('');
  }
}

function changeCalendarMonth(delta) {
  calendarDate.setMonth(calendarDate.getMonth() + delta);
  renderCalendar();
}

// ========== 18. CHATBOT ==========
var chatbotKB = [
  { keywords: ['نسبة','ضريبة','شركات','شركة'], answer: 'نسبة ضريبة دخل الشركات في العراق هي ١٥٪ للشركات العادية، و٣٥٪ لشركات النفط والغاز، وفقاً لقانون ضريبة الدخل رقم ١١٣ لسنة ١٩٨٢.' },
  { keywords: ['دخل','حساب','احتساب','كيف'], answer: 'يتم حساب ضريبة الدخل بعد خصم الإعفاء السنوي (٥,٠٠٠,٠٠٠ د.ع) ثم تطبيق الشرائح التصاعدية:\n• أول ٢٥٠,٠٠٠ → ٣٪\n• ٢٥٠,٠٠١ - ٥٠٠,٠٠٠ → ٥٪\n• ٥٠٠,٠٠١ - ١,٠٠٠,٠٠٠ → ١٠٪\n• ما زاد → ١٥٪' },
  { keywords: ['غرامة','تأخير','جزاء'], answer: 'غرامة التأخير في الدفع هي ٥٪ عن كل شهر تأخير بحد أقصى ٥٠٪ من مبلغ الضريبة. التهرب الضريبي يعاقب بغرامة تعادل كامل مبلغ الضريبة.' },
  { keywords: ['إعفاء','معفاة','استثمار'], answer: 'الإعفاء السنوي لضريبة الدخل هو ٥,٠٠٠,٠٠٠ دينار عراقي. كما يمكن للشركات الحصول على إعفاءات بموجب قانون الاستثمار رقم ١٣ لسنة ٢٠٠٦.' },
  { keywords: ['عقار','بيع','إيجار','تأجير'], answer: 'ضريبة العقار عند البيع هي ٣٪ من قيمة البيع. ضريبة الإيجار هي ١٠٪ من إجمالي مبلغ الإيجار.' },
  { keywords: ['عرصة','أرض','أراضي'], answer: 'ضريبة العرصات تفرض بنسبة ٠.١٪ (واحد بالألف) من القيمة المقدرة للأرض سنوياً، وتختلف أسعار التقدير حسب المحافظة ونوع الاستخدام.' },
  { keywords: ['مبيعات','هاتف','سيارة','سكائر'], answer: 'نسب ضريبة المبيعات:\n• الهاتف والإنترنت: ٢٠٪\n• السيارات: ١٥٪\n• السكائر: ١٠٠٪\n• المشروبات الكحولية: ٢٠٠٪\n• العطور: ٢٥٪\n• الإلكترونيات: ١٥٪\n• الفنادق: ١٠٪' },
  { keywords: ['مهنة','طبيب','محامي','مهندس'], answer: 'ضريبة المهنة تطبق على الدخل الصافي (بعد خصم المصروفات المهنية) وتحسب بنفس شرائح ضريبة الدخل مع إعفاء سنوي قدره ٥,٠٠٠,٠٠٠ د.ع.' },
  { keywords: ['قانون','رقم','تشريع'], answer: 'القوانين الضريبية الرئيسية في العراق:\n• قانون ضريبة الدخل رقم ١١٣ لسنة ١٩٨٢\n• قانون ضريبة العقار رقم ١٦٢ لسنة ١٩٥٩\n• قانون ضريبة العرصات رقم ٢٦ لسنة ١٩٦٢\n• قانون الاستثمار رقم ١٣ لسنة ٢٠٠٦' },
  { keywords: ['موعد','تقديم','إقرار','دفع'], answer: 'المواعيد الرئيسية:\n• ٣١ كانون الثاني: إقرار الدخل السنوي\n• نهاية كل ربع: دفعات ضريبة الشركات\n• ١٥ تشرين الأول: إقرار ضريبة العقار\nيمكنك مراجعة التقويم الضريبي للمزيد.' }
];

function toggleChatbot() {
  var panel = document.getElementById('chatbotPanel');
  panel.classList.toggle('show');
}

function sendChatMessage() {
  var input = document.getElementById('chatInput');
  var msg = input.value.trim();
  if (!msg) return;
  appendChatMessage(msg, 'user');
  input.value = '';
  setTimeout(function() {
    var answer = findChatAnswer(msg);
    appendChatMessage(answer, 'bot');
  }, 500);
}

function askChatbot(question) {
  appendChatMessage(question, 'user');
  setTimeout(function() {
    var answer = findChatAnswer(question);
    appendChatMessage(answer, 'bot');
  }, 500);
}

function appendChatMessage(text, type) {
  var container = document.getElementById('chatbotMessages');
  var div = document.createElement('div');
  div.className = 'chat-message ' + type;
  div.innerHTML = '<div class="chat-bubble">' + text.replace(/\n/g, '<br>') + '</div>';
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function findChatAnswer(query) {
  var bestMatch = null, maxScore = 0;
  chatbotKB.forEach(function(item) {
    var score = 0;
    item.keywords.forEach(function(kw) {
      if (query.indexOf(kw) !== -1) score++;
    });
    if (score > maxScore) { maxScore = score; bestMatch = item; }
  });
  if (bestMatch && maxScore > 0) return bestMatch.answer;
  return 'عذراً، لم أتمكن من فهم سؤالك بالتحديد. يمكنك السؤال عن:\n• نسب الضرائب المختلفة\n• طريقة الحساب\n• الغرامات والجزاءات\n• الإعفاءات\n• المواعيد الضريبية\n• القوانين والتشريعات';
}

// ========== INIT ==========


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



// ============================================================
//  FEATURE: INVOICES (الفوترة الإلكترونية)
// ============================================================
var invoicesData = JSON.parse(localStorage.getItem('taxInvoices') || '[]');
if (invoicesData.length === 0) {
  invoicesData = [
    {id:'INV-001',client:'شركة النور للتجارة',taxType:'ضريبة دخل الشركات',amount:2500000,date:'2026-03-01',due:'2026-04-01',status:'paid',notes:''},
    {id:'INV-002',client:'مؤسسة الرافدين',taxType:'ضريبة العقار',amount:1800000,date:'2026-03-10',due:'2026-04-10',status:'pending',notes:''},
    {id:'INV-003',client:'شركة بغداد المتحدة',taxType:'ضريبة المبيعات',amount:3200000,date:'2026-02-15',due:'2026-03-15',status:'overdue',notes:''},
    {id:'INV-004',client:'مكتب الأمين للمحاسبة',taxType:'ضريبة المهنة',amount:950000,date:'2026-03-20',due:'2026-04-20',status:'pending',notes:''},
    {id:'INV-005',client:'شركة الفرات للإنشاء',taxType:'ضريبة العرصات',amount:4100000,date:'2026-01-05',due:'2026-02-05',status:'paid',notes:''}
  ];
}
function saveInvoices(){ localStorage.setItem('taxInvoices', JSON.stringify(invoicesData)); }
function renderInvoices(){
  var paid=0,pending=0,overdue=0;
  invoicesData.forEach(function(inv){ if(inv.status==='paid')paid++; else if(inv.status==='pending')pending++; else overdue++; });
  var te=document.getElementById('invTotal');if(te)te.textContent=invoicesData.length;
  var pe=document.getElementById('invPaid');if(pe)pe.textContent=paid;
  var pne=document.getElementById('invPending');if(pne)pne.textContent=pending;
  var oe=document.getElementById('invOverdue');if(oe)oe.textContent=overdue;
  renderInvoiceTable(invoicesData);
}
function renderInvoiceTable(data){
  var tb=document.getElementById('invoicesTableBody');if(!tb)return;
  var statusMap={paid:'<span class="status-badge success">مدفوعة</span>',pending:'<span class="status-badge warning">معلقة</span>',overdue:'<span class="status-badge danger">متأخرة</span>'};
  tb.innerHTML=data.map(function(inv){return '<tr><td>'+inv.id+'</td><td>'+inv.client+'</td><td>'+inv.taxType+'</td><td>'+Number(inv.amount).toLocaleString('ar-IQ')+' د.ع</td><td>'+inv.date+'</td><td>'+(statusMap[inv.status]||inv.status)+'</td><td><button class="btn btn-sm" onclick="printInvoice(\''+inv.id+'\')"><i class="fas fa-print"></i></button> <button class="btn btn-sm" onclick="deleteInvoice(\''+inv.id+'\')"><i class="fas fa-trash"></i></button></td></tr>';}).join('');
}
function filterInvoices(val){ if(val==='all')renderInvoiceTable(invoicesData);else renderInvoiceTable(invoicesData.filter(function(i){return i.status===val;})); }
function searchInvoices(q){ q=q.toLowerCase();renderInvoiceTable(invoicesData.filter(function(i){return i.client.toLowerCase().indexOf(q)!==-1||i.id.toLowerCase().indexOf(q)!==-1;})); }
function createNewInvoice(){ document.getElementById('invoiceModal').style.display='flex'; }
function closeInvoiceModal(){ document.getElementById('invoiceModal').style.display='none'; }
function saveInvoice(){
  var c=document.getElementById('invClientName').value,t=document.getElementById('invTaxType').value,a=document.getElementById('invAmount').value,d=document.getElementById('invDueDate').value;
  if(!c||!a){showToast('يرجى ملء الحقول المطلوبة',true);return;}
  var inv={id:'INV-'+String(invoicesData.length+1).padStart(3,'0'),client:c,taxType:t,amount:parseFloat(a),date:new Date().toISOString().split('T')[0],due:d,status:'pending',notes:document.getElementById('invNotes').value};
  invoicesData.push(inv);saveInvoices();closeInvoiceModal();renderInvoices();showToast('تم إنشاء الفاتورة بنجاح');addAuditEntry('فاتورة جديدة','تم إنشاء فاتورة '+inv.id);
}
function printInvoice(id){ var inv=invoicesData.find(function(i){return i.id===id;});if(!inv)return;showToast('جاري طباعة الفاتورة '+id); }
function deleteInvoice(id){ invoicesData=invoicesData.filter(function(i){return i.id!==id;});saveInvoices();renderInvoices();showToast('تم حذف الفاتورة'); }

// ============================================================
//  FEATURE: TAXPAYERS (سجل المكلفين)
// ============================================================
var taxpayersData = JSON.parse(localStorage.getItem('taxTaxpayers') || '[]');
if(taxpayersData.length===0){
  taxpayersData=[
    {id:'TP-001',taxId:'IQ-2026-00001',name:'شركة النور للتجارة',type:'company',province:'بغداد',phone:'07701234567',email:'info@alnour.iq',address:'بغداد - الكرادة',status:'active'},
    {id:'TP-002',taxId:'IQ-2026-00002',name:'أحمد محمود العلي',type:'individual',province:'البصرة',phone:'07809876543',email:'ahmad@mail.com',address:'البصرة - العشار',status:'active'},
    {id:'TP-003',taxId:'IQ-2026-00003',name:'مؤسسة الرافدين',type:'company',province:'نينوى',phone:'07501112233',email:'rafidain@iq.com',address:'الموصل - الدواسة',status:'active'},
    {id:'TP-004',taxId:'IQ-2026-00004',name:'دائرة ضريبة كربلاء',type:'government',province:'كربلاء',phone:'07601234567',email:'karbala.tax@gov.iq',address:'كربلاء - المركز',status:'active'},
    {id:'TP-005',taxId:'IQ-2026-00005',name:'علي حسن الموسوي',type:'individual',province:'النجف',phone:'07711223344',email:'ali@mail.com',address:'النجف - حي السعد',status:'inactive'}
  ];
}
function saveTaxpayers(){ localStorage.setItem('taxTaxpayers', JSON.stringify(taxpayersData)); }
function renderTaxpayers(){
  var tb=document.getElementById('taxpayersTableBody');if(!tb)return;
  var typeMap={individual:'فرد',company:'شركة',government:'حكومي'};
  var statusMap={active:'<span class="status-badge success">نشط</span>',inactive:'<span class="status-badge warning">غير نشط</span>',suspended:'<span class="status-badge danger">معلق</span>'};
  tb.innerHTML=taxpayersData.map(function(tp){return '<tr><td>'+tp.taxId+'</td><td>'+tp.name+'</td><td>'+(typeMap[tp.type]||tp.type)+'</td><td>'+tp.province+'</td><td>'+tp.phone+'</td><td>'+(statusMap[tp.status]||tp.status)+'</td><td><button class="btn btn-sm" onclick="editTaxpayer(\''+tp.id+'\')"><i class="fas fa-edit"></i></button> <button class="btn btn-sm" onclick="deleteTaxpayer(\''+tp.id+'\')"><i class="fas fa-trash"></i></button></td></tr>';}).join('');
}
function searchTaxpayers(q){ var tb=document.getElementById('taxpayersTableBody');if(!tb)return; q=q.toLowerCase(); var f=taxpayersData.filter(function(t){return t.name.toLowerCase().indexOf(q)!==-1||t.taxId.toLowerCase().indexOf(q)!==-1;}); var typeMap={individual:'فرد',company:'شركة',government:'حكومي'}; var statusMap={active:'<span class="status-badge success">نشط</span>',inactive:'<span class="status-badge warning">غير نشط</span>',suspended:'<span class="status-badge danger">معلق</span>'}; tb.innerHTML=f.map(function(tp){return '<tr><td>'+tp.taxId+'</td><td>'+tp.name+'</td><td>'+(typeMap[tp.type]||tp.type)+'</td><td>'+tp.province+'</td><td>'+tp.phone+'</td><td>'+(statusMap[tp.status]||tp.status)+'</td><td><button class="btn btn-sm"><i class="fas fa-edit"></i></button></td></tr>';}).join(''); }
function filterTaxpayerType(v){ /* filter by type */ }
function filterTaxpayerStatus(v){ /* filter by status */ }
function addNewTaxpayer(){ document.getElementById('taxpayerModal').style.display='flex';document.getElementById('taxpayerModalTitle').textContent='إضافة مكلف جديد'; }
function closeTaxpayerModal(){ document.getElementById('taxpayerModal').style.display='none'; }
function saveTaxpayer(){
  var n=document.getElementById('tpName').value;if(!n){showToast('يرجى إدخال الاسم',true);return;}
  var tp={id:'TP-'+String(taxpayersData.length+1).padStart(3,'0'),taxId:'IQ-2026-'+String(taxpayersData.length+1).padStart(5,'0'),name:n,type:document.getElementById('tpType').value,province:document.getElementById('tpProvince').value,phone:document.getElementById('tpPhone').value,email:document.getElementById('tpEmail').value,address:document.getElementById('tpAddress').value,status:'active'};
  taxpayersData.push(tp);saveTaxpayers();closeTaxpayerModal();renderTaxpayers();showToast('تم إضافة المكلف بنجاح');addAuditEntry('مكلف جديد','تم إضافة '+n);
}
function editTaxpayer(id){ showToast('تحرير المكلف '+id); }
function deleteTaxpayer(id){ taxpayersData=taxpayersData.filter(function(t){return t.id!==id;});saveTaxpayers();renderTaxpayers();showToast('تم حذف المكلف'); }

// ============================================================
//  FEATURE: ATTACHMENTS (المرفقات المتقدمة)
// ============================================================
var attachmentsData = JSON.parse(localStorage.getItem('taxAttachments') || '[]');
if(attachmentsData.length===0){
  attachmentsData=[
    {id:1,name:'تقرير_الضرائب_2025.pdf',type:'pdf',size:'2.4 MB',date:'2026-03-15',category:'تقارير'},
    {id:2,name:'فاتورة_شركة_النور.docx',type:'doc',size:'540 KB',date:'2026-03-10',category:'فواتير'},
    {id:3,name:'صورة_الهوية.jpg',type:'image',size:'1.2 MB',date:'2026-02-28',category:'هويات'},
    {id:4,name:'كشف_حساب_2025.xlsx',type:'excel',size:'890 KB',date:'2026-03-01',category:'مالية'}
  ];
}
function saveAttachmentsData(){ localStorage.setItem('taxAttachments', JSON.stringify(attachmentsData)); }
function renderAttachments(){
  var el=document.getElementById('attachmentsList');if(!el)return;
  var iconMap={pdf:'fa-file-pdf',doc:'fa-file-word',excel:'fa-file-excel',image:'fa-file-image'};
  var colorMap={pdf:'#e74c3c',doc:'#2980b9',excel:'#27ae60',image:'#f39c12'};
  el.innerHTML=attachmentsData.map(function(a){return '<div class="attachment-item" style="display:flex;align-items:center;gap:14px;padding:14px 18px;background:var(--bg-secondary);border-radius:12px;margin-bottom:10px;"><i class="fas '+(iconMap[a.type]||'fa-file')+'" style="font-size:1.8rem;color:'+(colorMap[a.type]||'#666')+';"></i><div style="flex:1;"><h4 style="margin:0;font-size:0.95rem;">'+a.name+'</h4><span style="font-size:0.8rem;color:var(--text-secondary);">'+a.size+' • '+a.date+' • '+a.category+'</span></div><button class="btn btn-sm" onclick="downloadAttachment('+a.id+')"><i class="fas fa-download"></i></button><button class="btn btn-sm" onclick="removeAttachment('+a.id+')"><i class="fas fa-trash"></i></button></div>';}).join('');
}
function handleFileDrop(e){ e.preventDefault();e.currentTarget.classList.remove('dragover');handleFileSelect(e.dataTransfer.files); }
function handleFileSelect(files){
  for(var i=0;i<files.length;i++){
    var f=files[i];
    var ext=f.name.split('.').pop().toLowerCase();
    var type='pdf';if(['doc','docx'].indexOf(ext)!==-1)type='doc';else if(['xls','xlsx'].indexOf(ext)!==-1)type='excel';else if(['jpg','jpeg','png','gif'].indexOf(ext)!==-1)type='image';
    attachmentsData.push({id:Date.now()+i,name:f.name,type:type,size:(f.size/1024>1024?(f.size/1048576).toFixed(1)+' MB':(f.size/1024).toFixed(0)+' KB'),date:new Date().toISOString().split('T')[0],category:'عام'});
  }
  saveAttachmentsData();renderAttachments();showToast('تم رفع '+files.length+' ملف بنجاح');
}
function downloadAttachment(id){ showToast('جاري تحميل الملف...'); }
function removeAttachment(id){ attachmentsData=attachmentsData.filter(function(a){return a.id!==id;});saveAttachmentsData();renderAttachments();showToast('تم حذف المرفق'); }

// ============================================================
//  FEATURE: HEATMAP (الخريطة الحرارية)
// ============================================================
var heatmapProvinceData = {
  'بغداد':95,'البصرة':78,'نينوى':65,'أربيل':82,'النجف':58,'كربلاء':52,'ذي قار':44,'بابل':48,
  'ديالى':38,'الأنبار':35,'كركوك':55,'صلاح الدين':42,'واسط':30,'ميسان':28,'المثنى':22,'القادسية':34,'دهوك':60,'السليمانية':72
};
function renderHeatmap(){ updateHeatmap(); }
function updateHeatmap(){
  var grid=document.getElementById('heatmapGrid');if(!grid)return;
  var provinces=Object.keys(heatmapProvinceData);
  grid.innerHTML=provinces.map(function(p){
    var val=heatmapProvinceData[p];
    var color=val>80?'#f44336':val>60?'#ff9800':val>40?'#66bb6a':val>20?'#a5d6a7':'#e8f5e9';
    return '<div class="heatmap-cell" style="background:'+color+';padding:16px;border-radius:12px;text-align:center;color:'+(val>60?'#fff':'#333')+';"><h4 style="margin:0 0 4px;font-size:0.85rem;">'+p+'</h4><span style="font-size:1.4rem;font-weight:700;">'+val+'%</span></div>';
  }).join('');
}

// ============================================================
//  FEATURE: KPI (مؤشرات الأداء)
// ============================================================
function renderKPI(){
  var kpiData=[
    {title:'نسبة التحصيل',value:'87%',icon:'fa-percentage',color:'#4caf50',target:'90%'},
    {title:'عدد المكلفين النشطين',value:'1,247',icon:'fa-users',color:'#2196f3',target:'1,500'},
    {title:'متوسط وقت المعالجة',value:'3.2 يوم',icon:'fa-clock',color:'#ff9800',target:'2 يوم'},
    {title:'رضا المكلفين',value:'92%',icon:'fa-smile',color:'#9c27b0',target:'95%'},
    {title:'الفواتير المصدرة',value:'856',icon:'fa-file-invoice',color:'#00bcd4',target:'1000'},
    {title:'الإيرادات الشهرية',value:'2.4 مليار',icon:'fa-coins',color:'#d4a017',target:'3 مليار'}
  ];
  var row=document.getElementById('kpiCardsRow');
  if(row) row.innerHTML=kpiData.map(function(k){return '<div class="kpi-card" style="background:var(--bg-card);border-radius:14px;padding:20px;text-align:center;border-right:4px solid '+k.color+';"><i class="fas '+k.icon+'" style="font-size:1.8rem;color:'+k.color+';margin-bottom:8px;"></i><h3 style="font-size:1.5rem;margin:4px 0;">'+k.value+'</h3><p style="margin:0;color:var(--text-secondary);font-size:0.85rem;">'+k.title+'</p><small style="color:var(--text-secondary);">الهدف: '+k.target+'</small></div>';}).join('');
  // Goals
  var goals=document.getElementById('kpiGoals');
  if(goals) goals.innerHTML='<div class="kpi-goal-item"><div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span>تحصيل ضريبة الشركات</span><span>75%</span></div><div class="progress-bar-bg"><div class="progress-bar-fill" style="width:75%;background:#4caf50;"></div></div></div><div class="kpi-goal-item" style="margin-top:14px;"><div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span>معالجة الملفات المعلقة</span><span>60%</span></div><div class="progress-bar-bg"><div class="progress-bar-fill" style="width:60%;background:#ff9800;"></div></div></div><div class="kpi-goal-item" style="margin-top:14px;"><div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span>تسجيل مكلفين جدد</span><span>90%</span></div><div class="progress-bar-bg"><div class="progress-bar-fill" style="width:90%;background:#2196f3;"></div></div></div>';
  // Achievements
  var ach=document.getElementById('kpiAchievements');
  if(ach) ach.innerHTML='<div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--bg-secondary);border-radius:10px;margin-bottom:8px;"><i class="fas fa-trophy" style="color:#d4a017;"></i><span>أعلى نسبة تحصيل في آذار 2026</span></div><div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--bg-secondary);border-radius:10px;margin-bottom:8px;"><i class="fas fa-medal" style="color:#cd7f32;"></i><span>معالجة 500+ ملف في أسبوع واحد</span></div><div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--bg-secondary);border-radius:10px;"><i class="fas fa-star" style="color:#9c27b0;"></i><span>صفر شكاوى لمدة 30 يوم</span></div>';
  // KPI Chart
  try{
    var ctx=document.getElementById('kpiTrendChart');
    if(ctx){new Chart(ctx,{type:'line',data:{labels:['كانون٢','شباط','آذار','نيسان','أيار','حزيران','تموز','آب','أيلول','تشرين١','تشرين٢','كانون١'],datasets:[{label:'نسبة التحصيل',data:[72,75,78,80,82,85,83,87,89,88,90,92],borderColor:'#4caf50',tension:0.4,fill:false},{label:'رضا المكلفين',data:[85,86,88,87,89,90,91,92,91,93,92,94],borderColor:'#9c27b0',tension:0.4,fill:false}]},options:{responsive:true,plugins:{legend:{position:'bottom'}}}});}
  }catch(e){}
}

// ============================================================
//  FEATURE: REPORT BUILDER (منشئ التقارير)
// ============================================================
function initReportBuilder(){ /* already static HTML */ }
function generateCustomReport(){
  var type=document.getElementById('rbType').value;
  var output=document.getElementById('customReportOutput');if(!output)return;
  output.style.display='block';
  output.innerHTML='<div class="card" style="margin-top:16px;"><div class="card-header"><h3><i class="fas fa-chart-pie"></i> نتائج التقرير</h3></div><div class="card-body"><div class="stats-grid" style="margin-bottom:20px;"><div class="stat-card"><div class="stat-icon" style="background:var(--primary-light);color:var(--primary);"><i class="fas fa-coins"></i></div><div class="stat-info"><h3>4,250,000,000</h3><p>إجمالي الإيرادات (د.ع)</p></div></div><div class="stat-card"><div class="stat-icon" style="background:#e8f5e9;color:#4caf50;"><i class="fas fa-users"></i></div><div class="stat-info"><h3>1,247</h3><p>عدد المكلفين</p></div></div><div class="stat-card"><div class="stat-icon" style="background:#fff3e0;color:#ff9800;"><i class="fas fa-percentage"></i></div><div class="stat-info"><h3>87%</h3><p>نسبة التحصيل</p></div></div></div><canvas id="customReportChart" height="250"></canvas></div></div>';
  try{
    var ctx=document.getElementById('customReportChart');
    if(ctx){new Chart(ctx,{type:type==='comparison'?'bar':'line',data:{labels:['كانون٢','شباط','آذار','نيسان','أيار','حزيران'],datasets:[{label:'الإيرادات (مليون)',data:[350,420,380,510,480,560],backgroundColor:'rgba(15,27,77,0.7)',borderColor:'#0f1b4d',tension:0.3}]},options:{responsive:true}});}
  }catch(e){}
  showToast('تم إنشاء التقرير بنجاح');
}
function exportCustomReport(fmt){ showToast('جاري تصدير التقرير كـ '+fmt.toUpperCase()); }

// ============================================================
//  FEATURE: WORKFLOW (سير العمل)
// ============================================================
var workflowData = JSON.parse(localStorage.getItem('taxWorkflows') || '[]');
if(workflowData.length===0){
  workflowData=[
    {id:1,title:'مراجعة ملف شركة النور',assignee:'محمد أحمد',priority:'high',status:'new',date:'2026-03-25'},
    {id:2,title:'تدقيق ضريبة العقار - البصرة',assignee:'سارة حسين',priority:'medium',status:'review',date:'2026-03-20'},
    {id:3,title:'معالجة اعتراض المكلف',assignee:'أحمد علي',priority:'urgent',status:'review',date:'2026-03-18'},
    {id:4,title:'إصدار شهادة براءة ذمة',assignee:'محمد أحمد',priority:'low',status:'approved',date:'2026-03-15'},
    {id:5,title:'تسوية ضريبية - كركوك',assignee:'سارة حسين',priority:'medium',status:'completed',date:'2026-03-10'}
  ];
}
function saveWorkflows(){ localStorage.setItem('taxWorkflows', JSON.stringify(workflowData)); }
function renderWorkflow(){
  var statusCols={new:'wfNew',review:'wfReview',approved:'wfApproved',completed:'wfCompleted'};
  var priorityColors={urgent:'#f44336',high:'#ff9800',medium:'#2196f3',low:'#4caf50'};
  var priorityNames={urgent:'عاجل',high:'عالي',medium:'متوسط',low:'منخفض'};
  Object.keys(statusCols).forEach(function(s){
    var col=document.getElementById(statusCols[s]);if(!col)return;
    var items=workflowData.filter(function(w){return w.status===s;});
    col.innerHTML=items.map(function(w){return '<div class="wf-card" style="background:var(--bg-card);border-radius:10px;padding:14px;margin-bottom:10px;border-right:3px solid '+priorityColors[w.priority]+';cursor:pointer;" onclick="advanceWorkflow('+w.id+')"><h4 style="margin:0 0 6px;font-size:0.9rem;">'+w.title+'</h4><div style="display:flex;justify-content:space-between;font-size:0.78rem;color:var(--text-secondary);"><span><i class="fas fa-user"></i> '+w.assignee+'</span><span style="background:'+priorityColors[w.priority]+';color:#fff;padding:2px 8px;border-radius:20px;">'+priorityNames[w.priority]+'</span></div><small style="color:var(--text-secondary);">'+w.date+'</small></div>';}).join('');
    var countEl=document.getElementById(statusCols[s]+'Count');if(countEl)countEl.textContent=items.length;
  });
}
function advanceWorkflow(id){
  var order=['new','review','approved','completed'];
  var w=workflowData.find(function(x){return x.id===id;});if(!w)return;
  var idx=order.indexOf(w.status);if(idx<order.length-1){w.status=order[idx+1];saveWorkflows();renderWorkflow();showToast('تم تحديث حالة المهمة');}
}
function createWorkflow(){
  var title=prompt('عنوان المسار الجديد:');if(!title)return;
  workflowData.push({id:Date.now(),title:title,assignee:'محمد أحمد',priority:'medium',status:'new',date:new Date().toISOString().split('T')[0]});
  saveWorkflows();renderWorkflow();showToast('تم إنشاء مسار جديد');
}

// ============================================================
//  FEATURE: TICKETS (تذاكر الدعم)
// ============================================================
var ticketsData = JSON.parse(localStorage.getItem('taxTickets') || '[]');
if(ticketsData.length===0){
  ticketsData=[
    {id:'TKT-001',subject:'مشكلة في حساب ضريبة الشركات',dept:'الدعم الفني',priority:'high',status:'open',date:'2026-03-25',desc:''},
    {id:'TKT-002',subject:'طلب تفعيل باقة الأعمال',dept:'الاشتراكات',priority:'medium',status:'progress',date:'2026-03-22',desc:''},
    {id:'TKT-003',subject:'خطأ في تقرير التحصيل',dept:'المحاسبة',priority:'low',status:'closed',date:'2026-03-18',desc:''}
  ];
}
function saveTickets(){ localStorage.setItem('taxTickets', JSON.stringify(ticketsData)); }
function renderTickets(){
  var open=0,prog=0,closed=0;
  ticketsData.forEach(function(t){if(t.status==='open')open++;else if(t.status==='progress')prog++;else closed++;});
  var te=document.getElementById('tktTotal');if(te)te.textContent=ticketsData.length;
  var oe=document.getElementById('tktOpen');if(oe)oe.textContent=open;
  var pe=document.getElementById('tktProgress');if(pe)pe.textContent=prog;
  var ce=document.getElementById('tktClosed');if(ce)ce.textContent=closed;
  var tb=document.getElementById('ticketsTableBody');if(!tb)return;
  var priorityMap={low:'<span class="status-badge success">منخفضة</span>',medium:'<span class="status-badge warning">متوسطة</span>',high:'<span class="status-badge danger">عالية</span>',urgent:'<span class="status-badge danger" style="background:#d32f2f;color:#fff;">عاجلة</span>'};
  var statusMap={open:'<span class="status-badge warning">مفتوحة</span>',progress:'<span class="status-badge info">قيد المعالجة</span>',closed:'<span class="status-badge success">مغلقة</span>'};
  tb.innerHTML=ticketsData.map(function(t){return '<tr><td>'+t.id+'</td><td>'+t.subject+'</td><td>'+(priorityMap[t.priority]||t.priority)+'</td><td>'+(statusMap[t.status]||t.status)+'</td><td>'+t.date+'</td><td><button class="btn btn-sm" onclick="closeTicketItem(\''+t.id+'\')"><i class="fas fa-check"></i></button></td></tr>';}).join('');
}
function createTicket(){ document.getElementById('ticketModal').style.display='flex'; }
function closeTicketModal(){ document.getElementById('ticketModal').style.display='none'; }
function saveTicket(){
  var s=document.getElementById('tktSubject').value;if(!s){showToast('يرجى إدخال الموضوع',true);return;}
  ticketsData.push({id:'TKT-'+String(ticketsData.length+1).padStart(3,'0'),subject:s,dept:document.getElementById('tktDept').value,priority:document.getElementById('tktPriority').value,status:'open',date:new Date().toISOString().split('T')[0],desc:document.getElementById('tktDesc').value});
  saveTickets();closeTicketModal();renderTickets();showToast('تم إرسال التذكرة بنجاح');
}
function closeTicketItem(id){ var t=ticketsData.find(function(x){return x.id===id;});if(t){t.status='closed';saveTickets();renderTickets();showToast('تم إغلاق التذكرة');} }

// ============================================================
//  FEATURE: APPOINTMENTS (المواعيد)
// ============================================================
var appointmentsData = JSON.parse(localStorage.getItem('taxAppointments') || '[]');
if(appointmentsData.length===0){
  appointmentsData=[
    {id:1,title:'مراجعة ملف شركة النور',date:'2026-03-30',time:'10:00',client:'شركة النور',notes:'',status:'upcoming'},
    {id:2,title:'اجتماع لجنة التدقيق',date:'2026-04-02',time:'09:00',client:'',notes:'قاعة الاجتماعات الرئيسية',status:'upcoming'},
    {id:3,title:'تسليم شهادة براءة ذمة',date:'2026-03-25',time:'14:00',client:'أحمد محمود',notes:'',status:'completed'}
  ];
}
function saveAppointments(){ localStorage.setItem('taxAppointments', JSON.stringify(appointmentsData)); }
function renderAppointments(){
  var el=document.getElementById('appointmentsTimeline');if(!el)return;
  updateAppointmentStats();
  appointmentsData.sort(function(a,b){return new Date(a.date)-new Date(b.date);});
  el.innerHTML=appointmentsData.map(function(a){
    var isPast=new Date(a.date)<new Date();
    return '<div class="appointment-card" style="display:flex;gap:16px;padding:18px;background:var(--bg-secondary);border-radius:12px;margin-bottom:12px;border-right:4px solid '+(isPast?'var(--success)':'var(--primary)')+';"><div style="text-align:center;min-width:60px;"><div style="font-size:1.6rem;font-weight:700;color:var(--primary);">'+new Date(a.date).getDate()+'</div><div style="font-size:0.78rem;color:var(--text-secondary);">'+new Date(a.date).toLocaleDateString('ar-IQ',{month:'short'})+'</div></div><div style="flex:1;"><h4 style="margin:0 0 4px;">'+a.title+'</h4><div style="font-size:0.85rem;color:var(--text-secondary);"><i class="fas fa-clock"></i> '+a.time+(a.client?' • <i class="fas fa-user"></i> '+a.client:'')+'</div>'+(a.notes?'<small style="color:var(--text-secondary);">'+a.notes+'</small>':'')+'</div><div><span class="status-badge '+(isPast?'success':'info')+'">'+(isPast?'مكتمل':'قادم')+'</span></div></div>';
  }).join('');
  if(appointmentsData.length===0) el.innerHTML='<div style="text-align:center;padding:40px;color:var(--text-secondary);"><i class="fas fa-calendar" style="font-size:2rem;margin-bottom:10px;"></i><p>لا توجد مواعيد</p></div>';
}
function createAppointment(){ document.getElementById('appointmentModal').style.display='flex'; }
function closeAppointmentModal(){ document.getElementById('appointmentModal').style.display='none'; }
function saveAppointment(){
  var t=document.getElementById('apptTitle').value,d=document.getElementById('apptDate').value;
  if(!t||!d){showToast('يرجى ملء الحقول المطلوبة',true);return;}
  appointmentsData.push({id:Date.now(),title:t,date:d,time:document.getElementById('apptTime').value||'00:00',client:document.getElementById('apptClient').value,notes:document.getElementById('apptNotes').value,status:'upcoming'});
  saveAppointments();closeAppointmentModal();renderAppointments();showToast('تم حفظ الموعد');
}
function updateAppointmentStats(){
  var now=new Date();now.setHours(0,0,0,0);
  var weekStart=new Date(now);weekStart.setDate(now.getDate()-now.getDay());
  var todayStr=now.toISOString().slice(0,10);
  var cancelled=0,today=0,week=0;
  appointmentsData.forEach(function(a){
    if(a.status==='cancelled'){cancelled++;return;}
    if(a.date===todayStr) today++;
    if(a.date>=weekStart.toISOString().slice(0,10)) week++;
  });
  function setStat(id,v){var e=document.getElementById(id);if(e)e.textContent=v;}
  setStat('apptTotalCount',appointmentsData.length);
  setStat('apptTodayCount',today);
  setStat('apptWeekCount',week);
  setStat('apptCancelledCount',cancelled);
}
var currentApptFilter='all';
function filterAppointments(filter,btn){
  currentApptFilter=filter;
  var filters=document.querySelectorAll('.tasks-filters .btn');
  filters.forEach(function(b){b.classList.remove('active');});
  if(btn)btn.classList.add('active');
  var today=new Date();today.setHours(0,0,0,0);
  var todayStr=today.toISOString().slice(0,10);
  var weekStart=new Date(today);weekStart.setDate(today.getDate()-today.getDay());
  var monthStart=new Date(today.getFullYear(),today.getMonth(),1);
  var list=appointmentsData.filter(function(a){
    if(filter==='all')return true;
    if(filter==='today')return a.date===todayStr;
    if(filter==='week')return a.date>=weekStart.toISOString().slice(0,10);
    if(filter==='month')return a.date>=monthStart.toISOString().slice(0,10);
    return true;
  }).sort(function(a,b){return new Date(a.date)-new Date(b.date);});
  var el=document.getElementById('appointmentsTimeline');if(!el)return;
  if(list.length===0){
    el.innerHTML='<div style="text-align:center;padding:40px;color:var(--text-secondary);"><i class="fas fa-calendar" style="font-size:2rem;margin-bottom:10px;"></i><p>لا توجد مواعيد لهذا الفلتر</p></div>';
    return;
  }
  el.innerHTML=list.map(function(a){
    var isPast=new Date(a.date)<new Date();
    return '<div class="appointment-card" style="display:flex;gap:16px;padding:18px;background:var(--bg-secondary);border-radius:12px;margin-bottom:12px;border-right:4px solid '+(isPast?'var(--success)':'var(--primary)')+';"><div style="text-align:center;min-width:60px;"><div style="font-size:1.6rem;font-weight:700;color:var(--primary);">'+new Date(a.date).getDate()+'</div><div style="font-size:0.78rem;color:var(--text-secondary);">'+new Date(a.date).toLocaleDateString('ar-IQ',{month:'short'})+'</div></div><div style="flex:1;"><h4 style="margin:0 0 4px;">'+a.title+'</h4><div style="font-size:0.85rem;color:var(--text-secondary);"><i class="fas fa-clock"></i> '+a.time+(a.client?' • <i class="fas fa-user"></i> '+a.client:'')+'</div>'+(a.notes?'<small style="color:var(--text-secondary);">'+a.notes+'</small>':'')+'</div><div><span class="status-badge '+(isPast?'success':'info')+'">'+(isPast?'مكتمل':'قادم')+'</span></div></div>';
  }).join('');
}

// ============================================================
//  FEATURE: E-SIGNATURE (التوقيع الإلكتروني)
// ============================================================
var signatureCtx=null,isDrawing=false;
function renderESignature(){
  var docs=document.getElementById('esignDocs');
  if(docs) docs.innerHTML='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;">'+[{name:'فاتورة INV-001',status:'موقّع'},{name:'عقد تسوية ضريبية',status:'بانتظار التوقيع'},{name:'شهادة براءة ذمة',status:'بانتظار التوقيع'}].map(function(d){return '<div style="padding:16px;background:var(--bg-secondary);border-radius:12px;"><h4 style="margin:0 0 6px;font-size:0.9rem;"><i class="fas fa-file-alt"></i> '+d.name+'</h4><span class="status-badge '+(d.status==='موقّع'?'success':'warning')+'">'+d.status+'</span></div>';}).join('')+'</div>';
  initSignaturePad();
}
function initSignaturePad(){
  var canvas=document.getElementById('signaturePad');if(!canvas)return;
  if(canvas) { signatureCtx=canvas.getContext('2d');
  signatureCtx.strokeStyle='#0f1b4d';signatureCtx.lineWidth=2;signatureCtx.lineCap='round';
  canvas.addEventListener('mousedown',function(e){isDrawing=true;signatureCtx.beginPath();signatureCtx.moveTo(e.offsetX,e.offsetY);});
  canvas.addEventListener('mousemove',function(e){if(isDrawing){signatureCtx.lineTo(e.offsetX,e.offsetY);signatureCtx.stroke();}});
  canvas.addEventListener('mouseup',function(){isDrawing=false;});
  canvas.addEventListener('mouseleave',function(){isDrawing=false;}); }
}
function clearSignature(){ var c=document.getElementById('signaturePad');if(c&&signatureCtx)signatureCtx.clearRect(0,0,c.width,c.height); }
function saveSignature(){ showToast('تم حفظ التوقيع الإلكتروني بنجاح');addAuditEntry('توقيع إلكتروني','تم حفظ توقيع جديد'); }

// ============================================================
//  FEATURE: TASKS (إدارة المهام)
// ============================================================
var tasksData = JSON.parse(localStorage.getItem('taxTasks') || '[]');
if(tasksData.length===0){
  tasksData=[
    {id:1,title:'مراجعة ملفات ضريبية معلقة',status:'done',priority:'high',date:'2026-03-20'},
    {id:2,title:'إعداد تقرير الربع الأول',status:'progress',priority:'medium',date:'2026-03-25'},
    {id:3,title:'تحديث بيانات المكلفين',status:'pending',priority:'low',date:'2026-03-28'},
    {id:4,title:'اجتماع مع فريق التدقيق',status:'pending',priority:'high',date:'2026-03-30'},
    {id:5,title:'إرسال إشعارات التأخير',status:'done',priority:'medium',date:'2026-03-15'}
  ];
}
function saveTasks(){ localStorage.setItem('taxTasks', JSON.stringify(tasksData)); }
function renderTasks(filter){
  filter=filter||'all';
  var list=document.getElementById('tasksList');if(!list)return;
  var filtered=filter==='all'?tasksData:tasksData.filter(function(t){return t.status===filter;});
  var done=tasksData.filter(function(t){return t.status==='done';}).length;
  var perc=tasksData.length?Math.round(done/tasksData.length*100):0;
  var pp=document.getElementById('tasksProgressPercent');if(pp)pp.textContent=perc+'%';
  var pf=document.getElementById('tasksProgressFill');if(pf)pf.style.width=perc+'%';
  var statusIcons={pending:'fa-clock',progress:'fa-spinner',done:'fa-check-circle'};
  var statusColors={pending:'var(--warning)',progress:'var(--info)',done:'var(--success)'};
  list.innerHTML=filtered.map(function(t){return '<div class="task-item" style="display:flex;align-items:center;gap:14px;padding:14px 18px;background:var(--bg-secondary);border-radius:10px;margin-bottom:8px;'+(t.status==='done'?'opacity:0.7;':'')+'"><button style="background:none;border:2px solid '+statusColors[t.status]+';width:24px;height:24px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;color:'+statusColors[t.status]+';font-size:0.7rem;" onclick="toggleTask('+t.id+')"><i class="fas '+(t.status==='done'?'fa-check':'')+'"></i></button><div style="flex:1;"><span style="'+(t.status==='done'?'text-decoration:line-through;':'')+'">'+t.title+'</span><div style="font-size:0.78rem;color:var(--text-secondary);margin-top:2px;">'+t.date+'</div></div><button class="btn btn-sm" onclick="deleteTask('+t.id+')"><i class="fas fa-trash"></i></button></div>';}).join('');
}
function filterTasks(f,btn){ document.querySelectorAll('.tasks-filters .btn').forEach(function(b){b.classList.remove('active');});if(btn)btn.classList.add('active');renderTasks(f); }
function toggleTask(id){
  var t=tasksData.find(function(x){return x.id===id;});if(!t)return;
  var order=['pending','progress','done'];var idx=order.indexOf(t.status);t.status=order[(idx+1)%order.length];
  saveTasks();renderTasks();
}
function addNewTask(){
  var title=prompt('عنوان المهمة:');if(!title)return;
  tasksData.push({id:Date.now(),title:title,status:'pending',priority:'medium',date:new Date().toISOString().split('T')[0]});
  saveTasks();renderTasks();showToast('تم إضافة مهمة جديدة');
}
function deleteTask(id){ tasksData=tasksData.filter(function(t){return t.id!==id;});saveTasks();renderTasks();showToast('تم حذف المهمة'); }

// ============================================================
//  FEATURE: LOGIN HISTORY (سجل الدخول)
// ============================================================
var loginHistoryData = JSON.parse(localStorage.getItem('taxLoginHistory') || '[]');
function addLoginRecord(){
  var session=JSON.parse(localStorage.getItem('taxSession')||sessionStorage.getItem('taxSession')||'null');
  var browsers=['Chrome 124','Firefox 125','Edge 124','Safari 17'];
  var ips=['192.168.1.'+Math.floor(Math.random()*255),'10.0.0.'+Math.floor(Math.random()*255)];
  loginHistoryData.push({date:new Date().toLocaleString('ar-IQ'),user:session?session.username:'غير معروف',ip:ips[Math.floor(Math.random()*ips.length)],browser:browsers[Math.floor(Math.random()*browsers.length)],location:'بغداد، العراق',status:'success'});
  if(loginHistoryData.length>50)loginHistoryData=loginHistoryData.slice(-50);
  localStorage.setItem('taxLoginHistory',JSON.stringify(loginHistoryData));
}
function renderLoginHistory(){
  var tb=document.getElementById('loginHistoryBody');if(!tb)return;
  // Add some demo data if empty
  if(loginHistoryData.length===0){
    var demoEntries=[
      {date:'2026/03/28 09:15:22',user:'admin',ip:'192.168.1.100',browser:'Chrome 124',location:'بغداد، العراق',status:'success'},
      {date:'2026/03/27 14:30:45',user:'admin',ip:'192.168.1.100',browser:'Chrome 124',location:'بغداد، العراق',status:'success'},
      {date:'2026/03/27 08:22:11',user:'user1',ip:'10.0.0.55',browser:'Firefox 125',location:'البصرة، العراق',status:'success'},
      {date:'2026/03/26 16:45:00',user:'unknown',ip:'203.45.67.89',browser:'Edge 124',location:'غير معروف',status:'failed'}
    ];
    loginHistoryData=demoEntries;
  }
  tb.innerHTML=loginHistoryData.slice().reverse().map(function(l){return '<tr><td>'+l.date+'</td><td>'+l.user+'</td><td><code>'+l.ip+'</code></td><td>'+l.browser+'</td><td>'+l.location+'</td><td><span class="status-badge '+(l.status==='success'?'success':'danger')+'">'+(l.status==='success'?'ناجح':'فاشل')+'</span></td></tr>';}).join('');
}

// ============================================================
//  FEATURE: BACKUP & RESTORE (النسخ الاحتياطي)
// ============================================================
var backupsData = JSON.parse(localStorage.getItem('taxBackups') || '[]');
function renderBackups(){
  var lastEl=document.getElementById('lastBackupDate');
  if(lastEl) lastEl.textContent=backupsData.length?backupsData[backupsData.length-1].date:'لم يتم النسخ بعد';
  var list=document.getElementById('backupsList');
  if(list) list.innerHTML=backupsData.length?backupsData.slice().reverse().map(function(b){return '<div style="display:flex;align-items:center;gap:14px;padding:14px;background:var(--bg-secondary);border-radius:10px;margin-bottom:8px;"><i class="fas fa-archive" style="font-size:1.4rem;color:var(--primary);"></i><div style="flex:1;"><h4 style="margin:0;font-size:0.9rem;">'+b.name+'</h4><small style="color:var(--text-secondary);">'+b.date+' • '+b.size+'</small></div><button class="btn btn-sm" onclick="restoreFromBackup(\''+b.id+'\')"><i class="fas fa-undo"></i> استعادة</button></div>';}).join(''):'<div style="text-align:center;padding:30px;color:var(--text-secondary);"><i class="fas fa-database" style="font-size:2rem;margin-bottom:10px;"></i><p>لا توجد نسخ احتياطية</p></div>';
}
function createBackup(){
  var allData={invoices:invoicesData,taxpayers:taxpayersData,tasks:tasksData,tickets:ticketsData,workflows:workflowData,appointments:appointmentsData};
  var json=JSON.stringify(allData);
  var size=(json.length/1024).toFixed(1)+' KB';
  var backup={id:'BK-'+Date.now(),name:'نسخة احتياطية '+(backupsData.length+1),date:new Date().toLocaleString('ar-IQ'),size:size,data:json};
  backupsData.push(backup);localStorage.setItem('taxBackups',JSON.stringify(backupsData));
  renderBackups();showToast('تم إنشاء النسخة الاحتياطية بنجاح');addAuditEntry('نسخ احتياطي','تم إنشاء '+backup.name);
}
function restoreBackup(){
  var input=document.createElement('input');input.type='file';input.accept='.json';
  input.onchange=function(e){
    var file=e.target.files[0];if(!file)return;
    var reader=new FileReader();reader.onload=function(ev){
      try{
        var data=JSON.parse(ev.target.result);
        if(data.invoices)invoicesData=data.invoices;if(data.taxpayers)taxpayersData=data.taxpayers;
        if(data.tasks)tasksData=data.tasks;if(data.tickets)ticketsData=data.tickets;
        showToast('تم استعادة البيانات بنجاح');addAuditEntry('استعادة','تم استعادة نسخة احتياطية');
      }catch(err){showToast('خطأ في الملف',true);}
    };reader.readAsText(file);
  };input.click();
}
function restoreFromBackup(id){ var b=backupsData.find(function(x){return x.id===id;});if(b&&b.data){try{var d=JSON.parse(b.data);if(d.invoices)invoicesData=d.invoices;if(d.taxpayers)taxpayersData=d.taxpayers;showToast('تم الاستعادة بنجاح');}catch(e){showToast('خطأ',true);}} }
function toggleAutoBackup(v){ localStorage.setItem('autoBackup',v?'1':'0');showToast(v?'تم تفعيل النسخ التلقائي':'تم إيقاف النسخ التلقائي'); }

// ============================================================
//  FEATURE: API DASHBOARD (واجهة API)
// ============================================================
var apiKey = localStorage.getItem('taxApiKey') || 'txapi_' + Math.random().toString(36).substr(2, 24);
localStorage.setItem('taxApiKey', apiKey);
var apiKeyVisible = false;
function renderApiDashboard(){
  var display=document.getElementById('apiKeyDisplay');if(display)display.textContent=apiKeyVisible?apiKey:'••••••••••••••••••••••••••••';
  // Endpoints
  var endpoints=document.getElementById('apiEndpoints');
  if(endpoints){
    var eps=[
      {method:'GET',path:'/api/v1/taxpayers',desc:'قائمة المكلفين'},
      {method:'POST',path:'/api/v1/invoices',desc:'إنشاء فاتورة'},
      {method:'GET',path:'/api/v1/reports',desc:'التقارير'},
      {method:'GET',path:'/api/v1/taxes/calculate',desc:'حساب الضريبة'},
      {method:'POST',path:'/api/v1/payments',desc:'تسجيل دفعة'},
      {method:'GET',path:'/api/v1/stats',desc:'الإحصائيات العامة'}
    ];
    endpoints.innerHTML=eps.map(function(e){return '<div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--bg-secondary);border-radius:10px;margin-bottom:8px;"><span style="background:'+(e.method==='GET'?'#4caf50':'#2196f3')+';color:#fff;padding:3px 10px;border-radius:6px;font-family:monospace;font-size:0.8rem;min-width:50px;text-align:center;">'+e.method+'</span><code style="flex:1;font-size:0.9rem;">'+e.path+'</code><span style="color:var(--text-secondary);font-size:0.85rem;">'+e.desc+'</span></div>';}).join('');
  }
  // Usage stats
  var stats=document.getElementById('apiUsageStats');
  if(stats) stats.innerHTML='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;"><div style="text-align:center;padding:16px;background:var(--bg-secondary);border-radius:10px;"><h3 style="margin:0;color:var(--primary);">1,247</h3><small>الطلبات اليوم</small></div><div style="text-align:center;padding:16px;background:var(--bg-secondary);border-radius:10px;"><h3 style="margin:0;color:var(--success);">99.8%</h3><small>وقت التشغيل</small></div><div style="text-align:center;padding:16px;background:var(--bg-secondary);border-radius:10px;"><h3 style="margin:0;color:var(--warning);">45ms</h3><small>متوسط الاستجابة</small></div></div>';
  // Chart
  try{
    var ctx=document.getElementById('apiUsageChart');
    if(ctx){new Chart(ctx,{type:'bar',data:{labels:['سبت','أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة'],datasets:[{label:'عدد الطلبات',data:[980,1100,1247,1050,1320,890,750],backgroundColor:'rgba(15,27,77,0.7)'}]},options:{responsive:true}});}
  }catch(e){}
}
function toggleApiKey(){ apiKeyVisible=!apiKeyVisible;var d=document.getElementById('apiKeyDisplay');if(d)d.textContent=apiKeyVisible?apiKey:'••••••••••••••••••••••••••••'; }
function copyApiKey(){ navigator.clipboard.writeText(apiKey).then(function(){showToast('تم نسخ مفتاح API');}); }
function regenerateApiKey(){ apiKey='txapi_'+Math.random().toString(36).substr(2,24);localStorage.setItem('taxApiKey',apiKey);apiKeyVisible=true;renderApiDashboard();showToast('تم إعادة توليد مفتاح API');addAuditEntry('API','تم إعادة توليد مفتاح API'); }

// ============================================================
//  FEATURE: 2FA (المصادقة الثنائية)
// ============================================================
var twoFAEnabled = localStorage.getItem('tax2FA') === '1';
function toggle2FA(enabled){
  if(enabled){
    var code=String(Math.floor(100000+Math.random()*900000));
    var entered=prompt('تم إرسال رمز التحقق: '+code+'\nأدخل الرمز للتفعيل:');
    if(entered===code){twoFAEnabled=true;localStorage.setItem('tax2FA','1');showToast('تم تفعيل المصادقة الثنائية بنجاح');addAuditEntry('أمان','تم تفعيل المصادقة الثنائية');}
    else{showToast('رمز غير صحيح',true);var el=document.getElementById('toggle2FA');if(el)el.checked=false;}
  }else{twoFAEnabled=false;localStorage.setItem('tax2FA','0');showToast('تم إيقاف المصادقة الثنائية');}
}

// ============================================================
//  FEATURE: RBAC (صلاحيات متقدمة)
// ============================================================
var roles = JSON.parse(localStorage.getItem('taxRoles') || 'null') || {
  admin:{name:'مدير النظام',permissions:['all']},
  accountant:{name:'محاسب',permissions:['dashboard','corporate','land','property','profession','sales','reports','invoices','taxpayers']},
  auditor:{name:'مدقق',permissions:['dashboard','reports','audit','documents']},
  viewer:{name:'مشاهد',permissions:['dashboard']}
};
function saveRoles(){ localStorage.setItem('taxRoles', JSON.stringify(roles)); }

// ============================================================
//  FEATURE: COLOR THEMES (سمات الألوان)
// ============================================================
var colorThemes = {
  default:{primary:'#0f1b4d',accent:'#d4a017',name:'الأزرق الداكن (الافتراضي)'},
  ocean:{primary:'#006064',accent:'#00bcd4',name:'المحيط'},
  forest:{primary:'#1b5e20',accent:'#4caf50',name:'الغابة'},
  royal:{primary:'#4a148c',accent:'#ce93d8',name:'الملكي'},
  sunset:{primary:'#bf360c',accent:'#ff6f00',name:'الغروب'},
  midnight:{primary:'#1a1a2e',accent:'#e94560',name:'منتصف الليل'}
};
function applyColorTheme(theme){
  var t=colorThemes[theme];if(!t)return;
  document.documentElement.style.setProperty('--primary',t.primary);
  document.documentElement.style.setProperty('--primary-dark',t.primary);
  document.documentElement.style.setProperty('--accent',t.accent);
  localStorage.setItem('taxColorTheme',theme);
  showToast('تم تطبيق سمة: '+t.name);
}
function loadColorTheme(){
  var saved=localStorage.getItem('taxColorTheme');
  if(saved&&colorThemes[saved])applyColorTheme(saved);
}

// ============================================================
//  FEATURE: MULTI-LANGUAGE (متعدد اللغات)
// ============================================================
var currentLang = localStorage.getItem('taxLang') || 'ar';
var translations = {
  ar:{dashboard:'لوحة التحكم',settings:'الإعدادات',logout:'تسجيل الخروج',search:'بحث',save:'حفظ',cancel:'إلغاء',delete:'حذف',edit:'تحرير',add:'إضافة',export_btn:'تصدير',print:'طباعة'},
  en:{dashboard:'Dashboard',settings:'Settings',logout:'Logout',search:'Search',save:'Save',cancel:'Cancel',delete:'Delete',edit:'Edit',add:'Add',export_btn:'Export',print:'Print'},
  ku:{dashboard:'داشبۆرد',settings:'ڕێکخستنەکان',logout:'چوونە دەرەوە',search:'گەڕان',save:'پاشەکەوتکردن',cancel:'هەڵوەشاندنەوە',delete:'سڕینەوە',edit:'دەستکاری',add:'زیادکردن',export_btn:'هەناردن',print:'چاپکردن'}
};
function switchLanguage(lang){
  currentLang=lang;localStorage.setItem('taxLang',lang);
  if(lang==='en'){document.documentElement.setAttribute('dir','ltr');document.documentElement.setAttribute('lang','en');}
  else if(lang==='ku'){document.documentElement.setAttribute('dir','rtl');document.documentElement.setAttribute('lang','ku');}
  else{document.documentElement.setAttribute('dir','rtl');document.documentElement.setAttribute('lang','ar');}
  showToast(lang==='en'?'Language changed to English':lang==='ku'?'زمان گۆڕدرا بۆ کوردی':'تم تغيير اللغة إلى العربية');
}

// ============================================================
//  FEATURE: PRESENTATION MODE (وضع العرض)
// ============================================================
var presentationMode = false;
function togglePresentationMode(){
  presentationMode=!presentationMode;
  document.body.classList.toggle('presentation-mode',presentationMode);
  if(presentationMode){
    document.getElementById('sidebar').style.display='none';
    document.querySelector('.main-content').style.marginRight='0';
    document.querySelector('.top-header').style.right='0';
    showToast('وضع العرض مفعّل - اضغط ESC للخروج');
  }else{
    document.getElementById('sidebar').style.display='';
    document.querySelector('.main-content').style.marginRight='';
    document.querySelector('.top-header').style.right='';
    showToast('تم الخروج من وضع العرض');
  }
}

// ============================================================
//  FEATURE: ENHANCED CHATBOT (المساعد الذكي المتقدم)
// ============================================================
var chatbotKnowledge = {
  'ضريبة الشركات':'نسبة ضريبة دخل الشركات في العراق هي 15% على صافي الدخل الخاضع للضريبة. شركات النفط والغاز تخضع لنسبة 35%. الشركات المعفاة تشمل المؤسسات الحكومية والجمعيات الخيرية.',
  'ضريبة العقار':'تفرض ضريبة العقار بنسبة 10% من إيجار العقار السنوي أو القيمة الإيجارية المقدرة. يُخصم بدل صيانة بنسبة 10-30% حسب نوع العقار.',
  'ضريبة العرصات':'تفرض ضريبة على العرصات (الأراضي غير المبنية) في المناطق البلدية بنسب تتراوح بين 2-10% من القيمة المقدرة حسب الموقع.',
  'الغرامات':'غرامة التأخير عن تقديم الإقرار الضريبي: 5% عن كل شهر تأخير بحد أقصى 25%. غرامة التأخير عن الدفع: 5% تضاف على المبلغ المستحق.',
  'الإعفاءات':'تشمل الإعفاءات: الحد الأدنى للإعفاء الشخصي (3,600,000 د.ع سنوياً)، إعفاء المعالين، إعفاء التعليم والصحة.',
  'التسجيل':'يجب على كل مكلف التسجيل لدى الهيئة العامة للضرائب خلال 30 يوم من بدء النشاط. يتم منح رقم ضريبي فريد (TIN).',
  'الاعتراض':'يحق للمكلف الاعتراض على التقدير الضريبي خلال 21 يوم من تاريخ التبليغ. يُقدم الاعتراض إلى لجنة الطعن.',
  'القانون':'قانون ضريبة الدخل رقم 113 لسنة 1982 المعدل هو القانون الأساسي المنظم للضرائب في العراق.',
  'المواعيد':'الموعد النهائي لتقديم الإقرار السنوي: 31 أيار من كل عام. الموعد النهائي للدفع: 30 حزيران.',
  'تحسين':'لتقليل العبء الضريبي بشكل قانوني: استفد من جميع الإعفاءات المتاحة، وثّق جميع المصاريف القابلة للخصم، استخدم إعفاءات المناطق الاستثمارية.'
};
// Override existing sendChatMessage with enhanced version
var originalAskChatbot = typeof askChatbot === 'function' ? askChatbot : null;

// ============================================================
//  FEATURE: AUTO ERROR DETECTION (كشف الأخطاء التلقائي)
// ============================================================
function autoDetectErrors(){
  var errors=[];
  // Check invoices for overdue
  invoicesData.forEach(function(inv){if(inv.status==='overdue')errors.push({type:'warning',msg:'فاتورة '+inv.id+' متأخرة عن الدفع'});});
  // Check tasks pending too long
  tasksData.forEach(function(t){if(t.status==='pending'){var d=new Date(t.date);var diff=(new Date()-d)/(86400000);if(diff>7)errors.push({type:'info',msg:'مهمة "'+t.title+'" معلقة منذ أكثر من أسبوع'});}});
  return errors;
}

// ============================================================
//  FEATURE: TAX OPTIMIZATION SUGGESTIONS (اقتراحات التحسين)
// ============================================================
function getTaxOptimizations(){
  return [
    {icon:'fa-lightbulb',title:'تقليل الضريبة المستحقة',desc:'تأكد من تسجيل جميع المصاريف التشغيلية لتقليل صافي الدخل الخاضع للضريبة.',color:'#ff9800'},
    {icon:'fa-shield-alt',title:'تجنب الغرامات',desc:'قدّم الإقرار الضريبي قبل 31 أيار لتجنب غرامة التأخير بنسبة 5% شهرياً.',color:'#f44336'},
    {icon:'fa-chart-line',title:'الاستثمار في المناطق المعفاة',desc:'استفد من قانون الاستثمار رقم 13 لسنة 2006 للحصول على إعفاءات في المناطق الاستثمارية.',color:'#4caf50'},
    {icon:'fa-file-alt',title:'توثيق المصاريف',desc:'احتفظ بجميع الفواتير والإيصالات كإثبات للمصاريف القابلة للخصم.',color:'#2196f3'}
  ];
}

// ============================================================
//  FEATURE: OCR SIMULATION (التعرف البصري)
// ============================================================
function simulateOCR(file){
  showToast('جاري معالجة المستند بتقنية OCR...');
  setTimeout(function(){
    showToast('تم استخراج البيانات من المستند بنجاح');
    addAuditEntry('OCR','تم معالجة مستند بتقنية التعرف البصري');
  },2000);
}

// ============================================================
//  FEATURE: PAYMENT GATEWAYS (بوابات الدفع)
// ============================================================
var paymentGateways = [
  {id:'zaincash',name:'زين كاش',icon:'fa-mobile-alt',color:'#7c3aed',active:true},
  {id:'asiahawala',name:'آسيا حوالة',icon:'fa-money-bill-wave',color:'#059669',active:true},
  {id:'fastpay',name:'فاست باي',icon:'fa-bolt',color:'#d97706',active:false},
  {id:'naspay',name:'ناس باي',icon:'fa-wallet',color:'#2563eb',active:false},
  {id:'qicard',name:'كي كارد',icon:'fa-credit-card',color:'#dc2626',active:true}
];
function processPayment(gateway,amount){
  showToast('جاري معالجة الدفع عبر '+gateway+'...');
  setTimeout(function(){showToast('تم الدفع بنجاح عبر '+gateway);addAuditEntry('دفع','تم دفع '+amount+' د.ع عبر '+gateway);},1500);
}

// ============================================================
//  FEATURE: ACCOUNTING EXPORT (تصدير المحاسبة)
// ============================================================
function exportToAccounting(format){
  var data={invoices:invoicesData,taxpayers:taxpayersData,date:new Date().toISOString()};
  if(format==='quickbooks'){showToast('جاري التصدير بصيغة QuickBooks...');}
  else if(format==='sage'){showToast('جاري التصدير بصيغة Sage...');}
  else{showToast('جاري التصدير بصيغة CSV...');}
  setTimeout(function(){showToast('تم التصدير بنجاح');addAuditEntry('تصدير','تم تصدير البيانات بصيغة '+format);},1000);
}

// ============================================================
//  FEATURE: TELEGRAM/WHATSAPP NOTIFICATIONS
// ============================================================
var notificationChannels = JSON.parse(localStorage.getItem('taxNotifChannels') || '{}');
function toggleNotifChannel(channel,enabled){
  notificationChannels[channel]=enabled;
  localStorage.setItem('taxNotifChannels',JSON.stringify(notificationChannels));
  showToast(enabled?'تم تفعيل إشعارات '+channel:'تم إيقاف إشعارات '+channel);
}
function sendTestNotification(channel){
  showToast('تم إرسال إشعار تجريبي عبر '+channel);
}

// ============================================================
//  FEATURE: PWA & SERVICE WORKER
// ============================================================
function initPWA(){
  if('serviceWorker' in navigator){
    // Register service worker if available
    // navigator.serviceWorker.register('/sw.js');
  }
}

// ============================================================
//  ENHANCED DASHBOARD (Advanced Charts + AI Predictions + Optimization)
// ============================================================
function enhanceDashboard(){
  // Tax optimization widget
  var optimizations=getTaxOptimizations();
  var dashContent=document.querySelector('#page-dashboard .page-content, #page-dashboard');
  if(!dashContent)return;
  var existing=document.getElementById('dashOptimizations');
  if(existing)return;
  // Add after existing content
  var widget=document.createElement('div');widget.id='dashOptimizations';widget.className='card';widget.setAttribute('data-aos','fade-up');
  widget.innerHTML='<div class="card-header"><h3><i class="fas fa-lightbulb" style="color:#ff9800;"></i> اقتراحات تحسين الضرائب (AI)</h3></div><div class="card-body"><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;">'+optimizations.map(function(o){return '<div style="padding:16px;background:var(--bg-secondary);border-radius:12px;border-right:4px solid '+o.color+';"><h4 style="margin:0 0 6px;font-size:0.9rem;"><i class="fas '+o.icon+'" style="color:'+o.color+';"></i> '+o.title+'</h4><p style="margin:0;font-size:0.83rem;color:var(--text-secondary);">'+o.desc+'</p></div>';}).join('')+'</div></div>';
  var charts=dashContent.querySelectorAll('.card');
  if(charts.length>2) charts[charts.length-1].parentNode.insertBefore(widget,charts[charts.length-1].nextSibling);

  // Error detection widget
  var errors=autoDetectErrors();
  if(errors.length>0){
    var errWidget=document.createElement('div');errWidget.className='card';errWidget.setAttribute('data-aos','fade-up');
    errWidget.innerHTML='<div class="card-header"><h3><i class="fas fa-exclamation-triangle" style="color:#f44336;"></i> تنبيهات تلقائية</h3></div><div class="card-body">'+errors.map(function(e){return '<div style="padding:10px 14px;background:var(--bg-secondary);border-radius:10px;margin-bottom:8px;border-right:3px solid '+(e.type==='warning'?'#ff9800':'#2196f3')+';display:flex;align-items:center;gap:10px;"><i class="fas '+(e.type==='warning'?'fa-exclamation-triangle':'fa-info-circle')+'" style="color:'+(e.type==='warning'?'#ff9800':'#2196f3')+';"></i><span style="font-size:0.88rem;">'+e.msg+'</span></div>';}).join('')+'</div>';
    if(widget.parentNode)widget.parentNode.insertBefore(errWidget,widget.nextSibling);
  }
}

// ============================================================
//  AI PREDICTIONS (التنبؤات)
// ============================================================
function getAIPredictions(){
  return {
    nextMonthRevenue:'2.8 مليار د.ع',nextMonthTaxpayers:'+45 مكلف جديد',
    riskLevel:'متوسط',recommendation:'زيادة فريق التدقيق'
  };
}

// ============================================================
//  PERIOD COMPARISON (مقارنة الفترات)
// ============================================================
function comparePeriods(p1,p2){
  return {revenue:{p1:'2.4 مليار',p2:'2.1 مليار',change:'+14%'},taxpayers:{p1:'1247',p2:'1180',change:'+5.7%'},collection:{p1:'87%',p2:'82%',change:'+5%'}};
}

// ============================================================
//  CUSTOM DASHBOARDS (لوحات مخصصة)
// ============================================================
var customWidgets = JSON.parse(localStorage.getItem('taxCustomWidgets') || '["revenue","taxpayers","collection","tasks"]');
function saveCustomWidgets(){ localStorage.setItem('taxCustomWidgets', JSON.stringify(customWidgets)); }

// ========== CORPORATE TAX — CONTRACT TAX ==========
var CONTRACT_TAX_RATES = {
  construction: { name: 'مقاولات إنشائية', rate: 0.033 },
  supply: { name: 'عقد توريد', rate: 0.033 },
  services: { name: 'عقد خدمات', rate: 0.033 },
  consulting: { name: 'عقد استشارات', rate: 0.07 },
  transport: { name: 'عقد نقل', rate: 0.033 },
  maintenance: { name: 'عقد صيانة', rate: 0.033 },
  rent_equipment: { name: 'تأجير معدات', rate: 0.10 },
  foreign: { name: 'عقد شركة أجنبية', rate: 0.07 }
};

function updateContractTaxRate() {
  var type = document.getElementById('contractType').value;
  var info = CONTRACT_TAX_RATES[type];
  document.getElementById('contractTaxRateDisplay').value = info ? (info.rate * 100) + '%' : '';
}

function calculateContractTax() {
  var type = document.getElementById('contractType').value;
  var value = getVal('contractValue');
  if (!type) { showToast('يرجى اختيار نوع العقد', true); return; }
  if (!value) { showToast('يرجى إدخال قيمة العقد', true); return; }
  var info = CONTRACT_TAX_RATES[type];
  var tax = value * info.rate;
  var signDate = document.getElementById('contractSignDate').value;
  var endDate = document.getElementById('contractEndDate').value;
  var duration = '-';
  if (signDate && endDate) {
    var d1 = new Date(signDate), d2 = new Date(endDate);
    var months = (d2.getFullYear() - d1.getFullYear()) * 12 + d2.getMonth() - d1.getMonth();
    duration = months + ' شهر';
  }
  setText('contractTypeResult', info.name);
  setText('contractValueResult', formatNumber(value) + ' د.ع');
  setText('contractRateResult', (info.rate * 100) + '٪');
  setText('contractDurationResult', duration);
  setText('contractTaxDue', formatNumber(Math.round(tax)) + ' د.ع');
  document.getElementById('contractTaxResult').style.display = 'block';
  showToast('تم احتساب ضريبة العقد بنجاح');
}

function switchContractSubTab(event, tabId) {
  event.target.closest('.tabs-container').querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
  event.target.classList.add('active');
  document.querySelectorAll('.contract-subtab').forEach(function(s) { s.classList.remove('active'); s.style.display = 'none'; });
  var panel = document.getElementById(tabId);
  if (panel) { panel.classList.add('active'); panel.style.display = 'block'; }
}

function calculateDeduction() {
  var payment = getVal('deductionPayment');
  var rate = parseFloat(document.getElementById('deductionRate').value) / 100;
  if (!payment) { showToast('يرجى إدخال قيمة الدفعة', true); return; }
  var deduction = payment * rate;
  var net = payment - deduction;
  setText('deductionPaymentResult', formatNumber(payment) + ' د.ع');
  setText('deductionRateResult', (rate * 100) + '٪');
  setText('deductionAmountResult', formatNumber(Math.round(deduction)) + ' د.ع');
  setText('deductionNetResult', formatNumber(Math.round(net)) + ' د.ع');
  document.getElementById('deductionResult').style.display = 'block';
  showToast('تم احتساب الاستقطاع بنجاح');
}

function formatInputNumber(val) {
  if(!val) return '';
  var num = val.replace(/[^0-9٠-٩۰-۹]/g, '');
  if(!num) return '';
  var parsed = parseArabicNumber(num);
  return formatNumber(parsed);
}

function handleLandStep1() {
  var step1 = document.getElementById('landExemptionCode').value;
  var step2 = document.getElementById('landStep2');
  var step3 = document.getElementById('landStep3');
  var btn = document.getElementById('landCalculateBtnGroup');
  var resBox = document.getElementById('landNewResultBox');
  
  // reset down tree
  document.getElementById('landIsMinor').value = "";
  document.getElementById('landTotalArea').value = "";
  document.getElementById('landTotalValue').value = "";
  step2.style.display = 'none';
  step3.style.display = 'none';
  btn.style.display = 'none';
  resBox.style.display = 'none';

  if (!step1) return;

  if (step1 === 'none') {
    // Proceed to Step 2
    step2.style.display = 'block';
  } else {
    // Total exemption directly
    btn.style.display = 'block';
  }
}

function handleLandStep2() {
  var step2 = document.getElementById('landIsMinor').value;
  var step3 = document.getElementById('landStep3');
  var btn = document.getElementById('landCalculateBtnGroup');
  var resBox = document.getElementById('landNewResultBox');

  // reset down tree
  document.getElementById('landTotalArea').value = "";
  document.getElementById('landTotalValue').value = "";
  step3.style.display = 'none';
  btn.style.display = 'none';
  resBox.style.display = 'none';

  if (step2) {
    step3.style.display = 'block';
    btn.style.display = 'block';
  }
}

function calculateNewLandTax() {
  var step1 = document.getElementById('landExemptionCode').value;
  var resBox = document.getElementById('landNewResultBox');
  var resDetails = document.getElementById('landNewResultDetails');
  var exemptMsg = document.getElementById('landExemptMessage');
  var exemptText = document.getElementById('landExemptText');
  
  if (!step1) {
    showToast('يرجى تحديد حالة الإعفاء من الخطوة الأولى', true);
    return;
  }

  resBox.style.display = 'block';

  // المرحلة الأولى: التحقق من الإعفاء الكلي
  if (step1 !== 'none') {
    resDetails.style.display = 'none';
    exemptMsg.style.display = 'block';
    exemptText.textContent = "العرصة معفاة من الضريبة بالكامل؛ لتطابقها مع أحد شروط الإعفاء التام.";
    showToast('العرصة معفاة بالكامل');
    return;
  }

  // Not strictly exempt, must check minor and numbers
  var isMinor = document.getElementById('landIsMinor').value;
  var totalArea = parseFloat(document.getElementById('landTotalArea').value);
  var totalValue = parseArabicNumber(document.getElementById('landTotalValue').value);

  if (!isMinor) {
    showToast('يرجى الإجابة على سؤال القاصر', true);
    return;
  }
  if (isNaN(totalArea) || totalArea <= 0 || isNaN(totalValue) || totalValue <= 0) {
    showToast('يرجى إدخال المساحة الكلية والقيمة الكلية بأرقام صحيحة أكبر من صفر', true);
    return;
  }

  var taxableArea = 0;
  var statusMsg = "";

  // المرحلة الثانية والثالثة
  if (isMinor === 'yes') {
    taxableArea = totalArea;
    statusMsg = "المالك قاصر؛ لا يوجد إعفاء جزئي للمساحة (800 متر)، تخضع كامل المساحة للضريبة.";
  } else {
    if (totalArea <= 800) {
      // معفى بالكامل
      resDetails.style.display = 'none';
      exemptMsg.style.display = 'block';
      exemptText.textContent = "العرصة معفاة من الضريبة بالكامل ضمن السماح القانوني للمساحة (800 متر مربع فما دون).";
      showToast('العرصة معفاة بالكامل');
      return;
    } else {
      taxableArea = totalArea - 800;
      statusMsg = "المالك بالغ؛ تم خصم الإعفاء الجزئي (800 م²). المساحة المتبقية خاضعة للضريبة.";
    }
  }

  // الحساب المالي
  var meterValue = totalValue / totalArea;
  var taxableValue = meterValue * taxableArea;
  var finalTax = taxableValue * 0.02; // نسبة 2%

  exemptMsg.style.display = 'none';
  resDetails.style.display = 'block';

  setText('landResTotalArea', formatNumber(totalArea) + ' م²');
  setText('landResTotalValue', formatNumber(Math.round(totalValue)) + ' د.ع');
  setText('landResMeterValue', formatNumber(Math.round(meterValue)) + ' د.ع / م²');
  setText('landResExemptStatus', statusMsg);
  setText('landResTaxableArea', formatNumber(taxableArea) + ' م²');
  setText('landResTaxableValue', formatNumber(Math.round(taxableValue)) + ' د.ع');
  setText('landResFinalTax', formatNumber(Math.round(finalTax)) + ' د.ع');

  showToast('تم احتساب الضريبة بنجاح');
  
  if (document.getElementById('dd4aPrintableArea')) {
      // Note: we can add audit or other saves if necessary, 
      // but not specifically requested for land just yet.
  }
}

// ========== PROPERTY TAX (ضريبة العقار) ==========
function handlePropStep1() {
  var s1 = document.getElementById('propExemptType1').value;
  var s2 = document.getElementById('propStep2');
  var s3 = document.getElementById('propStep3');
  var s4 = document.getElementById('propStep4');
  var btn = document.getElementById('propCalculateBtnGroup');
  var resBox = document.getElementById('propNewResultBox');

  // reset down
  document.getElementById('propExemptType2').value = "";
  document.getElementById('propIsNew').value = "";
  document.getElementById('propNewDate').value = "";
  document.getElementById('propIsEmpty').value = "";
  document.getElementById('propEmptyMonths').value = "";
  s2.style.display = 'none';
  s3.style.display = 'none';
  s4.style.display = 'none';
  btn.style.display = 'none';
  resBox.style.display = 'none';

  if (!s1) return;

  if (s1 === 'none') {
    s2.style.display = 'block';
  } else {
    btn.style.display = 'block';
  }
}

function handlePropStep2() {
  var s2 = document.getElementById('propExemptType2').value;
  var s3 = document.getElementById('propStep3');
  var s4 = document.getElementById('propStep4');
  var btn = document.getElementById('propCalculateBtnGroup');
  var resBox = document.getElementById('propNewResultBox');

  document.getElementById('propIsNew').value = "";
  document.getElementById('propNewDate').value = "";
  document.getElementById('propIsEmpty').value = "";
  document.getElementById('propEmptyMonths').value = "";
  s3.style.display = 'none';
  s4.style.display = 'none';
  btn.style.display = 'none';
  resBox.style.display = 'none';

  if (!s2) return;

  if (s2 === 'none') {
    s3.style.display = 'block';
  } else {
    btn.style.display = 'block';
  }
}

function togglePropNewDate() {
  var val = document.getElementById('propIsNew').value;
  document.getElementById('propNewDateGroup').style.display = val === 'yes' ? 'block' : 'none';
  handlePropStep3();
}

function togglePropEmptyMonths() {
  var val = document.getElementById('propIsEmpty').value;
  document.getElementById('propEmptyMonthsGroup').style.display = val === 'yes' ? 'block' : 'none';
  handlePropStep3();
}

function handlePropStep3() {
  var isNew = document.getElementById('propIsNew').value;
  var isEmp = document.getElementById('propIsEmpty').value;
  var s4 = document.getElementById('propStep4');
  var btn = document.getElementById('propCalculateBtnGroup');
  var resBox = document.getElementById('propNewResultBox');

  resBox.style.display = 'none';

  if (!isNew || !isEmp) {
    s4.style.display = 'none';
    btn.style.display = 'none';
    return;
  }

  // Check if fully exempt due to "New" within 5 years
  if (isNew === 'yes') {
    var d = document.getElementById('propNewDate').value;
    if (d) {
      var dDate = new Date(d);
      var now = new Date();
      var diffTime = Math.abs(now - dDate);
      var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= (5 * 365)) {
        s4.style.display = 'none';
        btn.style.display = 'block';
        return;
      }
    } else {
      s4.style.display = 'none';
      btn.style.display = 'none';
      return;
    }
  }

  s4.style.display = 'block';
  btn.style.display = 'block';
}

function calculateNewPropertyTax() {
  var s1 = document.getElementById('propExemptType1').value;
  var resBox = document.getElementById('propNewResultBox');
  var resDetails = document.getElementById('propNewResultDetails');
  var exemptMsg = document.getElementById('propExemptMessage');
  var exemptText = document.getElementById('propExemptText');
  
  resBox.style.display = 'block';

  // Step 1 check
  if (s1 !== 'none') {
    resDetails.style.display = 'none';
    exemptMsg.style.display = 'block';
    exemptText.textContent = "تم إعفاء هذا العقار بالكامل بناءً على صفته أو منفعته العامة المنتجاة، وذلك استناداً إلى أحكام (المادة الثالثة) من قانون ضريبة العقار رقم 162 لسنة 1959 وتعديلاته التي تنص على إعفاء دور الدولة والأوقاف والنفع العام.";
    showToast('العقار معفى بالكامل');
    return;
  }

  // Step 2 check
  var s2 = document.getElementById('propExemptType2').value;
  if (s2 !== 'none') {
    resDetails.style.display = 'none';
    exemptMsg.style.display = 'block';
    exemptText.textContent = "تم إعفاء هذا العقار بالكامل لأنه يمثل (دار سكن للعائلة)، وذلك استناداً إلى أحكام (المادة الرابعة - الفقرتين 1 و 2) من قانون ضريبة العقار رقم 162 لسنة 1959 وتعديلاته، والتي تنص على إعفاء دار السكن والشقة التي يسكنها المالك أو أقاربه من الدرجة الأولى.";
    showToast('العقار معفى كدار سكن');
    return;
  }

  // Step 3 check (New Building)
  var isNew = document.getElementById('propIsNew').value;
  if (isNew === 'yes') {
    var d = document.getElementById('propNewDate').value;
    var dDate = new Date(d);
    var now = new Date();
    var diffTime = Math.abs(now - dDate);
    var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= (5 * 365)) {
      resDetails.style.display = 'none';
      exemptMsg.style.display = 'block';
      exemptText.textContent = "تم إعفاء هذا العقار بالكامل لأنهُ عقار مشيد حديثاً لم تمضِ على إتمامه 5 سنوات، استناداً إلى أحكام (المادة الرابعة - الفقرة 3) من القانون.";
      showToast('العقار معفى كمشيد حديثاً');
      return;
    }
  }

  // Base Calculation
  var rent = parseArabicNumber(document.getElementById('propAnnualRent').value);
  if (isNaN(rent) || rent <= 0) {
    showToast('يرجى إدخال الإيراد السنوي رقمياً', true);
    return;
  }

  var isEmp = document.getElementById('propIsEmpty').value;
  var empMonths = parseInt(document.getElementById('propEmptyMonths').value) || 0;
  
  var maint = rent * 0.10;
  var taxable = rent - maint;
  
  var emptyDeduction = 0;
  var emptyMsg = "";
  if (isEmp === 'yes' && empMonths >= 3) {
    emptyDeduction = (taxable / 12) * empMonths;
    taxable = taxable - emptyDeduction;
    emptyMsg = "تم خصم نسبة من الوعاء تعادل مدة الخلو ("+empMonths+" أشهر)، استناداً إلى أحكام (المادة الرابعة - الفقرة 5-أ).";
    document.getElementById('propRowEmptyWrap').style.display = 'block';
    document.getElementById('propRowEmptyTextWrap').style.display = 'block';
    setText('propResEmpty', formatNumber(Math.round(emptyDeduction)) + ' د.ع');
    setText('propResEmptyText', emptyMsg);
  } else {
    document.getElementById('propRowEmptyWrap').style.display = 'none';
    document.getElementById('propRowEmptyTextWrap').style.display = 'none';
  }

  var baseTax = taxable * 0.10;
  var finalTax = baseTax;

  exemptMsg.style.display = 'none';
  resDetails.style.display = 'block';

  setText('propResRent', formatNumber(rent) + ' د.ع');
  setText('propResRentText', "قيمة الإيراد السنوي المدخلة");
  
  setText('propResMaint', formatNumber(Math.round(maint)) + ' د.ع');
  setText('propResMaintText', "تم استقطاع مبلغ كنسبة اندثار وصيانة، استناداً لأحكام (المادة الثانية - الفقرة 2).");
  
  setText('propResTaxable', formatNumber(Math.round(taxable)) + ' د.ع');
  
  setText('propResBaseTax', formatNumber(Math.round(baseTax)) + ' د.ع');
  setText('propResBaseTaxText', "تم ضرب الإيراد الخاضع للضريبة بنسبة 10%، استناداً لأحكام (المادة الثانية - الفقرة 1).");

  // Penalties
  var penSection = document.getElementById('propPenaltiesSection');
  var penRows = document.getElementById('propPenRows');
  penRows.innerHTML = '';
  var hasPen = false;

  if (document.getElementById('propPenDelay').checked) {
    var p = baseTax * 0.10;
    finalTax += p;
    penRows.innerHTML += '<div style="margin-bottom:8px;font-size:12px;"><strong>غرامة تأخير:</strong> تم إضافة ('+formatNumber(Math.round(p))+' د.ع) استناداً لأحكام (المادة 22 - الفقرة 1-أ).</div>';
    hasPen = true;
  }
  if (document.getElementById('propPenFalseInfo').checked) {
    var p = baseTax * 0.10;
    finalTax += p;
    penRows.innerHTML += '<div style="margin-bottom:8px;font-size:12px;"><strong>إخفاء معلومات:</strong> تم إضافة ('+formatNumber(Math.round(p))+' د.ع) استناداً لأحكام (المادة 7 - الفقرة 2).</div>';
    hasPen = true;
  }
  if (document.getElementById('propPenFakeEmpty').checked) {
    var p = baseTax * 2; // مثلي الضريبة
    finalTax += p;
    penRows.innerHTML += '<div style="margin-bottom:8px;font-size:12px;"><strong>خلو وهمي:</strong> تم إضافة ('+formatNumber(Math.round(p))+' د.ع) استناداً لأحكام الغرامات (مثلي الضريبة المتهربة).</div>';
    hasPen = true;
  }
  if (document.getElementById('propPenUseChange').checked) {
    var p = baseTax * 1; // مثل الضريبة
    finalTax += p;
    penRows.innerHTML += '<div style="margin-bottom:8px;font-size:12px;"><strong>تغيير استعمال:</strong> تم إضافة ('+formatNumber(Math.round(p))+' د.ع) بسبب عدم الإخبار عن زوال شرط الإعفاء.</div>';
    hasPen = true;
  }

  penSection.style.display = hasPen ? 'block' : 'none';
  setText('propResFinalTax', formatNumber(Math.round(finalTax)) + ' د.ع');

  showToast('تم إتمام الحساب وتوثيق الأسانيد بنجاح');
}

// ========== PROFESSION TAX ==========
function calculateProfTax() {
  var resBox = document.getElementById('profResultBox');
  
  // 1. Demographics & Allowances
  var isResident = document.getElementById('profRes').value === 'resident';
  var is63 = document.getElementById('profAge63').value === 'yes';
  var marital = document.getElementById('profMarital').value;
  var children = parseInt(document.getElementById('profChildren').value) || 0;
  
  // 2. Financials
  var salary = parseArabicNumber(document.getElementById('profBaseSalary').value) || 0;
  var allowances = parseArabicNumber(document.getElementById('profAllowances').value) || 0;
  var houseKindStr = document.getElementById('profHouseKind').value;
  var houseKindRate = parseFloat(houseKindStr) || 0;
  var foodKindVal = parseArabicNumber(document.getElementById('profFoodKindVal').value) || 0;
  
  // 3. Deductions
  var socialSec = parseArabicNumber(document.getElementById('profSocialSec').value) || 0;
  var lifeIns = parseArabicNumber(document.getElementById('profLifeIns').value) || 0;
  var alimony = parseArabicNumber(document.getElementById('profAlimony').value) || 0;
  
  // 5. Admin Penalties
  var delayDays = parseInt(document.getElementById('profDelayDays').value) || 0;

  if (salary <= 0) {
    resBox.style.display = 'none';
    return;
  }

  // --- Step 1 calculations ---
  var houseBenefit = 0;
  // hotel edge case
  if (houseKindStr === '0.20_hotel') { houseBenefit = salary * 0.20; }
  else { houseBenefit = salary * houseKindRate; }

  // Food benefit: min of 10% salary or actual cost
  var maxFoodVal = salary * 0.10;
  var foodBenefit = (foodKindVal > 0 && foodKindVal < maxFoodVal) ? foodKindVal : (foodKindVal > 0 ? maxFoodVal : 0);
  
  var totalBenefits = houseBenefit + foodBenefit;
  var grossIncome = salary + allowances + totalBenefits;

  // --- Step 2: 30% Exemption rule for cash allowances + benefits ---
  var totalAdditions = allowances + totalBenefits;
  var limit30 = salary * 0.30;
  var exemptAdditions = 0;
  var taxableAdditions = 0;
  var exempt30Reason = "";
  
  if (totalAdditions <= limit30) {
    exemptAdditions = totalAdditions;
    taxableAdditions = 0;
    exempt30Reason = "مجموع المخصصات والمنافع ("+formatNumber(Math.round(totalAdditions))+") أقل أو يساوي 30% من الراتب الاسمي ("+formatNumber(limit30)+"). تعفى المخصصات بالكامل.";
  } else {
    exemptAdditions = limit30;
    taxableAdditions = totalAdditions - limit30;
    exempt30Reason = "مجموع المخصصات والمنافع ("+formatNumber(Math.round(totalAdditions))+") تجاوز 30% من الراتب ("+formatNumber(limit30)+"). يعفى سقف الـ 30%، والباقي ("+formatNumber(Math.round(taxableAdditions))+") يضاف للوعاء الضريبي.";
  }

  // Revised Income after 30% exemption
  var revisedGross = salary + taxableAdditions;

  // --- Step 3: Legal Deductions ---
  var totalDeductions = socialSec + lifeIns + alimony;
  var netAfterDeductions = Math.max(0, revisedGross - totalDeductions);

  // --- Step 4: Social Statutory Allowances (per month) ---
  var statAllowance = 0;
  var statAllowanceReason = "";
  
  if (isResident) {
    if (marital === 'single' || marital === 'married_spouse_income') {
      statAllowance = 208333; // ~ 2,500,000 / 12
      statAllowanceReason = "أعزب / مطلّق / أرمل أو متزوج (وزوجته تحاسب مستقلاً): 2,500,000 د.ع سنوياً.";
    } else if (marital === 'married_spouse_no_income') {
      statAllowance = 375000; // ~ 4,500,000 / 12
      statAllowanceReason = "متزوج (وزوجته ربة بيت): 4,500,000 د.ع سنوياً.";
    } else if (marital === 'married_female_disabled_husband') {
      statAllowance = 416667; // ~ 5,000,000 / 12
      statAllowanceReason = "متزوجة (زوجها عاجز): 5,000,000 د.ع سنوياً.";
    } else if (marital === 'widow_divorced') {
      statAllowance = 266667; // ~ 3,200,000 / 12
      statAllowanceReason = "أرملة/مطلقة مستقلة: 3,200,000 د.ع سنوياً.";
    }
    
    // Extensions
    var childAllowance = 0;
    if (children > 0 && (marital === 'married_spouse_no_income' || marital === 'widow_divorced')) {
      childAllowance = children * 16667; 
      statAllowance += childAllowance;
      statAllowanceReason += " إضافة " + formatNumber(Math.round(childAllowance)) + " عن الأولاد.";
    }

    if (is63) {
      statAllowance += 25000; // ~ 300,000 / 12
      statAllowanceReason += " إضافة 300,000 د.ع سنوي لإكمال سن 63.";
    }
    
  } else {
    statAllowanceReason = "غير مقيم: لا يُشمل السن، أو الزوجية، أو الأولاد بأي سماح.";
  }

  // Calculate Net Taxable Base
  var taxableIncome = Math.max(0, netAfterDeductions - statAllowance);

  // --- Step 5: Tax Brackets Calculation ---
  var t = taxableIncome;
  var b1Tax = 0; var b2Tax = 0; var b3Tax = 0; var b4Tax = 0;
  
  if (t > 83333) { b4Tax = (t - 83333) * 0.15; t = 83333; }
  if (t > 41667) { b3Tax = (t - 41667) * 0.10; t = 41667; }
  if (t > 20833) { b2Tax = (t - 20833) * 0.05; t = 20833; }
  if (t > 0)     { b1Tax = t * 0.03;          }
  
  var baseTaxAmount = b1Tax + b2Tax + b3Tax + b4Tax;

  // --- Step 6: Employer Penalties ---
  var finalTaxAmount = baseTaxAmount;
  var penaltyHtml = '';
  var hasPenalties = false;

  if (delayDays >= 21) {
    hasPenalties = true;
    var periods = Math.floor(delayDays / 21);
    var rate = periods === 1 ? 0.05 : 0.10;
    var penAmnt = baseTaxAmount * rate;
    finalTaxAmount += penAmnt;
    penaltyHtml += '<div style="margin-bottom:6px;"><strong>تأخير ('+delayDays+' يوم):</strong> غرامة ' + (rate*100) + '% بمبلغ <strong>'+formatNumber(Math.round(penAmnt))+' د.ع</strong>. استناداً لأحكام (المادة 10 - سادساً).</div>';
    
    // Add fake simple interest assuming 4% for demo (M10-8th)
    var interestAmnt = baseTaxAmount * (delayDays / 365) * 0.04;
    finalTaxAmount += interestAmnt;
    penaltyHtml += '<div style="margin-bottom:6px;"><strong>فوائد تأخيرية مصرفية:</strong> مبلغ <strong>'+formatNumber(Math.round(interestAmnt))+' د.ع</strong>. استناداً لأحكام (المادة 10 - ثامناً).</div>';
  }

  // -------------------------------------------------------------
  // RENDER UI
  resBox.style.display = 'block';

  setText('profResGross', formatNumber(Math.round(grossIncome)) + ' د.ع');
  setText('profResGrossLegal', 'المادة (2) - رابعاً (المخصصات النقدية)، والمادة (2) - ثانياً وثالثاً (المنافع العينية للسكن والطعام).');
  
  setText('profResExempt30', formatNumber(Math.round(exemptAdditions)) + ' د.ع (المعفى)');
  setText('profResExempt30Legal', exempt30Reason + ' المادة (6) - ثالث عشر.');

  setText('profResDeductions', formatNumber(Math.round(totalDeductions)) + ' د.ع');
  var dedRea = [];
  if(socialSec>0) dedRea.push('المادة (3) عاشراً للتقاعد/الضمان');
  if(lifeIns>0) dedRea.push('المادة (3) للتأمين');
  if(alimony>0) dedRea.push('القانون للنفقة الشرعية');
  setText('profResDeductionsLegal', (dedRea.length ? dedRea.join(' و ') : 'لا يوجد استقطاعات.') );

  setText('profResAllowances', formatNumber(Math.round(statAllowance)) + ' د.ع');
  setText('profResAllowancesLegal', statAllowanceReason + ' المادة (5) - أولاً.');

  setText('profResTaxable', formatNumber(Math.round(taxableIncome)) + ' د.ع');

  var bracketsOut = '<ul style="margin:0;padding-right:20px;list-style:decimal;">';
  bracketsOut += '<li>الشريحة الأولى (لغاية 20,833) نسبة 3%: <strong>' + formatNumber(Math.round(b1Tax)) + ' د.ع</strong></li>';
  bracketsOut += '<li>الشريحة الثانية (إلى 41,667) نسبة 5%: <strong>' + formatNumber(Math.round(b2Tax)) + ' د.ع</strong></li>';
  bracketsOut += '<li>الشريحة الثالثة (إلى 83,333) نسبة 10%: <strong>' + formatNumber(Math.round(b3Tax)) + ' د.ع</strong></li>';
  bracketsOut += '<li>الشريحة الرابعة (أكثر من 83,333) نسبة 15%: <strong>' + formatNumber(Math.round(b4Tax)) + ' د.ع</strong></li>';
  bracketsOut += '<li>إجمالي الضريبة الأساسية قبل الغرامات: <strong><span style="color:var(--success);">' + formatNumber(Math.round(baseTaxAmount)) + ' د.ع</span></strong></li>';
  bracketsOut += '</ul>';
  document.getElementById('profBracketsHtml').innerHTML = bracketsOut;

  var penSec = document.getElementById('profPenaltiesSection');
  if (hasPenalties) {
    penSec.style.display = 'block';
    document.getElementById('profPenHtml').innerHTML = penaltyHtml;
  } else {
    penSec.style.display = 'none';
  }

  setText('profResFinalTax', formatNumber(Math.round(finalTaxAmount)) + ' د.ع');

}

// ========== DARK MODE ==========
function toggleDarkMode() {
  var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? '' : 'dark');
  var icon = document.getElementById('darkModeIcon');
  if (icon) icon.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
  var settingCheck = document.getElementById('settingDarkMode');
  if (settingCheck) settingCheck.checked = !isDark;
  localStorage.setItem('darkMode', isDark ? 'false' : 'true');
  addAuditEntry('تغيير المظهر', isDark ? 'الوضع الفاتح' : 'الوضع الليلي');
}

function loadDarkMode() {
  if (localStorage.getItem('darkMode') === 'true') {
    document.documentElement.setAttribute('data-theme', 'dark');
    var icon = document.getElementById('darkModeIcon');
    if (icon) icon.className = 'fas fa-sun';
    var settingCheck = document.getElementById('settingDarkMode');
    if (settingCheck) settingCheck.checked = true;
  }
}

// ========== GLOBAL SEARCH ==========
var searchIndex = [
  { page: 'dashboard', title: 'لوحة التحكم', icon: 'fa-th-large', keywords: 'رئيسية لوحة تحكم إحصائيات' },
  { page: 'corporate', title: 'ضريبة دخل الشركات', icon: 'fa-building', keywords: 'شركة شركات دخل أرباح إيرادات رواتب استقطاع' },
  { page: 'land', title: 'ضريبة العرصات', icon: 'fa-map-marked-alt', keywords: 'أرض عرصة عرصات أراضي بغداد محافظة' },
  { page: 'property', title: 'ضريبة العقار', icon: 'fa-home', keywords: 'عقار بيع إيجار شقة دار محل بناية طابو' },
  { page: 'profession', title: 'ضريبة المهنة', icon: 'fa-user-tie', keywords: 'مهنة طبيب محامي مهندس تاجر مقاول' },
  { page: 'sales', title: 'ضريبة المبيعات', icon: 'fa-shopping-cart', keywords: 'مبيعات هاتف سيارة سفر سكائر إلكترونيات' },
  { page: 'reports', title: 'التقارير والتحليلات', icon: 'fa-chart-bar', keywords: 'تقرير تقارير تحليل إقرار إقرارات' },
  { page: 'documents', title: 'المستندات', icon: 'fa-folder-open', keywords: 'مستند مستندات ملف ملفات رفع تحميل' },
  { page: 'notifications', title: 'الإشعارات', icon: 'fa-bell', keywords: 'إشعار إشعارات تنبيه تنبيهات موعد' },
  { page: 'penalties', title: 'حاسبة الغرامات', icon: 'fa-gavel', keywords: 'غرامة غرامات جزاء تأخير مخالفة تهرب' },
  { page: 'comparison', title: 'مقارنة الضرائب', icon: 'fa-balance-scale', keywords: 'مقارنة سنوات تغيير نسبة' },
  { page: 'calendar', title: 'التقويم الضريبي', icon: 'fa-calendar-alt', keywords: 'تقويم موعد مواعيد شهر سنة دفع' },
  { page: 'audit', title: 'سجل العمليات', icon: 'fa-clipboard-list', keywords: 'سجل عمليات تدقيق مراجعة' },
  { page: 'users', title: 'إدارة المستخدمين', icon: 'fa-users-cog', keywords: 'مستخدم مستخدمين صلاحية صلاحيات إدارة' },
  { page: 'settings', title: 'الإعدادات', icon: 'fa-cog', keywords: 'إعداد إعدادات ضبط تفضيلات مظهر خط' },
  { page: 'exportPDF', title: 'تصدير PDF', icon: 'fa-file-pdf', keywords: 'تصدير PDF طباعة تحميل', action: function() { exportToPDF(); } },
  { page: 'exportExcel', title: 'تصدير Excel', icon: 'fa-file-excel', keywords: 'تصدير Excel اكسل جدول', action: function() { exportToExcel(); } }
];

function openSearchModal() {
  var modal = document.getElementById('searchModal');
  modal.classList.add('show');
  var input = document.getElementById('searchInput');
  input.value = '';
  input.focus();
  document.getElementById('searchResults').innerHTML = '<div class="search-empty"><i class="fas fa-search"></i><p>اكتب للبحث في الصفحات والوظائف</p></div>';
}

function closeSearchModal() {
  document.getElementById('searchModal').classList.remove('show');
}

function performSearch(query) {
  var results = document.getElementById('searchResults');
  if (!query || query.length < 1) {
    results.innerHTML = '<div class="search-empty"><i class="fas fa-search"></i><p>اكتب للبحث في الصفحات والوظائف</p></div>';
    return;
  }
  var matches = searchIndex.filter(function(item) {
    return item.title.indexOf(query) !== -1 || item.keywords.indexOf(query) !== -1;
  });
  if (matches.length === 0) {
    results.innerHTML = '<div class="search-empty"><i class="fas fa-search"></i><p>لا توجد نتائج لـ "' + query + '"</p></div>';
    return;
  }
  results.innerHTML = matches.map(function(m) {
    return '<div class="search-result-item" onclick="' + (m.action ? 'searchIndex.find(function(s){return s.page===\'' + m.page + '\'}).action();closeSearchModal();' : 'navigateTo(\'' + m.page + '\');closeSearchModal();') + '"><i class="fas ' + m.icon + '"></i><span>' + m.title + '</span><small>' + (pageTitles[m.page] || '') + '</small></div>';
  }).join('');
}

// ========== PDF EXPORT ==========
function exportToPDF() {
  var activeSection = document.querySelector('.page-section.active');
  if (!activeSection) { showToast('لا توجد صفحة نشطة للتصدير', true); return; }
  if (typeof html2pdf === 'undefined') { showToast('مكتبة التصدير غير متوفرة', true); return; }
  showToast('جاري تصدير PDF...');
  var opt = {
    margin: 10, filename: 'تقرير_ضريبي_' + new Date().toISOString().slice(0,10) + '.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  html2pdf().set(opt).from(activeSection).save().then(function() {
    showToast('تم تصدير PDF بنجاح');
    addAuditEntry('تصدير PDF', pageTitles[getCurrentPage()] || '');
  });
}

// ========== EXCEL EXPORT ==========
function exportToExcel() {
  if (typeof XLSX === 'undefined') { showToast('مكتبة التصدير غير متوفرة', true); return; }
  var tables = document.querySelectorAll('.page-section.active table');
  if (tables.length === 0) { showToast('لا توجد جداول للتصدير في هذه الصفحة', true); return; }
  var wb = XLSX.utils.book_new();
  tables.forEach(function(table, idx) {
    var ws = XLSX.utils.table_to_sheet(table);
    XLSX.utils.book_append_sheet(wb, ws, 'جدول ' + (idx + 1));
  });
  XLSX.writeFile(wb, 'تقرير_ضريبي_' + new Date().toISOString().slice(0,10) + '.xlsx');
  showToast('تم تصدير Excel بنجاح');
  addAuditEntry('تصدير Excel', pageTitles[getCurrentPage()] || '');
}

function getCurrentPage() {
  var active = document.querySelector('.page-section.active');
  return active ? active.id.replace('page-', '') : 'dashboard';
}

// ========== FAQ TOGGLE ==========
function toggleFaq(el) {
  var wasOpen = el.classList.contains('open');
  document.querySelectorAll('.pkg-faq-item.open').forEach(function(i) { i.classList.remove('open'); });
  if (!wasOpen) el.classList.add('open');
}


document.addEventListener('DOMContentLoaded', function() {
  // Splash screen
  handleSplashScreen();

  // Load dark mode
  loadDarkMode();

  // Check saved session
  checkSession();

  // Restore saved company employees
  renderEmployeeList();
  if (typeof renderContractEmployeeList === "function") renderContractEmployeeList();

  // Set today's date
  var today = new Date();
  var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  var dateEl = document.getElementById('todayDate');
  if (dateEl) dateEl.textContent = today.toLocaleDateString('ar-IQ', options);

  // Corporate exempt toggle
  var exemptCheck = document.getElementById('corpExempt');
  if (exemptCheck) {
    exemptCheck.addEventListener('change', function() {
      document.getElementById('corpExemptPercentGroup').style.display = this.checked ? 'block' : 'none';
    });
  }

  // Initialize Charts
  initCharts();

  // Initialize AOS
  initAOS();

  // Load settings
  loadSettings();

  // Load drafts
  loadDrafts();

  // Setup auto-save
  setupAutoSave();

  // Render users table
  renderUsersTable();

  // Render audit log
  renderAuditLog();

  // Render calendar
  renderCalendar();

  // Initialize draggable widgets
  setTimeout(initDraggableWidgets, 500);

  // Initialize motion graphics & 3D animations
  createSplashParticles();
  setTimeout(init3DTilt, 800);
  setTimeout(initScrollAnimations, 1000);

  // Render provinces page
  setTimeout(renderProvincesPage, 600);

  // Initialize ripple effect
  setTimeout(initRippleEffect, 600);

  // Animate dashboard counters
  setTimeout(animateCounters, 1500);

  // Check payment reminders
  setTimeout(checkPaymentReminders, 3000);

  // Log login
  addAuditEntry('تشغيل النظام', 'تم تحميل النظام بنجاح');

  // Initialize new features
  addLoginRecord();
  loadColorTheme();
  initPWA();
  setTimeout(enhanceDashboard, 2000);

  // Keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key >= '1' && e.key <= '5') {
      e.preventDefault();
      var pages = ['corporate', 'land', 'property', 'profession', 'sales'];
      navigateTo(pages[parseInt(e.key) - 1]);
    }
    // Ctrl+K for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      openSearchModal();
    }
    // ESC to close search or presentation
    if (e.key === 'Escape') {
      closeSearchModal();
      if(presentationMode) togglePresentationMode();
    }
  });
});


window.exportBlankExcel = function() {
  if (typeof XLSX === 'undefined') {
    showToast('المكتبة غير متوفرة', true);
    return;
  }
  var ws_data = [
    [
      "اسم الموظف الثلاثي واللقب", "الجنسية", "الاقامة", "الجنس", "تاريخ الميلاد", "رقم هوية الاحوال", "رقم الهاتف", "البريد الالكتروني",
      "القطاع", "تاريخ المباشرة", "تاريخ الانتهاء", "صاحب العمل الرئيسي؟", "العنوان الوظيفي", "اسم صاحب العمل", "الرقم التعريفي لصاحب العمل",
      "المحافظة", "المدينة", "الزقاق", "الشارع", "رقم الدار",
      "الحالة الزوجية", "تاريخ الزواج", "اسم الزوجة/الزوج", "تاريخ الطلاق", "رقم هوية الزوجة", "الزوجة عاجزة؟",
      "صاحب عمل الزوجة", "الزوجة تعمل؟", "دمج المدخولات؟", "رقم صاحب عمل الزوجة",
      "عدد الاولاد المستحقين", "هل تجاوز 63؟", "عدد الاشهر",
      "الراتب الأساسي", "المخصصات الخاضعة كلياً (M)", "مخصصات السكن والطعام النقدية (N)", "السكن العيني", "قسط التأمين على الحياة", "أقساط النفقة الشرعية",
      "اسم الولد 1", "اسم الولد 2", "اسم الولد 3", "اسم الولد 4", "اسم الولد 5", "اسم الولد 6"
    ],
    [
      "محمد علي", "iraqi", "resident", "male", "1990-01-01", "123456", "0770000000", "test@test.com",
      "private", "2020-01-01", "", "yes", "مهندس", "الشركة الهندسية", "999",
      "بغداد", "المنصور", "1", "2", "3",
      "single", "", "", "", "", "no",
      "", "no", "no", "",
      "0", "no", "12",
      "1000000", "200000", "150000", "none", "0", "0", "", "", "", "", "", ""
    ]
  ];
  var ws = XLSX.utils.aoa_to_sheet(ws_data);
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Template");
  XLSX.writeFile(wb, "Employee_Import_Template.xlsx");
};


function getMergedEmployeesForYear(year) {
  var map = {};
  var all = globalEmployees.concat(contractEmployees);
  // 1. Active employees — keep the latest salary version per person (origId)
  all.forEach(function(e) {
    var key = e.origId || e.id;
    var existing = map[key];
    if (!existing || (Number(e.version) || 0) >= (Number(existing.version) || 0)) {
      map[key] = Object.assign({}, e);
    }
  });
  
  // 2. Archived or modified from snapshots
  taxSnapshots.forEach(function(s) {
    if (String(s.year) === String(year)) {
      var key = s.origId || s.empId;
      if (!map[key]) {
        // Employee was deleted from active, but has snapshot
        map[key] = Object.assign({}, s.input);
        map[key].origId = key;
        map[key].isDeleted = true;
      }
    }
  });
  return Object.values(map);
}


// Live Currency Formatter better logic
document.addEventListener('input', function(e) {
  if (e.target && e.target.tagName === 'INPUT' && e.target.type === 'text') {
    var id = e.target.id.toLowerCase();
    if (id.includes('salary') || id.includes('allow') || id.includes('cash') || id.includes('ins') || id.includes('alimony') || id.includes('revenue') || id.includes('expenses')) {
        var raw = e.target.value.replace(/[^0-9]/g, '');
        if(raw) {
            e.target.value = Number(raw).toLocaleString('en-US');
        } else {
            e.target.value = '';
        }
    }
  }
});

function getAllEmployeesForYear(year) {
  var emps = {};
  globalEmployees.forEach(function(e) { emps[e.id] = e; });
  var storedSnaps = JSON.parse(localStorage.getItem('taxSnapshots') || '[]');
  storedSnaps.forEach(function(s) {
    if (String(s.year) === String(year) && s.input && !emps[s.empId]) {
      emps[s.empId] = s.input;
    }
  });
  return Object.values(emps);
}


// Live Formatting for currency inputs
document.addEventListener('input', function(e) {
  if (e.target && e.target.tagName === 'INPUT') {
    var id = e.target.id || '';
    if (id.includes('Salary') || id.includes('Allow') || id.includes('Cash') || id.includes('corpRevenue') || id.includes('corpExpenses')) {
      var raw = e.target.value.replace(/,/g, '').replace(/[^0-9\.]/g, '');
      if(raw && !isNaN(raw)) {
        var num = parseInt(raw, 10);
        e.target.value = num.toLocaleString('en-US');
      }
    }
  }
});


var lockedYears = JSON.parse(localStorage.getItem('taxLockedYears') || '[]');

function closeTaxYear() {
  if (!isAdmin()) {
    showToast('إقفال السنة المالية متاح لمدير النظام فقط', true);
    if(typeof addAuditEntry === 'function') addAuditEntry('محاولة إقفال سنة مرفوضة', document.getElementById('closeTaxYear_Year').value + ' (غير مصرح)');
    return;
  }
  var year = document.getElementById('closeTaxYear_Year').value;
  if(!year) return;
  if(lockedYears.indexOf(String(year)) !== -1) {
      showToast('هذه السنة مقفلة مسبقاً', true);
      return;
  }
  if(confirm('تنبيه: هل أنت متأكد من إقفال السنة المالية ' + year + ' بالكامل؟\nلن تتمكن من تعديل أو إضافة لقطات أشهر إضافية لهذه السنة.\nلا يمكن فتح القفل إلا من قبل مدير النظام.')) {
      lockedYears.push(String(year));
      localStorage.setItem('taxLockedYears', JSON.stringify(lockedYears));
      showToast('تم إقفال السنة المالية ' + year + ' بنجاح');
      if(typeof addAuditEntry === 'function') addAuditEntry('إقفال سنة', year);
      document.getElementById('closeTaxYear_Year').dispatchEvent(new Event('change'));
  }
}

function openTaxYear() {
  if (!isAdmin()) {
    showToast('فتح قفل السنة المالية متاح لمدير النظام فقط', true);
    if(typeof addAuditEntry === 'function') addAuditEntry('محاولة فتح سنة مرفوضة', document.getElementById('closeTaxYear_Year').value + ' (غير مصرح)');
    return;
  }
  var year = document.getElementById('closeTaxYear_Year').value;
  if(!year) return;
  if(lockedYears.indexOf(String(year)) === -1) {
      showToast('هذه السنة غير مقفلة', true);
      return;
  }
  if(confirm('هل أنت متأكد من فتح قفل السنة المالية ' + year + '؟\nسيصبح ممكناً تعديل وإضافة أشهرها من جديد.')) {
      lockedYears = lockedYears.filter(function(y) { return String(y) !== String(year); });
      localStorage.setItem('taxLockedYears', JSON.stringify(lockedYears));
      showToast('تم فتح قفل السنة ' + year + ' بنجاح');
      if(typeof addAuditEntry === 'function') addAuditEntry('فتح قفل سنة', year);
      document.getElementById('closeTaxYear_Year').dispatchEvent(new Event('change'));
  }
}

function checkYearLocked(year) {
  return lockedYears.indexOf(String(year)) !== -1;
}


document.addEventListener('DOMContentLoaded', function() {
  var yrSel = document.getElementById('closeTaxYear_Year');
  if(yrSel) {
     yrSel.addEventListener('change', function() {
        var status = document.getElementById('yearLockStatus');
        if(status) {
           if(lockedYears.indexOf(String(yrSel.value)) !== -1) {
              var admin = isAdmin();
              status.innerHTML = '<i class="fas fa-lock"></i> هذه السنة مقفلة' + (admin ? ' <button class="btn btn-sm" onclick="openTaxYear()" style="margin-right:8px;background:#fff;color:#dc2626;border:1px solid #fecaca;border-radius:16px;font-weight:700;padding:4px 12px;cursor:pointer;"><i class="fas fa-unlock"></i> فتح القفل</button>' : ' <i class="fas fa-shield-alt" style="color:#94a3b8;" title="فتح القفل متاح لمدير النظام فقط"></i>');
              status.style.color = 'var(--danger)';
           } else {
              status.innerHTML = '<i class="fas fa-lock-open"></i> السنة مفتوحة للتعديلات';
              status.style.color = 'var(--success)';
           }
        }
        if(typeof renderMonthLockStatus === 'function') renderMonthLockStatus();
     });
     yrSel.dispatchEvent(new Event('change'));
  }
});
