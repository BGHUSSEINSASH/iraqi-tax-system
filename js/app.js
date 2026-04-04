/* ============================================
   Iraqi Tax System — App Logic v3.0
   ============================================ */

// ========== DEMO USER ACCOUNTS ==========

// ========== PACKAGE SYSTEM ==========
var PACKAGES = {
  basic: {
    name: 'الأساسية',
    icon: 'fa-leaf',
    pages: ['dashboard','corporate','calendar','notifications','settings','packages','provinces','tasks','contact']
  },
  professional: {
    name: 'المتقدمة',
    icon: 'fa-crown',
    pages: ['dashboard','corporate','land','property','profession','sales','reports','documents','calendar','notifications','penalties','comparison','settings','packages','provinces','invoices','taxpayers','attachments','heatmap','kpi','reportbuilder','appointments','tasks','contact']
  },
  enterprise: {
    name: 'الشاملة',
    icon: 'fa-building',
    pages: ['dashboard','corporate','land','property','profession','sales','reports','documents','calendar','notifications','penalties','comparison','audit','users','settings','packages','provinces','invoices','taxpayers','attachments','heatmap','kpi','reportbuilder','workflow','tickets','appointments','esignature','tasks','loginhistory','backup','api','contact']
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
  var modulePages = {corporate:'corporate',land:'land',property:'property',profession:'profession',sales:'sales'};
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
  setTimeout(function() { updateSidebarLocks(); updateModuleCardLocks(); renderPackagesPage(); renderProvincesPage(); }, 100);
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
  window.scrollTo({ top: 0, behavior: 'smooth' });
  // Refresh dynamic pages
  if (page === 'users') renderUsersTable();
  if (page === 'audit') renderAuditLog();
  if (page === 'calendar') renderCalendar();
  animatePageTransition(page);
  if (page === 'packages') renderPackagesPage();
  if (page === 'provinces') renderProvincesPage();
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
  if (isNaN(num) || num === null) return '٠';
  return Number(num).toLocaleString('ar-IQ');
}
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

// ========== CHIP SELECTION ==========
function selectChip(chip, inputId, value) {
  chip.parentElement.querySelectorAll('.chip').forEach(function(c) { c.classList.remove('active'); });
  chip.classList.add('active');
  document.getElementById(inputId).value = value;
  if (inputId === 'propOperation') { handlePropertyOperationChange(value); }
}

// ========== CORPORATE TAX — PROFIT TAX ==========
function calculateCorporateProfitTax() {
  var revenue = getVal('corpRevenue');
  var expenses = getVal('corpExpenses');
  if (!revenue) { showToast('يرجى إدخال إيراد الشركة', true); return; }
  var netProfit = revenue - expenses;
  if (netProfit <= 0) { showToast('الربح الصافي سالب أو صفر، لا توجد ضريبة مستحقة', true); return; }
  var rate = 0.15;
  var tax = netProfit * rate;

  setText('corpProfitRevenue', formatNumber(revenue) + ' د.ع');
  setText('corpProfitExpenses', formatNumber(expenses) + ' د.ع');
  setText('corpProfitNet', formatNumber(netProfit) + ' د.ع');
  setText('corpProfitTaxDue', formatNumber(Math.round(tax)) + ' د.ع');
  document.getElementById('corpProfitResultBox').style.display = 'block';
  showToast('تم احتساب ضريبة أرباح الشركة بنجاح');
}

// ========== CORPORATE TAX — EMPLOYEE TAX ==========
function calculateCompanyEmployeeTax(inputEl) {
  var row = inputEl.closest('tr');
  var salaryInput = row.querySelector('.emp-salary');
  var maritalSelect = row.querySelector('.emp-marital');
  var childrenInput = row.querySelector('.emp-children');
  var monthly = parseArabicNumber(salaryInput.value);
  var marital = maritalSelect.value;
  var children = parseInt(childrenInput.value) || 0;
  var annual = monthly * 12;

  // Iraqi tax: annual exemption 5,000,000 + married bonus 1,000,000 + children 500,000 each
  var exemption = SALARY_ANNUAL_EXEMPTION;
  if (marital === 'married') exemption += 1000000;
  exemption += children * 500000;

  var taxable = annual - exemption;
  if (taxable <= 0) {
    row.querySelector('.emp-monthly-tax').textContent = '٠ د.ع (معفي)';
    row.querySelector('.emp-annual-tax').textContent = '٠ د.ع (معفي)';
    return;
  }
  var tax = 0, prev = 0;
  for (var i = 0; i < SALARY_BRACKETS.length; i++) {
    var b = SALARY_BRACKETS[i];
    var chunk = Math.min(taxable, b.limit) - prev;
    if (chunk <= 0) break;
    tax += chunk * b.rate;
    prev = Math.min(taxable, b.limit);
    if (prev >= taxable) break;
  }
  row.querySelector('.emp-monthly-tax').textContent = formatNumber(Math.round(tax / 12)) + ' د.ع';
  row.querySelector('.emp-annual-tax').textContent = formatNumber(Math.round(tax)) + ' د.ع';
}

function addCompanyEmployeeRow() {
  var tbody = document.querySelector('#companyEmployeeTable tbody');
  var row = document.createElement('tr');
  row.innerHTML = '<td><input type="text" placeholder="اسم الموظف" class="table-input emp-name"></td>' +
    '<td><select class="table-input emp-nationality"><option value="iraqi">عراقي</option><option value="foreign">أجنبي</option></select></td>' +
    '<td><select class="table-input emp-gender"><option value="male">ذكر</option><option value="female">أنثى</option></select></td>' +
    '<td><input type="text" placeholder="٠" class="table-input emp-salary" onchange="calculateCompanyEmployeeTax(this)"></td>' +
    '<td><select class="table-input emp-marital" onchange="calculateCompanyEmployeeTax(this)"><option value="single">أعزب</option><option value="married">متزوج</option></select></td>' +
    '<td><input type="number" value="0" min="0" max="20" class="table-input emp-children" onchange="calculateCompanyEmployeeTax(this)" style="width:60px;"></td>' +
    '<td class="emp-monthly-tax">٠ د.ع</td>' +
    '<td class="emp-annual-tax">٠ د.ع</td>' +
    '<td><button class="btn btn-sm btn-danger" onclick="removeCompanyEmployeeRow(this)"><i class="fas fa-trash"></i></button></td>';
  tbody.appendChild(row);
}

function removeCompanyEmployeeRow(btn) {
  var tbody = btn.closest('tbody');
  if (tbody.rows.length > 1) btn.closest('tr').remove();
  else showToast('يجب الإبقاء على صف واحد على الأقل', true);
}

function exportFormD14() {
  var rows = document.querySelectorAll('#companyEmployeeTable tbody tr');
  var data = [];
  rows.forEach(function(row, i) {
    var name = row.querySelector('.emp-name').value || 'موظف ' + (i + 1);
    var nationality = row.querySelector('.emp-nationality').value === 'iraqi' ? 'عراقي' : 'أجنبي';
    var gender = row.querySelector('.emp-gender').value === 'male' ? 'ذكر' : 'أنثى';
    var salary = row.querySelector('.emp-salary').value || '0';
    var marital = row.querySelector('.emp-marital').value === 'married' ? 'متزوج' : 'أعزب';
    var children = row.querySelector('.emp-children').value || '0';
    var monthlyTax = row.querySelector('.emp-monthly-tax').textContent;
    var annualTax = row.querySelector('.emp-annual-tax').textContent;
    data.push({ name: name, nationality: nationality, gender: gender, salary: salary, marital: marital, children: children, monthlyTax: monthlyTax, annualTax: annualTax });
  });
  if (data.length === 0 || !data[0].salary || data[0].salary === '0') { showToast('يرجى إدخال بيانات الموظفين أولاً', true); return; }

  var html = '<div style="direction:rtl;font-family:Tajawal,sans-serif;padding:30px;">' +
    '<div style="text-align:center;margin-bottom:30px;"><h2>استمارة ض.د14</h2><p>كشف بالرواتب والأجور والمخصصات وضريبة الدخل المستقطعة</p></div>' +
    '<table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#0f1b4d;color:#fff;">' +
    '<th style="border:1px solid #333;padding:10px;">ت</th><th style="border:1px solid #333;padding:10px;">اسم الموظف</th>' +
    '<th style="border:1px solid #333;padding:10px;">الجنسية</th><th style="border:1px solid #333;padding:10px;">الجنس</th>' +
    '<th style="border:1px solid #333;padding:10px;">الراتب الشهري</th><th style="border:1px solid #333;padding:10px;">الحالة الزوجية</th>' +
    '<th style="border:1px solid #333;padding:10px;">عدد الأطفال</th><th style="border:1px solid #333;padding:10px;">الضريبة الشهرية</th>' +
    '<th style="border:1px solid #333;padding:10px;">الضريبة السنوية</th></tr></thead><tbody>';
  data.forEach(function(d, i) {
    html += '<tr><td style="border:1px solid #ccc;padding:8px;text-align:center;">' + (i + 1) + '</td>' +
      '<td style="border:1px solid #ccc;padding:8px;">' + d.name + '</td>' +
      '<td style="border:1px solid #ccc;padding:8px;text-align:center;">' + d.nationality + '</td>' +
      '<td style="border:1px solid #ccc;padding:8px;text-align:center;">' + d.gender + '</td>' +
      '<td style="border:1px solid #ccc;padding:8px;text-align:center;">' + d.salary + '</td>' +
      '<td style="border:1px solid #ccc;padding:8px;text-align:center;">' + d.marital + '</td>' +
      '<td style="border:1px solid #ccc;padding:8px;text-align:center;">' + d.children + '</td>' +
      '<td style="border:1px solid #ccc;padding:8px;text-align:center;">' + d.monthlyTax + '</td>' +
      '<td style="border:1px solid #ccc;padding:8px;text-align:center;">' + d.annualTax + '</td></tr>';
  });
  html += '</tbody></table></div>';
  if (typeof html2pdf !== 'undefined') {
    var el = document.createElement('div'); el.innerHTML = html;
    document.body.appendChild(el);
    html2pdf().set({ margin: 10, filename: 'استمارة_ض_د14.pdf', jsPDF: { direction: 'rtl' } }).from(el).save().then(function() { document.body.removeChild(el); });
    showToast('جاري تصدير استمارة ض.د14');
  } else { showToast('تعذر تصدير PDF', true); }
}

function exportAnnualMemo() {
  var rows = document.querySelectorAll('#companyEmployeeTable tbody tr');
  var data = [];
  var totalMonthly = 0, totalAnnual = 0;
  rows.forEach(function(row, i) {
    var name = row.querySelector('.emp-name').value || 'موظف ' + (i + 1);
    var salary = row.querySelector('.emp-salary').value || '0';
    var monthlyTax = row.querySelector('.emp-monthly-tax').textContent;
    var annualTax = row.querySelector('.emp-annual-tax').textContent;
    data.push({ name: name, salary: salary, monthlyTax: monthlyTax, annualTax: annualTax });
    totalMonthly += parseArabicNumber(row.querySelector('.emp-monthly-tax').textContent);
    totalAnnual += parseArabicNumber(row.querySelector('.emp-annual-tax').textContent);
  });
  if (data.length === 0 || !data[0].salary || data[0].salary === '0') { showToast('يرجى إدخال بيانات الموظفين أولاً', true); return; }

  var html = '<div style="direction:rtl;font-family:Tajawal,sans-serif;padding:30px;">' +
    '<div style="text-align:center;margin-bottom:30px;"><h2>المذكرة السنوية</h2><p>ملخص ضريبة رواتب الموظفين للسنة المالية</p></div>' +
    '<table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#065f46;color:#fff;">' +
    '<th style="border:1px solid #333;padding:10px;">ت</th><th style="border:1px solid #333;padding:10px;">اسم الموظف</th>' +
    '<th style="border:1px solid #333;padding:10px;">الراتب الشهري</th><th style="border:1px solid #333;padding:10px;">الضريبة الشهرية</th>' +
    '<th style="border:1px solid #333;padding:10px;">الضريبة السنوية</th></tr></thead><tbody>';
  data.forEach(function(d, i) {
    html += '<tr><td style="border:1px solid #ccc;padding:8px;text-align:center;">' + (i + 1) + '</td>' +
      '<td style="border:1px solid #ccc;padding:8px;">' + d.name + '</td>' +
      '<td style="border:1px solid #ccc;padding:8px;text-align:center;">' + d.salary + '</td>' +
      '<td style="border:1px solid #ccc;padding:8px;text-align:center;">' + d.monthlyTax + '</td>' +
      '<td style="border:1px solid #ccc;padding:8px;text-align:center;">' + d.annualTax + '</td></tr>';
  });
  html += '<tr style="background:#f0fdf4;font-weight:bold;"><td colspan="3" style="border:1px solid #ccc;padding:10px;">المجموع</td>' +
    '<td style="border:1px solid #ccc;padding:10px;text-align:center;">' + formatNumber(Math.round(totalMonthly)) + ' د.ع</td>' +
    '<td style="border:1px solid #ccc;padding:10px;text-align:center;">' + formatNumber(Math.round(totalAnnual)) + ' د.ع</td></tr>';
  html += '</tbody></table></div>';
  if (typeof html2pdf !== 'undefined') {
    var el = document.createElement('div'); el.innerHTML = html;
    document.body.appendChild(el);
    html2pdf().set({ margin: 10, filename: 'المذكرة_السنوية.pdf', jsPDF: { direction: 'rtl' } }).from(el).save().then(function() { document.body.removeChild(el); });
    showToast('جاري تصدير المذكرة السنوية');
  } else { showToast('تعذر تصدير PDF', true); }
}

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

function addContractEmployeeRow() {
  var tbody = document.querySelector('#contractEmployeeTable tbody');
  var row = document.createElement('tr');
  row.innerHTML = '<td><input type="text" placeholder="اسم الموظف" class="table-input emp-name"></td>' +
    '<td><select class="table-input emp-nationality"><option value="iraqi">عراقي</option><option value="foreign">أجنبي</option></select></td>' +
    '<td><select class="table-input emp-gender"><option value="male">ذكر</option><option value="female">أنثى</option></select></td>' +
    '<td><input type="text" placeholder="٠" class="table-input emp-salary" onchange="calculateCompanyEmployeeTax(this)"></td>' +
    '<td><select class="table-input emp-marital" onchange="calculateCompanyEmployeeTax(this)"><option value="single">أعزب</option><option value="married">متزوج</option></select></td>' +
    '<td><input type="number" value="0" min="0" max="20" class="table-input emp-children" onchange="calculateCompanyEmployeeTax(this)" style="width:60px;"></td>' +
    '<td class="emp-monthly-tax">٠ د.ع</td>' +
    '<td class="emp-annual-tax">٠ د.ع</td>' +
    '<td><button class="btn btn-sm btn-danger" onclick="removeContractEmployeeRow(this)"><i class="fas fa-trash"></i></button></td>';
  tbody.appendChild(row);
}

function removeContractEmployeeRow(btn) {
  var tbody = btn.closest('tbody');
  if (tbody.rows.length > 1) btn.closest('tr').remove();
  else showToast('يجب الإبقاء على صف واحد على الأقل', true);
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

// ========== SALARY TAX ==========
var SALARY_ANNUAL_EXEMPTION = 5000000;
var SALARY_BRACKETS = [
  { limit: 250000, rate: 0.03 },
  { limit: 500000, rate: 0.05 },
  { limit: 1000000, rate: 0.10 },
  { limit: Infinity, rate: 0.15 }
];

function calculateIncomeTax(annualIncome) {
  var taxable = annualIncome - SALARY_ANNUAL_EXEMPTION;
  if (taxable <= 0) return 0;
  var tax = 0, prev = 0;
  for (var i = 0; i < SALARY_BRACKETS.length; i++) {
    var b = SALARY_BRACKETS[i];
    var chunk = Math.min(taxable, b.limit) - prev;
    if (chunk <= 0) break;
    tax += chunk * b.rate;
    prev = Math.min(taxable, b.limit);
    if (prev >= taxable) break;
  }
  return tax;
}

function calculateSalaryTax(inputEl) {
  var row = inputEl.closest('tr');
  var monthly = parseArabicNumber(inputEl.value);
  var annual = monthly * 12;
  var annualTax = calculateIncomeTax(annual);
  var monthlyTax = annualTax / 12;
  row.querySelector('.salary-result').textContent = formatNumber(Math.round(monthlyTax)) + ' د.ع';
}

function addSalaryRow() {
  var tbody = document.querySelector('#salaryTable tbody');
  var row = document.createElement('tr');
  row.innerHTML = '<td><input type="text" placeholder="اسم الموظف" class="table-input"></td>' +
    '<td><input type="text" placeholder="٠" class="table-input" onchange="calculateSalaryTax(this)"></td>' +
    '<td class="salary-result">٠ د.ع</td>' +
    '<td><button class="btn btn-sm btn-danger" onclick="removeSalaryRow(this)"><i class="fas fa-trash"></i></button></td>';
  tbody.appendChild(row);
}

function removeSalaryRow(btn) {
  var tbody = btn.closest('tbody');
  if (tbody.rows.length > 1) btn.closest('tr').remove();
  else showToast('يجب الإبقاء على صف واحد على الأقل', true);
}

// ========== LAND TAX ==========
var LAND_DISTRICTS = {};
var LAND_PRICES = {};
// Populate from ALL_PROVINCES
Object.keys(ALL_PROVINCES).forEach(function(k) {
  LAND_DISTRICTS[k] = ALL_PROVINCES[k].districts;
  LAND_PRICES[k] = ALL_PROVINCES[k].prices;
});


function updateLandDistricts() {
  var province = document.getElementById('landProvince').value;
  var distSelect = document.getElementById('landDistrict');
  distSelect.innerHTML = '<option value="">اختر القضاء/الناحية</option>';
  if (province && LAND_DISTRICTS[province]) {
    LAND_DISTRICTS[province].forEach(function(d) {
      distSelect.innerHTML += '<option value="' + d + '">' + d + '</option>';
    });
  }
  // Auto-fill price
  var type = document.getElementById('landType').value;
  if (province && LAND_PRICES[province]) {
    document.getElementById('landPrice').value = formatNumber(LAND_PRICES[province][type]);
  }
}

function calculateLandTax() {
  var area = getVal('landArea');
  var price = getVal('landPrice');
  if (!area || !price) { showToast('يرجى إدخال عدد الأمتار وسعر المتر', true); return; }
  var totalValue = area * price;
  var taxRate = 0.02; // 2% سنوياً
  var tax = totalValue * taxRate;
  var province = document.getElementById('landProvince');
  var district = document.getElementById('landDistrict');
  setText('landLocation', (province.options[province.selectedIndex].text || '-') + ' - ' + (district.value || '-'));
  setText('landAreaResult', formatNumber(area) + ' م²');
  setText('landPriceResult', formatNumber(price) + ' د.ع / م²');
  setText('landTotalValue', formatNumber(totalValue) + ' د.ع');
  setText('landTaxDue', formatNumber(Math.round(tax)) + ' د.ع');
  document.getElementById('landResultDetails').style.display = 'block';
  showToast('تم احتساب ضريبة العرصة بنجاح');
}

// ========== LAND TAX EXEMPTIONS ==========
function checkLandExemption(value) {
  var resultDiv = document.getElementById('landExemptionResult');
  var partialDiv = document.getElementById('landExemptionPartial');
  partialDiv.style.display = 'none';

  var exemptMessages = {
    area_800: { exempt: false, msg: 'أول 800 متر مربع معفية من الضريبة. ما يزيد عن ذلك يخضع للضريبة بنسبة 2%.', showPartial: true },
    over_15_years: { exempt: true, msg: 'العرصة المملوكة لمدة تزيد عن 15 سنة معفية من ضريبة العرصات بالكامل.' },
    government: { exempt: true, msg: 'العرصات العائدة إلى الدوائر الرسمية أو شبه الرسمية معفية من ضريبة العرصات.' },
    waqf: { exempt: true, msg: 'العرصات العائدة إلى الأوقاف العامة وغير المؤجرة معفية من ضريبة العرصات.' },
    unions: { exempt: true, msg: 'العرصات العائدة إلى النقابات والجمعيات والمقابر معفية من ضريبة العرصات.' },
    legal_block: { exempt: true, msg: 'العرصات التي يتعذر التصرف بها بسبب قانوني معفية من ضريبة العرصات.' },
    public_use: { exempt: true, msg: 'العرصات المخصصة للأغراض والمنافع العامة معفية من ضريبة العرصات.' },
    outside_limits: { exempt: true, msg: 'العرصات الواقعة خارج حدود أمانة بغداد ومراكز المحافظات والأقضية والنواحي لا تخضع لضريبة العرصات.' },
    none: { exempt: false, msg: 'العرصة خاضعة لضريبة العرصات بالكامل بنسبة 2% سنوياً.' }
  };

  var info = exemptMessages[value];
  if (!info) return;

  var color = info.exempt ? '#059669' : (value === 'area_800' ? '#d97706' : '#dc2626');
  var bg = info.exempt ? '#f0fdf4' : (value === 'area_800' ? '#fffbeb' : '#fef2f2');
  var border = info.exempt ? '#bbf7d0' : (value === 'area_800' ? '#fde68a' : '#fecaca');
  var icon = info.exempt ? 'fa-check-circle' : (value === 'area_800' ? 'fa-exclamation-triangle' : 'fa-times-circle');

  resultDiv.style.display = 'block';
  resultDiv.innerHTML = '<div style="background:' + bg + ';border:1px solid ' + border + ';border-radius:10px;padding:20px;text-align:center;">' +
    '<i class="fas ' + icon + '" style="font-size:36px;color:' + color + ';"></i>' +
    '<h3 style="color:' + color + ';margin-top:10px;">' + (info.exempt ? 'معفي من الضريبة' : (value === 'area_800' ? 'إعفاء جزئي' : 'خاضع للضريبة')) + '</h3>' +
    '<p style="color:' + color + ';margin-top:8px;">' + info.msg + '</p></div>';

  if (info.showPartial) partialDiv.style.display = 'block';
}

function calculatePartialLandExemption() {
  var area = getVal('landExemptArea');
  var price = getVal('landExemptPrice');
  if (!area || !price) { showToast('يرجى إدخال المساحة وسعر المتر', true); return; }
  var exemptArea = Math.min(area, 800);
  var taxableArea = Math.max(0, area - 800);
  var taxableValue = taxableArea * price;
  var tax = taxableValue * 0.02;

  setText('partialTotalArea', formatNumber(area) + ' م²');
  setText('partialExemptArea', formatNumber(exemptArea) + ' م² (معفية)');
  setText('partialTaxableArea', formatNumber(taxableArea) + ' م²');
  setText('partialPrice', formatNumber(price) + ' د.ع / م²');
  setText('partialTaxableValue', formatNumber(taxableValue) + ' د.ع');
  setText('partialTaxDue', formatNumber(Math.round(tax)) + ' د.ع');
  document.getElementById('landPartialResult').style.display = 'block';
  showToast(taxableArea > 0 ? 'تم احتساب الضريبة على المساحة الزائدة عن 800 م²' : 'المساحة بالكامل معفية (أقل من 800 م²)');
}
  document.getElementById('landResultDetails').style.display = 'block';
  showToast('تم احتساب ضريبة العرصة بنجاح');
}

// ========== LAND WIZARD ==========
function nextLandStep(n) {
  if (n === 3) { calculateLandTax(); }
  var dots = document.querySelectorAll('#page-land .wizard-dot');
  var lines = document.querySelectorAll('#page-land .wizard-line');
  for (var i = 0; i < dots.length; i++) {
    dots[i].classList.remove('active', 'done');
    if (i < n - 1) dots[i].classList.add('done');
    if (i === n - 1) dots[i].classList.add('active');
  }
  for (var j = 0; j < lines.length; j++) {
    lines[j].classList.toggle('done', j < n - 1);
  }
  document.querySelectorAll('#page-land .wizard-card').forEach(function(c) { c.classList.remove('active'); });
  var step = document.getElementById('land-step-' + n);
  if (step) step.classList.add('active');
}
function prevLandStep(n) { nextLandStep(n); }

// ========== PROPERTY TAX ==========
function calculatePropertyTax() {
  var monthly = getVal('propRentAmount');
  var duration = parseFloat(document.getElementById('propRentDuration').value) || 12;
  if (!monthly) { showToast('يرجى إدخال قيمة الإيجار الشهرية', true); return; }
  var annualRent = monthly * duration;
  var taxRate = 0.10; // 10%
  var tax = annualRent * taxRate;
  var propTypeEl = document.getElementById('propType');
  var propTypeText = propTypeEl.options[propTypeEl.selectedIndex].text;
  var address = document.getElementById('propAddress').value || '-';

  setText('propOpType', propTypeText);
  setText('propLocationResult', address);
  setText('propMonthlyRent', formatNumber(monthly) + ' د.ع');
  setText('propMonths', duration + ' شهر');
  setText('propBaseValue', formatNumber(annualRent) + ' د.ع');
  setText('propTaxDue', formatNumber(Math.round(tax)) + ' د.ع');
  document.getElementById('propResultDetails').style.display = 'block';
  showToast('تم احتساب ضريبة العقار بنجاح');
}
  showToast('تم احتساب ضريبة العقار بنجاح');
}

