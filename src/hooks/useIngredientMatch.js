import { useState, useMemo } from "react";

function normalize(str) {
  return str.toLowerCase().trim()
    .replace(/ё/g, "е")
    .replace(/[^а-яa-z0-9 ]/g, "");
}

function ingredientMatches(recipeName, userList) {
  const rn = normalize(recipeName);
  return userList.some(u => {
    const un = normalize(u);
    return rn.includes(un) || un.includes(rn) || (rn.length > 4 && un.length > 4 && (rn.slice(0, 4) === un.slice(0, 4)));
  });
}

export function useIngredientMatch(recipes) {
  const [input, setInput] = useState("");
  const [userIngredients, setUserIngredients] = useState([]);

  const addIngredient = (raw) => {
    const trimmed = raw.trim();
    if (trimmed && !userIngredients.includes(trimmed)) {
      setUserIngredients(prev => [...prev, trimmed]);
    }
    setInput("");
  };

  const removeIngredient = (item) => {
    setUserIngredients(prev => prev.filter(i => i !== item));
  };

  const matchedRecipes = useMemo(() => {
    if (userIngredients.length === 0) return [];
    return recipes.map(recipe => {
      const required = recipe.ingredients.map(i => i.name);
      const matched = required.filter(n => ingredientMatches(n, userIngredients));
      const missing = required.filter(n => !ingredientMatches(n, userIngredients));
      const score = matched.length / required.length;
      let mode = "improvise";
      if (missing.length === 0) mode = "full";
      else if (missing.length <= 2) mode = "almost";
      return { recipe, matched, missing, score, mode };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score);
  }, [recipes, userIngredients]);

  return { input, setInput, userIngredients, addIngredient, removeIngredient, matchedRecipes };
}
