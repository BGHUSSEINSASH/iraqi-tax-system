import os
BASE = r'c:\Users\BGHUSSEINSASH\Desktop\نظام ضريبة'

with open(os.path.join(BASE, 'index.html'), 'r', encoding='utf-8') as f:
    html = f.read()
with open(os.path.join(BASE, 'css', 'style.css'), 'r', encoding='utf-8') as f:
    css = f.read()
with open(os.path.join(BASE, 'js', 'app.js'), 'r', encoding='utf-8') as f:
    js = f.read()
print('Files read OK')

# ===================== 1. HTML: Replace packages selection screen with 5 packages =====================
old_packages_screen = '''  <div class="packages-screen" id="packagesScreen" style="display:none;">
    <div class="packages-bg"></div>
    <div class="packages-container">
      <div class="packages-header">
        <div class="packages-logo"><i class="fas fa-gem"></i></div>
        <h1>اختر باقتك المناسبة</h1>
        <p>اختر الخطة المثالية لاحتياجاتك الضريبية — يمكنك الترقية في أي وقت</p>
      </div>
      <div class="packages-grid">
        <div class="package-card" onclick="selectPackage('basic')">
          <div class="package-icon basic-icon"><i class="fas fa-leaf"></i></div>
          <h3>الباقة الأساسية</h3>
          <div class="package-price"><span class="price-amount">مجاني</span></div>
          <p class="package-desc">للاستخدام الشخصي والتجربة</p>
          <ul class="package-features-list">
            <li class="yes"><i class="fas fa-check-circle"></i> لوحة التحكم الرئيسية</li>
            <li class="yes"><i class="fas fa-check-circle"></i> وحدة ضريبية واحدة (الشركات)</li>
            <li class="yes"><i class="fas fa-check-circle"></i> التقويم الضريبي</li>
            <li class="yes"><i class="fas fa-check-circle"></i> الإشعارات</li>
            <li class="no"><i class="fas fa-lock"></i> باقي الوحدات الضريبية</li>
            <li class="no"><i class="fas fa-lock"></i> التقارير والتحليلات</li>
            <li class="no"><i class="fas fa-lock"></i> تصدير PDF / Excel</li>
            <li class="no"><i class="fas fa-lock"></i> إدارة المستخدمين</li>
          </ul>
          <button class="package-select-btn basic-btn">اختيار الأساسية</button>
        </div>
        <div class="package-card featured" onclick="selectPackage('professional')">
          <div class="package-popular-tag">الأكثر شيوعاً</div>
          <div class="package-icon pro-icon"><i class="fas fa-crown"></i></div>
          <h3>الباقة المتقدمة</h3>
          <div class="package-price"><span class="price-amount">٢٥,٠٠٠</span><span class="price-period">د.ع / شهرياً</span></div>
          <p class="package-desc">للمحاسبين والشركات الصغيرة</p>
          <ul class="package-features-list">
            <li class="yes"><i class="fas fa-check-circle"></i> لوحة التحكم الرئيسية</li>
            <li class="yes"><i class="fas fa-check-circle"></i> جميع الوحدات الضريبية (٥)</li>
            <li class="yes"><i class="fas fa-check-circle"></i> التقويم الضريبي</li>
            <li class="yes"><i class="fas fa-check-circle"></i> الإشعارات والتذكيرات</li>
            <li class="yes"><i class="fas fa-check-circle"></i> التقارير والتحليلات</li>
            <li class="yes"><i class="fas fa-check-circle"></i> تصدير PDF / Excel</li>
            <li class="no"><i class="fas fa-lock"></i> إدارة المستخدمين</li>
            <li class="no"><i class="fas fa-lock"></i> المساعد الذكي</li>
          </ul>
          <button class="package-select-btn pro-btn">اختيار المتقدمة</button>
        </div>
        <div class="package-card" onclick="selectPackage('enterprise')">
          <div class="package-icon ent-icon"><i class="fas fa-building"></i></div>
          <h3>الباقة الشاملة</h3>
          <div class="package-price"><span class="price-amount">٧٥,٠٠٠</span><span class="price-period">د.ع / شهرياً</span></div>
          <p class="package-desc">للمؤسسات والهيئات الحكومية</p>
          <ul class="package-features-list">
            <li class="yes"><i class="fas fa-check-circle"></i> لوحة التحكم الرئيسية</li>
            <li class="yes"><i class="fas fa-check-circle"></i> جميع الوحدات الضريبية (٥)</li>
            <li class="yes"><i class="fas fa-check-circle"></i> التقويم الضريبي</li>
            <li class="yes"><i class="fas fa-check-circle"></i> الإشعارات والتذكيرات</li>
            <li class="yes"><i class="fas fa-check-circle"></i> التقارير والتحليلات الكاملة</li>
            <li class="yes"><i class="fas fa-check-circle"></i> تصدير PDF / Excel</li>
            <li class="yes"><i class="fas fa-check-circle"></i> إدارة المستخدمين والصلاحيات</li>
            <li class="yes"><i class="fas fa-check-circle"></i> المساعد الذكي + الدعم الكامل</li>
          </ul>
          <button class="package-select-btn ent-btn">اختيار الشاملة</button>
        </div>
      </div>
      <button class="packages-skip-btn" onclick="selectPackage('basic')">تخطي واستخدام الباقة المجانية <i class="fas fa-arrow-left"></i></button>
    </div>
  </div>'''