// Property wizard
function nextPropStep(n) {
  if (n === 4) { calculatePropertyTax(); }
  var dots = document.querySelectorAll('#page-property .wizard-dot');
  var lines = document.querySelectorAll('#page-property .wizard-line');
  for (var i = 0; i < dots.length; i++) {
    dots[i].classList.remove('active', 'done');
    if (i < n - 1) dots[i].classList.add('done');
    if (i === n - 1) dots[i].classList.add('active');
  }
  for (var j = 0; j < lines.length; j++) {
    lines[j].classList.toggle('done', j < n - 1);
  }
  document.querySelectorAll('#page-property .wizard-card').forEach(function(c) { c.classList.remove('active'); });
  var step = document.getElementById('prop-step-' + n);
  if (step) step.classList.add('active');
}
function prevPropStep(n) { nextPropStep(n); }

// ========== PROFESSION TAX ==========
function toggleProfIncomeMethod(method) {
  var label = document.getElementById('profIncomeLabel');
  label.textContent = method === 'monthly' ? 'الدخل الشهري (د.ع)' : 'الدخل السنوي (د.ع)';
  document.getElementById('profIncome').dataset.method = method;
}

function calculateProfessionTax() {
  var income = getVal('profIncome');
  var expenses = getVal('profExpenses');
  var method = document.getElementById('profIncome').dataset.method || 'annual';
  if (method === 'monthly') { income *= 12; expenses *= 12; }
  var net = income - expenses;
  if (net <= 0) { showToast('صافي الدخل سالب أو صفر', true); return; }
  var tax = calculateIncomeTax(net);
  setText('profNetIncome', formatNumber(net) + ' د.ع');
  setText('profAfterExempt', formatNumber(Math.max(0, net - SALARY_ANNUAL_EXEMPTION)) + ' د.ع');
  setText('profTaxDue', formatNumber(Math.round(tax)) + ' د.ع');
  document.getElementById('profResultDetails').style.display = 'block';
  showToast('تم احتساب ضريبة المهنة بنجاح');
}

