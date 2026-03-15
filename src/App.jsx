import { useState, useMemo, useCallback } from "react";
import { mockRecipes, currentUser, moodOptions } from "./data/mockData";
import { usePortionCalc, formatAmount } from "./hooks/usePortions";
import { useIngredientMatch } from "./hooks/useIngredientMatch";

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 20, stroke = "currentColor", fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const SearchIcon = () => <Icon d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />;
const HeartIcon = ({ filled }) => <Icon d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill={filled ? "currentColor" : "none"} />;
const StarIcon = ({ filled }) => <Icon d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={filled ? "currentColor" : "none"} size={16} />;
const ClockIcon = () => <Icon d="M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10zm0-18v8l5 3" size={15} />;
const PlusIcon = () => <Icon d="M12 5v14M5 12h14" />;
const ChevronLeft = () => <Icon d="M15 18l-6-6 6-6" />;
const TrashIcon = () => <Icon d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" size={16} />;
const EditIcon = () => <Icon d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" size={16} />;
const CheckIcon = () => <Icon d="M20 6L9 17l-5-5" size={16} />;
const XIcon = () => <Icon d="M18 6L6 18M6 6l12 12" size={14} />;
const UsersIcon = () => <Icon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" size={16} />;
const CameraIcon = () => <Icon d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />;