new_packages_screen = '''  <div class="packages-screen" id="packagesScreen" style="display:none;">
    <div class="packages-bg">
      <div class="pkg-bg-orb orb-1"></div>
      <div class="pkg-bg-orb orb-2"></div>
      <div class="pkg-bg-orb orb-3"></div>
    </div>
    <div class="packages-container">
      <div class="packages-header">
        <div class="packages-logo"><i class="fas fa-gem"></i></div>
        <h1>اختر باقتك المناسبة</h1>
        <p>اختر الخطة المثالية لاحتياجاتك الضريبية — يمكنك الترقية أو التبديل في أي وقت</p>
        <div class="pkg-billing-toggle">
          <span class="pkg-toggle-label" id="pkgMonthlyLabel">شهري</span>
          <label class="pkg-toggle-switch">
            <input type="checkbox" id="pkgBillingToggle" onchange="toggleBillingCycle()">
            <span class="pkg-toggle-slider"></span>
          </label>
          <span class="pkg-toggle-label" id="pkgYearlyLabel">سنوي</span>
          <span class="pkg-save-badge">وفّر ٢٠٪</span>
        </div>
      </div>
      <div class="packages-grid packages-grid-5">

        <!-- 1. Trial -->
        <div class="package-card pkg-trial" onclick="selectPackage('trial')">
          <div class="pkg-ribbon trial-ribbon"><span>تجربة مجانية</span></div>
          <div class="package-icon trial-icon"><i class="fas fa-flask"></i></div>
          <h3>الباقة التجريبية</h3>
          <div class="package-price"><span class="price-amount">مجاني</span></div>
          <p class="pkg-duration">١٤ يوم تجربة كاملة</p>
          <p class="package-desc">جرّب جميع الميزات بدون التزام</p>
          <ul class="package-features-list">
            <li class="yes"><i class="fas fa-check-circle"></i> لوحة التحكم الرئيسية</li>
            <li class="yes"><i class="fas fa-check-circle"></i> وحدة ضريبية واحدة (الشركات)</li>
            <li class="yes"><i class="fas fa-check-circle"></i> التقويم الضريبي</li>
            <li class="yes"><i class="fas fa-check-circle"></i> ٥ عمليات حساب</li>
            <li class="no"><i class="fas fa-lock"></i> باقي الوحدات الضريبية</li>
            <li class="no"><i class="fas fa-lock"></i> التقارير والتصدير</li>
            <li class="no"><i class="fas fa-lock"></i> الدعم الفني</li>
            <li class="no"><i class="fas fa-lock"></i> إدارة المستخدمين</li>
          </ul>
          <button class="package-select-btn trial-btn">ابدأ التجربة المجانية</button>
        </div>

        <!-- 2. Basic -->
        <div class="package-card" onclick="selectPackage('basic')">
          <div class="package-icon basic-icon"><i class="fas fa-leaf"></i></div>
          <h3>الباقة الأساسية</h3>
          <div class="package-price">
            <span class="price-amount" data-monthly="١٥,٠٠٠" data-yearly="١٤٤,٠٠٠">١٥,٠٠٠</span>
            <span class="price-period" data-monthly="د.ع / شهرياً" data-yearly="د.ع / سنوياً">د.ع / شهرياً</span>
          </div>
          <p class="package-desc">للمحاسبين المستقلين والأفراد</p>
          <ul class="package-features-list">
            <li class="yes"><i class="fas fa-check-circle"></i> لوحة التحكم الرئيسية</li>
            <li class="yes"><i class="fas fa-check-circle"></i> وحدتان ضريبيتان (الشركات + العقار)</li>
            <li class="yes"><i class="fas fa-check-circle"></i> التقويم الضريبي</li>
            <li class="yes"><i class="fas fa-check-circle"></i> الإشعارات الأساسية</li>
            <li class="yes"><i class="fas fa-check-circle"></i> عمليات غير محدودة</li>
            <li class="no"><i class="fas fa-lock"></i> التقارير والتحليلات</li>
            <li class="no"><i class="fas fa-lock"></i> تصدير PDF / Excel</li>
            <li class="no"><i class="fas fa-lock"></i> إدارة المستخدمين</li>
            <li class="no"><i class="fas fa-lock"></i> المساعد الذكي</li>
            <li class="no"><i class="fas fa-lock"></i> الدعم ذو الأولوية</li>
          </ul>
          <button class="package-select-btn basic-btn">اختيار الأساسية</button>
        </div>

        <!-- 3. Professional -->
        <div class="package-card featured" onclick="selectPackage('professional')">
          <div class="package-popular-tag"><i class="fas fa-fire"></i> الأكثر شيوعاً</div>
          <div class="package-icon pro-icon"><i class="fas fa-crown"></i></div>
          <h3>الباقة المتقدمة</h3>
          <div class="package-price">
            <span class="price-amount" data-monthly="٤٥,٠٠٠" data-yearly="٤٣٢,٠٠٠">٤٥,٠٠٠</span>
            <span class="price-period" data-monthly="د.ع / شهرياً" data-yearly="د.ع / سنوياً">د.ع / شهرياً</span>
          </div>
          <p class="package-desc">للمحاسبين والشركات الصغيرة</p>
          <ul class="package-features-list">
            <li class="yes"><i class="fas fa-check-circle"></i> لوحة التحكم المتقدمة</li>
            <li class="yes"><i class="fas fa-check-circle"></i> جميع الوحدات الضريبية (٥)</li>
            <li class="yes"><i class="fas fa-check-circle"></i> التقويم + التذكيرات التلقائية</li>
            <li class="yes"><i class="fas fa-check-circle"></i> الإشعارات المتقدمة</li>
            <li class="yes"><i class="fas fa-check-circle"></i> التقارير والتحليلات</li>
            <li class="yes"><i class="fas fa-check-circle"></i> تصدير PDF / Excel</li>
            <li class="yes"><i class="fas fa-check-circle"></i> حاسبة الغرامات</li>
            <li class="yes"><i class="fas fa-check-circle"></i> مقارنة الضرائب</li>
            <li class="no"><i class="fas fa-lock"></i> إدارة المستخدمين</li>
            <li class="no"><i class="fas fa-lock"></i> المساعد الذكي المتقدم</li>
          </ul>
          <button class="package-select-btn pro-btn">اختيار المتقدمة</button>
        </div>

        <!-- 4. Business -->
        <div class="package-card" onclick="selectPackage('business')">
          <div class="package-icon biz-icon"><i class="fas fa-briefcase"></i></div>
          <h3>باقة الأعمال</h3>
          <div class="package-price">
            <span class="price-amount" data-monthly="٨٥,٠٠٠" data-yearly="٨١٦,٠٠٠">٨٥,٠٠٠</span>
            <span class="price-period" data-monthly="د.ع / شهرياً" data-yearly="د.ع / سنوياً">د.ع / شهرياً</span>
          </div>
          <p class="package-desc">للشركات المتوسطة ومكاتب المحاسبة</p>
          <ul class="package-features-list">
            <li class="yes"><i class="fas fa-check-circle"></i> كل ميزات المتقدمة</li>
            <li class="yes"><i class="fas fa-check-circle"></i> إدارة المستخدمين (حتى ١٠)</li>
            <li class="yes"><i class="fas fa-check-circle"></i> صلاحيات متعددة المستويات</li>
            <li class="yes"><i class="fas fa-check-circle"></i> المساعد الذكي</li>
            <li class="yes"><i class="fas fa-check-circle"></i> سجل التدقيق الكامل</li>
            <li class="yes"><i class="fas fa-check-circle"></i> إدارة المستندات</li>
            <li class="yes"><i class="fas fa-check-circle"></i> الدعم ذو الأولوية</li>
            <li class="yes"><i class="fas fa-check-circle"></i> تخصيص التقارير</li>
            <li class="no"><i class="fas fa-lock"></i> API متقدم</li>
            <li class="no"><i class="fas fa-lock"></i> مدير حساب مخصص</li>
          </ul>
          <button class="package-select-btn biz-btn">اختيار الأعمال</button>
        </div>

        <!-- 5. Enterprise -->
        <div class="package-card pkg-enterprise" onclick="selectPackage('enterprise')">
          <div class="pkg-ribbon ent-ribbon"><span>VIP</span></div>
          <div class="package-icon ent-icon"><i class="fas fa-building"></i></div>
          <h3>الباقة الشاملة</h3>
          <div class="package-price">
            <span class="price-amount" data-monthly="١٥٠,٠٠٠" data-yearly="١,٤٤٠,٠٠٠">١٥٠,٠٠٠</span>
            <span class="price-period" data-monthly="د.ع / شهرياً" data-yearly="د.ع / سنوياً">د.ع / شهرياً</span>
          </div>
          <p class="package-desc">للمؤسسات والهيئات الحكومية الكبرى</p>
          <ul class="package-features-list">
            <li class="yes"><i class="fas fa-check-circle"></i> كل ميزات باقة الأعمال</li>
            <li class="yes"><i class="fas fa-check-circle"></i> مستخدمين غير محدودين</li>
            <li class="yes"><i class="fas fa-check-circle"></i> صلاحيات إدارية كاملة</li>
            <li class="yes"><i class="fas fa-check-circle"></i> المساعد الذكي المتقدم + AI</li>
            <li class="yes"><i class="fas fa-check-circle"></i> API كامل وتكامل الأنظمة</li>
            <li class="yes"><i class="fas fa-check-circle"></i> مدير حساب مخصص</li>
            <li class="yes"><i class="fas fa-check-circle"></i> دعم فني ٢٤/٧</li>
            <li class="yes"><i class="fas fa-check-circle"></i> نسخ احتياطي يومي</li>
            <li class="yes"><i class="fas fa-check-circle"></i> تدريب مخصص للفريق</li>
            <li class="yes"><i class="fas fa-check-circle"></i> SLA مضمون ٩٩.٩٪</li>
          </ul>
          <button class="package-select-btn ent-btn">اختيار الشاملة</button>
        </div>

      </div>

      <!-- Feature Comparison Table -->
      <div class="pkg-comparison-section">
        <h2 class="pkg-section-title"><i class="fas fa-th-list"></i> مقارنة تفصيلية بين الباقات</h2>
        <div class="pkg-comparison-table-wrap">
          <table class="pkg-comparison-table">
            <thead>
              <tr>
                <th>الميزة</th>
                <th><i class="fas fa-flask"></i> التجريبية</th>
                <th><i class="fas fa-leaf"></i> الأساسية</th>
                <th class="highlight-col"><i class="fas fa-crown"></i> المتقدمة</th>
                <th><i class="fas fa-briefcase"></i> الأعمال</th>
                <th><i class="fas fa-building"></i> الشاملة</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>الوحدات الضريبية</td><td>١</td><td>٢</td><td class="highlight-col">٥</td><td>٥</td><td>٥</td></tr>
              <tr><td>عدد العمليات</td><td>٥</td><td>غير محدود</td><td class="highlight-col">غير محدود</td><td>غير محدود</td><td>غير محدود</td></tr>
              <tr><td>عدد المستخدمين</td><td>١</td><td>١</td><td class="highlight-col">٣</td><td>١٠</td><td>غير محدود</td></tr>
              <tr><td>التقارير والتحليلات</td><td><i class="fas fa-times pkg-no"></i></td><td><i class="fas fa-times pkg-no"></i></td><td class="highlight-col"><i class="fas fa-check pkg-yes"></i></td><td><i class="fas fa-check pkg-yes"></i></td><td><i class="fas fa-check pkg-yes"></i></td></tr>
              <tr><td>تصدير PDF / Excel</td><td><i class="fas fa-times pkg-no"></i></td><td><i class="fas fa-times pkg-no"></i></td><td class="highlight-col"><i class="fas fa-check pkg-yes"></i></td><td><i class="fas fa-check pkg-yes"></i></td><td><i class="fas fa-check pkg-yes"></i></td></tr>
              <tr><td>حاسبة الغرامات</td><td><i class="fas fa-times pkg-no"></i></td><td><i class="fas fa-times pkg-no"></i></td><td class="highlight-col"><i class="fas fa-check pkg-yes"></i></td><td><i class="fas fa-check pkg-yes"></i></td><td><i class="fas fa-check pkg-yes"></i></td></tr>
              <tr><td>مقارنة الضرائب</td><td><i class="fas fa-times pkg-no"></i></td><td><i class="fas fa-times pkg-no"></i></td><td class="highlight-col"><i class="fas fa-check pkg-yes"></i></td><td><i class="fas fa-check pkg-yes"></i></td><td><i class="fas fa-check pkg-yes"></i></td></tr>
              <tr><td>إدارة المستندات</td><td><i class="fas fa-times pkg-no"></i></td><td><i class="fas fa-times pkg-no"></i></td><td class="highlight-col"><i class="fas fa-times pkg-no"></i></td><td><i class="fas fa-check pkg-yes"></i></td><td><i class="fas fa-check pkg-yes"></i></td></tr>
              <tr><td>إدارة المستخدمين</td><td><i class="fas fa-times pkg-no"></i></td><td><i class="fas fa-times pkg-no"></i></td><td class="highlight-col"><i class="fas fa-times pkg-no"></i></td><td><i class="fas fa-check pkg-yes"></i></td><td><i class="fas fa-check pkg-yes"></i></td></tr>
              <tr><td>سجل التدقيق</td><td><i class="fas fa-times pkg-no"></i></td><td><i class="fas fa-times pkg-no"></i></td><td class="highlight-col"><i class="fas fa-times pkg-no"></i></td><td><i class="fas fa-check pkg-yes"></i></td><td><i class="fas fa-check pkg-yes"></i></td></tr>
              <tr><td>المساعد الذكي</td><td><i class="fas fa-times pkg-no"></i></td><td><i class="fas fa-times pkg-no"></i></td><td class="highlight-col"><i class="fas fa-times pkg-no"></i></td><td><i class="fas fa-check pkg-yes"></i></td><td><i class="fas fa-check pkg-yes"></i> متقدم + AI</td></tr>
              <tr><td>الدعم الفني</td><td>بريد إلكتروني</td><td>بريد إلكتروني</td><td class="highlight-col">بريد + دردشة</td><td>أولوية عالية</td><td>٢٤/٧ مخصص</td></tr>
              <tr><td>API وتكامل</td><td><i class="fas fa-times pkg-no"></i></td><td><i class="fas fa-times pkg-no"></i></td><td class="highlight-col"><i class="fas fa-times pkg-no"></i></td><td><i class="fas fa-times pkg-no"></i></td><td><i class="fas fa-check pkg-yes"></i></td></tr>
              <tr><td>نسخ احتياطي</td><td><i class="fas fa-times pkg-no"></i></td><td>أسبوعي</td><td class="highlight-col">يومي</td><td>يومي</td><td>فوري</td></tr>
              <tr><td>مدير حساب مخصص</td><td><i class="fas fa-times pkg-no"></i></td><td><i class="fas fa-times pkg-no"></i></td><td class="highlight-col"><i class="fas fa-times pkg-no"></i></td><td><i class="fas fa-times pkg-no"></i></td><td><i class="fas fa-check pkg-yes"></i></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- FAQ Section -->
      <div class="pkg-faq-section">
        <h2 class="pkg-section-title"><i class="fas fa-question-circle"></i> الأسئلة الشائعة</h2>
        <div class="pkg-faq-grid">
          <div class="pkg-faq-item" onclick="toggleFaq(this)">
            <div class="pkg-faq-q"><span>هل يمكنني تغيير الباقة لاحقاً؟</span><i class="fas fa-chevron-down"></i></div>
            <div class="pkg-faq-a">نعم، يمكنك الترقية أو التبديل بين الباقات في أي وقت من صفحة الباقات داخل النظام. سيتم تطبيق التغيير فوراً.</div>
          </div>
          <div class="pkg-faq-item" onclick="toggleFaq(this)">
            <div class="pkg-faq-q"><span>ما هي مدة الفترة التجريبية؟</span><i class="fas fa-chevron-down"></i></div>
            <div class="pkg-faq-a">الفترة التجريبية ١٤ يوماً كاملة تتيح لك الوصول المحدود لاستكشاف النظام. لا يلزم إدخال بيانات الدفع.</div>
          </div>
          <div class="pkg-faq-item" onclick="toggleFaq(this)">
            <div class="pkg-faq-q"><span>هل البيانات آمنة؟</span><i class="fas fa-chevron-down"></i></div>
            <div class="pkg-faq-a">نعم، نستخدم تشفير AES-256 لحماية جميع البيانات مع نسخ احتياطي منتظم وفقاً لباقتك المختارة.</div>
          </div>
          <div class="pkg-faq-item" onclick="toggleFaq(this)">
            <div class="pkg-faq-q"><span>كيف يتم الدفع؟</span><i class="fas fa-chevron-down"></i></div>
            <div class="pkg-faq-a">ندعم الدفع عبر ماستركارد، فيزا، زين كاش، آسيا حوالة، ونظام الدفع الإلكتروني الحكومي. يمكن الدفع شهرياً أو سنوياً مع خصم ٢٠٪ على الدفع السنوي.</div>
          </div>
          <div class="pkg-faq-item" onclick="toggleFaq(this)">
            <div class="pkg-faq-q"><span>هل يوجد عقد التزام؟</span><i class="fas fa-chevron-down"></i></div>
            <div class="pkg-faq-a">لا يوجد عقد التزام طويل المدة. يمكنك الإلغاء في أي وقت. الاشتراك السنوي يوفر خصماً لكنه لا يتطلب عقداً.</div>
          </div>
          <div class="pkg-faq-item" onclick="toggleFaq(this)">
            <div class="pkg-faq-q"><span>هل يمكنني استرداد المبلغ؟</span><i class="fas fa-chevron-down"></i></div>
            <div class="pkg-faq-a">نعم، نقدم ضمان استرداد كامل خلال ٣٠ يوماً من الاشتراك إذا لم يلبِّ النظام توقعاتك.</div>
          </div>
        </div>
      </div>

      <!-- Trust Badges -->
      <div class="pkg-trust-section">
        <div class="pkg-trust-item"><i class="fas fa-shield-alt"></i><span>تشفير AES-256</span></div>
        <div class="pkg-trust-item"><i class="fas fa-lock"></i><span>حماية البيانات</span></div>
        <div class="pkg-trust-item"><i class="fas fa-undo"></i><span>ضمان استرداد ٣٠ يوم</span></div>
        <div class="pkg-trust-item"><i class="fas fa-headset"></i><span>دعم فني متواصل</span></div>
        <div class="pkg-trust-item"><i class="fas fa-server"></i><span>SLA ٩٩.٩٪</span></div>
      </div>

      <button class="packages-skip-btn" onclick="selectPackage('trial')">ابدأ التجربة المجانية لمدة ١٤ يوم <i class="fas fa-arrow-left"></i></button>
    </div>
  </div>'''

