import React from 'react';
import { Recipe } from '../../types';

interface RecipeListProps {
  recipes: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
  onCreateNew: () => void;
}

const RecipeList: React.FC<RecipeListProps> = ({ recipes, onSelectRecipe, onCreateNew }) => {
  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-black text-slate-800">Recipes</h3>
        <button
          onClick={onCreateNew}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black hover:bg-indigo-700 transition-all"
        >
          New Recipe
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recipes.map((recipe) => (
          <div
            key={recipe.id}
            onClick={() => onSelectRecipe(recipe)}
            className="p-4 border border-slate-200 rounded-2xl hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer"
          >
            <h4 className="font-black text-slate-800 mb-2">{recipe.name}</h4>
            <p className="text-sm text-slate-600 mb-2">{recipe.description}</p>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Yields: {recipe.yieldQuantity} {recipe.yieldUnit}</span>
              <span className="font-black text-indigo-600">₦{recipe.totalCost.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecipeList;
