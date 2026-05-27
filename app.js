// app.js (root)
import pg from 'pg';
import connectPgSimple from 'connect-pg-simple';
import 'dotenv/config';
import express from 'express';
import { engine } from 'express-handlebars';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';

import { notFoundHandler, errorHandler } from './middlewares/error-handler.js';
import categoryModel from './models/category.model.js';
import homeRouter from './routes/home.route.js';
import healthRouter from './routes/health.route.js';
import categoryRouter from './routes/category.route.js';
import accountRouter from './routes/account.route.js';
import courseRouter from './routes/course.route.js';
import aboutRouter from "./routes/about.route.js";

// Admin 
import adminRouter from './routes/admin.route.js';
import { requireAuth, checkAdmin, requireStudent, requireInstructor, blockAdmin } from './middlewares/auth.js';


// OAuth
import { mountGoogleAuth } from './middlewares/google.oauth.js';

// Student features
import studentRouter from './routes/student.route.js';
import checkoutRouter from './routes/checkout.route.js';
import progressRouter from './routes/progress.route.js';

// Teacher features
import teacherRouter from './routes/teacher.route.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Init app
const app = express();
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

// view engine + helpers
app.engine('handlebars', engine({
  helpers: {
    // ===== Generic / số & chuỗi =====
    formatNumber(v) { return new Intl.NumberFormat('en-US').format(v ?? 0); },
    formatCurrency(amount) {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
        .format(amount || 0);
    },
    substring(str, start, end) { return (str || '').substring(start, end); },
    fillContent(value, def) { return value != null && value !== '' ? value : (def || ''); },
    ifEquals(arg1, arg2, options) {
      return arg1 == arg2 ? options.fn(this) : options.inverse(this);
    },
    // ===== So sánh / logic =====
    eq(a, b) { return a === b; },
    neq(a, b) { return a !== b; },
    gt(a, b) { return Number(a) > Number(b); },
    lt(a, b) { return Number(a) < Number(b); },
    gte(a, b) { return Number(a) >= Number(b); },
    lte(a, b) { return Number(a) <= Number(b); },
    and(a, b) { return a && b; },
    or(a, b) { return a || b; },
    notEmpty(v) { return v != null && String(v).trim() !== ''; },

    // ===== Toán học / mảng =====
    add: (a, b) => (a || 0) + (b || 0),
    sub: (a, b) => (a || 0) - (b || 0),
    length: (arr) => Array.isArray(arr) ? arr.length : 0,
    range(start, end) {
      const s = Number(start) || 0, e = Number(end) || 0, out = [];
      for (let i = s; i <= e; i++) out.push(i);
      return out;
    },
    eachWithIndex(context, options) {
      let out = '';
      for (let i = 0; i < (context?.length || 0); i++) {
        out += options.fn(context[i], { data: { index: i } });
      }
      return out;
    },
    contains(array, value) { return Array.isArray(array) ? array.includes(value) : false; },

    // ===== Giá / khuyến mãi =====
    price(p, promo) { return promo && promo > 0 ? promo : p; },
    ifPromo(p, promo, opts) { return promo && promo > 0 ? opts.fn(this) : opts.inverse(this); },

    // ===== Thời gian =====
    formatDate(date) {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleString('en-GB', {
        year: 'numeric', month: 'short', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false,
        timeZone: 'Asia/Ho_Chi_Minh'
      });
    },

    // ===== UI helpers =====
    stars(rating) {
      const r = Math.round(Number(rating) || 0);
      return [...Array(5)].map((_, i) => (i < r ? '★' : '☆')).join('');
    },
    getStatusBadge(status) {
      const m = { draft: 'secondary', published: 'success', completed: 'primary' };
      return m[status] || 'secondary';
    },
    getStatusText(status) {
      const m = { draft: 'Draft', published: 'Published', completed: 'Completed' };
      return m[status] || status;
    },
    getRoleBadge(role) {
      const map = { admin: 'danger', instructor: 'success', student: 'primary' };
      return map[role] || 'secondary';
    },
    getRoleText(role) {
      const map = { admin: 'Administrator', instructor: 'Instructor', student: 'Student' };
      return map[role] || role;
    },

    // ===== Học liệu =====
    calculateChapterDuration(lectures) {
      if (!Array.isArray(lectures)) return 0;
      return lectures.reduce((t, l) => t + (l.duration_minutes || 0), 0);
    },
    json(value) {
      try { return JSON.stringify(value || null); }
      catch { return 'null'; }
    },

  },
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials')
}));


app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// middleware
app.use(express.json()); // cần cho /api/progress/*
app.use(express.urlencoded({ extended: true }));

// Health and readiness endpoints should not depend on session or page-level data
app.use('/', healthRouter);

// static
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use(express.static('public'));

// session
const PgSession = connectPgSimple(session);
const { Pool } = pg;

const shouldUsePostgresSession =
  process.env.SESSION_STORE === 'postgres' ||
  process.env.NODE_ENV === 'production';

const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'local-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.COOKIE_SECURE === 'true',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
};

if (shouldUsePostgresSession) {
  sessionConfig.store = new PgSession({
    pool: new Pool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'postgres',
      ssl: process.env.DB_SSL === 'true'
        ? { rejectUnauthorized: false }
        : false
    }),
    tableName: 'session',
    createTableIfMissing: true
  });
}

app.use(session(sessionConfig));
// inject user + categories
app.use(async (req, res, next) => {
  res.locals.user = req.session.user || null;
  try {
    res.locals.global_categories = await categoryModel.findAll();
    res.locals.global_categories_tree = await categoryModel.findTree();
  } catch {
    res.locals.global_categories = [];
    res.locals.global_categories_tree = [];
  }
  next();
});

// optional flash (nếu có dùng)
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

app.use((req, res, next) => {
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

// routes
//app.use('/teacher', teacherRouter);
app.use('/teacher', requireInstructor, teacherRouter);
app.use('/', homeRouter);
app.use('/account', accountRouter);
app.use('/categories', categoryRouter);
app.use('/courses', courseRouter);

// admin 
app.use('/admin', requireAuth, checkAdmin, adminRouter);

// student features
//app.use('/student', requireAuth, studentRouter);
app.use('/student', requireStudent, studentRouter);
//app.use('/checkout', requireAuth, checkoutRouter);
app.use('/checkout', requireStudent, checkoutRouter);
//app.use('/api/progress', progressRouter);
app.use('/api/progress', requireStudent, progressRouter);

// About us
app.use("/", aboutRouter);

// OAuth mounts (sau session)
mountGoogleAuth(app);

// Error handling middleware, must be registered after all routes
app.use(notFoundHandler);
app.use(errorHandler);

// start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server http://localhost:${PORT}`));

export default app;