html = html.replace(old_packages_screen, new_packages_screen, 1)
print('HTML: Packages selection screen replaced with 5 packages + comparison + FAQ + trust')

# ===================== 2. HTML: Replace page-packages section with full management page =====================
old_page_packages = '''        <section class="page-section" id="page-packages">
          <div class="section-hero" style="--hero-c1:#d4a017;--hero-c2:#f0c75e;" data-aos="fade-down">
            <div class="section-hero-bg">
              <div class="hero-particle hp-1"></div>
              <div class="hero-particle hp-2"></div>
              <div class="hero-particle hp-3"></div>
              <div class="hero-wave"></div>
            </div>
            <div class="section-hero-content">
              <div class="section-hero-icon-3d">
                <div class="hero-icon-ring"></div>
                <i class="fas fa-gem"></i>
              </div>
              <div class="section-hero-text">
                <h2>الباقات والاشتراكات</h2>
                <p>استعراض وإدارة باقات الاشتراك</p>
              </div>
            </div>
          </div>
          <div class="card" data-aos="fade-up">
            <div class="card-header"><h3><i class="fas fa-gem"></i> الباقات والاشتراكات</h3></div>
            <div class="card-body">
              <div class="current-package-info" id="currentPackageInfo"></div>
              <div class="packages-grid-inline" id="packagesGridInline"></div>
            </div>
          </div>
        </section>'''