// Profession wizard
function nextProfStep(n) {
  if (n === 4) { calculateProfessionTax(); }
  var dots = document.querySelectorAll('#page-profession .wizard-dot');
  var lines = document.querySelectorAll('#page-profession .wizard-line');
  for (var i = 0; i < dots.length; i++) {
    dots[i].classList.remove('active', 'done');
    if (i < n - 1) dots[i].classList.add('done');
    if (i === n - 1) dots[i].classList.add('active');
  }
  for (var j = 0; j < lines.length; j++) {
    lines[j].classList.toggle('done', j < n - 1);
  }
  document.querySelectorAll('#page-profession .wizard-card').forEach(function(c) { c.classList.remove('active'); });
  var step = document.getElementById('prof-step-' + n);
  if (step) step.classList.add('active');
}
function prevProfStep(n) { nextProfStep(n); }

// ========== SALES TAX ==========
var salesEntries = [];
var salesCounter = 0;

function updateSalesTaxRate() {
  var sel = document.getElementById('salesCategory');
  var rate = sel.options[sel.selectedIndex].getAttribute('data-rate') || 0;
  document.getElementById('salesTaxRate').value = rate + '٪';
}

function calculateSalesTax() {
  var sel = document.getElementById('salesCategory');
  var rate = parseFloat(sel.options[sel.selectedIndex].getAttribute('data-rate')) || 0;
  var amount = getVal('salesAmount');
  var qty = parseInt(document.getElementById('salesQty').value) || 1;
  if (!amount || !rate) { showToast('يرجى اختيار الفئة وإدخال المبلغ', true); return; }
  var subtotal = amount * qty;
  var taxAmt = subtotal * (rate / 100);
  var total = subtotal + taxAmt;
  setText('salesSubtotal', formatNumber(subtotal) + ' د.ع');
  setText('salesTaxAmount', formatNumber(Math.round(taxAmt)) + ' د.ع');
  setText('salesTotal', formatNumber(Math.round(total)) + ' د.ع');
  document.getElementById('salesSummary').style.display = 'grid';
}