// ─── THEME / COLORS ──────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --cream: #FDF8F2;
    --warm-white: #FFFBF7;
    --ink: #1A1410;
    --ink-60: #7A6E67;
    --ink-30: #C5BDB8;
    --ink-10: #EDE8E3;
    --terracotta: #C4623A;
    --terracotta-light: #F2DDD3;
    --sage: #6B8F71;
    --sage-light: #D4E6D6;
    --gold: #C49A3C;
    --gold-light: #F5EDD5;
    --font-display: 'Playfair Display', Georgia, serif;
    --font-body: 'DM Sans', system-ui, sans-serif;
    --radius: 16px;
    --radius-sm: 8px;
    --shadow: 0 2px 16px rgba(26,20,16,0.08);
    --shadow-lg: 0 8px 40px rgba(26,20,16,0.12);
  }

  body { font-family: var(--font-body); background: var(--cream); color: var(--ink); line-height: 1.6; }

  .app { min-height: 100vh; display: flex; flex-direction: column; }

  /* NAV */
  .nav {
    background: var(--warm-white);
    border-bottom: 1px solid var(--ink-10);
    padding: 0 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .nav-logo {
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 700;
    color: var(--terracotta);
    cursor: pointer;
    letter-spacing: -0.5px;
  }
  .nav-logo span { color: var(--ink); }
  .nav-links { display: flex; align-items: center; gap: 4px; }
  .nav-btn {
    background: none; border: none; cursor: pointer;
    padding: 8px 14px; border-radius: var(--radius-sm);
    font-family: var(--font-body); font-size: 14px; font-weight: 500;
    color: var(--ink-60);
    transition: all 0.15s;
    display: flex; align-items: center; gap: 6px;
  }
  .nav-btn:hover { background: var(--ink-10); color: var(--ink); }
  .nav-btn.active { background: var(--terracotta-light); color: var(--terracotta); }
  .nav-btn-primary {
    background: var(--terracotta); color: #fff; border: none; cursor: pointer;
    padding: 8px 16px; border-radius: var(--radius-sm);
    font-family: var(--font-body); font-size: 14px; font-weight: 500;
    display: flex; align-items: center; gap: 6px;
    transition: opacity 0.15s;
  }
  .nav-btn-primary:hover { opacity: 0.88; }

  /* MAIN */
  .main { flex: 1; padding: 32px 24px; max-width: 1100px; margin: 0 auto; width: 100%; }

  /* HERO */
  .hero {
    background: linear-gradient(135deg, var(--terracotta) 0%, #8B3A1E 100%);
    border-radius: 24px;
    padding: 48px;
    color: #fff;
    margin-bottom: 40px;
    position: relative;
    overflow: hidden;
  }
  .hero::after {
    content: '';
    position: absolute; inset: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    pointer-events: none;
  }
  .hero-tag { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; opacity: 0.7; margin-bottom: 12px; }
  .hero h1 { font-family: var(--font-display); font-size: 42px; font-weight: 700; line-height: 1.15; margin-bottom: 16px; }
  .hero p { font-size: 16px; opacity: 0.85; max-width: 440px; margin-bottom: 28px; }
  .hero-btns { display: flex; gap: 12px; flex-wrap: wrap; }
  .btn-white {
    background: #fff; color: var(--terracotta); border: none; cursor: pointer;
    padding: 12px 24px; border-radius: var(--radius-sm);
    font-family: var(--font-body); font-size: 15px; font-weight: 600;
    transition: transform 0.15s;
  }
  .btn-white:hover { transform: translateY(-1px); }
  .btn-outline-white {
    background: transparent; color: #fff; border: 2px solid rgba(255,255,255,0.5); cursor: pointer;
    padding: 12px 24px; border-radius: var(--radius-sm);
    font-family: var(--font-body); font-size: 15px; font-weight: 500;
    transition: border-color 0.15s;
  }
  .btn-outline-white:hover { border-color: #fff; }

  /* SEARCH BAR */
  .search-bar {
    display: flex; gap: 12px; margin-bottom: 32px; align-items: center;
  }
  .search-input-wrap {
    flex: 1; position: relative;
  }
  .search-input-wrap svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--ink-60); pointer-events: none; }
  .search-input {
    width: 100%; padding: 12px 16px 12px 44px;
    border: 1.5px solid var(--ink-10); border-radius: var(--radius-sm);
    font-family: var(--font-body); font-size: 15px; background: var(--warm-white);
    color: var(--ink); outline: none; transition: border-color 0.15s;
  }
  .search-input:focus { border-color: var(--terracotta); }
  .filter-select {
    padding: 12px 16px; border: 1.5px solid var(--ink-10); border-radius: var(--radius-sm);
    font-family: var(--font-body); font-size: 14px; background: var(--warm-white);
    color: var(--ink); outline: none; cursor: pointer; transition: border-color 0.15s;
  }
  .filter-select:focus { border-color: var(--terracotta); }

  /* SECTION HEADER */
  .section-header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 20px; }
  .section-title { font-family: var(--font-display); font-size: 26px; font-weight: 600; }
  .section-link { font-size: 14px; color: var(--terracotta); cursor: pointer; font-weight: 500; }
  .section-link:hover { text-decoration: underline; }

  /* RECIPE GRID */
  .recipe-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }

  /* RECIPE CARD */
  .recipe-card {
    background: var(--warm-white); border-radius: var(--radius);
    overflow: hidden; cursor: pointer;
    box-shadow: var(--shadow);
    transition: transform 0.2s, box-shadow 0.2s;
    position: relative;
  }
  .recipe-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
  .card-img { height: 200px; overflow: hidden; position: relative; }
  .card-img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; }
  .recipe-card:hover .card-img img { transform: scale(1.05); }
  .card-fav {
    position: absolute; top: 12px; right: 12px;
    background: rgba(255,255,255,0.9); border: none; border-radius: 50%;
    width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: transform 0.15s; color: var(--terracotta);
    backdrop-filter: blur(4px);
  }
  .card-fav:hover { transform: scale(1.15); }
  .card-category {
    position: absolute; top: 12px; left: 12px;
    background: rgba(255,255,255,0.9); backdrop-filter: blur(4px);
    padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; color: var(--ink);
  }
  .card-body { padding: 16px 20px 20px; }
  .card-title { font-family: var(--font-display); font-size: 18px; font-weight: 600; margin-bottom: 6px; line-height: 1.3; }
  .card-desc { font-size: 13px; color: var(--ink-60); line-height: 1.5; margin-bottom: 14px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .card-meta { display: flex; align-items: center; justify-content: space-between; }
  .card-rating { display: flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 600; color: var(--gold); }
  .card-time { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--ink-60); }
  .card-author { display: flex; align-items: center; gap: 8px; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--ink-10); }
  .avatar-xs { width: 24px; height: 24px; border-radius: 50%; background: var(--terracotta-light); color: var(--terracotta); font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .card-author-name { font-size: 12px; color: var(--ink-60); }

  /* MOOD GRID */
  .mood-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 12px; margin-bottom: 40px; }
  .mood-chip {
    background: var(--warm-white); border: 2px solid var(--ink-10);
    border-radius: var(--radius); padding: 16px 12px;
    cursor: pointer; text-align: center; transition: all 0.15s;
  }
  .mood-chip:hover, .mood-chip.active { border-color: var(--terracotta); background: var(--terracotta-light); }
  .mood-emoji { font-size: 28px; display: block; margin-bottom: 6px; }
  .mood-label { font-size: 12px; font-weight: 600; color: var(--ink); }

  /* ─── RECIPE PAGE ─── */
  .recipe-page { max-width: 840px; margin: 0 auto; }
  .back-btn {
    display: flex; align-items: center; gap: 6px;
    background: none; border: none; cursor: pointer;
    font-family: var(--font-body); font-size: 14px; color: var(--ink-60);
    padding: 0; margin-bottom: 24px;
    transition: color 0.15s;
  }
  .back-btn:hover { color: var(--terracotta); }
  .recipe-header { margin-bottom: 32px; }
  .recipe-cover { width: 100%; height: 380px; object-fit: cover; border-radius: var(--radius); margin-bottom: 28px; }
  .recipe-title { font-family: var(--font-display); font-size: 38px; font-weight: 700; margin-bottom: 12px; line-height: 1.2; }
  .recipe-meta-row { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; margin-bottom: 16px; }
  .meta-badge {
    display: flex; align-items: center; gap: 6px;
    background: var(--ink-10); padding: 6px 12px; border-radius: 20px;
    font-size: 13px; font-weight: 500; color: var(--ink-60);
  }
  .meta-badge.rating { background: var(--gold-light); color: var(--gold); }
  .recipe-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
  .tag-chip { background: var(--terracotta-light); color: var(--terracotta); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
  .recipe-desc { font-size: 16px; color: var(--ink-60); line-height: 1.7; margin-bottom: 32px; padding: 20px 24px; background: var(--warm-white); border-radius: var(--radius-sm); border-left: 4px solid var(--terracotta); }

  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: start; }
  @media (max-width: 680px) { .two-col { grid-template-columns: 1fr; } }

  .section-h2 { font-family: var(--font-display); font-size: 22px; font-weight: 600; margin-bottom: 16px; }
  .ingredient-list { list-style: none; }
  .ingredient-item {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 0; border-bottom: 1px solid var(--ink-10);
    font-size: 15px;
  }
  .ingredient-item:last-child { border-bottom: none; }
  .ingredient-name { color: var(--ink); }
  .ingredient-amount { font-weight: 600; color: var(--terracotta); white-space: nowrap; }
  .ingredient-amount.changed { background: var(--terracotta-light); padding: 2px 8px; border-radius: 4px; }

  .steps-list { list-style: none; }
  .step-item { display: flex; gap: 16px; margin-bottom: 20px; }
  .step-num { width: 32px; height: 32px; border-radius: 50%; background: var(--terracotta); color: #fff; font-size: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
  .step-text { font-size: 15px; line-height: 1.65; color: var(--ink); padding-top: 4px; }

  /* CALCULATOR */
  .calc-box {
    background: var(--warm-white); border-radius: var(--radius);
    padding: 24px; box-shadow: var(--shadow); border: 1.5px solid var(--ink-10);
    margin-bottom: 32px;
  }
  .calc-title { font-family: var(--font-display); font-size: 20px; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
  .calc-tabs { display: flex; gap: 8px; margin-bottom: 20px; }
  .calc-tab {
    flex: 1; padding: 8px; border-radius: var(--radius-sm);
    border: 1.5px solid var(--ink-10); background: none; cursor: pointer;
    font-family: var(--font-body); font-size: 13px; font-weight: 500; color: var(--ink-60);
    transition: all 0.15s;
  }
  .calc-tab.active { border-color: var(--terracotta); background: var(--terracotta-light); color: var(--terracotta); }
  .servings-row { display: flex; align-items: center; gap: 12px; }
  .servings-btn { width: 36px; height: 36px; border-radius: var(--radius-sm); border: 1.5px solid var(--ink-10); background: none; cursor: pointer; font-size: 20px; color: var(--ink); transition: all 0.15s; display: flex; align-items: center; justify-content: center; }
  .servings-btn:hover { border-color: var(--terracotta); color: var(--terracotta); }
  .servings-value { font-family: var(--font-display); font-size: 28px; font-weight: 700; color: var(--terracotta); min-width: 40px; text-align: center; }
  .servings-label { font-size: 14px; color: var(--ink-60); }
  .calc-select { width: 100%; padding: 10px 14px; border: 1.5px solid var(--ink-10); border-radius: var(--radius-sm); font-family: var(--font-body); font-size: 14px; color: var(--ink); background: var(--cream); outline: none; margin-bottom: 12px; }
  .calc-input-row { display: flex; gap: 8px; }
  .calc-input { flex: 1; padding: 10px 14px; border: 1.5px solid var(--ink-10); border-radius: var(--radius-sm); font-family: var(--font-body); font-size: 15px; color: var(--ink); outline: none; transition: border-color 0.15s; background: var(--cream); }
  .calc-input:focus { border-color: var(--terracotta); }
  .calc-unit { padding: 10px 14px; background: var(--ink-10); border-radius: var(--radius-sm); font-size: 14px; color: var(--ink-60); align-self: center; }
  .ratio-badge { display: inline-flex; align-items: center; gap: 4px; background: var(--sage-light); color: var(--sage); padding: 4px 10px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-top: 12px; }

  /* COMMENTS */
  .comments-section { margin-top: 40px; }
  .comment-list { list-style: none; margin-bottom: 20px; }
  .comment-item { padding: 14px 0; border-bottom: 1px solid var(--ink-10); }
  .comment-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
  .avatar-sm { width: 32px; height: 32px; border-radius: 50%; background: var(--terracotta-light); color: var(--terracotta); font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .comment-author { font-size: 14px; font-weight: 600; }
  .comment-date { font-size: 12px; color: var(--ink-60); margin-left: auto; }
  .comment-text { font-size: 14px; color: var(--ink-60); line-height: 1.6; }
  .comment-form { display: flex; gap: 10px; }
  .comment-input { flex: 1; padding: 10px 14px; border: 1.5px solid var(--ink-10); border-radius: var(--radius-sm); font-family: var(--font-body); font-size: 14px; color: var(--ink); outline: none; background: var(--warm-white); transition: border-color 0.15s; }
  .comment-input:focus { border-color: var(--terracotta); }
  .btn-primary { background: var(--terracotta); color: #fff; border: none; cursor: pointer; padding: 10px 20px; border-radius: var(--radius-sm); font-family: var(--font-body); font-size: 14px; font-weight: 600; transition: opacity 0.15s; }
  .btn-primary:hover { opacity: 0.85; }

  /* INGREDIENT MATCH PAGE */
  .match-page h1 { font-family: var(--font-display); font-size: 34px; font-weight: 700; margin-bottom: 8px; }
  .match-subtitle { font-size: 16px; color: var(--ink-60); margin-bottom: 28px; }
  .ingredient-input-row { display: flex; gap: 10px; margin-bottom: 16px; }
  .ingredient-input { flex: 1; padding: 12px 16px; border: 1.5px solid var(--ink-10); border-radius: var(--radius-sm); font-family: var(--font-body); font-size: 15px; color: var(--ink); outline: none; background: var(--warm-white); transition: border-color 0.15s; }
  .ingredient-input:focus { border-color: var(--terracotta); }
  .tags-wrap { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 28px; min-height: 32px; }
  .ing-tag { display: flex; align-items: center; gap: 6px; background: var(--terracotta-light); color: var(--terracotta); padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; }
  .ing-tag-remove { background: none; border: none; cursor: pointer; color: var(--terracotta); display: flex; align-items: center; padding: 0; }
  .mode-tabs { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
  .mode-tab { padding: 8px 16px; border-radius: 20px; border: 2px solid var(--ink-10); background: none; cursor: pointer; font-family: var(--font-body); font-size: 13px; font-weight: 600; color: var(--ink-60); transition: all 0.15s; }
  .mode-tab.full { }
  .mode-tab.full.active { border-color: var(--sage); background: var(--sage-light); color: var(--sage); }
  .mode-tab.almost.active { border-color: var(--gold); background: var(--gold-light); color: var(--gold); }
  .mode-tab.improvise.active { border-color: var(--terracotta); background: var(--terracotta-light); color: var(--terracotta); }
  .match-card {
    background: var(--warm-white); border-radius: var(--radius); overflow: hidden;
    display: flex; gap: 0; box-shadow: var(--shadow); margin-bottom: 16px; cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s; border: 1.5px solid var(--ink-10);
  }
  .match-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
  .match-card-img { width: 140px; flex-shrink: 0; }
  .match-card-img img { width: 100%; height: 100%; object-fit: cover; }
  .match-card-body { padding: 16px 20px; flex: 1; }
  .match-badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; margin-bottom: 8px; }
  .match-badge.full { background: var(--sage-light); color: var(--sage); }
  .match-badge.almost { background: var(--gold-light); color: var(--gold); }
  .match-badge.improvise { background: var(--terracotta-light); color: var(--terracotta); }
  .match-card-title { font-family: var(--font-display); font-size: 17px; font-weight: 600; margin-bottom: 6px; }
  .match-progress { height: 6px; border-radius: 3px; background: var(--ink-10); margin-bottom: 8px; overflow: hidden; }
  .match-progress-fill { height: 100%; border-radius: 3px; background: var(--sage); transition: width 0.3s; }
  .match-missing { font-size: 12px; color: var(--ink-60); }
  .match-missing span { color: var(--terracotta); font-weight: 600; }
  .empty-state { text-align: center; padding: 60px 20px; color: var(--ink-60); }
  .empty-state-emoji { font-size: 56px; display: block; margin-bottom: 16px; }
  .empty-state p { font-size: 16px; }

  /* ADD RECIPE FORM */
  .form-page h1 { font-family: var(--font-display); font-size: 32px; font-weight: 700; margin-bottom: 8px; }
  .form-subtitle { font-size: 15px; color: var(--ink-60); margin-bottom: 32px; }
  .form-section { background: var(--warm-white); border-radius: var(--radius); padding: 28px; margin-bottom: 20px; box-shadow: var(--shadow); }
  .form-section-title { font-family: var(--font-display); font-size: 18px; font-weight: 600; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid var(--ink-10); }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  @media (max-width: 580px) { .form-row { grid-template-columns: 1fr; } }
  .form-group { margin-bottom: 16px; }
  .form-label { display: block; font-size: 13px; font-weight: 600; color: var(--ink-60); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
  .form-input, .form-textarea, .form-select-f {
    width: 100%; padding: 11px 14px; border: 1.5px solid var(--ink-10);
    border-radius: var(--radius-sm); font-family: var(--font-body); font-size: 15px;
    color: var(--ink); background: var(--cream); outline: none;
    transition: border-color 0.15s;
  }
  .form-input:focus, .form-textarea:focus, .form-select-f:focus { border-color: var(--terracotta); }
  .form-textarea { resize: vertical; min-height: 90px; }
  .ingredient-form-row { display: grid; grid-template-columns: 3fr 1.5fr 1.5fr auto; gap: 10px; margin-bottom: 10px; align-items: center; }
  .remove-btn { background: none; border: none; cursor: pointer; color: var(--ink-30); transition: color 0.15s; display: flex; align-items: center; padding: 4px; }
  .remove-btn:hover { color: var(--terracotta); }
  .add-row-btn { display: flex; align-items: center; gap: 6px; background: none; border: 2px dashed var(--ink-30); border-radius: var(--radius-sm); padding: 10px 16px; width: 100%; cursor: pointer; font-family: var(--font-body); font-size: 14px; color: var(--ink-60); transition: all 0.15s; margin-top: 4px; }
  .add-row-btn:hover { border-color: var(--terracotta); color: var(--terracotta); }
  .step-form-row { display: flex; gap: 12px; margin-bottom: 12px; }
  .step-form-num { width: 32px; height: 32px; background: var(--terracotta-light); color: var(--terracotta); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; flex-shrink: 0; margin-top: 8px; }
  .form-submit-row { display: flex; justify-content: flex-end; gap: 12px; }
  .btn-secondary { background: none; border: 2px solid var(--ink-10); color: var(--ink-60); cursor: pointer; padding: 12px 24px; border-radius: var(--radius-sm); font-family: var(--font-body); font-size: 15px; font-weight: 500; transition: all 0.15s; }
  .btn-secondary:hover { border-color: var(--terracotta); color: var(--terracotta); }
  .btn-primary-lg { background: var(--terracotta); color: #fff; border: none; cursor: pointer; padding: 13px 32px; border-radius: var(--radius-sm); font-family: var(--font-body); font-size: 15px; font-weight: 600; transition: opacity 0.15s; display: flex; align-items: center; gap: 8px; }
  .btn-primary-lg:hover { opacity: 0.85; }

  /* PROFILE */
  .profile-header { display: flex; gap: 28px; align-items: flex-start; margin-bottom: 40px; padding: 28px; background: var(--warm-white); border-radius: var(--radius); box-shadow: var(--shadow); }
  .avatar-lg { width: 80px; height: 80px; border-radius: 50%; background: var(--terracotta); color: #fff; font-size: 28px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .profile-name { font-family: var(--font-display); font-size: 28px; font-weight: 700; margin-bottom: 4px; }
  .profile-handle { font-size: 14px; color: var(--terracotta); margin-bottom: 8px; }
  .profile-bio { font-size: 14px; color: var(--ink-60); line-height: 1.6; }
  .profile-stats { display: flex; gap: 24px; margin-top: 16px; }
  .stat-item { text-align: center; }
  .stat-num { font-family: var(--font-display); font-size: 24px; font-weight: 700; color: var(--terracotta); }
  .stat-label { font-size: 12px; color: var(--ink-60); }

  .success-toast {
    position: fixed; bottom: 24px; right: 24px;
    background: var(--sage); color: #fff; padding: 14px 22px; border-radius: var(--radius-sm);
    font-size: 15px; font-weight: 600; box-shadow: var(--shadow-lg);
    display: flex; align-items: center; gap: 8px; z-index: 999;
    animation: slideIn 0.3s ease;
  }
  @keyframes slideIn { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
`;

// ─── STARS ───────────────────────────────────────────────────────────────────
function Stars({ rating }) {
  return (
    <span style={{ display: "flex", gap: 1 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= Math.round(rating) ? "#C49A3C" : "#C5BDB8" }}>
          <StarIcon filled={i <= Math.round(rating)} />
        </span>
      ))}
    </span>
  );
}

// ─── RECIPE CARD ─────────────────────────────────────────────────────────────
function RecipeCard({ recipe, onOpen, favorites, onFav }) {
  const isFav = favorites.includes(recipe.id);
  const totalTime = recipe.prepTime + recipe.cookTime;
  return (
    <div className="recipe-card" onClick={() => onOpen(recipe.id)}>
      <div className="card-img">
        <img src={recipe.coverImage} alt={recipe.title} loading="lazy" />
        <span className="card-category">{recipe.category}</span>
        <button className="card-fav" onClick={e => { e.stopPropagation(); onFav(recipe.id); }}>
          <HeartIcon filled={isFav} />
        </button>
      </div>
      <div className="card-body">
        <div className="card-title">{recipe.title}</div>
        <div className="card-desc">{recipe.description}</div>
        <div className="card-meta">
          <span className="card-rating">
            <StarIcon filled />
            {recipe.rating.toFixed(1)}
            <span style={{ fontWeight: 400, color: "#C5BDB8", fontSize: 12 }}>({recipe.ratingCount})</span>
          </span>
          <span className="card-time">
            <ClockIcon /> {totalTime} мин
          </span>
        </div>
        <div className="card-author">
          <div className="avatar-xs">{recipe.author.avatar}</div>
          <span className="card-author-name">{recipe.author.name}</span>
        </div>
      </div>
    </div>
  );
}

// ─── PORTION CALCULATOR ───────────────────────────────────────────────────────
function PortionCalc({ recipe, calc }) {
  const { mode, setMode, servings, setServings, anchorId, setAnchorId, anchorValue, setAnchorValue, ratio } = calc;
  const selectedIng = recipe.ingredients.find(i => i.id === anchorId) || recipe.ingredients[0];
  const displayRatio = Math.round(ratio * 100) / 100;

  return (
    <div className="calc-box">
      <div className="calc-title">
        🧮 Калькулятор порций
      </div>
      <div className="calc-tabs">
        <button className={`calc-tab ${mode === "servings" ? "active" : ""}`} onClick={() => setMode("servings")}>По количеству порций</button>
        <button className={`calc-tab ${mode === "ingredient" ? "active" : ""}`} onClick={() => setMode("ingredient")}>По ингредиенту</button>
      </div>

      {mode === "servings" && (
        <div>
          <div className="servings-row">
            <button className="servings-btn" onClick={() => setServings(Math.max(1, servings - 1))}>−</button>
            <span className="servings-value">{servings}</span>
            <button className="servings-btn" onClick={() => setServings(servings + 1)}>+</button>
            <span className="servings-label">порций</span>
          </div>
          <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[1, 2, 4, 6, 10].map(n => (
              <button key={n} onClick={() => setServings(n)}
                style={{ padding: "4px 12px", border: `1.5px solid ${servings === n ? "var(--terracotta)" : "var(--ink-10)"}`, background: servings === n ? "var(--terracotta-light)" : "none", color: servings === n ? "var(--terracotta)" : "var(--ink-60)", borderRadius: "20px", cursor: "pointer", fontSize: 13, fontFamily: "var(--font-body)", fontWeight: 600 }}>
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === "ingredient" && (
        <div>
          <select className="calc-select" value={anchorId || recipe.ingredients[0]?.id} onChange={e => { setAnchorId(e.target.value); setAnchorValue(""); }}>
            {recipe.ingredients.map(ing => (
              <option key={ing.id} value={ing.id}>{ing.name} (базово: {ing.amount} {ing.unit})</option>
            ))}
          </select>
          <div className="calc-input-row">
            <input
              className="calc-input"
              type="number"
              min="0"
              placeholder={`У меня есть...`}
              value={anchorValue}
              onChange={e => { setAnchorId(anchorId || recipe.ingredients[0]?.id); setAnchorValue(e.target.value); }}
            />
            <span className="calc-unit">{selectedIng?.unit}</span>
          </div>
        </div>
      )}

      {displayRatio !== 1 && (
        <div className="ratio-badge">
          <CheckIcon /> Коэффициент: ×{displayRatio}
        </div>
      )}
    </div>
  );
}

// ─── RECIPE PAGE ──────────────────────────────────────────────────────────────
function RecipePage({ recipeId, recipes, favorites, onFav, onBack, currentUserId, onDelete }) {
  const recipe = recipes.find(r => r.id === recipeId);
  const [newComment, setNewComment] = useState("");
  const [localComments, setLocalComments] = useState(recipe?.comments || []);
  const calc = usePortionCalc(recipe);
  const isFav = favorites.includes(recipe?.id);
  const isOwner = recipe?.author?.id === currentUserId;

  if (!recipe) return null;

  const handleComment = () => {
    if (!newComment.trim()) return;
    setLocalComments(prev => [...prev, {
      id: `c${Date.now()}`, author: "Вы", text: newComment,
      date: new Date().toISOString().slice(0, 10)
    }]);
    setNewComment("");
  };

  const scaledIngredients = calc.scaledIngredients;
  const ratio = Math.round(calc.ratio * 100) / 100;

  return (
    <div className="recipe-page">
      <button className="back-btn" onClick={onBack}>
        <ChevronLeft /> Назад к рецептам
      </button>

      <div className="recipe-header">
        <img src={recipe.coverImage} alt={recipe.title} className="recipe-cover" />
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--terracotta)", textTransform: "uppercase", letterSpacing: 1 }}>{recipe.category}</span>
            <div style={{ display: "flex", gap: 8 }}>
              {isOwner && (
                <>
                  <button onClick={() => onDelete(recipe.id)} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "1.5px solid var(--ink-10)", borderRadius: "var(--radius-sm)", padding: "6px 12px", cursor: "pointer", color: "var(--ink-60)", fontSize: 13, fontFamily: "var(--font-body)" }}>
                    <TrashIcon /> Удалить
                  </button>
                </>
              )}
              <button
                onClick={() => onFav(recipe.id)}
                style={{ display: "flex", alignItems: "center", gap: 5, background: isFav ? "var(--terracotta-light)" : "none", border: `1.5px solid ${isFav ? "var(--terracotta)" : "var(--ink-10)"}`, borderRadius: "var(--radius-sm)", padding: "6px 12px", cursor: "pointer", color: isFav ? "var(--terracotta)" : "var(--ink-60)", fontSize: 13, fontFamily: "var(--font-body)" }}>
                <HeartIcon filled={isFav} /> {isFav ? "В избранном" : "В избранное"}
              </button>
            </div>
          </div>
          <h1 className="recipe-title">{recipe.title}</h1>
          <div className="recipe-meta-row">
            <span className="meta-badge rating"><Stars rating={recipe.rating} /> {recipe.rating.toFixed(1)} ({recipe.ratingCount})</span>
            <span className="meta-badge"><ClockIcon /> {recipe.prepTime} мин подготовка</span>
            <span className="meta-badge"><ClockIcon /> {recipe.cookTime} мин готовка</span>
            <span className="meta-badge"><UsersIcon /> {recipe.baseServings} порции</span>
          </div>
          <div className="recipe-tags">
            {recipe.tags.map(t => <span key={t} className="tag-chip">{t}</span>)}
          </div>
          <div className="recipe-desc">{recipe.description}</div>
        </div>
      </div>

      <PortionCalc recipe={recipe} calc={calc} />

      <div className="two-col" style={{ marginBottom: 40 }}>
        <div>
          <h2 className="section-h2">Ингредиенты</h2>
          <ul className="ingredient-list">
            {scaledIngredients.map(ing => (
              <li key={ing.id} className="ingredient-item">
                <span className="ingredient-name">{ing.name}</span>
                <span className={`ingredient-amount ${ratio !== 1 ? "changed" : ""}`}>
                  {formatAmount(ing.scaledAmount)} {ing.unit}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="section-h2">Приготовление</h2>
          <ol className="steps-list">
            {recipe.steps.map(step => (
              <li key={step.n} className="step-item">
                <span className="step-num">{step.n}</span>
                <span className="step-text">{step.text}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="comments-section">
        <h2 className="section-h2">Комментарии ({localComments.length})</h2>
        <ul className="comment-list">
          {localComments.map(c => (
            <li key={c.id} className="comment-item">
              <div className="comment-header">
                <div className="avatar-sm">{c.author[0]}</div>
                <span className="comment-author">{c.author}</span>
                <span className="comment-date">{c.date}</span>
              </div>
              <p className="comment-text">{c.text}</p>
            </li>
          ))}
          {localComments.length === 0 && <p style={{ color: "var(--ink-60)", fontSize: 14 }}>Пока нет комментариев — будь первым!</p>}
        </ul>
        <div className="comment-form">
          <input className="comment-input" placeholder="Написать комментарий..." value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === "Enter" && handleComment()} />
          <button className="btn-primary" onClick={handleComment}>Отправить</button>
        </div>
      </div>
    </div>
  );
}

// ─── ADD RECIPE FORM ──────────────────────────────────────────────────────────
function AddRecipePage({ onSave, onCancel }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Завтрак");
  const [prepTime, setPrepTime] = useState(10);
  const [cookTime, setCookTime] = useState(20);
  const [servings, setServings] = useState(2);
  const [ingredients, setIngredients] = useState([
    { id: "n1", name: "", amount: "", unit: "г" }
  ]);
  const [steps, setSteps] = useState([{ id: "s1", text: "" }]);
  const [coverImage, setCoverImage] = useState("");

  const addIngredient = () => setIngredients(prev => [...prev, { id: `n${Date.now()}`, name: "", amount: "", unit: "г" }]);
  const removeIngredient = id => setIngredients(prev => prev.filter(i => i.id !== id));
  const updateIngredient = (id, field, value) => setIngredients(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));

  const addStep = () => setSteps(prev => [...prev, { id: `s${Date.now()}`, text: "" }]);
  const removeStep = id => setSteps(prev => prev.filter(s => s.id !== id));
  const updateStep = (id, text) => setSteps(prev => prev.map(s => s.id === id ? { ...s, text } : s));

  const handleSave = () => {
    if (!title.trim()) return;
    const recipe = {
      id: `r${Date.now()}`,
      title, description, category,
      prepTime: +prepTime, cookTime: +cookTime, baseServings: +servings,
      rating: 5, ratingCount: 0,
      coverImage: coverImage || "https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=600&q=80",
      author: { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar },
      tags: [], mood: [],
      ingredients: ingredients.filter(i => i.name).map((i, idx) => ({
        id: `i${idx}`, name: i.name, amount: parseFloat(i.amount) || 0, unit: i.unit
      })),
      steps: steps.filter(s => s.text).map((s, idx) => ({ n: idx + 1, text: s.text })),
      comments: [], createdAt: new Date().toISOString().slice(0, 10),
    };
    onSave(recipe);
  };

  const units = ["г", "кг", "мл", "л", "шт", "ч.л.", "ст.л.", "стак.", "по вкусу"];

  return (
    <div className="form-page">
      <button className="back-btn" onClick={onCancel}><ChevronLeft /> Отмена</button>
      <h1>Новый рецепт</h1>
      <p className="form-subtitle">Поделитесь своим любимым блюдом с сообществом</p>

      <div className="form-section">
        <div className="form-section-title">Основная информация</div>
        <div className="form-group">
          <label className="form-label">Название рецепта *</label>
          <input className="form-input" placeholder="Например: Бабушкин борщ" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Описание</label>
          <textarea className="form-textarea" placeholder="Расскажите о блюде, его истории, особенностях..." value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Категория</label>
            <select className="form-select-f" value={category} onChange={e => setCategory(e.target.value)}>
              {["Завтрак","Обед","Ужин","Салат","Суп","Десерт","Выпечка","Напиток"].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Количество порций</label>
            <input className="form-input" type="number" min="1" value={servings} onChange={e => setServings(e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Подготовка (мин)</label>
            <input className="form-input" type="number" min="0" value={prepTime} onChange={e => setPrepTime(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Готовка (мин)</label>
            <input className="form-input" type="number" min="0" value={cookTime} onChange={e => setCookTime(e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Ссылка на фото обложки</label>
          <input className="form-input" placeholder="https://..." value={coverImage} onChange={e => setCoverImage(e.target.value)} />
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title">Ингредиенты</div>
        {ingredients.map((ing, idx) => (
          <div key={ing.id} className="ingredient-form-row">
            <input className="form-input" placeholder="Название" value={ing.name} onChange={e => updateIngredient(ing.id, "name", e.target.value)} />
            <input className="form-input" type="number" placeholder="Кол-во" value={ing.amount} onChange={e => updateIngredient(ing.id, "amount", e.target.value)} />
            <select className="form-select-f" value={ing.unit} onChange={e => updateIngredient(ing.id, "unit", e.target.value)}>
              {units.map(u => <option key={u}>{u}</option>)}
            </select>
            {ingredients.length > 1 && (
              <button className="remove-btn" onClick={() => removeIngredient(ing.id)}><TrashIcon /></button>
            )}
          </div>
        ))}
        <button className="add-row-btn" onClick={addIngredient}><PlusIcon /> Добавить ингредиент</button>
      </div>

      <div className="form-section">
        <div className="form-section-title">Шаги приготовления</div>
        {steps.map((step, idx) => (
          <div key={step.id} className="step-form-row">
            <span className="step-form-num">{idx + 1}</span>
            <textarea
              className="form-textarea"
              style={{ flex: 1, minHeight: 64 }}
              placeholder={`Шаг ${idx + 1}...`}
              value={step.text}
              onChange={e => updateStep(step.id, e.target.value)}
            />
            {steps.length > 1 && (
              <button className="remove-btn" style={{ alignSelf: "flex-start", marginTop: 8 }} onClick={() => removeStep(step.id)}><TrashIcon /></button>
            )}
          </div>
        ))}
        <button className="add-row-btn" onClick={addStep}><PlusIcon /> Добавить шаг</button>
      </div>

      <div className="form-submit-row">
        <button className="btn-secondary" onClick={onCancel}>Отмена</button>
        <button className="btn-primary-lg" onClick={handleSave}>
          <CheckIcon /> Опубликовать рецепт
        </button>
      </div>
    </div>
  );
}

// ─── INGREDIENT MATCH PAGE ────────────────────────────────────────────────────
function IngredientMatchPage({ recipes, onOpen }) {
  const { input, setInput, userIngredients, addIngredient, removeIngredient, matchedRecipes } = useIngredientMatch(recipes);
  const [activeMode, setActiveMode] = useState("all");

  const suggestions = ["яйца", "молоко", "мука", "курица", "сыр", "помидоры", "картофель", "лук", "морковь", "паста"];
  const filtered = activeMode === "all" ? matchedRecipes : matchedRecipes.filter(r => r.mode === activeMode);

  const modeCounts = {
    full: matchedRecipes.filter(r => r.mode === "full").length,
    almost: matchedRecipes.filter(r => r.mode === "almost").length,
    improvise: matchedRecipes.filter(r => r.mode === "improvise").length,
  };

  return (
    <div className="match-page">
      <h1>Что приготовить?</h1>
      <p className="match-subtitle">Введите продукты, которые есть у вас дома — подберём рецепты</p>

      <div className="ingredient-input-row">
        <input
          className="ingredient-input"
          placeholder="Введите продукт и нажмите Enter..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && input.trim() && addIngredient(input)}
        />
        <button className="btn-primary" onClick={() => input.trim() && addIngredient(input)}>Добавить</button>
      </div>

      {userIngredients.length === 0 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: "var(--ink-60)", marginBottom: 8 }}>Быстро добавить:</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {suggestions.map(s => (
              <button key={s} onClick={() => addIngredient(s)}
                style={{ padding: "5px 12px", border: "1.5px solid var(--ink-10)", borderRadius: "20px", background: "var(--warm-white)", cursor: "pointer", fontSize: 13, fontFamily: "var(--font-body)", color: "var(--ink-60)", transition: "all 0.15s" }}>
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {userIngredients.length > 0 && (
        <div className="tags-wrap">
          {userIngredients.map(ing => (
            <span key={ing} className="ing-tag">
              {ing}
              <button className="ing-tag-remove" onClick={() => removeIngredient(ing)}><XIcon /></button>
            </span>
          ))}
        </div>
      )}

      {matchedRecipes.length > 0 && (
        <>
          <div className="mode-tabs">
            <button className={`mode-tab full ${activeMode === "all" ? "active" : ""}`} style={activeMode === "all" ? {borderColor: "var(--ink)", background: "var(--ink-10)", color: "var(--ink)"} : {}} onClick={() => setActiveMode("all")}>
              Все ({matchedRecipes.length})
            </button>
            {modeCounts.full > 0 && <button className={`mode-tab full ${activeMode === "full" ? "active" : ""}`} onClick={() => setActiveMode("full")}>✅ Готово ({modeCounts.full})</button>}
            {modeCounts.almost > 0 && <button className={`mode-tab almost ${activeMode === "almost" ? "active" : ""}`} onClick={() => setActiveMode("almost")}>🛒 Почти ({modeCounts.almost})</button>}
            {modeCounts.improvise > 0 && <button className={`mode-tab improvise ${activeMode === "improvise" ? "active" : ""}`} onClick={() => setActiveMode("improvise")}>✨ Импровизация ({modeCounts.improvise})</button>}
          </div>

          {filtered.map(({ recipe, score, mode, missing }) => (
            <div key={recipe.id} className="match-card" onClick={() => onOpen(recipe.id)}>
              <div className="match-card-img">
                <img src={recipe.coverImage} alt={recipe.title} />
              </div>
              <div className="match-card-body">
                <span className={`match-badge ${mode}`}>
                  {mode === "full" && "✅ Всё есть"}
                  {mode === "almost" && `🛒 Нет ${missing.length} прод.`}
                  {mode === "improvise" && "✨ Импровизация"}
                </span>
                <div className="match-card-title">{recipe.title}</div>
                <div className="match-progress">
                  <div className="match-progress-fill" style={{ width: `${Math.round(score * 100)}%`, background: mode === "full" ? "var(--sage)" : mode === "almost" ? "var(--gold)" : "var(--terracotta)" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div className="match-missing">
                    {missing.length > 0
                      ? <>Не хватает: <span>{missing.slice(0, 3).join(", ")}{missing.length > 3 ? "..." : ""}</span></>
                      : <span style={{ color: "var(--sage)", fontWeight: 600 }}>Можно готовить прямо сейчас!</span>
                    }
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-60)" }}>{Math.round(score * 100)}%</span>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {userIngredients.length > 0 && matchedRecipes.length === 0 && (
        <div className="empty-state">
          <span className="empty-state-emoji">🔍</span>
          <p>По вашим продуктам рецептов не найдено. Попробуйте добавить ещё!</p>
        </div>
      )}

      {userIngredients.length === 0 && (
        <div className="empty-state">
          <span className="empty-state-emoji">🥕</span>
          <p>Начните вводить продукты, и мы найдём, что можно приготовить</p>
        </div>
      )}
    </div>
  );
}

// ─── PROFILE PAGE ─────────────────────────────────────────────────────────────
function ProfilePage({ recipes, favorites, onOpen, onFav }) {
  const myRecipes = recipes.filter(r => r.author.id === currentUser.id);
  const favRecipes = recipes.filter(r => favorites.includes(r.id));
  const [tab, setTab] = useState("my");

  return (
    <div>
      <div className="profile-header">
        <div className="avatar-lg">{currentUser.avatar}</div>
        <div style={{ flex: 1 }}>
          <div className="profile-name">{currentUser.name}</div>
          <div className="profile-handle">@{currentUser.username}</div>
          <div className="profile-bio">{currentUser.bio}</div>
          <div className="profile-stats">
            <div className="stat-item">
              <div className="stat-num">{myRecipes.length}</div>
              <div className="stat-label">рецептов</div>
            </div>
            <div className="stat-item">
              <div className="stat-num">{favRecipes.length}</div>
              <div className="stat-label">избранных</div>
            </div>
            <div className="stat-item">
              <div className="stat-num">{myRecipes.reduce((s, r) => s + r.ratingCount, 0)}</div>
              <div className="stat-label">оценок</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[["my", "Мои рецепты"], ["fav", "Избранное"]].map(([id, label]) => (
          <button key={id} className={`calc-tab ${tab === id ? "active" : ""}`} style={{ flex: "none", padding: "8px 20px" }} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      <div className="recipe-grid">
        {(tab === "my" ? myRecipes : favRecipes).map(recipe => (
          <RecipeCard key={recipe.id} recipe={recipe} onOpen={onOpen} favorites={favorites} onFav={onFav} />
        ))}
      </div>
      {(tab === "my" ? myRecipes : favRecipes).length === 0 && (
        <div className="empty-state">
          <span className="empty-state-emoji">{tab === "my" ? "👨‍🍳" : "💛"}</span>
          <p>{tab === "my" ? "Вы ещё не добавили рецептов" : "Нет избранных рецептов"}</p>
        </div>
      )}
    </div>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
function HomePage({ recipes, favorites, onOpen, onFav, onAddRecipe, onMatchPage }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Все");
  const [activeMood, setActiveMood] = useState(null);

  const categories = ["Все", "Завтрак", "Обед", "Ужин", "Салат", "Суп", "Десерт"];

  const filtered = useMemo(() => {
    let res = recipes;
    if (search) {
      const s = search.toLowerCase();
      res = res.filter(r =>
        r.title.toLowerCase().includes(s) ||
        r.description.toLowerCase().includes(s) ||
        r.ingredients.some(i => i.name.toLowerCase().includes(s))
      );
    }
    if (category !== "Все") res = res.filter(r => r.category === category);
    if (activeMood) {
      const m = moodOptions.find(m => m.id === activeMood);
      if (m) res = res.filter(r => m.tags.some(t => r.mood?.includes(t) || r.tags?.includes(t)));
    }
    return res;
  }, [recipes, search, category, activeMood]);

  return (
    <div>
      <div className="hero">
        <div className="hero-tag">🍳 Домашняя кухня</div>
        <h1>Готовьте с душой,<br />делитесь с радостью</h1>
        <p>Сохраняйте рецепты, пересчитывайте пропорции и находите блюда из того, что есть дома.</p>
        <div className="hero-btns">
          <button className="btn-white" onClick={onAddRecipe}>+ Добавить рецепт</button>
          <button className="btn-outline-white" onClick={onMatchPage}>Что готовить сегодня?</button>
        </div>
      </div>

      <div className="search-bar">
        <div className="search-input-wrap">
          <SearchIcon />
          <input className="search-input" placeholder="Поиск по названию или ингредиентам..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={category} onChange={e => setCategory(e.target.value)}>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="section-header" style={{ marginBottom: 12 }}>
        <span className="section-title">По настроению</span>
      </div>
      <div className="mood-grid">
        {moodOptions.map(m => (
          <div key={m.id} className={`mood-chip ${activeMood === m.id ? "active" : ""}`} onClick={() => setActiveMood(activeMood === m.id ? null : m.id)}>
            <span className="mood-emoji">{m.emoji}</span>
            <span className="mood-label">{m.label}</span>
          </div>
        ))}
      </div>

      <div className="section-header">
        <span className="section-title">
          {activeMood ? moodOptions.find(m => m.id === activeMood)?.label : (search ? `Результаты: «${search}»` : "Все рецепты")}
          <span style={{ fontSize: 16, fontWeight: 400, color: "var(--ink-60)", marginLeft: 8 }}>({filtered.length})</span>
        </span>
        {activeMood && <span className="section-link" onClick={() => setActiveMood(null)}>Сбросить</span>}
      </div>

      <div className="recipe-grid">
        {filtered.map(recipe => (
          <RecipeCard key={recipe.id} recipe={recipe} onOpen={onOpen} favorites={favorites} onFav={onFav} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <span className="empty-state-emoji">🔍</span>
          <p>Ничего не найдено. Попробуйте другой запрос.</p>
        </div>
      )}
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home"); // home | recipe | add | match | profile
  const [openRecipeId, setOpenRecipeId] = useState(null);
  const [recipes, setRecipes] = useState(mockRecipes);
  const [favorites, setFavorites] = useState(["2"]);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }, []);

  const handleFav = useCallback((id) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      showToast(prev.includes(id) ? "Удалено из избранного" : "Добавлено в избранное ❤️");
      return next;
    });
  }, [showToast]);

  const handleOpen = (id) => { setOpenRecipeId(id); setPage("recipe"); };
  const handleBack = () => { setPage("home"); setOpenRecipeId(null); };
  const handleSaveRecipe = (recipe) => { setRecipes(prev => [recipe, ...prev]); setPage("home"); showToast("Рецепт опубликован! 🎉"); };
  const handleDelete = (id) => { setRecipes(prev => prev.filter(r => r.id !== id)); setPage("home"); showToast("Рецепт удалён"); };

  const nav = [
    ["home", "Рецепты"],
    ["match", "Что готовить?"],
    ["profile", "Мой профиль"],
  ];

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <nav className="nav">
          <span className="nav-logo" onClick={() => setPage("home")}>
            Рецепт<span>бук</span>
          </span>
          <div className="nav-links">
            {nav.map(([id, label]) => (
              <button key={id} className={`nav-btn ${page === id ? "active" : ""}`} onClick={() => { setPage(id); setOpenRecipeId(null); }}>
                {label}
              </button>
            ))}
            <button className="nav-btn-primary" onClick={() => setPage("add")}>
              <PlusIcon size={16} /> Добавить
            </button>
          </div>
        </nav>

        <main className="main">
          {page === "home" && <HomePage recipes={recipes} favorites={favorites} onOpen={handleOpen} onFav={handleFav} onAddRecipe={() => setPage("add")} onMatchPage={() => setPage("match")} />}
          {page === "recipe" && openRecipeId && <RecipePage recipeId={openRecipeId} recipes={recipes} favorites={favorites} onFav={handleFav} onBack={handleBack} currentUserId={currentUser.id} onDelete={handleDelete} />}
          {page === "add" && <AddRecipePage onSave={handleSaveRecipe} onCancel={() => setPage("home")} />}
          {page === "match" && <IngredientMatchPage recipes={recipes} onOpen={handleOpen} />}
          {page === "profile" && <ProfilePage recipes={recipes} favorites={favorites} onOpen={handleOpen} onFav={handleFav} />}
        </main>

        {toast && (
          <div className="success-toast">
            <CheckIcon /> {toast}
          </div>
        )}
      </div>
    </>
  );
}