new_page_packages = '''        <section class="page-section" id="page-packages">
          <div class="section-hero" style="--hero-c1:#d4a017;--hero-c2:#f0c75e;" data-aos="fade-down">
            <div class="section-hero-bg">
              <div class="hero-particle hp-1"></div>
              <div class="hero-particle hp-2"></div>
              <div class="hero-particle hp-3"></div>
              <div class="hero-wave"></div>
            </div>
            <div class="section-hero-content">
              <div class="section-hero-icon-3d">
                <div class="hero-icon-ring"></div>
                <i class="fas fa-gem"></i>
              </div>
              <div class="section-hero-text">
                <h2>الباقات والاشتراكات</h2>
                <p>إدارة باقتك الحالية، الترقية، وسجل المدفوعات</p>
              </div>
            </div>
          </div>

          <!-- Current Subscription Status -->
          <div class="card pkg-status-card" data-aos="fade-up">
            <div class="card-body">
              <div class="current-package-info" id="currentPackageInfo"></div>
            </div>
          </div>

          <!-- Subscription Stats -->
          <div class="pkg-stats-row" data-aos="fade-up" data-aos-delay="100">
            <div class="pkg-stat-card">
              <div class="pkg-stat-icon" style="background:rgba(5,150,105,0.1);color:#059669;"><i class="fas fa-calendar-check"></i></div>
              <div class="pkg-stat-info">
                <span class="pkg-stat-value" id="pkgDaysLeft">--</span>
                <span class="pkg-stat-label">يوم متبقي</span>
              </div>
            </div>
            <div class="pkg-stat-card">
              <div class="pkg-stat-icon" style="background:rgba(37,99,235,0.1);color:#2563eb;"><i class="fas fa-calculator"></i></div>
              <div class="pkg-stat-info">
                <span class="pkg-stat-value" id="pkgCalcsUsed">--</span>
                <span class="pkg-stat-label">عملية حساب</span>
              </div>
            </div>
            <div class="pkg-stat-card">
              <div class="pkg-stat-icon" style="background:rgba(212,160,23,0.1);color:#d4a017;"><i class="fas fa-file-export"></i></div>
              <div class="pkg-stat-info">
                <span class="pkg-stat-value" id="pkgExportsUsed">--</span>
                <span class="pkg-stat-label">تقرير مُصدَّر</span>
              </div>
            </div>
            <div class="pkg-stat-card">
              <div class="pkg-stat-icon" style="background:rgba(124,58,237,0.1);color:#7c3aed;"><i class="fas fa-users"></i></div>
              <div class="pkg-stat-info">
                <span class="pkg-stat-value" id="pkgUsersCount">--</span>
                <span class="pkg-stat-label">مستخدم نشط</span>
              </div>
            </div>
          </div>

          <!-- Usage Progress Bars -->
          <div class="card" data-aos="fade-up" data-aos-delay="150">
            <div class="card-header"><h3><i class="fas fa-chart-bar"></i> استخدام الباقة</h3></div>
            <div class="card-body" id="pkgUsageBody">
              <!-- Rendered by JS -->
            </div>
          </div>

          <!-- Available Packages Grid -->
          <div class="card" data-aos="fade-up" data-aos-delay="200">
            <div class="card-header">
              <h3><i class="fas fa-th-large"></i> الباقات المتوفرة</h3>
              <div class="pkg-inline-toggle">
                <span class="pkg-toggle-label-sm">شهري</span>
                <label class="pkg-toggle-switch-sm">
                  <input type="checkbox" id="pkgInlineBillingToggle" onchange="toggleInlineBilling()">
                  <span class="pkg-toggle-slider-sm"></span>
                </label>
                <span class="pkg-toggle-label-sm">سنوي <small style="color:var(--success);">-٢٠٪</small></span>
              </div>
            </div>
            <div class="card-body">
              <div class="packages-grid-inline" id="packagesGridInline"></div>
            </div>
          </div>

          <!-- Payment History -->
          <div class="card" data-aos="fade-up" data-aos-delay="250">
            <div class="card-header"><h3><i class="fas fa-receipt"></i> سجل المدفوعات</h3></div>
            <div class="card-body">
              <table class="data-table" id="pkgPaymentTable">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>الباقة</th>
                    <th>الدورة</th>
                    <th>المبلغ</th>
                    <th>الحالة</th>
                    <th>الفاتورة</th>
                  </tr>
                </thead>
                <tbody id="pkgPaymentBody"></tbody>
              </table>
            </div>
          </div>

          <!-- Payment Methods -->
          <div class="card" data-aos="fade-up" data-aos-delay="300">
            <div class="card-header"><h3><i class="fas fa-credit-card"></i> طرق الدفع</h3></div>
            <div class="card-body">
              <div class="pkg-payment-methods" id="pkgPaymentMethods">
                <div class="pkg-pm-card active">
                  <div class="pkg-pm-icon"><i class="fab fa-cc-visa"></i></div>
                  <div class="pkg-pm-info">
                    <span class="pkg-pm-name">Visa •••• 4532</span>
                    <span class="pkg-pm-expiry">منتهي: ٠٩/٢٧</span>
                  </div>
                  <span class="pkg-pm-default">الافتراضية</span>
                </div>
                <div class="pkg-pm-card">
                  <div class="pkg-pm-icon"><i class="fab fa-cc-mastercard"></i></div>
                  <div class="pkg-pm-info">
                    <span class="pkg-pm-name">Mastercard •••• 8891</span>
                    <span class="pkg-pm-expiry">منتهي: ١٢/٢٦</span>
                  </div>
                </div>
                <button class="pkg-pm-add" onclick="showToast('ستتوفر هذه الميزة قريباً')"><i class="fas fa-plus"></i> إضافة طريقة دفع</button>
              </div>
            </div>
          </div>

          <!-- Subscription Settings -->
          <div class="card" data-aos="fade-up" data-aos-delay="350">
            <div class="card-header"><h3><i class="fas fa-cog"></i> إعدادات الاشتراك</h3></div>
            <div class="card-body">
              <div class="pkg-settings-list">
                <div class="pkg-setting-item">
                  <div class="pkg-setting-info">
                    <h4>التجديد التلقائي</h4>
                    <p>تجديد الاشتراك تلقائياً عند انتهاء الفترة الحالية</p>
                  </div>
                  <label class="switch"><input type="checkbox" checked onchange="togglePkgSetting('autoRenew', this.checked)"><span class="switch-slider"></span></label>
                </div>
                <div class="pkg-setting-item">
                  <div class="pkg-setting-info">
                    <h4>إشعارات انتهاء الاشتراك</h4>
                    <p>تلقي تنبيه قبل ٧ أيام من انتهاء الاشتراك</p>
                  </div>
                  <label class="switch"><input type="checkbox" checked onchange="togglePkgSetting('expiryNotif', this.checked)"><span class="switch-slider"></span></label>
                </div>
                <div class="pkg-setting-item">
                  <div class="pkg-setting-info">
                    <h4>إيصالات عبر البريد الإلكتروني</h4>
                    <p>إرسال إيصال الدفع تلقائياً إلى بريدك الإلكتروني</p>
                  </div>
                  <label class="switch"><input type="checkbox" checked onchange="togglePkgSetting('emailReceipts', this.checked)"><span class="switch-slider"></span></label>
                </div>
                <div class="pkg-setting-item">
                  <div class="pkg-setting-info">
                    <h4>التقارير الشهرية</h4>
                    <p>تلقي تقرير شهري بملخص استخدامك للنظام</p>
                  </div>
                  <label class="switch"><input type="checkbox" onchange="togglePkgSetting('monthlyReport', this.checked)"><span class="switch-slider"></span></label>
                </div>
              </div>
            </div>
          </div>

          <!-- Cancel / Downgrade -->
          <div class="pkg-actions-row" data-aos="fade-up" data-aos-delay="400">
            <button class="btn btn-outline-danger" onclick="cancelSubscription()"><i class="fas fa-times-circle"></i> إلغاء الاشتراك</button>
            <button class="btn btn-warning" onclick="showUpgradePackages()"><i class="fas fa-arrow-up"></i> ترقية الباقة</button>
          </div>
        </section>'''

