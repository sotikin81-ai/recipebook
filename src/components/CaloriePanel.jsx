import { useState, useMemo } from "react";
import { calcTotalCalories, calcIngredientCalories } from "../utils/calorieUtils";

export const calorieCss = `
.calorie-panel {
  background: var(--warm-white); border-radius: var(--radius);
  padding: 20px 24px; border: 1.5px solid var(--ink-10);
  box-shadow: var(--shadow); margin-bottom: 32px;
}
.calorie-panel-title {
  font-family: var(--font-display); font-size: 18px; font-weight: 600;
  margin-bottom: 16px; display: flex; align-items: center; gap: 8px;
}
.calorie-total {
  display: flex; align-items: baseline; gap: 6px; margin-bottom: 16px; flex-wrap: wrap;
}
.calorie-big-num {
  font-family: var(--font-display); font-size: 36px; font-weight: 700;
  color: var(--terracotta); line-height: 1;
}
.calorie-big-label { font-size: 14px; color: var(--ink-60); }
.calorie-per-serving {
  font-size: 13px;
  background: var(--terracotta-light); color: var(--terracotta);
  padding: 3px 10px; border-radius: 20px; font-weight: 600; margin-left: 8px;
}
.kbju-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
  margin-bottom: 16px;
}
.kbju-card {
  background: var(--cream); border-radius: var(--radius-sm);
  padding: 10px 14px; text-align: center;
}
.kbju-value {
  font-family: var(--font-display); font-size: 20px; font-weight: 700;
  color: var(--ink); margin-bottom: 2px;
}
.kbju-value.protein { color: #185FA5; }
.kbju-value.fat     { color: #854F0B; }
.kbju-value.carbs   { color: #3B6D11; }
.kbju-label { font-size: 11px; color: var(--ink-60); text-transform: uppercase; letter-spacing: 0.5px; }
.calorie-bar {
  height: 8px; background: var(--ink-10); border-radius: 4px;
  overflow: hidden; display: flex; margin-bottom: 10px;
}
.calorie-bar-p { background: #378ADD; height: 100%; transition: width 0.4s; }
.calorie-bar-f { background: #EF9F27; height: 100%; transition: width 0.4s; }
.calorie-bar-c { background: #639922; height: 100%; transition: width 0.4s; }
.calorie-legend {
  display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 16px;
}
.calorie-legend-item {
  display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--ink-60);
}
.legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.calorie-coverage {
  font-size: 12px; color: var(--ink-60); padding-top: 12px;
  border-top: 1px solid var(--ink-10);
}
.calorie-coverage a { color: var(--terracotta); cursor: pointer; font-weight: 600; }
.calorie-ing-list { margin-top: 12px; }
.calorie-ing-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 0; border-bottom: 1px solid var(--ink-10); font-size: 13px;
}
.calorie-ing-row:last-child { border-bottom: none; }
.calorie-ing-name { color: var(--ink); flex: 1; }
.calorie-ing-kcal { font-weight: 600; color: var(--terracotta); min-width: 60px; text-align: right; }
.calorie-ing-unknown { color: var(--ink-30); font-size: 11px; }
@media (max-width: 480px) {
  .kbju-value { font-size: 16px; }
  .calorie-big-num { font-size: 28px; }
}
`;

export function CaloriePanel({ ingredients, servings = 1, baseServings = 1 }) {
  const [showDetails, setShowDetails] = useState(false);

  const totals = useMemo(
    () => calcTotalCalories(ingredients),
    [ingredients]
  );

  const baseServings_ = baseServings || 1;
  const ratio = servings / baseServings_;

  const current = {
    kcal:    Math.round(totals.kcal    * ratio),
    protein: Math.round(totals.protein * ratio * 10) / 10,
    fat:     Math.round(totals.fat     * ratio * 10) / 10,
    carbs:   Math.round(totals.carbs   * ratio * 10) / 10,
  };

  const perServing = {
    kcal:    Math.round(totals.kcal    / baseServings_),
  };

  const totalMacro = (current.protein * 4) + (current.fat * 9) + (current.carbs * 4);
  const pctP = totalMacro > 0 ? Math.round(current.protein * 4 / totalMacro * 100) : 33;
  const pctF = totalMacro > 0 ? Math.round(current.fat     * 9 / totalMacro * 100) : 33;
  const pctC = totalMacro > 0 ? Math.round(current.carbs   * 4 / totalMacro * 100) : 34;

  if (totals.kcal === 0 || totals.covered === 0) return null;

  return (
    <div className="calorie-panel">
      <div className="calorie-panel-title">🔥 Калорийность</div>

      <div className="calorie-total">
        <span className="calorie-big-num">{current.kcal}</span>
        <span className="calorie-big-label">ккал</span>
        {baseServings_ > 1 && (
          <span className="calorie-per-serving">
            {perServing.kcal} ккал / 1 порция
          </span>
        )}
      </div>

      <div className="kbju-grid">
        <div className="kbju-card">
          <div className="kbju-value protein">{current.protein}г</div>
          <div className="kbju-label">Белки</div>
        </div>
        <div className="kbju-card">
          <div className="kbju-value fat">{current.fat}г</div>
          <div className="kbju-label">Жиры</div>
        </div>
        <div className="kbju-card">
          <div className="kbju-value carbs">{current.carbs}г</div>
          <div className="kbju-label">Углеводы</div>
        </div>
      </div>

      <div className="calorie-bar">
        <div className="calorie-bar-p" style={{ width: `${pctP}%` }} />
        <div className="calorie-bar-f" style={{ width: `${pctF}%` }} />
        <div className="calorie-bar-c" style={{ width: `${pctC}%` }} />
      </div>
      <div className="calorie-legend">
        <span className="calorie-legend-item">
          <span className="legend-dot" style={{ background: "#378ADD" }} /> Б {pctP}%
        </span>
        <span className="calorie-legend-item">
          <span className="legend-dot" style={{ background: "#EF9F27" }} /> Ж {pctF}%
        </span>
        <span className="calorie-legend-item">
          <span className="legend-dot" style={{ background: "#639922" }} /> У {pctC}%
        </span>
      </div>

      <div className="calorie-coverage">
        Рассчитано по {totals.covered} из {totals.total} ингредиентов
        {totals.covered < totals.total && (
          <> · <a onClick={() => setShowDetails(v => !v)}>
            {showDetails ? "скрыть" : "подробнее"}
          </a></>
        )}
      </div>

      {showDetails && (
        <div className="calorie-ing-list">
          {ingredients.map((ing, i) => {
            const c = calcIngredientCalories(
              ing.name, ing.scaledAmount ?? ing.amount, ing.unit
            );
            return (
              <div key={i} className="calorie-ing-row">
                <span className="calorie-ing-name">{ing.name}</span>
                {c
                  ? <span className="calorie-ing-kcal">{Math.round(c.kcal)} ккал</span>
                  : <span className="calorie-ing-unknown">нет данных</span>
                }
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