function addSalesEntry() {
  var sel = document.getElementById('salesCategory');
  var catText = sel.options[sel.selectedIndex].text;
  var rate = parseFloat(sel.options[sel.selectedIndex].getAttribute('data-rate')) || 0;
  var amount = getVal('salesAmount');
  var qty = parseInt(document.getElementById('salesQty').value) || 1;
  if (!amount || !rate) { showToast('يرجى احتساب الضريبة أولاً', true); return; }
  var subtotal = amount * qty;
  var taxAmt = subtotal * (rate / 100);
  var total = subtotal + taxAmt;
  salesCounter++;
  salesEntries.push({ id: salesCounter, category: catText, amount: subtotal, tax: taxAmt, total: total });

  var tbody = document.getElementById('salesListBody');
  tbody.innerHTML = '';
  salesEntries.forEach(function(e) {
    tbody.innerHTML += '<tr><td>' + e.id + '</td><td>' + e.category + '</td><td>' +
      formatNumber(e.amount) + '</td><td>' + formatNumber(Math.round(e.tax)) + '</td><td>' +
      formatNumber(Math.round(e.total)) + '</td></tr>';
  });

  var totalSales = salesEntries.reduce(function(s, e) { return s + e.amount; }, 0);
  var totalTax = salesEntries.reduce(function(s, e) { return s + e.tax; }, 0);
  setText('salesReportTotal', formatNumber(Math.round(totalSales)) + ' د.ع');
  setText('salesReportTax', formatNumber(Math.round(totalTax)) + ' د.ع');
  setText('salesReportCount', salesEntries.length.toString());
  showToast('تمت إضافة العملية للقائمة');
}