html = html.replace(old_page_packages, new_page_packages, 1)
print('HTML: page-packages section replaced with full management page')

with open(os.path.join(BASE, 'index.html'), 'w', encoding='utf-8') as f:
    f.write(html)
print('HTML saved!')

# ===================== 3. CSS: Add comprehensive package styles =====================
pkg_css = '''

/* ===================================================================
   COMPLETE PACKAGES SYSTEM — STYLES
   =================================================================== */

/* ========== Billing Toggle ========== */
.pkg-billing-toggle {
  display: flex; align-items: center; justify-content: center;
  gap: 12px; margin-top: 20px;
}
.pkg-toggle-label { color: rgba(255,255,255,0.5); font-size: 0.88rem; font-weight: 600; transition: var(--transition); }
.pkg-toggle-label.active { color: #fff; }
.pkg-toggle-switch {
  position: relative; width: 52px; height: 28px; display: inline-block;
}
.pkg-toggle-switch input { opacity: 0; width: 0; height: 0; }
.pkg-toggle-slider {
  position: absolute; inset: 0; border-radius: 28px; cursor: pointer;
  background: rgba(255,255,255,0.15); border: 2px solid rgba(255,255,255,0.2);
  transition: var(--transition);
}
.pkg-toggle-slider::before {
  content: ''; position: absolute; width: 20px; height: 20px; border-radius: 50%;
  top: 2px; left: 2px; background: #fff;
  transition: var(--transition); box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
.pkg-toggle-switch input:checked + .pkg-toggle-slider {
  background: var(--accent); border-color: var(--accent);
}
.pkg-toggle-switch input:checked + .pkg-toggle-slider::before {
  transform: translateX(24px); background: var(--primary-dark);
}
.pkg-save-badge {
  background: var(--success); color: #fff; padding: 4px 12px; border-radius: 20px;
  font-size: 0.72rem; font-weight: 800; animation: pulseSave 2s ease-in-out infinite;
}
@keyframes pulseSave { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }

/* ========== 5-Column Packages Grid ========== */
.packages-grid-5 {
  display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; margin-bottom: 32px;
}
.packages-grid-5 .package-card { padding: 22px 14px; font-size: 0.88rem; }
.packages-grid-5 .package-card h3 { font-size: 0.95rem; }
.packages-grid-5 .price-amount { font-size: 1.2rem; }
.packages-grid-5 .package-features-list li { font-size: 0.73rem; padding: 5px 0; }
.packages-grid-5 .package-select-btn { padding: 10px; font-size: 0.85rem; }

/* ========== Package Ribbons ========== */
.pkg-ribbon {
  position: absolute; top: -5px; left: -5px; z-index: 10;
  overflow: hidden; width: 85px; height: 85px;
}
.pkg-ribbon span {
  position: absolute; display: block; width: 130px;
  padding: 6px 0; font-size: 0.68rem; font-weight: 900;
  text-align: center; text-transform: uppercase;
  transform: rotate(45deg); top: 18px; right: -32px;
}
[dir="rtl"] .pkg-ribbon { left: auto; right: -5px; }
[dir="rtl"] .pkg-ribbon span { transform: rotate(-45deg); right: auto; left: -32px; }
.trial-ribbon span { background: #059669; color: #fff; }
.ent-ribbon span { background: linear-gradient(135deg, #d4a017, #f0c75e); color: #0f1b4d; }

/* Package Duration Badge */
.pkg-duration { font-size: 0.72rem; color: #059669; font-weight: 700; margin-bottom: 4px; }

/* Package Trial Card */
.pkg-trial { border: 2px dashed rgba(5,150,105,0.3); }
.trial-icon { background: linear-gradient(135deg, #d1fae5, #6ee7b7); color: #065f46; }
.trial-btn {
  background: linear-gradient(135deg, #059669, #10b981);
  color: #fff; border: none; box-shadow: 0 4px 16px rgba(5,150,105,0.3);
}
.trial-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(5,150,105,0.4); }

/* Package Business Card */
.biz-icon { background: linear-gradient(135deg, #ede9fe, #c4b5fd); color: #7c3aed; }
.biz-btn {
  background: linear-gradient(135deg, #7c3aed, #8b5cf6);
  color: #fff; border: none; box-shadow: 0 4px 16px rgba(124,58,237,0.3);
}
.biz-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(124,58,237,0.4); }

/* Enterprise Card Special */
.pkg-enterprise { border: 2px solid rgba(212,160,23,0.3); }

/* Background Orbs */
.pkg-bg-orb {
  position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.15;
  animation: orbDrift 15s ease-in-out infinite;
}
.pkg-bg-orb.orb-1 { width: 400px; height: 400px; background: var(--accent); top: -10%; right: -5%; }
.pkg-bg-orb.orb-2 { width: 300px; height: 300px; background: #2563eb; bottom: 10%; left: -5%; animation-delay: -5s; }
.pkg-bg-orb.orb-3 { width: 200px; height: 200px; background: #7c3aed; top: 50%; left: 50%; animation-delay: -10s; }
@keyframes orbDrift {
  0%,100% { transform: translate(0,0); }
  33% { transform: translate(30px,-20px); }
  66% { transform: translate(-20px,30px); }
}

/* ========== Comparison Table ========== */
.pkg-comparison-section { margin: 40px 0; }
.pkg-section-title {
  color: #fff; font-size: 1.2rem; font-weight: 900; text-align: center;
  margin-bottom: 24px; display: flex; align-items: center; justify-content: center; gap: 10px;
}
.pkg-comparison-table-wrap {
  overflow-x: auto; border-radius: 14px;
  background: rgba(255,255,255,0.95); backdrop-filter: blur(20px);
}
.pkg-comparison-table {
  width: 100%; border-collapse: collapse; font-size: 0.82rem;
}
.pkg-comparison-table th {
  padding: 14px 12px; background: var(--primary);
  color: #fff; font-weight: 800; text-align: center; white-space: nowrap;
  border-bottom: 3px solid var(--accent);
}
.pkg-comparison-table th:first-child { text-align: right; }
.pkg-comparison-table td {
  padding: 12px; text-align: center; border-bottom: 1px solid var(--border-light);
  color: var(--text-primary); font-weight: 500;
}
.pkg-comparison-table td:first-child {
  text-align: right; font-weight: 700; background: rgba(15,27,77,0.02);
}
.pkg-comparison-table tr:hover td { background: rgba(212,160,23,0.04); }
.highlight-col { background: rgba(212,160,23,0.06) !important; }
.pkg-yes { color: #059669; font-size: 1rem; }
.pkg-no { color: #d1d5db; font-size: 1rem; }

/* ========== FAQ Section ========== */
.pkg-faq-section { margin: 40px 0; }
.pkg-faq-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.pkg-faq-item {
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px; overflow: hidden; cursor: pointer;
  transition: var(--transition);
}
.pkg-faq-item:hover { background: rgba(255,255,255,0.1); border-color: rgba(212,160,23,0.2); }
.pkg-faq-item.open { border-color: var(--accent); }
.pkg-faq-q {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px; color: #fff; font-weight: 700; font-size: 0.88rem;
}
.pkg-faq-q i { color: var(--accent); transition: transform 0.3s ease; font-size: 0.8rem; }
.pkg-faq-item.open .pkg-faq-q i { transform: rotate(180deg); }
.pkg-faq-a {
  padding: 0 20px; max-height: 0; overflow: hidden;
  color: rgba(255,255,255,0.6); font-size: 0.82rem; line-height: 1.7;
  transition: max-height 0.3s ease, padding 0.3s ease;
}
.pkg-faq-item.open .pkg-faq-a { max-height: 200px; padding: 0 20px 16px; }

/* ========== Trust Badges ========== */
.pkg-trust-section {
  display: flex; justify-content: center; flex-wrap: wrap; gap: 20px;
  margin: 32px 0; padding: 20px;
  border-top: 1px solid rgba(255,255,255,0.06);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.pkg-trust-item {
  display: flex; align-items: center; gap: 8px;
  color: rgba(255,255,255,0.4); font-size: 0.78rem; font-weight: 600;
}
.pkg-trust-item i { color: var(--accent); font-size: 1rem; }

/* ========== IN-APP PACKAGES PAGE — Stats Row ========== */
.pkg-stats-row {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 16px;
}
.pkg-stat-card {
  background: var(--bg-card); border: 1px solid var(--border-light);
  border-radius: var(--radius); padding: 18px 16px;
  display: flex; align-items: center; gap: 14px;
  transition: var(--transition);
}
.pkg-stat-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
.pkg-stat-icon {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem; flex-shrink: 0;
}
.pkg-stat-info { display: flex; flex-direction: column; }
.pkg-stat-value { font-size: 1.3rem; font-weight: 900; color: var(--text-primary); }
.pkg-stat-label { font-size: 0.72rem; color: var(--text-muted); font-weight: 500; }

/* ========== Usage Bars ========== */
.pkg-usage-item { margin-bottom: 18px; }
.pkg-usage-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
.pkg-usage-label { font-size: 0.82rem; font-weight: 700; color: var(--text-primary); }
.pkg-usage-count { font-size: 0.78rem; color: var(--text-muted); font-weight: 600; }
.pkg-usage-bar {
  height: 8px; background: var(--border-light); border-radius: 8px; overflow: hidden;
}
.pkg-usage-fill {
  height: 100%; border-radius: 8px; transition: width 1s ease;
  background: linear-gradient(90deg, var(--accent-dark), var(--accent));
}
.pkg-usage-fill.warn { background: linear-gradient(90deg, #f59e0b, #ef4444); }
.pkg-usage-fill.good { background: linear-gradient(90deg, #059669, #10b981); }

/* ========== Status Card Enhanced ========== */
.pkg-status-card .current-package-info {
  position: relative; overflow: hidden;
}
.pkg-status-card .current-package-info::before {
  content: ''; position: absolute; top: 0; right: 0; bottom: 0; width: 200px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Ccircle cx='100' cy='100' r='80' fill='none' stroke='rgba(255,255,255,0.05)' stroke-width='2'/%3E%3Ccircle cx='100' cy='100' r='50' fill='none' stroke='rgba(255,255,255,0.03)' stroke-width='2'/%3E%3C/svg%3E") no-repeat center;
  opacity: 0.5; pointer-events: none;
}

/* ========== Inline Billing Toggle (Small) ========== */
.pkg-inline-toggle { display: flex; align-items: center; gap: 8px; }
.pkg-toggle-label-sm { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); }
.pkg-toggle-switch-sm {
  position: relative; width: 36px; height: 20px; display: inline-block;
}
.pkg-toggle-switch-sm input { opacity: 0; width: 0; height: 0; }
.pkg-toggle-slider-sm {
  position: absolute; inset: 0; border-radius: 20px; cursor: pointer;
  background: var(--border); transition: var(--transition);
}
.pkg-toggle-slider-sm::before {
  content: ''; position: absolute; width: 14px; height: 14px; border-radius: 50%;
  top: 3px; left: 3px; background: #fff; transition: var(--transition);
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.pkg-toggle-switch-sm input:checked + .pkg-toggle-slider-sm { background: var(--accent); }
.pkg-toggle-switch-sm input:checked + .pkg-toggle-slider-sm::before { transform: translateX(16px); }

/* ========== Payment Methods ========== */
.pkg-payment-methods { display: flex; flex-direction: column; gap: 10px; }
.pkg-pm-card {
  display: flex; align-items: center; gap: 14px; padding: 14px 18px;
  border: 2px solid var(--border-light); border-radius: var(--radius-sm);
  transition: var(--transition);
}
.pkg-pm-card.active { border-color: var(--accent); background: rgba(212,160,23,0.03); }
.pkg-pm-icon { font-size: 1.8rem; color: var(--text-primary); }
.pkg-pm-info { display: flex; flex-direction: column; flex: 1; }
.pkg-pm-name { font-size: 0.88rem; font-weight: 700; color: var(--text-primary); }
.pkg-pm-expiry { font-size: 0.72rem; color: var(--text-muted); }
.pkg-pm-default {
  font-size: 0.68rem; font-weight: 800; color: var(--accent);
  background: rgba(212,160,23,0.1); padding: 4px 10px; border-radius: 12px;
}
.pkg-pm-add {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 14px; border: 2px dashed var(--border); border-radius: var(--radius-sm);
  background: none; color: var(--text-muted); font-size: 0.85rem; font-weight: 600;
  cursor: pointer; transition: var(--transition);
}
.pkg-pm-add:hover { border-color: var(--accent); color: var(--accent); }

/* ========== Package Settings ========== */
.pkg-settings-list { display: flex; flex-direction: column; gap: 2px; }
.pkg-setting-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 0; border-bottom: 1px solid var(--border-light);
}
.pkg-setting-item:last-child { border-bottom: none; }
.pkg-setting-info h4 { font-size: 0.88rem; font-weight: 800; color: var(--text-primary); margin-bottom: 2px; }
.pkg-setting-info p { font-size: 0.75rem; color: var(--text-muted); }

/* Actions Row */
.pkg-actions-row {
  display: flex; justify-content: center; gap: 14px; padding: 16px 0;
}
.btn-outline-danger {
  background: none; border: 2px solid #ef4444; color: #ef4444;
  padding: 10px 24px; border-radius: var(--radius-sm); font-weight: 700;
  font-size: 0.85rem; cursor: pointer; transition: var(--transition);
}
.btn-outline-danger:hover { background: #ef4444; color: #fff; }

/* ========== Responsive ========== */
@media (max-width: 1200px) {
  .packages-grid-5 { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 900px) {
  .packages-grid-5 { grid-template-columns: 1fr 1fr; }
  .pkg-faq-grid { grid-template-columns: 1fr; }
  .pkg-comparison-table { font-size: 0.72rem; }
  .pkg-stats-row { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .packages-grid-5 { grid-template-columns: 1fr; }
  .pkg-stats-row { grid-template-columns: 1fr; }
  .pkg-trust-section { gap: 12px; }
}

/* Dark Mode Adjustments */
[data-theme="dark"] .pkg-comparison-table-wrap { background: rgba(22,27,45,0.95); }
[data-theme="dark"] .pkg-comparison-table th { background: rgba(15,27,77,0.8); }
[data-theme="dark"] .pkg-comparison-table td { color: var(--text-primary); }
[data-theme="dark"] .pkg-comparison-table td:first-child { background: rgba(255,255,255,0.02); }
[data-theme="dark"] .pkg-faq-item { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.05); }

'''

