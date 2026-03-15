import { useState, useCallback } from "react";

export function smartRound(value, unit) {
  const u = (unit || "").toLowerCase();
  // Countable items — round to nearest half
  if (["шт", "яйца", "яйцо", "желток", "желтки", "зубчик"].some(x => u.includes(x))) {
    if (value <= 0.3) return 0.25;
    if (value <= 0.65) return 0.5;
    if (value <= 0.85) return 0.75;
    return Math.round(value);
  }
  // Very small amounts
  if (value < 3) return Math.round(value * 4) / 4;
  if (value < 10) return Math.round(value * 2) / 2;
  if (value < 100) return Math.round(value / 5) * 5;
  if (value < 500) return Math.round(value / 10) * 10;
  return Math.round(value / 50) * 50;
}

export function formatAmount(value) {
  if (value === Math.floor(value)) return String(value);
  const fracs = { 0.25: "¼", 0.5: "½", 0.75: "¾" };
  const floor = Math.floor(value);
  const frac = value - floor;
  const fracStr = fracs[frac] || value.toFixed(1);
  return floor > 0 ? `${floor} ${fracStr}` : fracStr;
}

export function usePortionCalc(recipe) {
  const [anchorId, setAnchorId] = useState(null);
  const [anchorValue, setAnchorValue] = useState("");
  const [servings, setServings] = useState(recipe?.baseServings || 2);
  const [mode, setMode] = useState("servings"); // "servings" | "ingredient"

  const ratio = useCallback(() => {
    if (mode === "servings") {
      return servings / (recipe?.baseServings || 1);
    }
    if (mode === "ingredient" && anchorId && anchorValue) {
      const base = recipe?.ingredients?.find(i => i.id === anchorId);
      if (!base || !parseFloat(anchorValue)) return 1;
      return parseFloat(anchorValue) / base.amount;
    }
    return 1;
  }, [mode, servings, anchorId, anchorValue, recipe]);

  const scaledIngredients = useCallback(() => {
    const r = ratio();
    return (recipe?.ingredients || []).map(ing => ({
      ...ing,
      scaledAmount: smartRound(ing.amount * r, ing.unit),
    }));
  }, [recipe, ratio]);

  return {
    mode, setMode,
    servings, setServings,
    anchorId, setAnchorId,
    anchorValue, setAnchorValue,
    scaledIngredients: scaledIngredients(),
    ratio: ratio(),
  };
}