// ========== 1. DARK MODE ==========
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

// ========== 2. CHARTS (Chart.js) ==========
var taxDistChart = null;
var revenueChart = null;

function initCharts() {
  if (typeof Chart === 'undefined') return;
  Chart.defaults.font.family = 'Tajawal';
  var ctx1 = document.getElementById('taxDistributionChart');
  if (ctx1) {
    taxDistChart = new Chart(ctx1, {
      type: 'doughnut',
      data: {
        labels: ['ضريبة الشركات', 'ضريبة العرصات', 'ضريبة العقار', 'ضريبة المهنة', 'ضريبة المبيعات'],
        datasets: [{
          data: [45, 15, 20, 12, 8],
          backgroundColor: ['#1a237e','#2e7d32','#e65100','#6200ea','#c62828'],
          borderWidth: 0, borderRadius: 4
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true } } }
      }
    });
  }
  var ctx2 = document.getElementById('monthlyRevenueChart');
  if (ctx2) {
    revenueChart = new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: ['كانون٢','شباط','آذار','نيسان','أيار','حزيران','تموز','آب','أيلول','ت١','ت٢','ك١'],
        datasets: [{
          label: 'الإيرادات (مليون د.ع)',
          data: [8.5, 9.2, 12.1, 10.8, 11.5, 14.2, 13.0, 10.5, 15.3, 12.8, 11.0, 16.5],
          backgroundColor: 'rgba(26,35,126,0.7)', borderRadius: 6, borderSkipped: false
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } }, x: { grid: { display: false } } }
      }
    });
  }
}