# Insert before the PRINT section marker
print_marker = '/* ========== PRINT =========='
if print_marker not in css:
    # Try animation section
    print_marker2 = '/* ===================================================================\n   ANIMATED VIDEOS'
    if print_marker2 in css:
        css = css.replace(print_marker2, pkg_css + '\n' + print_marker2, 1)
    else:
        css += pkg_css
else:
    css = css.replace(print_marker, pkg_css + '\n' + print_marker, 1)
print('CSS: Package styles added')

with open(os.path.join(BASE, 'css', 'style.css'), 'w', encoding='utf-8') as f:
    f.write(css)
print('CSS saved!')

# ===================== 4. JS: Replace PACKAGES object + all package functions =====================
old_js_packages = '''var PACKAGES = {
  basic: {
    name: 'الأساسية',
    icon: 'fa-leaf',
    pages: ['dashboard','corporate','calendar','notifications','settings','packages','provinces']
  },
  professional: {
    name: 'المتقدمة',
    icon: 'fa-crown',
    pages: ['dashboard','corporate','land','property','profession','sales','reports','documents','calendar','notifications','penalties','comparison','settings','packages','provinces']
  },
  enterprise: {
    name: 'الشاملة',
    icon: 'fa-building',
    pages: ['dashboard','corporate','land','property','profession','sales','reports','documents','calendar','notifications','penalties','comparison','audit','users','settings','packages','provinces']
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
}'''