// ========== 3. GLOBAL SEARCH ==========
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

// ========== 4. PDF EXPORT ==========
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

// ========== 5. EXCEL EXPORT ==========
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

// ========== 6. USER MANAGEMENT ==========
function getUsers() {
  var stored = localStorage.getItem('taxUsers');
  if (stored) return JSON.parse(stored);
  return {
    admin: { password: 'admin123', name: 'مدير النظام', role: 'مدير النظام', avatar: 'م', active: true },
    accountant: { password: '123456', name: 'محمد أحمد', role: 'محاسب ضريبي', avatar: 'م', active: true }
  };
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
  signatureCtx=canvas.getContext('2d');
  signatureCtx.strokeStyle='#0f1b4d';signatureCtx.lineWidth=2;signatureCtx.lineCap='round';
  canvas.addEventListener('mousedown',function(e){isDrawing=true;signatureCtx.beginPath();signatureCtx.moveTo(e.offsetX,e.offsetY);});
  canvas.addEventListener('mousemove',function(e){if(isDrawing){signatureCtx.lineTo(e.offsetX,e.offsetY);signatureCtx.stroke();}});
  canvas.addEventListener('mouseup',function(){isDrawing=false;});
  canvas.addEventListener('mouseleave',function(){isDrawing=false;});
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


document.addEventListener('DOMContentLoaded', function() {
  // Splash screen
  handleSplashScreen();

  // Load dark mode
  loadDarkMode();

  // Check saved session
  checkSession();

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

// ============================================================
//  FEATURE: CONTACT FORM (تواصل معنا)
// ============================================================
function submitContactForm() {
  var name = document.getElementById('contactName').value.trim();
  var phone = document.getElementById('contactPhone').value.trim();
  var email = document.getElementById('contactEmail').value.trim();
  var service = document.getElementById('contactService').value;
  var details = document.getElementById('contactDetails').value.trim();
  if (!name) { showToast('يرجى إدخال اسم الشركة أو المكلف', true); return; }
  if (!phone) { showToast('يرجى إدخال رقم الهاتف', true); return; }
  if (!service) { showToast('يرجى اختيار نوع الخدمة المطلوبة', true); return; }
  // Save request locally
  var requests = JSON.parse(localStorage.getItem('contactRequests') || '[]');
  requests.push({ name: name, phone: phone, email: email, service: service, details: details, date: new Date().toISOString() });
  localStorage.setItem('contactRequests', JSON.stringify(requests));
  document.getElementById('contactSuccessMsg').style.display = 'block';
  showToast('تم إرسال طلبك بنجاح! سنتواصل معك قريباً');
  addAuditEntry('طلب تواصل', 'طلب إعداد حسابات ختامية من: ' + name);
}

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