new_js_packages = '''var PACKAGES = {
  trial: {
    name: 'التجريبية',
    icon: 'fa-flask',
    color: '#059669',
    priceMonthly: 0,
    priceYearly: 0,
    maxUsers: 1,
    maxCalcs: 5,
    maxExports: 0,
    durationDays: 14,
    pages: ['dashboard','corporate','calendar','notifications','settings','packages','provinces']
  },
  basic: {
    name: 'الأساسية',
    icon: 'fa-leaf',
    color: '#059669',
    priceMonthly: 15000,
    priceYearly: 144000,
    maxUsers: 1,
    maxCalcs: -1,
    maxExports: 5,
    durationDays: 30,
    pages: ['dashboard','corporate','property','calendar','notifications','settings','packages','provinces']
  },
  professional: {
    name: 'المتقدمة',
    icon: 'fa-crown',
    color: '#d97706',
    priceMonthly: 45000,
    priceYearly: 432000,
    maxUsers: 3,
    maxCalcs: -1,
    maxExports: -1,
    durationDays: 30,
    pages: ['dashboard','corporate','land','property','profession','sales','reports','documents','calendar','notifications','penalties','comparison','settings','packages','provinces']
  },
  business: {
    name: 'الأعمال',
    icon: 'fa-briefcase',
    color: '#7c3aed',
    priceMonthly: 85000,
    priceYearly: 816000,
    maxUsers: 10,
    maxCalcs: -1,
    maxExports: -1,
    durationDays: 30,
    pages: ['dashboard','corporate','land','property','profession','sales','reports','documents','calendar','notifications','penalties','comparison','audit','users','settings','packages','provinces']
  },
  enterprise: {
    name: 'الشاملة',
    icon: 'fa-building',
    color: '#2563eb',
    priceMonthly: 150000,
    priceYearly: 1440000,
    maxUsers: -1,
    maxCalcs: -1,
    maxExports: -1,
    durationDays: 30,
    pages: ['dashboard','corporate','land','property','profession','sales','reports','documents','calendar','notifications','penalties','comparison','audit','users','settings','packages','provinces']
  }
};

var PKG_KEYS = ['trial','basic','professional','business','enterprise'];
var PKG_ICON_CLASS = {trial:'trial',basic:'basic',professional:'pro',business:'biz',enterprise:'ent'};

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
  // Record subscription start date
  var subKey = 'pkgSubStart_' + (session ? session.username : 'guest');
  if (!localStorage.getItem(subKey)) {
    localStorage.setItem(subKey, new Date().toISOString());
  }
  // Add payment record
  addPaymentRecord(pkg);
}

function getSubscriptionStart() {
  var session = JSON.parse(localStorage.getItem('taxSession') || sessionStorage.getItem('taxSession') || 'null');
  var subKey = 'pkgSubStart_' + (session ? session.username : 'guest');
  var d = localStorage.getItem(subKey);
  return d ? new Date(d) : new Date();
}

function getDaysRemaining() {
  var pkg = getUserPackage();
  var info = PACKAGES[pkg];
  if (!info) return 0;
  var start = getSubscriptionStart();
  var elapsed = Math.floor((Date.now() - start.getTime()) / 86400000);
  return Math.max(0, info.durationDays - elapsed);
}

function getUsageStats() {
  var session = JSON.parse(localStorage.getItem('taxSession') || sessionStorage.getItem('taxSession') || 'null');
  var key = 'pkgUsage_' + (session ? session.username : 'guest');
  return JSON.parse(localStorage.getItem(key) || '{"calcs":0,"exports":0}');
}

function incrementUsage(type) {
  var session = JSON.parse(localStorage.getItem('taxSession') || sessionStorage.getItem('taxSession') || 'null');
  var key = 'pkgUsage_' + (session ? session.username : 'guest');
  var usage = JSON.parse(localStorage.getItem(key) || '{"calcs":0,"exports":0}');
  if (type === 'calc') usage.calcs++;
  if (type === 'export') usage.exports++;
  localStorage.setItem(key, JSON.stringify(usage));
}

function addPaymentRecord(pkg) {
  var session = JSON.parse(localStorage.getItem('taxSession') || sessionStorage.getItem('taxSession') || 'null');
  var key = 'pkgPayments_' + (session ? session.username : 'guest');
  var records = JSON.parse(localStorage.getItem(key) || '[]');
  var info = PACKAGES[pkg];
  if (!info) return;
  var billingYearly = localStorage.getItem('pkgBillingYearly') === 'true';
  var price = billingYearly ? info.priceYearly : info.priceMonthly;
  records.unshift({
    date: new Date().toISOString(),
    package: pkg,
    packageName: info.name,
    cycle: billingYearly ? 'سنوي' : 'شهري',
    amount: price,
    status: price === 0 ? 'مجاني' : 'مدفوع',
    invoiceId: 'INV-' + Date.now().toString(36).toUpperCase()
  });
  if (records.length > 50) records = records.slice(0, 50);
  localStorage.setItem(key, JSON.stringify(records));
}

function getPaymentRecords() {
  var session = JSON.parse(localStorage.getItem('taxSession') || sessionStorage.getItem('taxSession') || 'null');
  var key = 'pkgPayments_' + (session ? session.username : 'guest');
  return JSON.parse(localStorage.getItem(key) || '[]');
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
  showToast('تم اختيار باقة ' + PACKAGES[pkg].name + ' بنجاح', 'success');
  addAuditEntry('اختيار باقة', PACKAGES[pkg].name);
}

function formatIQD(n) {
  if (n === 0) return 'مجاني';
  return n.toLocaleString('ar-IQ') + ' د.ع';
}

function renderPackagesPage() {
  var currentPkg = getUserPackage();
  var info = PACKAGES[currentPkg] || PACKAGES.basic;
  var billingYearly = localStorage.getItem('pkgBillingYearly') === 'true';
  var price = billingYearly ? info.priceYearly : info.priceMonthly;

  // Current package info banner
  var infoDiv = document.getElementById('currentPackageInfo');
  if (infoDiv) {
    var renewDate = new Date(getSubscriptionStart());
    renewDate.setDate(renewDate.getDate() + info.durationDays);
    var renewStr = renewDate.toLocaleDateString('ar-IQ', {year:'numeric',month:'long',day:'numeric'});
    
    infoDiv.innerHTML =
      '<div style="flex:1;">' +
        '<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">' +
          '<div style="width:48px;height:48px;border-radius:14px;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;font-size:1.3rem;"><i class="fas ' + info.icon + '"></i></div>' +
          '<div><h3 style="margin:0;">باقة ' + info.name + '</h3><p style="margin:0;font-size:0.78rem;opacity:0.6;">اشتراك ' + (billingYearly ? 'سنوي' : 'شهري') + '</p></div>' +
        '</div>' +
        '<div style="display:flex;gap:20px;flex-wrap:wrap;margin-top:10px;">' +
          '<span style="font-size:0.78rem;opacity:0.7;"><i class="fas fa-money-bill-wave" style="margin-left:6px;"></i>' + formatIQD(price) + ' / ' + (billingYearly ? 'سنوياً' : 'شهرياً') + '</span>' +
          '<span style="font-size:0.78rem;opacity:0.7;"><i class="fas fa-calendar" style="margin-left:6px;"></i>تجديد: ' + renewStr + '</span>' +
          '<span style="font-size:0.78rem;opacity:0.7;"><i class="fas fa-users" style="margin-left:6px;"></i>' + (info.maxUsers === -1 ? 'غير محدود' : info.maxUsers) + ' مستخدم</span>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;gap:10px;align-items:center;">' +
        (currentPkg !== 'enterprise' ? '<button class="btn btn-warning" onclick="showUpgradePackages()"><i class="fas fa-arrow-up"></i> ترقية</button>' : '<span style="background:rgba(255,255,255,0.15);padding:8px 16px;border-radius:20px;font-size:0.78rem;font-weight:700;">أعلى باقة ✦</span>') +
      '</div>';
  }

  // Stats
  var usage = getUsageStats();
  var daysLeft = getDaysRemaining();
  var el;
  el = document.getElementById('pkgDaysLeft'); if(el) el.textContent = daysLeft;
  el = document.getElementById('pkgCalcsUsed'); if(el) el.textContent = usage.calcs;
  el = document.getElementById('pkgExportsUsed'); if(el) el.textContent = usage.exports;
  el = document.getElementById('pkgUsersCount'); if(el) el.textContent = info.maxUsers === -1 ? '∞' : '1';

  // Usage bars
  var usageBody = document.getElementById('pkgUsageBody');
  if (usageBody) {
    var bars = [];
    // Days usage
    var daysPct = info.durationDays > 0 ? Math.round(((info.durationDays - daysLeft) / info.durationDays) * 100) : 0;
    bars.push(renderUsageBar('الأيام المستخدمة', (info.durationDays - daysLeft) + ' / ' + info.durationDays + ' يوم', daysPct, daysPct > 80 ? 'warn' : 'good'));
    // Calculations
    if (info.maxCalcs !== -1) {
      var calcPct = Math.min(100, Math.round((usage.calcs / info.maxCalcs) * 100));
      bars.push(renderUsageBar('عمليات الحساب', usage.calcs + ' / ' + info.maxCalcs, calcPct, calcPct > 80 ? 'warn' : ''));
    } else {
      bars.push(renderUsageBar('عمليات الحساب', usage.calcs + ' — غير محدود', 30, 'good'));
    }
    // Exports
    if (info.maxExports !== -1 && info.maxExports > 0) {
      var expPct = Math.min(100, Math.round((usage.exports / info.maxExports) * 100));
      bars.push(renderUsageBar('التصدير', usage.exports + ' / ' + info.maxExports, expPct, expPct > 80 ? 'warn' : ''));
    } else if (info.maxExports === -1) {
      bars.push(renderUsageBar('التصدير', usage.exports + ' — غير محدود', 25, 'good'));
    } else {
      bars.push(renderUsageBar('التصدير', 'غير متاح في هذه الباقة', 0, ''));
    }
    // Users
    if (info.maxUsers !== -1) {
      bars.push(renderUsageBar('المستخدمون', '1 / ' + info.maxUsers, Math.round(100 / info.maxUsers), 'good'));
    } else {
      bars.push(renderUsageBar('المستخدمون', '1 — غير محدود', 10, 'good'));
    }
    usageBody.innerHTML = bars.join('');
  }

  // Packages grid (inline)
  var grid = document.getElementById('packagesGridInline');
  if (grid) {
    grid.innerHTML = '';
    PKG_KEYS.forEach(function(pk) {
      var p = PACKAGES[pk];
      var isCurrent = pk === currentPkg;
      var pkgPrice = billingYearly ? p.priceYearly : p.priceMonthly;
      var iconCls = PKG_ICON_CLASS[pk] || 'basic';
      var isUpgrade = PKG_KEYS.indexOf(pk) > PKG_KEYS.indexOf(currentPkg);
      var isDowngrade = PKG_KEYS.indexOf(pk) < PKG_KEYS.indexOf(currentPkg);

      grid.innerHTML += '<div class="package-card-inline' + (isCurrent ? ' pkg-current' : '') + (isUpgrade ? ' pkg-upgrade' : '') + '">' +
        '<div class="pkg-inline-header">' +
          '<div class="package-icon ' + iconCls + '-icon"><i class="fas ' + p.icon + '"></i></div>' +
          '<h4>' + p.name + '</h4>' +
          '<div class="pkg-inline-price">' + formatIQD(pkgPrice) + '</div>' +
          (billingYearly && pkgPrice > 0 ? '<div class="pkg-inline-monthly">' + formatIQD(Math.round(pkgPrice/12)) + '/شهر</div>' : '') +
        '</div>' +
        '<div class="pkg-inline-features">' +
          '<span><i class="fas fa-layer-group"></i> ' + p.pages.length + ' صفحة</span>' +
          '<span><i class="fas fa-users"></i> ' + (p.maxUsers === -1 ? '∞' : p.maxUsers) + ' مستخدم</span>' +
          '<span><i class="fas fa-calculator"></i> ' + (p.maxCalcs === -1 ? '∞' : p.maxCalcs) + ' عملية</span>' +
        '</div>' +
        '<div class="pkg-inline-action">' +
          (isCurrent ? '<span class="pkg-current-badge"><i class="fas fa-check-circle"></i> باقتك الحالية</span>' :
           isUpgrade ? '<button class="btn btn-sm btn-warning" onclick="selectPackage(\'' + pk + '\')"><i class="fas fa-arrow-up"></i> ترقية</button>' :
           '<button class="btn btn-sm btn-outline" onclick="selectPackage(\'' + pk + '\')"><i class="fas fa-arrow-down"></i> تبديل</button>') +
        '</div>' +
      '</div>';
    });
  }

  // Payment history table
  renderPaymentHistory();
}

function renderUsageBar(label, count, pct, cls) {
  return '<div class="pkg-usage-item">' +
    '<div class="pkg-usage-header"><span class="pkg-usage-label">' + label + '</span><span class="pkg-usage-count">' + count + '</span></div>' +
    '<div class="pkg-usage-bar"><div class="pkg-usage-fill ' + cls + '" style="width:' + pct + '%;"></div></div>' +
  '</div>';
}

function renderPaymentHistory() {
  var body = document.getElementById('pkgPaymentBody');
  if (!body) return;
  var records = getPaymentRecords();
  if (records.length === 0) {
    body.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:24px;">لا توجد مدفوعات بعد</td></tr>';
    return;
  }
  body.innerHTML = records.slice(0, 10).map(function(r) {
    var d = new Date(r.date);
    var dateStr = d.toLocaleDateString('ar-IQ', {year:'numeric',month:'short',day:'numeric'});
    var statusCls = r.status === 'مدفوع' ? 'approved' : 'complete';
    return '<tr>' +
      '<td>' + dateStr + '</td>' +
      '<td><i class="fas ' + (PACKAGES[r.package] ? PACKAGES[r.package].icon : 'fa-gem') + '" style="margin-left:6px;color:' + (PACKAGES[r.package] ? PACKAGES[r.package].color : '#d4a017') + ';"></i>' + r.packageName + '</td>' +
      '<td>' + r.cycle + '</td>' +
      '<td style="font-weight:700;">' + formatIQD(r.amount) + '</td>' +
      '<td><span class="status-badge ' + statusCls + '">' + r.status + '</span></td>' +
      '<td><button class="btn btn-sm" onclick="downloadInvoice(\'' + r.invoiceId + '\')"><i class="fas fa-download"></i></button></td>' +
    '</tr>';
  }).join('');
}

function downloadInvoice(id) {
  showToast('جاري تحميل الفاتورة ' + id, 'info');
}

function toggleBillingCycle() {
  var toggle = document.getElementById('pkgBillingToggle');
  var yearly = toggle && toggle.checked;
  localStorage.setItem('pkgBillingYearly', yearly ? 'true' : 'false');
  // Update labels
  var ml = document.getElementById('pkgMonthlyLabel');
  var yl = document.getElementById('pkgYearlyLabel');
  if (ml) ml.classList.toggle('active', !yearly);
  if (yl) yl.classList.toggle('active', yearly);
  // Update prices in cards
  document.querySelectorAll('.packages-grid-5 .price-amount[data-monthly]').forEach(function(el) {
    el.textContent = yearly ? el.getAttribute('data-yearly') : el.getAttribute('data-monthly');
  });
  document.querySelectorAll('.packages-grid-5 .price-period[data-monthly]').forEach(function(el) {
    el.textContent = yearly ? el.getAttribute('data-yearly') : el.getAttribute('data-monthly');
  });
}

function toggleInlineBilling() {
  var toggle = document.getElementById('pkgInlineBillingToggle');
  var yearly = toggle && toggle.checked;
  localStorage.setItem('pkgBillingYearly', yearly ? 'true' : 'false');
  renderPackagesPage();
}

function toggleFaq(el) {
  el.classList.toggle('open');
}

function togglePkgSetting(name, val) {
  var session = JSON.parse(localStorage.getItem('taxSession') || sessionStorage.getItem('taxSession') || 'null');
  var key = 'pkgSettings_' + (session ? session.username : 'guest');
  var settings = JSON.parse(localStorage.getItem(key) || '{}');
  settings[name] = val;
  localStorage.setItem(key, JSON.stringify(settings));
  showToast('تم تحديث الإعداد بنجاح');
}

function cancelSubscription() {
  if (confirm('هل أنت متأكد من إلغاء الاشتراك؟ سيتم تحويلك إلى الباقة التجريبية.')) {
    selectPackage('trial');
    showToast('تم إلغاء الاشتراك. يمكنك إعادة الاشتراك في أي وقت.', 'warning');
    addAuditEntry('إلغاء اشتراك', 'تم التحويل إلى الباقة التجريبية');
  }
}

function showUpgradePackages() {
  document.getElementById('appContainer').style.display = 'none';
  document.getElementById('packagesScreen').style.display = 'flex';
}'''

js = js.replace(old_js_packages, new_js_packages, 1)
print('JS: Package system completely replaced with 5 packages + full management')

with open(os.path.join(BASE, 'js', 'app.js'), 'w', encoding='utf-8') as f:
    f.write(js)
print('JS saved!')

print('\n=== PACKAGES UPDATE COMPLETE ===')
print(f'HTML: {len(html):,} chars')
print(f'CSS:  {len(css):,} chars')
print(f'JS:   {len(js):,} chars')
